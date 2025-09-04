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
    console.log(`\n🔍 Starting parallel evaluation process...`);
    console.log(`📊 Configuration:`);
    console.log(`   - Model outputs to evaluate: ${outputs.length}`);
    console.log(`   - Ideal response: ${idealResponse ? "Yes" : "No"}`);
    console.log(
      `   - Total evaluations: ${outputs.length + (idealResponse ? 1 : 0)}`
    );
    console.log(`   - Criteria per evaluation: ${criteria.length}`);

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
      console.log("Using default judgment strategy: majority_voting");
    }
    console.log(`   - Judgment strategy: ${judgmentStrategy}`);

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
    console.log(`   - Active assistants: ${activeEvaluationAssistants.length}`);
    console.log(`   - Total weighted runs per output: ${totalRuns}`);
    console.log(
      `   - Total parallel evaluations: ${
        (outputs.length + (idealResponse ? 1 : 0)) * totalRuns * criteria.length
      }`
    );

    // Log assistant details
    activeEvaluationAssistants.forEach((assistant) => {
      console.log(
        `   - ${assistant.name}: weight=${assistant.weight}, model=${assistant.provider}/${assistant.model}`
      );
    });

    console.log(
      `⏱️  Started at: ${new Date(totalEvaluationStartTime).toISOString()}\n`
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

    // Print comprehensive evaluation summary
    console.log(`\n${"=".repeat(80)}`);
    console.log(`📊 EVALUATION SUMMARY`);
    console.log(`${"=".repeat(80)}`);

    console.log(`\n⏱️  Performance Metrics:`);
    console.log(`   - Total wall time: ${totalEvaluationTime}ms`);
    console.log(`   - Parallel execution time: ${totalTime}ms`);
    console.log(
      `   - Speedup factor: ${(totalEvaluationTime / totalTime).toFixed(2)}x`
    );
    console.log(
      `   - Average time per evaluation: ${(
        totalTime / evaluationRuns.length
      ).toFixed(2)}ms`
    );

    console.log(
      `\n🤖 Assistants Used (${activeEvaluationAssistants.length} total):`
    );
    activeEvaluationAssistants.forEach((assistant) => {
      const runs = evaluationRuns.filter(
        (r) => r.assistantId === assistant.assistantId
      ).length;
      console.log(`   - ${assistant.name}:`);
      console.log(`     • Model: ${assistant.provider}/${assistant.model}`);
      console.log(`     • Weight: ${assistant.weight}`);
      console.log(`     • Actual runs: ${runs}`);
    });

    console.log(
      `\n📈 Judgment Strategy: ${judgmentStrategy
        .replace("_", " ")
        .toUpperCase()}`
    );

    console.log(`\n📋 Results per Model:`);
    evaluations.forEach((evaluation) => {
      const modelName = evaluation.isIdealResponse
        ? "IDEAL RESPONSE"
        : evaluation.modelId || "Unknown";
      console.log(`\n   ${modelName}:`);
      console.log(`   - Overall Score: ${evaluation.overallScore.toFixed(2)}`);
      console.log(`   - Criteria Scores:`);

      Object.entries(evaluation.criteriaScores).forEach(
        ([criterionId, scoreData]) => {
          const criterion = criteria.find((c: any) => c.id === criterionId);
          const criterionName = criterion?.name || criterionId;
          console.log(`     • ${criterionName}: ${scoreData.score}`);

          // If majority voting, show vote distribution from subscores
          if (
            judgmentStrategy === "majority_voting" &&
            scoreData.subscores &&
            scoreData.subscores.length > 0
          ) {
            const voteCount = new Map<number, number>();
            scoreData.subscores.forEach((subscore: any) => {
              const count = voteCount.get(subscore.score) || 0;
              voteCount.set(subscore.score, count + 1);
            });
            const voteSummary = Array.from(voteCount.entries())
              .map(([score, count]) => `${score}: ${count}`)
              .join(", ");
            console.log(`       (Vote distribution: ${voteSummary})`);
          }
        }
      );
    });

    console.log(`\n📊 Statistics:`);
    console.log(`   - Total evaluation runs: ${evaluationRuns.length}`);
    console.log(
      `   - Models evaluated: ${outputs.length}${
        idealResponse ? " + 1 ideal" : ""
      }`
    );
    console.log(`   - Criteria evaluated: ${criteria.length}`);
    console.log(
      `   - Total individual scores: ${evaluationRuns.length * criteria.length}`
    );

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

    console.log(`\n${"=".repeat(80)}`);
    console.log(`✅ Evaluation completed successfully!`);
    console.log(`${"=".repeat(80)}\n`);

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
      console.log("Starting evaluation phase with parallel execution...");
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
