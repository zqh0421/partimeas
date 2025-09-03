import {
  NewEvaluationRecord,
  RubricWithScoring,
  EvaluationCriterion,
  EvaluationScore,
} from "@/app/types/database";
import { IdealModelResponse } from "@/app/types";
import {
  restoreCriteriaVersionSelection,
  restoreIdealResponseSelection,
} from "@/app/utils/selectionCache";
import { getCachedGroupId } from "@/app/utils/groupIdCache";

/**
 * Get active evaluation assistant information from the API
 */
async function getActiveEvaluationAssistant(): Promise<{
  provider: string;
  model: string;
  systemPrompt: string;
  assistantId: number;
  name: string;
} | null> {
  try {
    const res = await fetch("/api/evaluation-assistant", { cache: "no-store" });
    if (!res.ok) {
      console.warn(
        "[EvaluationDataCollector] Failed to fetch evaluation assistant. Using fallback."
      );
      return {
        provider: "openai",
        model: "gpt-4-turbo",
        systemPrompt:
          "You are an expert evaluator. Evaluate the given response based on the rubric criteria.",
        assistantId: 1,
        name: "Default Evaluation Assistant",
      };
    }
    const data = await res.json();
    if (data?.assistant) {
      return {
        provider: data.assistant.provider,
        model: data.assistant.model,
        systemPrompt: data.assistant.systemPrompt,
        assistantId: data.assistant.assistantId,
        name: data.assistant.name,
      };
    }
    return null;
  } catch (error) {
    console.error(
      "[EvaluationDataCollector] Error getting evaluation assistant:",
      error
    );
    return null;
  }
}

/**
 * Interface for collecting evaluation data from the UI components
 */
export interface EvaluationDataSnapshot {
  // Test case information
  testCasePrompt: string;
  testCaseContext?: string;
  testCase?: any; // The full test case object which may contain sessionId

  // Model responses
  modelOutputs: Array<{
    modelId: string;
    modelName: string;
    provider: string;
    systemPrompt: string;
    responseContent: string;
  }>;

  // Rubric information
  rubricItems: Array<{
    id: string;
    name: string;
    num: number;
    weight?: string;
    description?: string;
    requirement: string;
    points: number;
  }>;

  // Human scores
  humanScores: Record<string, Record<string, number>>; // rubricId -> responseId -> score
  humanRationales: Record<string, Record<string, string>>; // rubricId -> responseId -> rationale

  // AI scores
  aiScores: Record<
    string,
    Record<string, { 
      score: number; 
      rationale: string;
      subscores?: any[];
      aggregation_method?: string;
    }>
  >;

  // Evaluation model information
  evaluatorModel?: string;
  evaluatorSystemPrompt?: string;

  // Ideal response information
  idealResponse?: string;
  idealTestCase?: string;
  selectedIdealResponseId?: string;
  idealExpectedScores?: Record<string, number>; // criterionId -> expected score for ideal response

  // Session information
  sessionId?: string;
  groupId?: string;
}

/**
 * Collects evaluation data from various UI components and formats it for upload
 */
export async function collectEvaluationData(
  snapshot: EvaluationDataSnapshot
): Promise<NewEvaluationRecord> {
  // Get the active evaluation assistant info
  const evaluationAssistant = await getActiveEvaluationAssistant();

  // Helper: normalize response IDs for database storage
  const normalizeResponseId = (
    rubricId: string,
    responseId: string
  ): string => {
    console.log("before nomalize");
    console.log(responseId);
    // Handle ideal response specially - check if this responseId is the selected ideal response
    if (
      snapshot.selectedIdealResponseId &&
      responseId === snapshot.selectedIdealResponseId
    ) {
      return "Ideal Response";
    }

    // Check if this is a model ID (contains letters and hyphens, like "claude-3-5-sonnet-20241022")
    // Model IDs typically have format: provider-model-version or just model-version
    const isModelId = /^[a-z0-9]+(-[a-z0-9]+)+$/i.test(responseId);
    if (isModelId) {
      // For model IDs, find the index in modelOutputs array to get the response number
      const modelIndex = snapshot.modelOutputs.findIndex(
        (mo) => mo.modelId === responseId
      );
      if (modelIndex !== -1) {
        return `Response ${modelIndex + 1}`;
      }
      // If not found in modelOutputs, return as is (shouldn't happen)
      return responseId;
    }

    // For regular response IDs, extract the number and format as "Response N"
    // Handle various formats: "resp-1", "model-1", "Response 1", etc.
    const patterns = [
      /^resp-(\d+)$/i,
      /^response\s*(\d+)$/i,
      /^model-(\d+)$/i,
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(responseId?.trim() || "");
      if (match) {
        const num = parseInt(match[1], 10);
        if (!Number.isNaN(num) && num < 100) { // Reasonable response number limit
          return `Response ${num}`;
        }
      }
    }
    console.log("after nomalize");
    console.log(responseId);
    // If no pattern matches, return the original ID
    return responseId;
  };
  // Create criteria array combining human and AI scores in the new structure
  const criteria: EvaluationCriterion[] = snapshot.rubricItems.map((item) => {
    // Build per-response score map
    const humanResponseIds = Object.keys(snapshot.humanScores[item.id] || {});
    const aiResponseIds = Object.keys(snapshot.aiScores[item.id] || {});

    console.log(`[EvaluationDataCollector] Processing criterion ${item.id}:`, {
      humanResponseIds,
      aiResponseIds,
      humanScoresAvailable: humanResponseIds.length,
      aiScoresAvailable: aiResponseIds.length,
    });

    const responseIds = new Set<string>([
      ...humanResponseIds,
      ...aiResponseIds,
    ]);

    const scores: Record<
      string,
      { human_score: EvaluationScore; ai_score: EvaluationScore }
    > = {};
    for (const rawId of responseIds) {
      const normalizedId = normalizeResponseId(item.id, rawId);

      // Always use rawId to look up the actual data, since that's how it's stored
      const humanRaw = snapshot.humanScores[item.id]?.[rawId];
      const humanRationale = snapshot.humanRationales[item.id]?.[rawId] || "";

      // Debug logging for rationales
      if (humanRationale) {
        console.log(
          `[EvaluationDataCollector] Found rationale for ${item.id}/${rawId} -> ${normalizedId}: "${humanRationale}"`
        );
      } else if (typeof humanRaw === "number") {
        console.log(
          `[EvaluationDataCollector] No rationale found for ${item.id}/${rawId} -> ${normalizedId}, score: ${humanRaw}`
        );
      }

      const human_score: EvaluationScore =
        typeof humanRaw === "number"
          ? {
              score: humanRaw,
              rationale: humanRationale.trim(),
            }
          : {
              score: 0,
              rationale: "",
            };

      const aiRaw = snapshot.aiScores[item.id]?.[rawId];

      // Debug logging for AI scores
      if (aiRaw) {
        console.log(
          `[EvaluationDataCollector] Found AI score for ${item.id}/${rawId} -> ${normalizedId}:`,
          {
            score: aiRaw.score,
            rationale: aiRaw.rationale?.substring(0, 50) + "...",
          }
        );
      }

      // Include subscores and aggregation method if available
      // Note: For aggregated scores, we use empty string for rationale at the top level
      const ai_score: EvaluationScore & { subscores?: any[]; aggregation_method?: string } = aiRaw
        ? { 
            score: aiRaw.score ?? 0,
            // Always include rationale as a string (empty string for aggregated scores)
            rationale: (!aiRaw.subscores || aiRaw.subscores.length === 0) && aiRaw.rationale 
              ? (aiRaw.rationale || "").trim()
              : "",
            subscores: aiRaw.subscores || undefined,
            aggregation_method: aiRaw.aggregation_method || undefined
          }
        : { score: -1, rationale: "" };

      // Always add the score entry, even if both are defaults
      // Use the normalized ID for storage in the database
      scores[normalizedId] = {
        human_score: human_score,
        ai_score: ai_score,
      };
    }

    // Ensure ideal response expected human score is saved even if not in humanScores map
    if (snapshot.selectedIdealResponseId) {
      const idealResponseId = "Ideal Response";
      const expected = snapshot.idealExpectedScores?.[item.id];
      const expectedScore = typeof expected === "number" ? expected : 1; // default to 1

      // If ideal response doesn't exist in scores yet, add it with expected values
      if (!scores[idealResponseId]) {
        scores[idealResponseId] = {
          human_score: {
            score: expectedScore,
            rationale: "Ideal expected score",
          },
          ai_score: {
            score: -1,
            rationale: "Not evaluated by AI",
          },
        };
      } else if (
        !scores[idealResponseId].human_score ||
        scores[idealResponseId].human_score.score === 0
      ) {
        // Update human score if it's missing or default
        scores[idealResponseId].human_score = {
          score: expectedScore,
          rationale: "Ideal expected score",
        };
      }
    }

    // Debug: Log final scores for this criterion
    console.log(
      `[EvaluationDataCollector] Final scores for criterion "${item.name}":`,
      {
        responseCount: Object.keys(scores).length,
        hasAiScores: Object.values(scores).some(
          (s) => s.ai_score !== undefined
        ),
        scores: JSON.stringify(scores, null, 2),
      }
    );

    return {
      name: item.name || "Untitled Criterion",
      num: item.num,
      weight: item.weight,
      description:
        item.requirement || item.description || "No description provided", // Use requirement as description
      requirement: item.requirement || "No requirement specified",
      points: item.points || 2,
      scores,
      ideal_response: snapshot.idealResponse || "",
      original_id: item.id, // Store the original criterion ID for later mapping
    };
  });

  // Ensure we have at least one criterion
  if (criteria.length === 0) {
    // Create a default criterion if none exist
    criteria.push({
      name: "Default Criterion",
      num: 1,
      description: "Default evaluation criterion",
      requirement: "Evaluate the response quality",
      points: 2,
      scores: {},
      ideal_response: snapshot.idealResponse || "",
    });
  }

  const rubricWithScoring: RubricWithScoring = {
    criteria,
  };

  // Get group ID from cache (user input from GroupIdModal)
  const cachedGroupId = getCachedGroupId();
  const groupId =
    cachedGroupId ||
    snapshot.groupId ||
    `eval-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

  // Try to get sessionId from multiple sources
  const sessionId = snapshot.sessionId || snapshot.testCase?.sessionId;

  console.log("[EvaluationDataCollector] Session ID sources:", {
    fromSnapshot: snapshot.sessionId,
    fromTestCase: snapshot.testCase?.sessionId,
    resolved: sessionId,
  });

  // If no session_id is available, we can't upload the record due to foreign key constraint
  if (!sessionId) {
    throw new Error(
      "Session ID is required but not available. Cannot upload evaluation record."
    );
  }

  // Retrieve evaluation metadata from session storage
  let evaluationMetadata: { evaluationDurationMs?: number; judgmentStrategy?: string } = {};
  try {
    const storedMetadata = window.sessionStorage.getItem('lastEvaluationMetadata');
    if (storedMetadata) {
      const parsed = JSON.parse(storedMetadata);
      evaluationMetadata = {
        evaluationDurationMs: parsed.evaluationDurationMs,
        judgmentStrategy: parsed.judgmentStrategy
      };
      console.log('[EvaluationDataCollector] ✅ Retrieved evaluation metadata:', {
        duration: `${evaluationMetadata.evaluationDurationMs}ms`,
        strategy: evaluationMetadata.judgmentStrategy,
        totalRuns: parsed.totalRuns,
        assistants: parsed.assistantsUsed?.length || 0
      });
    } else {
      console.warn('[EvaluationDataCollector] ⚠️ No evaluation metadata found in session storage');
    }
  } catch (e) {
    console.warn('[EvaluationDataCollector] ❌ Could not retrieve evaluation metadata:', e);
  }

  const record = {
    group_id: groupId,
    session_id: sessionId,
    test_case_prompt:
      snapshot.testCasePrompt || "No test case prompt available",
    evaluator_model:
      evaluationAssistant?.model || snapshot.evaluatorModel || "gpt-4-turbo",
    evaluator_system_prompt:
      evaluationAssistant?.systemPrompt ||
      snapshot.evaluatorSystemPrompt ||
      "Default evaluation system prompt",
    ideal_response: snapshot.idealResponse || "No ideal response available",
    ideal_test_case: snapshot.idealTestCase || "No ideal test case available",
    rubric_with_scoring: rubricWithScoring,
    evaluation_duration_ms: evaluationMetadata.evaluationDurationMs,
    judgment_strategy: evaluationMetadata.judgmentStrategy,
  };
  
  // Log the complete record to verify metadata is included
  console.log('[EvaluationDataCollector] 📦 Final evaluation record:', {
    group_id: record.group_id,
    session_id: record.session_id,
    evaluation_duration_ms: record.evaluation_duration_ms,
    judgment_strategy: record.judgment_strategy,
    has_subscores: rubricWithScoring.criteria.some(c => 
      Object.values(c.scores || {}).some((s: any) => 
        s.ai_score?.subscores && s.ai_score.subscores.length > 0
      )
    ),
    criteria_count: rubricWithScoring.criteria.length
  });
  
  return record;
}

/**
 * Uploads evaluation data to the server
 */
export async function uploadEvaluationRecord(
  record: NewEvaluationRecord
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const response = await fetch("/api/evaluation-records", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(record),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Failed to upload evaluation record:", result);
      console.error("Response status:", response.status);
      console.error(
        "Validation details:",
        result.errors || "No validation details"
      );
      console.error("Full response:", result);
      return {
        success: false,
        error: result.error || result.details || "Upload failed",
      };
    }

    return {
      success: true,
      id: result.record?.id,
    };
  } catch (error) {
    console.error("Error uploading evaluation record:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Helper function to collect data from InputScoringTable component props and state
 */
export function createEvaluationSnapshot(params: {
  testCase?: any;
  modelOutputs?: any[];
  rubricItems: Array<{
    id: string;
    name: string;
    requirement?: string;
    num: number;
    weight?: string;
  }>;
  rubricPoints: number[];
  humanScores: Record<string, Record<string, number | "">>;
  humanRationales: Record<string, Record<string, string>>;
  aiScores: Record<
    string,
    Record<string, { 
      score: number; 
      rationale: string;
      subscores?: any[];
      aggregation_method?: string;
    }>
  >;
  evaluatorModel?: string;
  evaluatorSystemPrompt?: string;
  idealResponses?: IdealModelResponse[];
  sessionId?: string;
  groupId?: string;
  idealExpectedScores?: Record<string, number>;
}): EvaluationDataSnapshot {
  // Get selected ideal response
  const selectedIdealResponseId = restoreIdealResponseSelection();
  const selectedIdealResponse = params.idealResponses?.find(
    (response) => response.id === selectedIdealResponseId
  );

  // Convert human scores to proper format
  const cleanHumanScores: Record<string, Record<string, number>> = {};
  Object.entries(params.humanScores).forEach(([rubricId, responseScores]) => {
    cleanHumanScores[rubricId] = {};
    Object.entries(responseScores).forEach(([responseId, score]) => {
      if (typeof score === "number") {
        cleanHumanScores[rubricId][responseId] = score;
      }
    });
  });

  // Create enhanced rubric items with examples and requirements
  const enhancedRubricItems = params.rubricItems.map((item, index) => ({
    id: item.id,
    num: item.num,
    name: item.name,
    requirement: item.requirement || "Evaluate based on the criteria",
    points: params.rubricPoints[index] || 2,
    weight: item.weight,
  }));

  // Pull expected scores for ideal response from UI state if available
  // They are reflected via rubricPoints today; we don't have per-criterion edited values here
  // So we leave idealExpectedScores undefined and rely on server-side/default of 1

  // Format model outputs
  const formattedModelOutputs = (params.modelOutputs || []).map(
    (mo, index) => ({
      modelId: mo.modelId || `model-${index}`,
      modelName: mo.modelName || `Model ${index + 1}`,
      provider: mo.provider || "unknown",
      systemPrompt: mo.systemPrompt || "",
      responseContent: mo.output || mo.response || mo.responseContent || "",
    })
  );

  return {
    testCasePrompt:
      params.testCase?.input ||
      params.testCase?.prompt ||
      "Test case not available",
    testCaseContext: params.testCase?.context,
    modelOutputs: formattedModelOutputs,
    rubricItems: enhancedRubricItems,
    humanScores: cleanHumanScores,
    humanRationales: params.humanRationales,
    aiScores: params.aiScores,
    evaluatorModel: params.evaluatorModel,
    evaluatorSystemPrompt: params.evaluatorSystemPrompt,
    idealResponse: selectedIdealResponse?.modelResponse || "",
    idealTestCase: selectedIdealResponse?.testCaseInput || "", // This comes from the Test Case Input column in spreadsheet
    selectedIdealResponseId: selectedIdealResponseId || undefined,
    idealExpectedScores: params.idealExpectedScores,
    sessionId: params.sessionId,
    groupId: params.groupId,
  };
}

/**
 * Complete function to collect and upload evaluation data
 */
export async function collectAndUploadEvaluationData(params: {
  testCase?: any;
  modelOutputs?: any[];
  rubricItems: Array<{
    id: string;
    name: string;
    requirement?: string;
    num: number;
    weight?: string;
  }>;
  rubricPoints: number[];
  humanScores: Record<string, Record<string, number | "">>;
  humanRationales: Record<string, Record<string, string>>;
  aiScores: Record<
    string,
    Record<string, { 
      score: number; 
      rationale: string;
      subscores?: any[];
      aggregation_method?: string;
    }>
  >;
  evaluatorModel?: string;
  evaluatorSystemPrompt?: string;
  idealResponses?: IdealModelResponse[];
  sessionId?: string;
  groupId?: string;
  idealExpectedScores?: Record<string, number>;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    console.log(
      "[EvaluationDataCollector] Starting data collection and upload..."
    );

    // Debug: Log incoming AI scores
    console.log("[EvaluationDataCollector] Incoming AI scores:", {
      hasAiScores: Object.keys(params.aiScores || {}).length > 0,
      aiScoresKeys: Object.keys(params.aiScores || {}),
      sampleAiScore:
        Object.keys(params.aiScores || {}).length > 0
          ? params.aiScores[Object.keys(params.aiScores)[0]]
          : null,
    });

    // Step 1: Create snapshot
    const snapshot = createEvaluationSnapshot(params);
    console.log("[EvaluationDataCollector] Created evaluation snapshot:", {
      ...snapshot,
      aiScores:
        Object.keys(snapshot.aiScores).length > 0
          ? `${Object.keys(snapshot.aiScores).length} criteria with AI scores`
          : "No AI scores",
    });

    // Step 2: Convert to evaluation record format
    const record = await collectEvaluationData(snapshot);

    // Debug: Check if AI scores are in the record
    const hasAiScoresInRecord = record.rubric_with_scoring.criteria.some(
      (criterion) =>
        Object.values(criterion.scores || {}).some(
          (scoreData) => scoreData.ai_score !== undefined
        )
    );

    console.log("[EvaluationDataCollector] Created evaluation record:", {
      hasAiScores: hasAiScoresInRecord,
      criteriaCount: record.rubric_with_scoring.criteria.length,
      sampleCriterion: record.rubric_with_scoring.criteria[0]
        ? {
            name: record.rubric_with_scoring.criteria[0].name,
            scoresCount: Object.keys(
              record.rubric_with_scoring.criteria[0].scores || {}
            ).length,
            scores: record.rubric_with_scoring.criteria[0].scores,
          }
        : null,
    });

    // Step 3: Upload to server
    const result = await uploadEvaluationRecord(record);
    console.log("[EvaluationDataCollector] Upload result:", result);

    return result;
  } catch (error) {
    console.error(
      "[EvaluationDataCollector] Error in collectAndUploadEvaluationData:",
      error
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : "Data collection failed",
    };
  }
}
