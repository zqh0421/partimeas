import { NextRequest, NextResponse } from "next/server";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { traceable } from "langsmith/traceable";
import {
  getModelInstance,
  getActiveEvaluationAssistant,
  getAllActiveEvaluationAssistants,
} from "@/app/api/model-evaluation/utils";
import { 
  runParallelEvaluations, 
  applyJudgmentStrategy 
} from "@/app/api/model-evaluation/parallel-evaluation";
import { sql } from "@/app/config/database";
import { group } from "console";

interface EvaluationResult {
  modelId?: string; // Model ID for the evaluated response
  overallScore: number;
  criteriaScores: Record<string, { score: number; reasoning: string }>;
  feedback: string;
  timestamp: string;
  isIdealResponse?: boolean; // Optional flag for ideal response evaluations
}

interface EvaluationRun {
  assistantId: number;
  assistantName: string;
  runIndex: number;
  criteriaScores: Record<string, { score: number; reasoning: string }>;
}

type JudgmentStrategy = 'majority_voting' | 'highest_score' | 'lowest_score';

// Helper function to evaluate model outputs
const evaluateModelOutputs = async (
  outputs: any[],
  testCase: any,
  criteria: any[],
  idealResponse?: any // Add ideal response parameter
) => {
  try {
    const totalEvaluationStartTime = Date.now();
    console.log(`\n🔍 Starting evaluation process...`);
    console.log(`📊 Configuration:`);
    console.log(`   - Model outputs to evaluate: ${outputs.length}`);
    console.log(`   - Ideal response: ${idealResponse ? "Yes" : "No"}`);
    console.log(
      `   - Total evaluations: ${outputs.length + (idealResponse ? 1 : 0)}`
    );
    console.log(`   - Criteria per evaluation: ${criteria.length}`);
    console.log(
      `   - Total criterion evaluations: ${
        (outputs.length + (idealResponse ? 1 : 0)) * criteria.length
      }`
    );
    console.log(
      `⏱️  Started at: ${new Date(totalEvaluationStartTime).toISOString()}\n`
    );

    // Get judgment strategy from config
    let judgmentStrategy: JudgmentStrategy = 'majority_voting';
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
      console.log('Using default judgment strategy: majority_voting');
    }

    // Get all active evaluation assistants with weights
    const activeEvaluationAssistants = await getAllActiveEvaluationAssistants();
    if (!activeEvaluationAssistants || activeEvaluationAssistants.length === 0) {
      // Fallback to single assistant for backward compatibility
      const singleAssistant = await getActiveEvaluationAssistant();
      if (!singleAssistant) {
        return { evaluations: [], evaluationModelId: "" };
      }
      activeEvaluationAssistants.push({
        ...singleAssistant,
        weight: 1
      });
    }

    const evaluationModelId = `${activeEvaluationAssistant.provider}/${activeEvaluationAssistant.model}`;
    const evaluationModel = await getModelInstance(
      activeEvaluationAssistant.provider,
      activeEvaluationAssistant.model
    );
    console.log(
      `✅ Evaluation model instance created successfully: ${evaluationModelId}, ${activeEvaluationAssistant.model}, ${activeEvaluationAssistant.provider}`
    );
    console.log(
      `🔧 Using evaluation assistant: ${activeEvaluationAssistant.name}`
    );
    console.log(
      `🔧 System prompt length: ${
        activeEvaluationAssistant.systemPrompt?.length || 0
      }`
    );

    const evaluations: EvaluationResult[] = [];
    const modelEvaluationTimes: {
      modelId: string;
      time: number;
      criteriaCount: number;
      criteriaTimings: {
        individual: number[];
        avg: number;
        max: number;
        min: number;
        total: number;
      };
    }[] = [];

    // Helper function to evaluate a single criterion/assertion
    const evaluateSingleCriterion = async (
      responseContent: string,
      modelId: string,
      testCaseInput: string,
      criterion: any,
      isIdeal: boolean = false
    ): Promise<{
      criterionId: string;
      scoreData: any;
      evaluationTime: number;
    }> => {
      const startTime = Date.now();
      const logPrefix = isIdeal ? "🎯 Ideal" : `🔍 Model ${modelId}`;

      // Build user prompt for single criterion
      const userQuery =
        `**Test Case User Input:**\n${testCaseInput}\n\n\n` +
        `**AI Model Response to Evaluate:**\n${responseContent}\n\n\n` +
        `**Evaluation Criterion:**\n` +
        `- Assertion: ${criterion.description}\n` +
        `- Score Range: ${criterion.scoreRange} (Use whole numbers only)`;

      // Create format instructions for single criterion
      const formatInstructions =
        `Respond with a valid JSON object containing:\n` +
        `- "score": number (within the specified range)\n` +
        `- "reasoning": string (explanation for the score)`;

      const partialedPrompt = await ChatPromptTemplate.fromMessages([
        [
          "system",
          `${activeEvaluationAssistant.systemPrompt}\n\n{format_instructions}`,
        ],
        ["human", "{query}"],
      ]).partial({
        format_instructions: formatInstructions,
      });

      try {
        // Parser for single criterion result
        const singleCriterionParser = new JsonOutputParser<{
          score: number;
          reasoning: string;
        }>();

        const chain = partialedPrompt
          .pipe(evaluationModel)
          .pipe(singleCriterionParser);

        // Create a traceable wrapper for the chain invocation
        const tracedChain = traceable(
          async (query: string) => {
            return await chain.invoke({ query });
          },
          {
            name: isIdeal
              ? `ideal-criterion-${criterion.id}-${activeEvaluationAssistant.provider}-${activeEvaluationAssistant.model}`
              : `criterion-${criterion.id}-${activeEvaluationAssistant.provider}-${activeEvaluationAssistant.model}`,
            tags: isIdeal
              ? ["evaluation", "ideal-response", "criterion"]
              : ["evaluation", "criterion"],
            metadata: {
              source: "PartiMeas",
              run_type: "evaluation",
              criterion_id: criterion.id,
              ls_provider: activeEvaluationAssistant.provider,
              ls_model_name: activeEvaluationAssistant.model,
              assistant_id: activeEvaluationAssistant.assistantId,
              assistant_name: activeEvaluationAssistant.name,
              test_case_id: testCase.id || "unknown",
              model_being_evaluated: isIdeal ? "ideal-response" : modelId,
              system_prompt: activeEvaluationAssistant.systemPrompt,
            },
          }
        );

        const result = await tracedChain(userQuery);
        const evaluationTime = Date.now() - startTime;

        return {
          criterionId: criterion.id,
          scoreData: result,
          evaluationTime,
        };
      } catch (error) {
        console.error(
          `❌ Failed to evaluate criterion ${criterion.id} for ${logPrefix}:`,
          error
        );

        const evaluationTime = Date.now() - startTime;
        return {
          criterionId: criterion.id,
          scoreData: {
            score: 0,
            reasoning:
              `${
                isIdeal ? "Ideal response evaluation" : "Evaluation"
              } failed for criterion ${criterion.id} - ` +
              (error instanceof Error ? error.message : "Unknown error"),
          },
          evaluationTime,
        };
      }
    };

    // Helper function to evaluate a single response (all criteria in parallel)
    const evaluateResponse = async (
      responseContent: string,
      modelId: string,
      testCaseInput: string,
      isIdeal: boolean = false
    ): Promise<void> => {
      const logPrefix = isIdeal ? "🎯 Ideal response" : `🔍 Model ${modelId}`;
      const overallStartTime = Date.now();
      const modelEvalStartTime = Date.now();

      try {
        // Evaluate all criteria in parallel
        const criteriaPromises = criteria.map((criterion) =>
          evaluateSingleCriterion(
            responseContent,
            modelId,
            testCaseInput,
            criterion,
            isIdeal
          )
        );

        const criteriaResults = await Promise.all(criteriaPromises);
        const overallEvaluationTime = Date.now() - overallStartTime;

        // Combine results into the expected format
        const criteriaScores = criteriaResults.reduce((acc, result) => {
          acc[result.criterionId] = result.scoreData;
          return acc;
        }, {} as any);

        // Calculate overall score
        const totalScore = Object.values(criteriaScores).reduce(
          (sum: number, scoreData: any) => sum + (scoreData.score || 0),
          0
        );
        const overallScore =
          criteria.length > 0 ? totalScore / criteria.length : 0;

        // Create the evaluation object
        const evaluationWithMetadata: EvaluationResult = {
          modelId: modelId,
          overallScore,
          criteriaScores,
          feedback: `Evaluated ${criteria.length} criteria successfully`,
          timestamp: new Date().toISOString(),
          ...(isIdeal && { isIdealResponse: true }),
        };

        evaluations.push(evaluationWithMetadata);

        // Track model evaluation time and criterion details
        const modelEvalTime = Date.now() - modelEvalStartTime;
        const individualTimes = criteriaResults.map((r) => r.evaluationTime);
        modelEvaluationTimes.push({
          modelId,
          time: modelEvalTime,
          criteriaCount: criteria.length,
          criteriaTimings: {
            individual: individualTimes,
            avg:
              individualTimes.reduce((a, b) => a + b, 0) /
              individualTimes.length,
            max: Math.max(...individualTimes),
            min: Math.min(...individualTimes),
            total: overallEvaluationTime,
          },
        });
      } catch (error) {
        console.error(`❌ Failed to evaluate ${logPrefix}:`, error);

        // Create a fallback evaluation
        evaluations.push({
          modelId: modelId,
          overallScore: 0,
          criteriaScores: criteria.reduce((acc, c) => {
            acc[c.id] = {
              score: 0,
              reasoning:
                `${
                  isIdeal ? "Ideal response evaluation" : "Evaluation"
                } failed - ` +
                (error instanceof Error ? error.message : "Unknown error"),
            };
            return acc;
          }, {} as any),
          feedback: `${
            isIdeal ? "Ideal response evaluation" : "Evaluation"
          } failed`,
          timestamp: new Date().toISOString(),
          ...(isIdeal && { isIdealResponse: true }),
        });
      }
    };

    // Prepare all evaluation promises (models + ideal)
    const allEvaluationPromises: Promise<void>[] = [];

    // Add all model output evaluations
    outputs.forEach((output) => {
      allEvaluationPromises.push(
        evaluateResponse(output.output, output.modelId, testCase.input, false)
      );
    });

    // Add ideal response evaluation if present
    if (idealResponse && idealResponse.content) {
      const idealTestCaseInput =
        idealResponse.idealTestCase ||
        idealResponse.testCaseInput ||
        testCase.input;

      allEvaluationPromises.push(
        evaluateResponse(
          idealResponse.content,
          idealResponse.id || "ideal-response",
          idealTestCaseInput,
          true
        )
      );
    }

    // Execute all evaluations in parallel
    await Promise.all(allEvaluationPromises);

    const totalEvaluationTime = Date.now() - totalEvaluationStartTime;

    // Print comprehensive summary
    console.log(`\n${"=".repeat(70)}`);
    console.log(`                    EVALUATION SUMMARY`);
    console.log(`${"=".repeat(70)}\n`);

    console.log(`✅ Evaluation completed successfully!`);
    console.log(
      `⏱️  TOTAL TIME: ${totalEvaluationTime}ms (${(
        totalEvaluationTime / 1000
      ).toFixed(2)} seconds)`
    );
    console.log(`📊 Total evaluations: ${evaluations.length}`);
    console.log(
      `📈 Average time per model: ${(
        totalEvaluationTime / allEvaluationPromises.length
      ).toFixed(0)}ms\n`
    );

    // Sort and display model evaluation times
    modelEvaluationTimes.sort((a, b) => b.time - a.time);
    console.log(`${"─".repeat(70)}`);
    console.log(`MODEL EVALUATION BREAKDOWN (sorted by time):`);
    console.log(`${"─".repeat(70)}`);
    modelEvaluationTimes.forEach((model) => {
      const isIdeal = evaluations.find(
        (e) => e.modelId === model.modelId
      )?.isIdealResponse;
      const prefix = isIdeal ? "🎯 IDEAL" : "🤖 MODEL";
      console.log(`${prefix}: ${model.modelId}`);
      console.log(
        `   Total time: ${model.time}ms (${(model.time / 1000).toFixed(2)}s)`
      );
      console.log(`   Criteria evaluated: ${model.criteriaCount}`);
      console.log(
        `   Avg per criterion: ${model.criteriaTimings.avg.toFixed(0)}ms`
      );
      console.log(`   Fastest criterion: ${model.criteriaTimings.min}ms`);
      console.log(`   Slowest criterion: ${model.criteriaTimings.max}ms`);
      console.log(
        `   Criterion parallel speedup: ${(
          model.criteriaTimings.individual.reduce((a, b) => a + b, 0) /
          model.criteriaTimings.total
        ).toFixed(2)}x`
      );
      console.log();
    });

    // Calculate parallel speedup for models
    console.log(`${"─".repeat(70)}`);
    console.log(`PARALLEL PERFORMANCE METRICS:`);
    console.log(`${"─".repeat(70)}`);
    const totalSequentialTime = modelEvaluationTimes.reduce(
      (sum, m) => sum + m.time,
      0
    );
    const parallelSpeedup = totalSequentialTime / totalEvaluationTime;
    const totalCriteriaSequential = modelEvaluationTimes.reduce(
      (sum, m) => sum + m.criteriaTimings.individual.reduce((a, b) => a + b, 0),
      0
    );

    console.log(`🚀 MODEL-LEVEL PARALLELIZATION:`);
    console.log(
      `   - Models evaluated in parallel: ${allEvaluationPromises.length}`
    );
    console.log(
      `   - Sequential time (if one-by-one): ${totalSequentialTime}ms`
    );
    console.log(`   - Actual parallel time: ${totalEvaluationTime}ms`);
    console.log(`   - Speedup: ${parallelSpeedup.toFixed(2)}x`);
    console.log(
      `   - Time saved: ${totalSequentialTime - totalEvaluationTime}ms\n`
    );

    console.log(`⚡ CRITERIA-LEVEL PARALLELIZATION:`);
    console.log(
      `   - Total criteria evaluations: ${modelEvaluationTimes.reduce(
        (sum, m) => sum + m.criteriaCount,
        0
      )}`
    );
    console.log(
      `   - Sequential time (all criteria): ${totalCriteriaSequential}ms`
    );
    console.log(
      `   - Actual time (with parallelization): ${totalEvaluationTime}ms`
    );
    console.log(
      `   - Overall speedup: ${(
        totalCriteriaSequential / totalEvaluationTime
      ).toFixed(2)}x`
    );
    return { evaluations, evaluationModelId };
  } catch (error) {
    console.error("❌ Error during evaluation:", error);
    throw error;
  }
};

// Main API route handler
export async function POST(request: NextRequest) {
  try {
    const { testCase, criteria, outputs, groupId, idealResponse } =
      await request.json();

    console.log(`Phase 2: Evaluating outputs... - Group: ${groupId}`);

    if (!criteria || !Array.isArray(criteria) || criteria.length === 0) {
      return NextResponse.json(
        {
          error:
            "Missing required field: criteria. Please provide evaluation criteria.",
        },
        { status: 400 }
      );
    }

    if (!outputs || !Array.isArray(outputs) || outputs.length === 0) {
      return NextResponse.json(
        {
          error:
            "Missing required field: outputs. Please provide model outputs to evaluate.",
        },
        { status: 400 }
      );
    }

    try {
      // Evaluate all outputs using the evaluation model
      const { evaluations, evaluationModelId } = await evaluateModelOutputs(
        outputs,
        testCase,
        criteria,
        idealResponse
      );

      return NextResponse.json({
        success: true,
        phase: "evaluate",
        evaluations,
        evaluationModel: evaluationModelId,
        timestamp: new Date().toISOString(),
        message: "Evaluation completed.",
      });
    } catch (evaluationError) {
      console.error("❌ Evaluation error details:", evaluationError);
      console.error(
        "❌ Error stack:",
        evaluationError instanceof Error
          ? evaluationError.stack
          : "No stack trace"
      );

      return NextResponse.json(
        {
          error: "Evaluation failed",
          details:
            evaluationError instanceof Error
              ? evaluationError.message
              : "Unknown evaluation error",
          phase: "evaluate",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Model evaluation error:", error);

    // Provide more specific error messages
    let errorMessage = "Failed to evaluate model";
    let errorDetails = error instanceof Error ? error.message : "Unknown error";

    if (errorDetails.includes("OPENAI_API_KEY not configured")) {
      errorMessage =
        "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.";
    } else if (errorDetails.includes("ANTHROPIC_API_KEY not configured")) {
      errorMessage =
        "Anthropic API key not configured. Please add ANTHROPIC_API_KEY to your environment variables.";
    } else if (errorDetails.includes("GOOGLE_API_KEY not configured")) {
      errorMessage =
        "Google API key not configured. Please add GOOGLE_API_KEY to your environment variables.";
    } else if (errorDetails.includes("OPENROUTER_API_KEY not configured")) {
      errorMessage =
        "OpenRouter API key not configured. Please add OPENROUTER_API_KEY to your environment variables.";
    } else if (errorDetails.includes("Unsupported model")) {
      errorMessage =
        "One or more models are not supported or not available in your account.";
    } else if (
      errorDetails.includes("401") ||
      errorDetails.includes("Unauthorized")
    ) {
      errorMessage =
        "Invalid API key. Please check your API key configuration.";
    } else if (
      errorDetails.includes("404") ||
      errorDetails.includes("Not Found")
    ) {
      errorMessage =
        "One or more models not found. They may not be available in your account.";
    } else if (
      errorDetails.includes("429") ||
      errorDetails.includes("Rate limit")
    ) {
      errorMessage = "Rate limit exceeded. Please try again later.";
    } else if (
      errorDetails.includes("500") ||
      errorDetails.includes("Internal Server Error")
    ) {
      errorMessage = "OpenAI service error. Please try again later.";
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}
