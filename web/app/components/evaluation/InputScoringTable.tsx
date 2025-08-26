"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useCriteriaData } from "@/app/hooks/useCriteriaData";
import {
  restoreCriteriaVersionSelection,
  restoreIdealResponseSelection,
} from "@/app/utils/selectionCache";
import {
  updateIdealResponseScore,
  getExpectedScore,
} from "@/app/utils/idealResponseScoring";
import { IdealModelResponse } from "@/app/types";

interface InputScoringTableProps {
  responses: { id: string; label: string }[];
  rubricItems?: { id: string; name: string }[];
  aiScores?: Record<
    string,
    Record<string, { score: number; rationale: string }>
  >;
  showAiResults?: boolean;
  modelOutputs?: any[]; // Model outputs for AI evaluation
  testCase?: any; // Test case for AI evaluation
  onCompareClick?: () => void;
  selectedIdealResponseId?: string; // Optional override for ideal response selection
  enableIdealScoreEditing?: boolean; // Whether to allow editing ideal scores
  idealResponses?: IdealModelResponse[]; // Available ideal responses for evaluation
}

export default function InputScoringTable({
  responses,
  rubricItems = [],
  aiScores: initialAiScores = {},
  showAiResults = false,
  modelOutputs = [],
  testCase,
  onCompareClick,
  selectedIdealResponseId,
  enableIdealScoreEditing = true,
  idealResponses = [],
}: InputScoringTableProps) {
  const { criteria } = useCriteriaData();

  // Derive rubric rows from selected criteria version in cache if no rubricItems provided
  const derived = useMemo(() => {
    if (rubricItems && rubricItems.length > 0) {
      return {
        items: rubricItems,
        instructions: rubricItems.map(() => ({ positive: "", negative: "" })),
        points: rubricItems.map(() => 1),
      };
    }

    const selectedVersionId = restoreCriteriaVersionSelection();
    let selectedVersion = criteria.find(
      (v) => v.sheetName === selectedVersionId
    );
    if (!selectedVersion) selectedVersion = criteria[0];
    if (!selectedVersion) {
      return { items: [], instructions: [], points: [] };
    }

    const items = selectedVersion.requirements.map((req, idx) => ({
      id: `${selectedVersion.sheetName}-req-${idx + 1}`,
      name:
        (req.category && req.category.trim() !== ""
          ? `${req.category.trim()}: `
          : "") + (req.requirement || `Requirement ${idx + 1}`),
    }));

    const instructions = selectedVersion.requirements.map((req) => ({
      positive: req.positiveExamples || "",
      negative: req.negativeExamples || "",
    }));

    const points = selectedVersion.requirements.map((req) => {
      const n = parseInt((req.points || "1").trim(), 10);
      return Number.isNaN(n) ? 1 : n;
    });

    return { items, instructions, points };
  }, [criteria, rubricItems]);

  // Initialize/merge state when items or responses change
  React.useEffect(() => {
    setScores((prev) => {
      let changed = false;
      const next: Record<string, Record<string, number | "">> = {};
      for (const r of derived.items) {
        const prevRow = prev[r.id] || {};
        const row: Record<string, number | ""> = {};
        for (const resp of responses) {
          const before = prevRow[resp.id];
          const after = before !== undefined ? before : "";
          row[resp.id] = after;
          if (after !== before) changed = true;
        }
        next[r.id] = row;
        if (prevRow === undefined) changed = true;
      }
      // If number of rows changed
      if (Object.keys(prev).length !== Object.keys(next).length) changed = true;
      return changed ? next : prev;
    });

    setRationales((prev) => {
      let changed = false;
      const next: Record<string, Record<string, string>> = {};
      for (const r of derived.items) {
        const prevRow = prev[r.id] || {};
        const row: Record<string, string> = {};
        for (const resp of responses) {
          const before = prevRow[resp.id];
          const after = before !== undefined ? before : "";
          row[resp.id] = after;
          if (after !== before) changed = true;
        }
        next[r.id] = row;
        if (prevRow === undefined) changed = true;
      }
      if (Object.keys(prev).length !== Object.keys(next).length) changed = true;
      return changed ? next : prev;
    });
  }, [
    derived.items.map((item) => item.id).join(","),
    responses.map((resp) => resp.id).join(","),
  ]); // Use stable string representations

  const [scores, setScores] = useState<
    Record<string, Record<string, number | "">>
  >(() => {
    const initial: Record<string, Record<string, number | "">> = {};
    for (const r of derived.items) {
      initial[r.id] = {};
      for (const resp of responses) {
        initial[r.id][resp.id] = "";
      }
    }
    return initial;
  });

  const [rationales, setRationales] = useState<
    Record<string, Record<string, string>>
  >(() => {
    const initial: Record<string, Record<string, string>> = {};
    for (const r of derived.items) {
      initial[r.id] = {};
      for (const resp of responses) {
        initial[r.id][resp.id] = "";
      }
    }
    return initial;
  });

  // Get the ideal response ID (from prop or cache)
  const currentIdealResponseId = useMemo(() => {
    const id = selectedIdealResponseId || restoreIdealResponseSelection();
    console.log(`🔍 [InputScoringTable] IDEAL RESPONSE DEBUG:`, {
      currentIdealResponseId: id,
      selectedIdealResponseIdProp: selectedIdealResponseId,
      restoredFromCache: restoreIdealResponseSelection(),
      enableIdealScoreEditing: enableIdealScoreEditing,
      hasValue: !!id,
    });
    return id;
  }, [selectedIdealResponseId]);

  // State for ideal response expected scores
  const [idealScores, setIdealScores] = useState<Record<string, number>>({});

  // Load ideal scores when ideal response changes
  useEffect(() => {
    console.log(`[InputScoringTable] useEffect triggered:`, {
      currentIdealResponseId,
      derivedItemsLength: derived.items.length,
      willExecute: !!(currentIdealResponseId && derived.items.length > 0),
    });

    if (currentIdealResponseId && derived.items.length > 0) {
      console.log(
        `[InputScoringTable] Loading ideal scores for: ${currentIdealResponseId}`
      );

      try {
        const scores: Record<string, number> = {};

        // For each rubric item, initialize or get from cache
        derived.items.forEach((item, index) => {
          const defaultScore = derived.points[index] || 2;

          // Try to get cached score first
          const cachedScore = getExpectedScore(
            currentIdealResponseId,
            item.id,
            `${item.id}-sub`, // Use consistent subcriteria ID pattern
            undefined // No rubric structure available
          );

          if (cachedScore !== null) {
            // Use cached score
            scores[item.id] = cachedScore;
            console.log(
              `[InputScoringTable] Using cached score for ${item.id}: ${cachedScore}`
            );
          } else {
            // Initialize with default and save to cache
            scores[item.id] = defaultScore;
            updateIdealResponseScore(
              currentIdealResponseId,
              item.id,
              `${item.id}-sub`,
              defaultScore,
              undefined
            );
            console.log(
              `[InputScoringTable] Initialized default score for ${item.id}: ${defaultScore}`
            );
          }
        });

        setIdealScores(scores);
        console.log(
          `[InputScoringTable] Loaded ideal scores for ${derived.items.length} items:`,
          scores
        );
      } catch (error) {
        console.error("[InputScoringTable] Error loading ideal scores:", error);
        // Fallback to default points on error
        const fallbackScores: Record<string, number> = {};
        derived.items.forEach((item, index) => {
          const defaultScore = derived.points[index] || 2;
          fallbackScores[item.id] = defaultScore;
          // Also try to cache the fallback values
          try {
            updateIdealResponseScore(
              currentIdealResponseId,
              item.id,
              `${item.id}-sub`,
              defaultScore,
              undefined
            );
          } catch (cacheError) {
            console.warn(
              `[InputScoringTable] Failed to cache fallback score for ${item.id}:`,
              cacheError
            );
          }
        });
        setIdealScores(fallbackScores);
      }
    } else {
      setIdealScores({});
    }
  }, [currentIdealResponseId, derived.items.map((item) => item.id).join(",")]); // Use stable string representation

  const idealPoints = useMemo(() => {
    if (currentIdealResponseId && Object.keys(idealScores).length > 0) {
      // Use customizable ideal scores when ideal response is selected
      return derived.items.map(
        (item) =>
          idealScores[item.id] ||
          derived.points[derived.items.indexOf(item)] ||
          2
      );
    }
    // Default behavior - use derived points
    return derived.points;
  }, [currentIdealResponseId, idealScores, derived.points, derived.items]);

  // State for AI evaluation
  const [aiScores, setAiScores] = useState(initialAiScores);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [isComparingMode, setIsComparingMode] = useState(false);

  // Debug aiScores changes
  useEffect(() => {
    console.log(
      "[InputScoringTable] aiScores state updated:",
      JSON.stringify(aiScores, null, 2)
    );
    console.log(
      "[InputScoringTable] aiScores keys count:",
      Object.keys(aiScores).length
    );
  }, [aiScores]);

  // Auto-trigger AI evaluation when model outputs are ready
  useEffect(() => {
    console.log(
      "[InputScoringTable] 🔍 Checking evaluation trigger conditions:",
      {
        hasModelOutputs: !!(modelOutputs && modelOutputs.length > 0),
        modelOutputsLength: modelOutputs?.length || 0,
        hasTestCase: !!testCase,
        derivedItemsLength: derived.items.length,
        hasExistingScores: Object.keys(aiScores).length > 0,
        isCurrentlyEvaluating: isEvaluating,
        modelOutputsWithContent:
          modelOutputs?.filter((mo) => mo.output && mo.output.trim().length > 0)
            .length || 0,
        modelOutputs: modelOutputs?.map((mo) => ({
          modelId: mo.modelId,
          hasOutput: !!(mo.output && mo.output.trim().length > 0),
          outputLength: mo.output?.length || 0,
        })),
        testCase: testCase,
      }
    );

    // Check if model outputs actually have content
    const hasValidModelOutputs =
      modelOutputs &&
      modelOutputs.length > 0 &&
      modelOutputs.some((mo) => mo.output && mo.output.trim().length > 0);

    const shouldTriggerEvaluation =
      hasValidModelOutputs &&
      testCase &&
      derived.items.length > 0 &&
      Object.keys(aiScores).length === 0 && // Don't re-evaluate if we already have scores
      !isEvaluating;

    console.log("[InputScoringTable] 🔍 Auto-trigger decision:", {
      shouldTriggerEvaluation,
      conditions: {
        hasValidModelOutputs,
        hasTestCase: !!testCase,
        hasDerivedItems: derived.items.length > 0,
        hasExistingScores: Object.keys(aiScores).length > 0,
        isEvaluating,
      },
      reason: !shouldTriggerEvaluation
        ? hasValidModelOutputs
          ? testCase
            ? derived.items.length > 0
              ? Object.keys(aiScores).length > 0
                ? "Already have AI scores"
                : isEvaluating
                ? "Currently evaluating"
                : "Unknown reason"
              : "No rubric items"
            : "No test case"
          : "No valid model outputs"
        : "All conditions met",
    });

    if (shouldTriggerEvaluation) {
      console.log(
        "[InputScoringTable] 🚀 Auto-triggering AI evaluation in 1 second..."
      );
      // Add a small delay to ensure everything is fully loaded
      const timer = setTimeout(() => {
        console.log(
          "[InputScoringTable] ⏰ Timer fired, calling triggerAiEvaluation"
        );
        triggerAiEvaluation();
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      console.log(
        "[InputScoringTable] ❌ Conditions not met for auto-evaluation:",
        {
          hasValidModelOutputs,
          hasTestCase: !!testCase,
          hasDerivedItems: derived.items.length > 0,
          hasExistingScores: Object.keys(aiScores).length > 0,
          isEvaluating,
        }
      );
    }
  }, [modelOutputs, testCase, aiScores, isEvaluating, derived.items.length]);

  const triggerAiEvaluation = async () => {
    console.log("[InputScoringTable] 🔍 triggerAiEvaluation called with:");
    console.log("  - modelOutputs:", modelOutputs);
    console.log("  - testCase:", testCase);
    console.log("  - derived.items:", derived.items);
    console.log("  - derived.items.length:", derived.items.length);

    // Validate model outputs have actual content
    const hasValidModelOutputs =
      modelOutputs &&
      modelOutputs.length > 0 &&
      modelOutputs.some((mo) => mo.output && mo.output.trim().length > 0);

    console.log("[InputScoringTable] 🔍 Validation results:");
    console.log("  - hasValidModelOutputs:", hasValidModelOutputs);
    console.log("  - modelOutputs exists:", !!modelOutputs);
    console.log("  - modelOutputs length:", modelOutputs?.length || 0);
    console.log(
      "  - modelOutputs with content:",
      modelOutputs?.filter((mo) => mo.output && mo.output.trim().length > 0)
        .length || 0
    );

    if (!hasValidModelOutputs) {
      console.warn(
        "[InputScoringTable] ❌ No valid model outputs with content available"
      );
      setEvaluationError("No valid model outputs available for evaluation");
      return;
    }

    console.log("[InputScoringTable] ✅ Model outputs validation passed");

    if (!testCase) {
      console.warn(
        "[InputScoringTable] ❌ No test case available for evaluation"
      );
      setEvaluationError("No test case available for evaluation");
      return;
    }

    console.log("[InputScoringTable] ✅ Test case validation passed");

    if (derived.items.length === 0) {
      console.warn(
        "[InputScoringTable] ❌ No rubric items available for evaluation"
      );
      setEvaluationError("No rubric criteria available for evaluation");
      return;
    }

    console.log("[InputScoringTable] ✅ Rubric items validation passed");
    console.log(
      "[InputScoringTable] 🎯 All validations passed, setting isEvaluating to true"
    );

    setIsEvaluating(true);
    setEvaluationError(null);

    try {
      console.log("[InputScoringTable] Starting AI evaluation...");

      // Prepare criteria in the format expected by the API
      const criteriaForApi = derived.items.map((item, index) => ({
        id: item.id,
        name: item.name,
        description: `Requirements: ${item.name}`,
        scoreRange: `Score range: 0-${idealPoints[index] || 1}`, // Include score range for each criterion
        positive: derived.instructions[index].positive,
        negative: derived.instructions[index].negative,
      }));

      const response = await fetch("/api/model-evaluation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phase: "evaluate",
          testCase: testCase,
          criteria: criteriaForApi,
          outputs: modelOutputs,
          idealResponse: currentIdealResponseId
            ? idealResponses.find((ir) => ir.name === currentIdealResponseId)
              ? {
                  id: currentIdealResponseId,
                  content: idealResponses.find(
                    (ir) => ir.name === currentIdealResponseId
                  )!.modelResponse,
                }
              : undefined
            : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`Evaluation failed: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(
        "[InputScoringTable] Raw API response:",
        JSON.stringify(data, null, 2)
      );

      if (data.success && data.evaluations) {
        console.log("[InputScoringTable] AI evaluation completed successfully");
        console.log(
          "[InputScoringTable] Evaluations data:",
          JSON.stringify(data.evaluations, null, 2)
        );
        console.log(
          "[InputScoringTable] Expected response IDs:",
          responses.map((r) => r.id)
        );
        console.log(
          "[InputScoringTable] ModelOutputs IDs:",
          modelOutputs?.map((mo, i) => mo.modelId || `resp-${i + 1}`)
        );

        // Transform evaluation results to match our aiScores format
        let transformedScores: Record<
          string,
          Record<string, { score: number; rationale: string }>
        > = {};

        data.evaluations.forEach((evaluation: any, evalIndex: number) => {
          console.log(
            `[InputScoringTable] Processing evaluation ${evalIndex}:`,
            JSON.stringify(evaluation, null, 2)
          );

          // Find the corresponding response ID from our responses array
          // The API returns evaluations with modelId, but we need to map them to our response IDs
          let responseId = evaluation.modelId;

          // If the modelId doesn't match any of our response IDs, try to find a match
          if (!responses.find((r) => r.id === responseId)) {
            // Try to find a response with a matching modelId
            const matchingResponse = responses.find(
              (r) =>
                r.id === evaluation.modelId ||
                r.id.includes(evaluation.modelId) ||
                evaluation.modelId.includes(r.id)
            );

            if (matchingResponse) {
              responseId = matchingResponse.id;
            } else {
              // Fallback to using the index-based response ID
              responseId = responses[evalIndex]?.id || `resp-${evalIndex + 1}`;
            }
          }

          console.log(
            `[InputScoringTable] Mapped response ID: ${evaluation.modelId} -> ${responseId}`
          );

          // Map criteria scores to rubric items
          Object.entries(evaluation.criteriaScores || {}).forEach(
            ([criteriaId, scoreData]: [string, any], entryIndex: number) => {
              console.log(
                `[InputScoringTable] Processing criteria ${entryIndex} - ID: ${criteriaId}, Data:`,
                JSON.stringify(scoreData, null, 2)
              );
              if (!transformedScores[criteriaId]) {
                transformedScores[criteriaId] = {};
              }
              transformedScores[criteriaId][responseId] = {
                score: scoreData.score || 0,
                rationale:
                  scoreData.reasoning ||
                  scoreData.rationale ||
                  "No rationale provided",
              };
              console.log(
                `[InputScoringTable] Added to transformedScores[${criteriaId}][${responseId}]:`,
                transformedScores[criteriaId][responseId]
              );
            }
          );
        });

        // Handle case where API returns scores with simplified response IDs (e.g., "resp-1", "resp-2")
        // This can happen with mock evaluations or when the LLM doesn't follow format instructions
        const hasSimplifiedResponseIds = Object.values(transformedScores).some(
          (responseScores) =>
            Object.keys(responseScores).some((responseId) =>
              responseId.startsWith("resp-")
            )
        );

        if (hasSimplifiedResponseIds) {
          console.log(
            "[InputScoringTable] Detected simplified response IDs, mapping to actual response IDs..."
          );

          // Create a mapping from simplified IDs to actual response IDs
          const responseIdMapping: Record<string, string> = {};
          responses.forEach((response, index) => {
            responseIdMapping[`resp-${index + 1}`] = response.id;
          });

          console.log(
            "[InputScoringTable] Response ID mapping:",
            responseIdMapping
          );

          // Transform the scores to use actual response IDs
          const correctedScores: Record<
            string,
            Record<string, { score: number; rationale: string }>
          > = {};

          Object.entries(transformedScores).forEach(
            ([criteriaId, responseScores]) => {
              correctedScores[criteriaId] = {};
              Object.entries(responseScores).forEach(
                ([responseId, scoreData]) => {
                  const actualResponseId =
                    responseIdMapping[responseId] || responseId;
                  correctedScores[criteriaId][actualResponseId] = scoreData;
                  console.log(
                    `[InputScoringTable] Mapped ${responseId} -> ${actualResponseId} for criteria ${criteriaId}`
                  );
                }
              );
            }
          );

          transformedScores = correctedScores;
        }

        console.log(
          "[InputScoringTable] Final transformedScores before setState:",
          JSON.stringify(transformedScores, null, 2)
        );

        // Additional debugging: show the structure of transformedScores
        console.log("[InputScoringTable] TransformedScores structure:");
        Object.entries(transformedScores).forEach(
          ([criteriaId, responseScores]) => {
            console.log(`  ${criteriaId}:`, Object.keys(responseScores));
            Object.entries(responseScores).forEach(
              ([responseId, scoreData]) => {
                console.log(`    ${responseId}:`, scoreData);
              }
            );
          }
        );

        // Verify that all response IDs in transformedScores match our actual response IDs
        const allResponseIds = new Set(responses.map((r) => r.id));
        const allTransformedResponseIds = new Set(
          Object.values(transformedScores).flatMap((scores) =>
            Object.keys(scores)
          )
        );

        console.log("[InputScoringTable] Response ID verification:");
        console.log("  Expected response IDs:", Array.from(allResponseIds));
        console.log(
          "  Transformed response IDs:",
          Array.from(allTransformedResponseIds)
        );
        console.log(
          "  All IDs match:",
          allTransformedResponseIds.size === allResponseIds.size &&
            Array.from(allTransformedResponseIds).every((id) =>
              allResponseIds.has(id)
            )
        );

        setAiScores(transformedScores);
        console.log(
          "[InputScoringTable] setAiScores called with transformedScores"
        );
      } else {
        throw new Error(data.error || "Evaluation failed");
      }
    } catch (error) {
      console.error("[InputScoringTable] AI evaluation error:", error);
      setEvaluationError(
        error instanceof Error ? error.message : "Evaluation failed"
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleScoreChange = (
    rubricId: string,
    responseId: string,
    value: number | ""
  ) => {
    setScores((prev) => ({
      ...prev,
      [rubricId]: { ...prev[rubricId], [responseId]: value },
    }));
  };

  const handleRationaleChange = (
    rubricId: string,
    responseId: string,
    value: string
  ) => {
    setRationales((prev) => ({
      ...prev,
      [rubricId]: { ...prev[rubricId], [responseId]: value },
    }));
  };

  const handleIdealScoreChange = (
    criteriaId: string,
    newScore: number | ""
  ) => {
    console.log(
      `[InputScoringTable] handleIdealScoreChange called with criteriaId: ${criteriaId}, newScore: ${newScore}`
    );
    console.log(
      `[InputScoringTable] currentIdealResponseId: ${currentIdealResponseId}`
    );
    console.log(
      `[InputScoringTable] selectedIdealResponseId prop: ${selectedIdealResponseId}`
    );
    console.log(
      `[InputScoringTable] restoreIdealResponseSelection(): ${restoreIdealResponseSelection()}`
    );

    if (!currentIdealResponseId) {
      console.warn(
        "[InputScoringTable] No ideal response selected, cannot update score"
      );
      return;
    }

    // Don't update if empty string
    if (newScore === "") {
      return;
    }

    try {
      console.log(
        `[InputScoringTable] Updating ideal score for ${criteriaId}: ${idealScores[criteriaId]} -> ${newScore}`
      );

      // Update the score in cache using the scoring utility
      const updatedScores = updateIdealResponseScore(
        currentIdealResponseId,
        criteriaId,
        `${criteriaId}-sub`, // Use criteriaId-sub as subcriteria ID (matches our pattern)
        newScore,
        undefined // No rubric structure available, will use fallback logic
      );

      // Update local state for immediate UI feedback
      setIdealScores((prev) => ({
        ...prev,
        [criteriaId]: newScore,
      }));

      console.log(
        `[InputScoringTable] Successfully updated ideal score for ${criteriaId}: ${newScore} (${updatedScores.length} scores in cache)`
      );
    } catch (error) {
      console.error(
        `[InputScoringTable] Error updating ideal score for ${criteriaId}:`,
        error
      );
    }
  };

  const toTitleCase = (input: string): string => {
    if (!input) return "";
    return input.replace(
      /\b\w+\b/g,
      (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
  };

  const autoResize = (el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  // Check if all human scores are completed
  const areAllHumanScoresComplete = useMemo(() => {
    // Check if all rubric items have scores for all responses
    for (const item of derived.items) {
      for (const response of responses) {
        const score = scores[item.id]?.[response.id];
        if (score === "" || score === undefined) {
          return false;
        }
      }
    }
    return true;
  }, [scores, derived.items, responses]);

  // Check if AI evaluation results are available
  const areAiResultsAvailable = useMemo(() => {
    return Object.keys(aiScores).length > 0;
  }, [aiScores]);

  // Combined check for compare button availability
  const canCompare = useMemo(() => {
    return areAllHumanScoresComplete && areAiResultsAvailable;
  }, [areAllHumanScoresComplete, areAiResultsAvailable]);

  // Debug log for troubleshooting
  console.log(
    `[InputScoringTable] Render - currentIdealResponseId: ${currentIdealResponseId}, enableIdealScoreEditing: ${enableIdealScoreEditing}, idealScores:`,
    idealScores
  );

  console.log(`[InputScoringTable] Compare button state:`, {
    areAllHumanScoresComplete,
    areAiResultsAvailable,
    canCompare,
    totalScoresNeeded: derived.items.length * responses.length,
    completedScores: derived.items.reduce((count, item) => {
      return (
        count +
        responses.reduce((respCount, response) => {
          const score = scores[item.id]?.[response.id];
          return respCount + (score !== "" && score !== undefined ? 1 : 0);
        }, 0)
      );
    }, 0),
  });

  return (
    <div className="overflow-x-auto">
      <div className="border border-gray-200 rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-center">
            <tr>
              <th className="px-4 pt-4 pb-2 text-sm font-bold text-gray-700  w-[15vw] border-x border-gray-200">
                Rubric Item
              </th>
              <th className="px-4 pt-4 pb-2 text-sm font-bold text-gray-700 border-x border-gray-200 w-[15vw]">
                Scoring Instruction
              </th>
              {responses.map((resp) => (
                <th
                  key={resp.id}
                  colSpan={2}
                  className="px-4 pt-4 pb-2 text-center text-sm font-bold text-gray-700 border-x border-gray-200"
                >
                  {resp.label}
                </th>
              ))}
              <th className="px-4 pt-4 pb-2  text-sm font-bold text-gray-700 border-x border-gray-200 w-28">
                Ideal Response
              </th>
            </tr>
            <tr>
              <th className="px-4 py-2 border-x border-gray-200" />
              <th className="px-4 py-2 border-x border-gray-200" />
              {responses.map((resp) => (
                <React.Fragment key={`${resp.id}-subheaders`}>
                  <th className=" pb-2 pt-1 text-sm font-medium text-gray-700 text-center border-x border-gray-200 w-10">
                    Point
                  </th>
                  <th className=" pb-2 pt-1 text-sm font-medium text-gray-700 text-center border-x border-gray-200 w-[14vw]">
                    Rationale
                  </th>
                </React.Fragment>
              ))}
              <th className=" pb-2 pt-1 text-sm font-medium text-gray-700 text-center border-x border-gray-200 w-10">
                Point
              </th>
            </tr>
          </thead>
          <tbody>
            {derived.items.map((r, rowIdx) => (
              <tr key={r.id} className="border-t border-gray-200 align-top">
                <td className="px-4 py-3 text-sm text-gray-900 border-x border-gray-200">
                  {(() => {
                    const parts = (r.name || "").split(":");
                    const hasCategory = parts.length > 1;
                    const category = hasCategory ? parts[0].trim() : "";
                    const requirement = hasCategory
                      ? parts.slice(1).join(":").trim()
                      : parts[0].trim();
                    return (
                      <>
                        {hasCategory && (
                          <>
                            <span className="font-semibold">
                              {toTitleCase(category)}
                            </span>
                            {": "}
                          </>
                        )}
                        {toTitleCase(requirement)}
                      </>
                    );
                  })()}
                </td>
                <td className="px-4 py-3 text-sm border-x border-gray-200">
                  {derived.instructions[rowIdx] && (
                    <div className="">
                      {derived.instructions[rowIdx].positive && (
                        <p className="text-sm whitespace-pre-wrap">
                          <span className="font-medium">
                            Positive Examples:{" "}
                          </span>
                          {derived.instructions[rowIdx].positive}
                        </p>
                      )}
                      {derived.instructions[rowIdx].negative && (
                        <p className="text-sm whitespace-pre-wrap">
                          <span className="font-medium">
                            Negative Examples:{" "}
                          </span>
                          {derived.instructions[rowIdx].negative}
                        </p>
                      )}
                      {!derived.instructions[rowIdx].positive &&
                        !derived.instructions[rowIdx].negative && (
                          <div className="text-sm text-gray-500">N/A</div>
                        )}
                    </div>
                  )}
                </td>
                {responses.map((resp) => (
                  <React.Fragment key={resp.id}>
                    <td className="px-4 py-3 align-top border-x border-gray-200">
                      <div className="relative w-16">
                        <select
                          className={`w-16 h-10 px-3 py-2 pr-8 border rounded-lg text-sm font-medium text-center transition-all duration-200 appearance-none ${
                            isComparingMode
                              ? `cursor-not-allowed ${
                                  aiScores[r.id]?.[resp.id] !== undefined &&
                                  scores[r.id]?.[resp.id] !==
                                    aiScores[r.id][resp.id].score
                                    ? "border-red-300 bg-red-100 text-red-700"
                                    : "border-gray-200 bg-white text-gray-700"
                                }`
                              : "shadow-sm bg-white hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer border-gray-300 text-gray-700"
                          }`}
                          value={(scores[r.id] && scores[r.id][resp.id]) ?? ""}
                          disabled={isComparingMode}
                          onChange={(e) => {
                            const v =
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value);
                            handleScoreChange(r.id, resp.id, v as number | "");
                          }}
                        >
                          <option value="" disabled className="text-gray-400">
                            —
                          </option>
                          {Array.from(
                            {
                              length:
                                Math.max(0, Number(idealPoints[rowIdx] ?? 0)) +
                                1,
                            },
                            (_, i) => i
                          ).map((val) => (
                            <option
                              key={val}
                              value={val}
                              className="text-gray-700 font-medium"
                            >
                              {val}
                            </option>
                          ))}
                        </select>
                        {!isComparingMode && (
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg
                              className="w-4 h-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top border-x border-gray-200">
                      <textarea
                        className={`w-[15vw] px-3 py-2 border rounded-md text-sm transition-all duration-200 ${
                          isComparingMode
                            ? "border-gray-200 bg-white text-gray-700"
                            : "border-gray-300 shadow-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700"
                        }`}
                        placeholder="Your rationale"
                        rows={1}
                        disabled={isComparingMode}
                        value={
                          (rationales[r.id] && rationales[r.id][resp.id]) ?? ""
                        }
                        onChange={(e) => {
                          handleRationaleChange(r.id, resp.id, e.target.value);
                          autoResize(e.currentTarget);
                        }}
                        onInput={(e) => autoResize(e.currentTarget)}
                        ref={(el) => autoResize(el)}
                        style={{ overflow: "hidden", resize: "none" }}
                      />
                    </td>
                  </React.Fragment>
                ))}
                <td className="px-4 py-3 align-top border-x border-gray-200">
                  <div className="relative w-16">
                    <select
                      className={`w-16 h-10 px-3 py-2 pr-8 border rounded-lg text-sm font-medium text-center transition-all duration-200 appearance-none ${
                        isComparingMode
                          ? `${
                              currentIdealResponseId &&
                              aiScores[r.id]?.[currentIdealResponseId] !==
                                undefined &&
                              (idealScores[r.id] !== undefined
                                ? idealScores[r.id]
                                : idealPoints[rowIdx]) !==
                                aiScores[r.id][currentIdealResponseId].score
                                ? "border-red-300 bg-red-100 text-red-700"
                                : "border-gray-200 bg-white text-gray-700"
                            }`
                          : "shadow-sm bg-white hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer border-gray-300 text-gray-700"
                      }`}
                      value={
                        idealScores[r.id] !== undefined
                          ? idealScores[r.id]
                          : idealPoints[rowIdx] !== undefined
                          ? idealPoints[rowIdx]
                          : ""
                      }
                      disabled={isComparingMode}
                      onChange={(e) => {
                        const v =
                          e.target.value === "" ? "" : Number(e.target.value);
                        console.log(
                          `🎯 [InputScoringTable] Ideal Response dropdown changed:`,
                          {
                            criteriaId: r.id,
                            newValue: v,
                            oldValue: idealScores[r.id],
                            currentIdealResponseId: currentIdealResponseId,
                          }
                        );
                        handleIdealScoreChange(r.id, v);
                      }}
                    >
                      <option value="" disabled className="text-gray-400">
                        —
                      </option>
                      {Array.from(
                        {
                          length:
                            Math.max(0, Number(idealPoints[rowIdx] ?? 0)) + 1,
                        },
                        (_, i) => i
                      ).map((val) => (
                        <option
                          key={val}
                          value={val}
                          className="text-gray-700 font-medium"
                        >
                          {val}
                        </option>
                      ))}
                    </select>
                    {!isComparingMode && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAiResults && (
        <div className="mt-8">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              AI Grader Results (for debugging)
            </h3>
            {/* Debug button to manually trigger evaluation */}
            <div className="mt-2 mb-4">
              <button
                onClick={() => {
                  console.log(
                    "[InputScoringTable] 🚀 Manual evaluation trigger clicked"
                  );
                  triggerAiEvaluation();
                }}
                disabled={isEvaluating}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  isEvaluating
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {isEvaluating
                  ? "Evaluating..."
                  : "🔍 Manual Trigger Evaluation"}
              </button>
              <span className="ml-3 text-xs text-gray-500">
                Use this button to manually trigger evaluation for debugging
              </span>
            </div>
            {(() => {
              console.log(
                "[InputScoringTable] AI Results Table rendering with:",
                {
                  showAiResults,
                  responsesCount: responses.length,
                  responses: responses,
                  aiScoresKeys: Object.keys(aiScores),
                  aiScores: aiScores,
                  derivedItemsCount: derived.items.length,
                }
              );
              return null;
            })()}
            <p className="text-sm text-gray-600">
              {isEvaluating
                ? "Evaluating responses automatically..."
                : evaluationError
                ? `Evaluation error: ${evaluationError}`
                : "Automated scoring results for comparison"}
            </p>
            {isEvaluating && (
              <div className="flex items-center mt-2">
                <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mr-2"></div>
                <span className="text-sm text-blue-600">
                  Evaluating with AI...
                </span>
              </div>
            )}
          </div>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-4 pt-4 pb-2 text-left text-sm font-bold text-gray-700 border-x border-gray-200 w-[10vw]">
                    Rubric Item
                  </th>
                  <th className="px-4 pt-4 pb-2 text-left text-sm font-bold text-gray-700 border-x border-gray-200">
                    Scoring Instruction
                  </th>
                  {responses.map((resp) => (
                    <th
                      key={resp.id}
                      colSpan={2}
                      className="px-4 pt-4 pb-2 text-center text-sm font-bold text-gray-700 border-x border-gray-200"
                    >
                      {resp.label}
                    </th>
                  ))}
                  <th className="px-4 pt-4 pb-2 text-left text-sm font-bold text-gray-700 border-x border-gray-200 w-28">
                    Ideal Response
                  </th>
                </tr>
                <tr>
                  <th className="px-4 py-2 border-x border-gray-200" />
                  <th className="px-4 py-2 border-x border-gray-200" />
                  {responses.map((resp) => (
                    <React.Fragment key={`${resp.id}-ai-subheaders`}>
                      <th className="pb-2 pt-1 text-sm font-medium text-gray-700 text-center border-x border-gray-200 w-10">
                        AI Score
                      </th>
                      <th className="pb-2 pt-1 text-sm font-medium text-gray-700 text-center border-x border-gray-200">
                        AI Rationale
                      </th>
                    </React.Fragment>
                  ))}
                  <th className="px-4 py-2 border-x border-gray-200" />
                </tr>
              </thead>
              <tbody className="bg-white">
                {derived.items.map((r, rowIdx) => (
                  <tr
                    key={`ai-${r.id}`}
                    className="border-t border-gray-200 align-top"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 border-x border-gray-200">
                      {(() => {
                        const parts = (r.name || "").split(":");
                        const hasCategory = parts.length > 1;
                        const category = hasCategory ? parts[0].trim() : "";
                        const requirement = hasCategory
                          ? parts.slice(1).join(":").trim()
                          : parts[0].trim();
                        return (
                          <>
                            {hasCategory && (
                              <>
                                <span className="font-semibold">
                                  {toTitleCase(category)}
                                </span>
                                {": "}
                              </>
                            )}
                            {toTitleCase(requirement)}
                          </>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-sm border-x border-gray-200">
                      {derived.instructions[rowIdx] && (
                        <div className="">
                          {derived.instructions[rowIdx].positive && (
                            <p className="text-sm whitespace-pre-wrap">
                              <span className="font-medium">
                                Positive Examples:{" "}
                              </span>
                              {derived.instructions[rowIdx].positive}
                            </p>
                          )}
                          {derived.instructions[rowIdx].negative && (
                            <p className="text-sm whitespace-pre-wrap">
                              <span className="font-medium">
                                Negative Examples:{" "}
                              </span>
                              {derived.instructions[rowIdx].negative}
                            </p>
                          )}
                          {!derived.instructions[rowIdx].positive &&
                            !derived.instructions[rowIdx].negative && (
                              <div className="text-sm text-gray-500">N/A</div>
                            )}
                        </div>
                      )}
                    </td>
                    {responses.map((resp) => {
                      const score = aiScores[r.id]?.[resp.id]?.score;
                      console.log(
                        `[InputScoringTable] Rendering AI score for ${r.id} -> ${resp.id}:`,
                        score,
                        aiScores[r.id]?.[resp.id]
                      );
                      return (
                        <React.Fragment key={`ai-${resp.id}`}>
                          <td className="px-4 py-3 align-top border-x border-gray-200">
                            <div className="w-16 h-10 px-3 py-2 border border-blue-200 rounded-lg shadow-sm bg-blue-50 text-sm font-medium text-blue-700 text-center flex items-center justify-center">
                              {score ?? "—"}
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top border-x border-gray-200">
                            <div className="w-full px-3 py-2 border border-blue-200 rounded-md shadow-sm bg-blue-50 text-sm text-gray-700 min-h-[2.5rem]">
                              {aiScores[r.id]?.[resp.id]?.rationale || (
                                <span className="text-gray-400 italic">
                                  No rationale provided
                                </span>
                              )}
                            </div>
                          </td>
                        </React.Fragment>
                      );
                    })}
                    <td className="px-4 py-3 text-sm text-gray-900 border-x border-gray-200">
                      {enableIdealScoreEditing ? (
                        <div className="relative w-16">
                          <select
                            className={`w-16 h-10 px-3 py-2 pr-8 border rounded-lg text-sm font-medium text-center transition-all duration-200 appearance-none ${
                              isComparingMode
                                ? `cursor-not-allowed bg-white ${
                                    currentIdealResponseId &&
                                    aiScores[r.id]?.[currentIdealResponseId] !==
                                      undefined &&
                                    (idealScores[r.id] !== undefined
                                      ? idealScores[r.id]
                                      : idealPoints[rowIdx]) !==
                                      aiScores[r.id][currentIdealResponseId]
                                        .score
                                      ? "border-red-300 text-red-700"
                                      : "border-gray-200 text-gray-600"
                                  }`
                                : "shadow-sm bg-white hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer border-gray-300 text-gray-700"
                            }`}
                            value={
                              idealScores[r.id] !== undefined
                                ? idealScores[r.id]
                                : idealPoints[rowIdx] !== undefined
                                ? idealPoints[rowIdx]
                                : ""
                            }
                            disabled={isComparingMode}
                            onChange={(e) => {
                              const v =
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value);
                              console.log(
                                `🎯 [InputScoringTable] AI table Ideal Response dropdown changed:`,
                                {
                                  criteriaId: r.id,
                                  newValue: v,
                                  oldValue: idealScores[r.id],
                                  currentIdealResponseId:
                                    currentIdealResponseId,
                                }
                              );
                              handleIdealScoreChange(r.id, v);
                            }}
                            title="Expected score for selected ideal response"
                          >
                            <option value="" disabled className="text-gray-400">
                              —
                            </option>
                            {Array.from(
                              {
                                length:
                                  Math.max(
                                    0,
                                    Number(idealPoints[rowIdx] ?? 0)
                                  ) + 1,
                              },
                              (_, i) => i
                            ).map((val) => (
                              <option
                                key={val}
                                value={val}
                                className="text-gray-700 font-medium"
                              >
                                {val}
                              </option>
                            ))}
                          </select>
                          {!isComparingMode && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                              <svg
                                className="w-4 h-4 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-900 font-medium">
                          {idealPoints[rowIdx]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          className={`px-4 py-2 rounded-md mb-2 transition-all duration-200 ${
            !canCompare
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : isComparingMode
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
          disabled={!canCompare}
          onClick={() => {
            if (canCompare) {
              setIsComparingMode(!isComparingMode);
              onCompareClick && onCompareClick();
            }
          }}
          title={
            !canCompare
              ? `Complete all scoring first. Human scoring: ${
                  areAllHumanScoresComplete ? "✓" : "✗"
                }, AI results: ${areAiResultsAvailable ? "✓" : "✗"}`
              : isComparingMode
              ? "Stop comparing with AI results"
              : "Compare human scores with AI results"
          }
        >
          {isComparingMode ? "Stop Comparing" : "Compare with the AI Grader"}
        </button>
      </div>
    </div>
  );
}
