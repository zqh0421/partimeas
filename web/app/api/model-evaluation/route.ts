import { NextRequest, NextResponse } from "next/server";
import {
  getActiveEvaluationAssistant,
  getAllActiveEvaluationAssistants,
} from "@/app/api/model-evaluation/utils";
import {
  runParallelEvaluations,
  applyJudgmentStrategy,
} from "@/app/api/model-evaluation/parallel-evaluation";
import { sql } from "@/app/config/database";

interface EvaluationResult {
  modelId?: string;
  overallScore: number;
  criteriaScores: Record<
    string,
    {
      score: number;
      reasoning: string;
      subscores?: Array<{
        score: number;
        rationale: string;
      }>;
      aggregation_method?: string;
    }
  >;
  feedback: string;
  timestamp: string;
  isIdealResponse?: boolean;
}

type JudgmentStrategy = "majority_voting" | "highest_score" | "lowest_score";

// Helper function to evaluate model outputs with parallel execution
const evaluateModelOutputs = async (
  outputs: any[],
  testCase: any,
  criteria: any[],
  idealResponse?: any
) => {
  try {
    const totalEvaluationStartTime = Date.now();

    // Get judgment strategy from config
    let judgmentStrategy: JudgmentStrategy = "majority_voting";
    try {
      const strategyConfig = await sql`
        SELECT value FROM partimeas_configs 
        WHERE name = 'judgmentStrategy'
        LIMIT 1
      `;
      if (strategyConfig && strategyConfig.length > 0) {
        judgmentStrategy = strategyConfig[0].value as JudgmentStrategy;
      }
    } catch (e) {
      // Using default judgment strategy: majority_voting
    }

    // Get all active evaluation assistants with weights
    const activeEvaluationAssistants = await getAllActiveEvaluationAssistants();
    if (
      !activeEvaluationAssistants ||
      activeEvaluationAssistants.length === 0
    ) {
      // Fallback to single assistant for backward compatibility
      const singleAssistant = await getActiveEvaluationAssistant();
      if (!singleAssistant) {
        return { evaluations: [], evaluationModelId: "" };
      }
      activeEvaluationAssistants.push({
        ...singleAssistant,
        weight: 1,
      });
    }

    // Calculate total runs
    const totalRuns = activeEvaluationAssistants.reduce(
      (sum, a) => sum + (a.weight || 1),
      0
    );

    // Run parallel evaluations
    const { evaluationRuns, totalTime } = await runParallelEvaluations(
      outputs,
      testCase,
      criteria,
      activeEvaluationAssistants,
      idealResponse
    );

    // Group runs by modelId and apply judgment strategy
    const evaluations: EvaluationResult[] = [];
    const modelIds = new Set<string>();

    // Collect all unique model IDs
    outputs.forEach((output) => modelIds.add(output.modelId));
    if (idealResponse) {
      modelIds.add("ideal-response");
    }

    // For each model, apply judgment strategy and collect subscores
    modelIds.forEach((modelId) => {
      const aggregatedScores = applyJudgmentStrategy(
        evaluationRuns,
        judgmentStrategy,
        modelId
      );

      // Collect subscores for this model
      const modelRuns = evaluationRuns.filter((r) => r.modelId === modelId);
      const subscoresByCriterion: Record<string, any[]> = {};

      // Organize subscores by criterion
      modelRuns.forEach((run) => {
        Object.entries(run.criteriaScores).forEach(
          ([criterionId, scoreData]) => {
            if (!subscoresByCriterion[criterionId]) {
              subscoresByCriterion[criterionId] = [];
            }
            subscoresByCriterion[criterionId].push({
              score: scoreData.score,
              rationale: scoreData.reasoning,
            });
          }
        );
      });

      // Create final scores with subscores
      const finalScores: Record<
        string,
        {
          score: number;
          reasoning: string;
          subscores?: Array<{
            score: number;
            rationale: string;
          }>;
          aggregation_method?: string;
        }
      > = {};

      Object.keys(aggregatedScores).forEach((criterionId) => {
        finalScores[criterionId] = {
          ...aggregatedScores[criterionId],
          subscores: subscoresByCriterion[criterionId] || [],
          aggregation_method: judgmentStrategy,
        };
      });

      // Calculate overall score (average of all criteria scores)
      const scores = Object.values(finalScores).map((s) => s.score);
      const overallScore =
        scores.length > 0
          ? scores.reduce((sum, score) => sum + score, 0) / scores.length
          : 0;

      // Generate feedback based on scores
      const feedback =
        `Evaluation completed using ${judgmentStrategy.replace(
          "_",
          " "
        )} strategy across ${totalRuns} runs. ` +
        `Average score: ${overallScore.toFixed(2)}`;

      evaluations.push({
        modelId: modelId === "ideal-response" ? undefined : modelId,
        isIdealResponse: modelId === "ideal-response",
        overallScore,
        criteriaScores: finalScores,
        feedback,
        timestamp: new Date().toISOString(),
      });
    });

    const totalEvaluationTime = Date.now() - totalEvaluationStartTime;

    // Calculate score variance if multiple runs
    // if (totalRuns > 1) {
    //   console.log(`\n📉 Score Consistency Analysis:`);
    //   modelIds.forEach((modelId) => {
    //     const modelRuns = evaluationRuns.filter((r) => r.modelId === modelId);
    //     if (modelRuns.length > 1) {
    //       const modelName =
    //         modelId === "ideal-response" ? "IDEAL RESPONSE" : modelId;
    //       console.log(`   ${modelName}:`);

    //       criteria.forEach((criterion: any) => {
    //         const scores = modelRuns
    //           .map((r) => r.criteriaScores[criterion.id]?.score)
    //           .filter((s) => s !== undefined);

    //         if (scores.length > 1) {
    //           const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    //           const variance =
    //             scores.reduce(
    //               (sum, score) => sum + Math.pow(score - avg, 2),
    //               0
    //             ) / scores.length;
    //           const stdDev = Math.sqrt(variance);
    //           const uniqueScores = new Set(scores);

    //           console.log(`     • ${criterion.name}:`);
    //           console.log(`       - Scores: [${scores.join(", ")}]`);
    //           console.log(`       - Unique values: ${uniqueScores.size}`);
    //           console.log(`       - Std deviation: ${stdDev.toFixed(2)}`);
    //           console.log(
    //             `       - Agreement: ${
    //               uniqueScores.size === 1 ? "✅ Perfect" : "⚠️ Varied"
    //             }`
    //           );
    //         }
    //       });
    //     }
    //   });
    // }


    // Get evaluation model ID for response (use first assistant's model for backward compatibility)
    const evaluationModelId =
      activeEvaluationAssistants.length > 0
        ? `${activeEvaluationAssistants[0].provider}/${activeEvaluationAssistants[0].model}`
        : "";

    return {
      evaluations,
      evaluationModelId,
      metadata: {
        strategy: judgmentStrategy,
        assistantsUsed: activeEvaluationAssistants.map((a) => ({
          name: a.name,
          weight: a.weight,
          model: `${a.provider}/${a.model}`,
        })),
        totalRuns,
        totalTime,
        evaluationDurationMs: totalEvaluationTime,
        judgmentStrategy: judgmentStrategy,
      },
    };
  } catch (error) {
    console.error("Error in evaluateModelOutputs:", error);
    return {
      evaluations: [],
      evaluationModelId: "",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phase, testCase, criteria, outputs, idealResponse } = body;

    if (phase === "evaluate") {
      const result = await evaluateModelOutputs(
        outputs,
        testCase,
        criteria,
        idealResponse
      );

      return NextResponse.json({
        success: true,
        ...result,
      });
    }

    // Handle other phases if needed
    return NextResponse.json(
      {
        error: "Invalid phase specified",
        details: "Only 'evaluate' phase is supported",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("Model evaluation error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    return NextResponse.json(
      {
        error: "Failed to evaluate models",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
