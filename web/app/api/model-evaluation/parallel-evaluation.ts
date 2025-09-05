/**
 * Parallel Evaluation Module Summary (by Claude Opus 4.1)
 *
 * This module handles concurrent evaluation of AI model responses using multiple
 * evaluation assistants. It supports weighted voting, multiple judgment strategies,
 * and parallel processing for improved performance.
 *
 * FLOW OVERVIEW:
 * 1. Multiple evaluation assistants evaluate the same response in parallel
 * 2. Each assistant can have a weight (number of evaluation runs)
 * 3. Results are aggregated using a judgment strategy (majority voting, highest/lowest score)
 * 4. Final scores are determined per criterion across all runs
 */

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { getModelInstance } from "@/app/api/model-evaluation/utils";

interface EvaluationRun {
  assistantId: number;
  assistantName: string;
  runIndex: number;
  modelId: string;
  criteriaScores: Record<string, { score: number; reasoning: string }>;
  timestamp: string;
}

type JudgmentStrategy = "majority_voting" | "highest_score" | "lowest_score";

/**
 * Apply judgment strategy to aggregate scores from multiple runs
 *
 * AGGREGATION FLOW:
 * 1. Collect all scores for each criterion from multiple evaluation runs
 * 2. Apply the selected strategy to determine final score:
 *    - majority_voting: Most frequent score wins (ties broken by higher score)
 *    - highest_score: Maximum score across all runs
 *    - lowest_score: Minimum score across all runs (conservative approach)
 * 3. Return aggregated scores for all criteria
 */
export function applyJudgmentStrategy(
  allRuns: EvaluationRun[],
  strategy: JudgmentStrategy,
  modelId: string
): Record<string, { score: number; reasoning: string }> {
  const aggregatedScores: Record<string, { score: number; reasoning: string }> =
    {};

  // Get all criterion IDs
  const criterionIds = new Set<string>();
  allRuns.forEach((run) => {
    Object.keys(run.criteriaScores).forEach((id) => criterionIds.add(id));
  });

  // For each criterion, apply the judgment strategy
  criterionIds.forEach((criterionId) => {
    const scoresForCriterion = allRuns
      .filter((run) => run.modelId === modelId)
      .map((run) => run.criteriaScores[criterionId])
      .filter((score) => score !== undefined);

    if (scoresForCriterion.length === 0) return;

    let finalScore: number;

    switch (strategy) {
      case "majority_voting": {
        // Count occurrences of each score
        const scoreCount = new Map<number, number>();

        scoresForCriterion.forEach((item) => {
          const currentCount = scoreCount.get(item.score) || 0;
          scoreCount.set(item.score, currentCount + 1);
        });

        // Find the score with maximum occurrences
        let maxCount = 0;
        let mostFrequentScore = scoresForCriterion[0].score;

        scoreCount.forEach((count, score) => {
          if (
            count > maxCount ||
            (count === maxCount && score > mostFrequentScore)
          ) {
            maxCount = count;
            mostFrequentScore = score;
          }
        });

        finalScore = mostFrequentScore;
        break;
      }

      case "highest_score": {
        // Select the highest score
        const highest = scoresForCriterion.reduce((max, current) =>
          current.score > max.score ? current : max
        );
        finalScore = highest.score;
        break;
      }

      case "lowest_score": {
        // Select the lowest score
        const lowest = scoresForCriterion.reduce((min, current) =>
          current.score < min.score ? current : min
        );
        finalScore = lowest.score;
        break;
      }

      default:
        // Default to first score if strategy is unknown
        finalScore = scoresForCriterion[0].score;
    }

    // Find the reasoning that corresponds to the final score
    const selectedItem = scoresForCriterion.find(item => item.score === finalScore) || scoresForCriterion[0];
    
    aggregatedScores[criterionId] = {
      score: finalScore,
      reasoning: selectedItem.reasoning,
    };
  });

  return aggregatedScores;
}

/**
 * Evaluate a single criterion with a specific assistant
 *
 * EVALUATION FLOW:
 * 1. Get the model instance for the evaluation assistant
 * 2. Construct evaluation prompt with test input, model response, and criterion
 * 3. Send to LLM with JSON output parser for structured scoring
 * 4. Use LangSmith tracing for observability
 * 5. Return score with reasoning or error fallback
 *
 * This function is called multiple times in parallel for different criteria
 * and assistants to enable concurrent evaluation.
 */
export async function evaluateSingleCriterionWithAssistant(
  responseContent: string,
  _modelId: string, // Unused but kept for API compatibility
  testCaseInput: string,
  criterion: any,
  assistant: any,
  _isIdeal: boolean = false // Unused but kept for API compatibility
): Promise<{
  criterionId: string;
  scoreData: { score: number; reasoning: string };
  evaluationTime: number;
}> {
  const startTime = Date.now();

  try {
    // Get model instance for this assistant
    const evaluationModel = await getModelInstance(
      assistant.provider,
      assistant.model
    );

    // Build user prompt for single criterion
    const userQuery =
      `**Test Case User Input:**\n${testCaseInput}\n\n\n` +
      `**AI Model Response to Evaluate:**\n${responseContent}\n\n\n` +
      `**Evaluation Criterion:**\n` +
      `- Assertion: ${criterion.description}\n` +
      `- Score Range: ${criterion.scoreRange} (Use whole numbers only)`;

    // Create format instructions
    const formatInstructions =
      `Respond with a valid JSON object containing:\n` +
      `- "reasoning": string (explanation for the score)` +
      `- "score": number (within the specified range)\n`;

    const partialedPrompt = await ChatPromptTemplate.fromMessages([
      ["system", `${assistant.systemPrompt}\n\n{format_instructions}`],
      ["human", "{query}"],
    ]).partial({
      format_instructions: formatInstructions,
    });

    // Parser for single criterion result
    const singleCriterionParser = new JsonOutputParser<{
      score: number;
      reasoning: string;
    }>();

    const chain = partialedPrompt
      .pipe(evaluationModel)
      .pipe(singleCriterionParser);

    const result = await chain.invoke({ query: userQuery });

    const evaluationTime = Date.now() - startTime;

    return {
      criterionId: criterion.id,
      scoreData: result,
      evaluationTime,
    };
  } catch (error) {
    console.error(
      `Error evaluating criterion ${criterion.id} with assistant ${assistant.name}:`,
      error
    );

    // Return a default score on error
    return {
      criterionId: criterion.id,
      scoreData: {
        score: 0,
        reasoning: `Evaluation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      evaluationTime: Date.now() - startTime,
    };
  }
}

/**
 * Run parallel evaluations for all assistants and their weights
 *
 * MAIN PARALLEL PROCESSING FLOW:
 * 1. For each model output to evaluate:
 *    - For each evaluation assistant:
 *      - Create N evaluation runs based on assistant weight
 *      - Each run evaluates ALL criteria for that output
 *
 * 2. If ideal response provided:
 *    - Run same evaluation process on ideal response
 *    - Used as baseline for comparison
 *
 * 3. Execute all evaluations concurrently using Promise.allSettled
 *    - Typically runs 10-100+ evaluations simultaneously
 *    - Resilient to individual evaluation failures
 *
 * 4. Collect results and return with timing metrics
 *
 * PERFORMANCE: With 3 assistants × weight 3 × 5 criteria × 2 models = 90 parallel calls
 */
export async function runParallelEvaluations(
  outputs: any[],
  testCase: any,
  criteria: any[],
  assistants: any[],
  idealResponse?: any
): Promise<{
  evaluationRuns: EvaluationRun[];
  totalTime: number;
}> {
  const startTime = Date.now();
  const allEvaluationPromises: Promise<EvaluationRun>[] = [];

  // STEP 1: Create evaluation promises for each output
  // This nested loop structure creates all evaluation tasks upfront
  for (const output of outputs) {
    for (const assistant of assistants) {
      const weight = assistant.weight || 1; // Weight determines number of voting runs

      // Create multiple runs based on weight for voting power
      for (let runIndex = 0; runIndex < weight; runIndex++) {
        const evaluationPromise = (async (): Promise<EvaluationRun> => {
          const criteriaScores: Record<
            string,
            { score: number; reasoning: string }
          > = {};

          // STEP 1.1: Evaluate all criteria for this output in parallel
          // Each criterion is evaluated independently by the same assistant
          const criteriaPromises = criteria.map((criterion) =>
            evaluateSingleCriterionWithAssistant(
              output.output,
              output.modelId,
              testCase.input,
              criterion,
              assistant,
              false
            )
          );

          const criteriaResults = await Promise.allSettled(criteriaPromises);

          criteriaResults.forEach((result, index) => {
            if (result.status === "fulfilled") {
              criteriaScores[result.value.criterionId] = result.value.scoreData;
            } else {
              // Handle failed criterion evaluation
              criteriaScores[criteria[index].id] = {
                score: 0,
                reasoning: "Evaluation failed",
              };
            }
          });


          return {
            assistantId: assistant.assistantId,
            assistantName: assistant.name,
            runIndex,
            modelId: output.modelId,
            criteriaScores,
            timestamp: new Date().toISOString(),
          };
        })();

        allEvaluationPromises.push(evaluationPromise);
      }
    }
  }

  // STEP 2: Add ideal response evaluation if provided
  // Same evaluation process but with ideal/expected response as baseline
  if (idealResponse) {
    for (const assistant of assistants) {
      const weight = assistant.weight || 1;

      for (let runIndex = 0; runIndex < weight; runIndex++) {
        const evaluationPromise = (async (): Promise<EvaluationRun> => {
          const criteriaScores: Record<
            string,
            { score: number; reasoning: string }
          > = {};

          // Evaluate all criteria for ideal response
          const criteriaPromises = criteria.map((criterion) =>
            evaluateSingleCriterionWithAssistant(
              idealResponse.content,
              "ideal-response",
              idealResponse.idealTestCase || testCase.input,
              criterion,
              assistant,
              true
            )
          );

          const criteriaResults = await Promise.allSettled(criteriaPromises);

          criteriaResults.forEach((result, index) => {
            if (result.status === "fulfilled") {
              criteriaScores[result.value.criterionId] = result.value.scoreData;
            } else {
              criteriaScores[criteria[index].id] = {
                score: 0,
                reasoning: "Evaluation failed",
              };
            }
          });


          return {
            assistantId: assistant.assistantId,
            assistantName: assistant.name,
            runIndex,
            modelId: "ideal-response",
            criteriaScores,
            timestamp: new Date().toISOString(),
          };
        })();

        allEvaluationPromises.push(evaluationPromise);
      }
    }
  }

  // STEP 3: Execute all evaluations in parallel
  // Promise.allSettled ensures all evaluations complete even if some fail
  const results = await Promise.allSettled(allEvaluationPromises);

  // STEP 4: Process results - separate successful from failed runs
  const successfulRuns: EvaluationRun[] = [];
  let failedCount = 0;

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      successfulRuns.push(result.value);
    } else {
      failedCount++;
      console.error(`❌ Evaluation run ${index + 1} failed:`, result.reason);
    }
  });

  const totalTime = Date.now() - startTime;

  return {
    evaluationRuns: successfulRuns,
    totalTime,
  };
}
