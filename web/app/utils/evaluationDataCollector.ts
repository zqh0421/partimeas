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
    description?: string;
    requirement: string;
    positiveExample: string;
    negativeExample: string;
    points: number;
  }>;

  // Human scores
  humanScores: Record<string, Record<string, number>>; // rubricId -> responseId -> score
  humanRationales: Record<string, Record<string, string>>; // rubricId -> responseId -> rationale

  // AI scores
  aiScores: Record<
    string,
    Record<string, { score: number; rationale: string }>
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

  // Helper: normalize response IDs like "resp-3" to spreadsheet names (e.g., "Response 3")
  const normalizeResponseId = (
    rubricId: string,
    responseId: string
  ): string => {
    // If ideal response is selected, map both "resp-N" and "Response N" to "Ideal Response"
    if (snapshot.selectedIdealResponseId) {
      const match = /^resp-(\d+)$/.exec(
        responseId?.trim()?.toLowerCase() || ""
      );
      if (match) return "Ideal Response";
      const responseMatch = /^response\s*(\d+)$/i.exec(
        responseId?.trim() || ""
      );
      if (responseMatch) return "Ideal Response";
    }

    const match = /^resp-(\d+)$/.exec(responseId?.trim()?.toLowerCase() || "");
    if (!match) return responseId;
    const idx = parseInt(match[1], 10);
    if (Number.isNaN(idx)) return responseId;
    const humanKeys = Object.keys(snapshot.humanScores[rubricId] || {});
    // Try exact case-insensitive match for "response N"
    const targetRegex = new RegExp(`^response\s*${idx}$`, "i");
    const found = humanKeys.find((k) => targetRegex.test(k.trim()));
    return found || responseId;
  };
  // Create criteria array combining human and AI scores in the new structure
  const criteria: EvaluationCriterion[] = snapshot.rubricItems.map((item) => {
    // Build per-response score map
    const responseIds = new Set<string>([
      ...Object.keys(snapshot.humanScores[item.id] || {}),
      ...Object.keys(snapshot.aiScores[item.id] || {}),
    ]);

    const scores: Record<
      string,
      { human_score?: EvaluationScore; ai_score?: EvaluationScore }
    > = {};
    for (const rawId of responseIds) {
      const responseId = normalizeResponseId(item.id, rawId);
      const humanRaw =
        snapshot.humanScores[item.id]?.[rawId] ??
        snapshot.humanScores[item.id]?.[responseId];
      const humanRationale = 
        (snapshot.humanRationales[item.id]?.[rawId] ??
        snapshot.humanRationales[item.id]?.[responseId]) || "";
      
      // Debug logging for rationales
      if (humanRationale) {
        console.log(`[EvaluationDataCollector] Found rationale for ${item.id}/${responseId}: "${humanRationale}"`);
      }
      
      const human_score =
        typeof humanRaw === "number"
          ? {
              score: humanRaw,
              rationale: humanRationale.trim(),
            }
          : undefined;

      const aiRaw =
        snapshot.aiScores[item.id]?.[rawId] ??
        snapshot.aiScores[item.id]?.[responseId];
      const ai_score = aiRaw
        ? { score: aiRaw.score ?? 0, rationale: (aiRaw.rationale || "").trim() }
        : undefined;

      if (human_score || ai_score) {
        const existing = scores[responseId] || {};
        scores[responseId] = {
          human_score: human_score ?? existing.human_score,
          ai_score: ai_score ?? existing.ai_score,
        };
      }
    }

    // Ensure ideal response expected human score is saved even if not in humanScores map
    if (snapshot.selectedIdealResponseId) {
      const idealResponseId = "Ideal Response";
      const expected = snapshot.idealExpectedScores?.[item.id];
      const expectedScore = typeof expected === "number" ? expected : 1; // default to 1
      const existing = scores[idealResponseId]?.human_score;
      if (!existing) {
        scores[idealResponseId] = {
          ...(scores[idealResponseId] || {}),
          human_score: {
            score: expectedScore,
            rationale: "Ideal expected score",
          },
        };
      }
    }

    return {
      name: item.name || "Untitled Criterion",
      description: item.description || "No description provided",
      requirement: item.requirement || "No requirement specified",
      positive_example: item.positiveExample || "No positive example provided",
      negative_example: item.negativeExample || "No negative example provided",
      points: item.points || 2,
      scores,
      ideal_response: snapshot.idealResponse || "",
    };
  });

  // Ensure we have at least one criterion
  if (criteria.length === 0) {
    // Create a default criterion if none exist
    criteria.push({
      name: "Default Criterion",
      description: "Default evaluation criterion",
      requirement: "Evaluate the response quality",
      positive_example: "Good responses are clear and helpful",
      negative_example: "Poor responses are unclear or unhelpful",
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

  return {
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
    ideal_test_case:
      snapshot.idealTestCase ||
      snapshot.testCasePrompt ||
      "No ideal test case available",
    rubric_with_scoring: rubricWithScoring,
  };
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
  rubricItems: Array<{ id: string; name: string }>;
  rubricInstructions: Array<{ positive: string; negative: string }>;
  rubricPoints: number[];
  humanScores: Record<string, Record<string, number | "">>;
  humanRationales: Record<string, Record<string, string>>;
  aiScores: Record<
    string,
    Record<string, { score: number; rationale: string }>
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
    name: item.name,
    description: "",
    requirement: "Evaluate based on the criteria",
    positiveExample:
      params.rubricInstructions[index]?.positive || "Good performance example",
    negativeExample:
      params.rubricInstructions[index]?.negative || "Poor performance example",
    points: params.rubricPoints[index] || 2,
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
    idealTestCase: selectedIdealResponse?.testCaseInput || "", // This comes from the Prompt column in spreadsheet
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
  rubricItems: Array<{ id: string; name: string }>;
  rubricInstructions: Array<{ positive: string; negative: string }>;
  rubricPoints: number[];
  humanScores: Record<string, Record<string, number | "">>;
  humanRationales: Record<string, Record<string, string>>;
  aiScores: Record<
    string,
    Record<string, { score: number; rationale: string }>
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

    // Step 1: Create snapshot
    const snapshot = createEvaluationSnapshot(params);
    console.log(
      "[EvaluationDataCollector] Created evaluation snapshot:",
      snapshot
    );

    // Step 2: Convert to evaluation record format
    const record = await collectEvaluationData(snapshot);
    console.log("[EvaluationDataCollector] Created evaluation record:", record);

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
