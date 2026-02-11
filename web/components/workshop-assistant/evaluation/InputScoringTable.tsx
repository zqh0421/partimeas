"use client";

import React, {
  useMemo,
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useRef,
} from "react";
import { useCriteriaData } from "@/hooks/useCriteriaData";
import {
  restoreIdealResponseSelection,
  restoreIndependentCriteriaSelection,
} from "@/utils/selectionCache";
import {
  updateIdealResponseScore,
  getExpectedScore,
} from "@/utils/idealResponseScoring";
import { collectAndUploadEvaluationData } from "@/utils/evaluationDataCollector";
import { IdealModelResponse } from "@/types";
import { EvaluationRecord } from "@/types/database";
import {
  cacheSessionScore,
  restoreSessionScores,
  PointOption,
  PointValue,
} from "@/utils/sessionScoreCache";
import InputScoringMatrix from "@/components/workshop-assistant/evaluation/InputScoringMatrix";
import InputScoringActions from "@/components/workshop-assistant/evaluation/InputScoringActions";

type InputScoringTableProps = {
  responses: { id: string; label: string }[];
  rubricItems?: {
    id: string;
    name: string;
    requirement: string;
    num: number;
    weight?: string;
  }[];
  aiScores?: Record<
    string,
    Record<
      string,
      {
        score: number;
        rationale: string;
        subscores?: Array<{ score: number; rationale: string }>;
      }
    >
  >;
  modelOutputs?: any[];
  testCase?: any;
  onCompareClick?: (isComparing: boolean) => void;
  selectedIdealResponseId?: string;
  enableIdealScoreEditing?: boolean;
  idealResponses?: IdealModelResponse[];
  sessionId?: string | null;
  linkedCriteriaId?: string; // Linked criteria from session
  onVersionInfo?: (currentIndex: number | null, totalVersions: number) => void;
  onVersionChange?: (index: number) => void;
};

const InputScoringTable = forwardRef<
  { changeVersion: (index: number) => void },
  InputScoringTableProps
>(function InputScoringTable(
  {
    responses,
    rubricItems = [],
    aiScores: initialAiScores = {},
    modelOutputs = [],
    testCase,
    onCompareClick,
    selectedIdealResponseId,
    idealResponses = [],
    sessionId,
    linkedCriteriaId,
    onVersionInfo,
  }: InputScoringTableProps,
  ref
) {
  const { criteria, refetch: refetchCriteria } = useCriteriaData();

  // State for AI evaluation and comparing mode (moved here to be available for derived useMemo)
  const [aiScores, setAiScores] = useState(initialAiScores);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [isComparingMode, setIsComparingMode] = useState(false);
  const [isRefreshingRubric, setIsRefreshingRubric] = useState(false);
  const [isUploadingData, setIsUploadingData] = useState(false);

  // Versioning state for comparing mode
  const [evaluationVersions, setEvaluationVersions] = useState<
    EvaluationRecord[]
  >([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState<number | null>(
    null
  );

  // Add ref to track and cancel in-flight requests
  const fetchVersionsAbortController = useRef<AbortController | null>(null);

  // Derive rubric rows - use archived rubric when viewing versions, latest when editing
  const derived = useMemo(() => {
    // When in comparing mode and viewing a version, use the archived rubric from that version
    if (
      isComparingMode &&
      currentVersionIndex !== null &&
      evaluationVersions[currentVersionIndex]
    ) {
      const currentVersion = evaluationVersions[currentVersionIndex];
      const archivedRubric = currentVersion.rubric_with_scoring;

      if (
        archivedRubric &&
        archivedRubric.criteria &&
        archivedRubric.criteria.length > 0
      ) {
        const items = archivedRubric.criteria.map((criterion, idx) => ({
          id: criterion.original_id || `archived-criterion-${idx + 1}`,
          name: criterion.name || `Criterion ${idx + 1}`,
          num: criterion.num || idx + 1, // Use num from archived data if available
          requirement:
            criterion.requirement ||
            criterion.description ||
            criterion.name ||
            `Criterion ${idx + 1}`, // Use actual requirement field from archived data
        }));

        // Sort items by num field
        items.sort((a, b) => a.num - b.num);

        // Create points array matching the sorted order
        const points = items.map((item) => {
          const criterion = archivedRubric.criteria.find(
            (c, idx) => (c.num || idx + 1) === item.num
          );
          return criterion?.points || 2;
        });

        return { items, points };
      }
    }

    // When provided rubricItems directly (from props), use them
    if (rubricItems && rubricItems.length > 0) {
      const sortedItems = [...rubricItems].sort(
        (a, b) => (a.num || 0) - (b.num || 0)
      );
      return {
        items: sortedItems.map((item) => ({
          ...item,
          num: item.num || 0, // Ensure num field exists
        })),
        points: sortedItems.map(() => 1),
      };
    }

    // Otherwise, use the latest rubric from criteria data (for new evaluations)
    // Handle case where criteria is not yet loaded
    if (!criteria || criteria.length === 0) {
      return { items: [], points: [] };
    }

    // Priority: 1. linkedCriteriaId (from session), 2. cached selection, 3. first available
    let selectedVersionId = linkedCriteriaId;

    // If no linked criteria, check independent cache (for non-session usage)
    if (!selectedVersionId) {
      selectedVersionId = restoreIndependentCriteriaSelection() ?? undefined;
    }

    // Debug logging to track which source is used
    console.log("🎯 Rubric selection logic:", {
      linkedCriteriaId,
      cachedCriteriaId: restoreIndependentCriteriaSelection() ?? undefined,
      finalSelectedId: selectedVersionId,
      availableVersions: criteria.map((v) => v.sheetName),
    });

    let selectedVersion = criteria.find(
      (v) => v.sheetName === selectedVersionId
    );
    if (!selectedVersion) selectedVersion = criteria[0];
    if (!selectedVersion) {
      return { items: [], points: [] };
    }

    const items = selectedVersion.requirements.map((req, idx) => ({
      id: `${selectedVersion.sheetName}-req-${idx + 1}`,
      name: req.category?.trim() || `Criterion ${idx + 1}`, // Only use category as name
      requirement: req.requirement || `Requirement ${idx + 1}`, // Keep requirement separate
      num: req.num || idx + 1, // Add num field from requirements
      weight: req.weight, // Pass weight but don't display it
    }));

    // Sort items by num field
    items.sort((a, b) => a.num - b.num);

    // Create points array matching the sorted order
    const points = items.map((item) => {
      const req = selectedVersion.requirements.find(
        (r) =>
          (r.num || selectedVersion.requirements.indexOf(r) + 1) === item.num
      );
      const n = parseInt((req?.points || "1").trim(), 10);
      return Number.isNaN(n) ? 1 : n;
    });

    return { items, points };
  }, [
    criteria,
    rubricItems,
    isComparingMode,
    currentVersionIndex,
    evaluationVersions,
  ]);

  // Get effective session ID
  const effectiveSessionId = useMemo(() => {
    return testCase?.sessionId || sessionId;
  }, [testCase?.sessionId, sessionId]);

  const [scores, setScores] = useState<PointOption>(() => {
    // Try to restore from session cache first (independent from rubric selection)
    if (effectiveSessionId && derived.items.length > 0) {
      const { scores: cachedScores } = restoreSessionScores(
        effectiveSessionId,
        derived.items.map((item) => item.num),
        responses.map((r) => r.id)
      );

      // Map criterion nums back to rubric item IDs
      const mapped: PointOption = {};
      let restoredCount = 0;
      derived.items.forEach((item) => {
        const rowData = cachedScores[`criterion-${item.num}`];
        if (rowData) {
          mapped[item.id] = rowData;
          restoredCount += Object.keys(rowData).length;
        } else {
          mapped[item.id] = {};
          for (const resp of responses) {
            mapped[item.id][resp.id] = 0;
          }
        }
      });

      if (restoredCount > 0) {
        console.log(
          "[InputScoringTable] 📦 Restored human scores from independent cache:",
          {
            sessionId: effectiveSessionId,
            restoredScores: restoredCount,
            rubricUsed:
              linkedCriteriaId ||
              restoreIndependentCriteriaSelection() ||
              "default",
            cacheType: "sessionScoreCache (independent from rubric selection)",
          }
        );
      }

      return mapped;
    }

    // Initialize empty if no cache
    const initial: PointOption = {};
    for (const r of derived.items) {
      initial[r.id] = {};
      for (const resp of responses) {
        initial[r.id][resp.id] = 0;
      }
    }
    console.log("Initial");
    console.log(initial);
    return initial;
  });

  const [rationales, setRationales] = useState<
    Record<string, Record<string, string>>
  >(() => {
    // Try to restore from session cache first
    if (effectiveSessionId && derived.items.length > 0) {
      const { rationales: cachedRationales } = restoreSessionScores(
        effectiveSessionId,
        derived.items.map((item) => item.num),
        responses.map((r) => r.id)
      );

      // Map criterion nums back to rubric item IDs
      const mapped: Record<string, Record<string, string>> = {};
      derived.items.forEach((item) => {
        const rowData = cachedRationales[`criterion-${item.num}`];
        if (rowData) {
          mapped[item.id] = rowData;
        } else {
          mapped[item.id] = {};
          for (const resp of responses) {
            mapped[item.id][resp.id] = "";
          }
        }
      });

      return mapped;
    }

    // Initialize empty if no cache
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
    return id;
  }, [selectedIdealResponseId]);

  // State for ideal response expected scores
  const [idealScores, setIdealScores] = useState<PointValue>({});

  // Load ideal scores when ideal response changes
  useEffect(() => {
    if (currentIdealResponseId && derived.items.length > 0) {
      try {
        const scores: PointValue = {};

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
          }
        });

        setIdealScores(scores);
      } catch (error) {
        console.error("[InputScoringTable] Error loading ideal scores:", error);
        // Fallback to default points on error
        const fallbackScores: PointValue = {};
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

  // Initialize/merge state when items or responses change
  React.useEffect(() => {
    // Skip this if we're in comparing mode and have versions loaded
    if (isComparingMode && evaluationVersions.length > 0) {
      return;
    }

    // Try to restore cached data when rubric changes
    if (effectiveSessionId && derived.items.length > 0) {
      const { scores: cachedScores, rationales: cachedRationales } =
        restoreSessionScores(
          effectiveSessionId,
          derived.items.map((item) => item.num),
          responses.map((r) => r.id)
        );

      setScores((prev) => {
        const next: PointOption = {};

        derived.items.forEach((item) => {
          const rowData = cachedScores[`criterion-${item.num}`];
          if (rowData && Object.keys(rowData).length > 0) {
            // Use cached data for this criterion
            next[item.id] = rowData;
          } else {
            // No cached data, try to preserve existing data if available
            const prevRow = prev[item.id] || {};
            const row: PointValue = {};
            for (const resp of responses) {
              row[resp.id] =
                prevRow[resp.id] !== undefined ? prevRow[resp.id] : 0;
            }
            next[item.id] = row;
          }
        });

        return next;
      });

      setRationales((prev) => {
        const next: Record<string, Record<string, string>> = {};

        derived.items.forEach((item) => {
          const rowData = cachedRationales[`criterion-${item.num}`];
          if (rowData && Object.keys(rowData).length > 0) {
            // Use cached data for this criterion
            next[item.id] = rowData;
          } else {
            // No cached data, try to preserve existing data if available
            const prevRow = prev[item.id] || {};
            const row: Record<string, string> = {};
            for (const resp of responses) {
              row[resp.id] =
                prevRow[resp.id] !== undefined ? prevRow[resp.id] : "";
            }
            next[item.id] = row;
          }
        });

        return next;
      });
    } else {
      // No session ID, initialize normally
      setScores((prev) => {
        let changed = false;
        const next: PointOption = {};
        for (const r of derived.items) {
          const prevRow = prev[r.id] || {};
          const row: PointValue = {};
          for (const resp of responses) {
            const before = prevRow[resp.id];
            const after = before !== undefined ? before : 0;
            row[resp.id] = after;
            if (after !== before) changed = true;
          }
          next[r.id] = row;
          if (prevRow === undefined) changed = true;
        }
        // If number of rows changed
        if (Object.keys(prev).length !== Object.keys(next).length)
          changed = true;
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
        if (Object.keys(prev).length !== Object.keys(next).length)
          changed = true;
        return changed ? next : prev;
      });
    }
  }, [
    derived.items.map((item) => item.id).join(","),
    responses.map((resp) => resp.id).join(","),
    isComparingMode,
    evaluationVersions.length,
    effectiveSessionId,
  ]); // Use stable string representations

  // Save scores and rationales to session cache whenever they change
  useEffect(() => {
    if (!effectiveSessionId || isComparingMode) {
      return; // Don't cache when in comparing mode or no session
    }

    // Cache each score/rationale by criterion num
    derived.items.forEach((item) => {
      responses.forEach((resp) => {
        const score = scores[item.id]?.[resp.id];
        const rationale = rationales[item.id]?.[resp.id] || "";

        if (score !== undefined) {
          cacheSessionScore(
            effectiveSessionId,
            item.num,
            resp.id,
            score,
            rationale
          );
        }
      });
    });
  }, [
    scores,
    rationales,
    effectiveSessionId,
    isComparingMode,
    derived.items,
    responses,
  ]);

  // Create a function to fetch versions that can be called manually
  const fetchVersions = async (forceRefresh = false) => {
    // Use test case session ID if available, otherwise fall back to prop session ID
    const effectiveSessionId = testCase?.sessionId || sessionId;

    if (!effectiveSessionId) {
      return;
    }

    // Cancel any previous in-flight request
    if (fetchVersionsAbortController.current) {
      fetchVersionsAbortController.current.abort();
    }

    // Create new abort controller for this request
    fetchVersionsAbortController.current = new AbortController();
    const signal = fetchVersionsAbortController.current.signal;

    try {
      const response = await fetch(
        `/api/evaluation-records?action=bySession&session_id=${effectiveSessionId}`,
        {
          signal,
          cache: forceRefresh ? "no-store" : "default", // Force refresh when needed
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch evaluation versions");
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Sort by created_at descending (newest first)
        const sortedVersions = data.data.sort(
          (a: EvaluationRecord, b: EvaluationRecord) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        // Atomic state update to prevent inconsistency
        setEvaluationVersions(sortedVersions);

        // Use setTimeout to ensure state is updated in next tick
        setTimeout(() => {
          if (sortedVersions.length > 0 && !signal.aborted) {
            setCurrentVersionIndex(0);
          }
        }, 0);
      }
    } catch (error: any) {
      // Ignore abort errors
      if (error?.name !== "AbortError") {
        console.error("[InputScoringTable] Error fetching versions:", error);
      }
    }
  };

  // Fetch evaluation versions when entering comparing mode
  useEffect(() => {
    if (!isComparingMode) {
      // Cancel any in-flight requests
      if (fetchVersionsAbortController.current) {
        fetchVersionsAbortController.current.abort();
        fetchVersionsAbortController.current = null;
      }
      setEvaluationVersions([]);
      setCurrentVersionIndex(null);
      return;
    }

    // Fetch versions when entering comparing mode with force refresh
    fetchVersions(true);

    // Cleanup function to cancel request if component unmounts or dependencies change
    return () => {
      if (fetchVersionsAbortController.current) {
        fetchVersionsAbortController.current.abort();
        fetchVersionsAbortController.current = null;
      }
    };
  }, [isComparingMode, sessionId, testCase?.sessionId]);

  // Notify parent about version info changes
  useEffect(() => {
    if (onVersionInfo) {
      if (!isComparingMode) {
        onVersionInfo(null, 0);
      } else if (
        evaluationVersions.length > 0 &&
        currentVersionIndex !== null
      ) {
        // Only notify when we have valid data
        // Validate that currentVersionIndex is within bounds
        const validIndex = Math.min(
          currentVersionIndex,
          evaluationVersions.length - 1
        );
        if (validIndex !== currentVersionIndex && validIndex >= 0) {
          // Fix index if out of bounds
          setCurrentVersionIndex(validIndex);
        } else {
          // Notify with valid data
          onVersionInfo(currentVersionIndex, evaluationVersions.length);
        }
      } else if (evaluationVersions.length === 0 && isComparingMode) {
        // No versions available yet but in comparing mode
        onVersionInfo(null, 0);
      }
    }
  }, [
    currentVersionIndex,
    evaluationVersions.length,
    isComparingMode,
    onVersionInfo,
  ]);

  // Expose version change method to parent
  useImperativeHandle(
    ref,
    () => ({
      changeVersion: (index: number) => {
        if (index >= 0 && index < evaluationVersions.length) {
          setCurrentVersionIndex(index);
        } else {
          console.warn(
            `[InputScoringTable] Invalid version index ${index}, versions available: ${evaluationVersions.length}`
          );
        }
      },
    }),
    [evaluationVersions.length]
  );

  // Update scores and rationales when version changes
  useEffect(() => {
    if (
      currentVersionIndex === null ||
      !evaluationVersions[currentVersionIndex] ||
      !isComparingMode // Only update when in comparing mode
    ) {
      return;
    }

    const currentVersion = evaluationVersions[currentVersionIndex];
    const rubricData = currentVersion.rubric_with_scoring;

    if (!rubricData || !rubricData.criteria) {
      return;
    }

    // Update human and AI scores from the selected version
    const newHumanScores: PointOption = {};
    const newHumanRationales: Record<string, Record<string, string>> = {};
    const newAiScores: Record<
      string,
      Record<
        string,
        {
          score: number;
          rationale: string;
          subscores?: Array<{ score: number; rationale: string }>;
        }
      >
    > = {};
    const newIdealScores: PointValue = {};

    rubricData.criteria.forEach((criterion, idx) => {
      // When viewing archived versions, use the original criterion ID if available
      // Otherwise use generated archived ID or current derived rubric item ID
      const rubricItemId =
        isComparingMode && currentVersionIndex !== null
          ? criterion.original_id || `archived-criterion-${idx + 1}` // Use original ID if available
          : derived.items[idx]?.id;
      if (!rubricItemId) return;

      newHumanScores[rubricItemId] = {};
      newHumanRationales[rubricItemId] = {};
      newAiScores[rubricItemId] = {};

      // Process scores for each response
      Object.entries(criterion.scores || {}).forEach(
        ([responseId, scoreData]) => {
          // Handle Ideal Response specially
          if (responseId === "Ideal Response") {
            // Store ideal response expected score
            if (scoreData.human_score) {
              newIdealScores[rubricItemId] = scoreData.human_score.score;
            }
            // Also set AI score for ideal response if available
            if (scoreData.ai_score && currentIdealResponseId) {
              newAiScores[rubricItemId][currentIdealResponseId] = {
                score: scoreData.ai_score.score,
                rationale:
                  scoreData.ai_score.rationale || "No rationale provided",
                subscores: scoreData.ai_score.subscores,
              };
            }
          } else {
            // Map response IDs from the database to current response IDs
            const mappedResponseId = responses.find(
              (r) => r.label === responseId || r.id === responseId
            )?.id;

            if (mappedResponseId) {
              // Set human scores and rationales
              if (scoreData.human_score) {
                newHumanScores[rubricItemId][mappedResponseId] =
                  scoreData.human_score.score;
                newHumanRationales[rubricItemId][mappedResponseId] =
                  scoreData.human_score.rationale || "";
              }

              // Set AI scores and rationales (including subscores)
              if (scoreData.ai_score) {
                newAiScores[rubricItemId][mappedResponseId] = {
                  score: scoreData.ai_score.score,
                  rationale:
                    scoreData.ai_score.rationale || "No rationale provided",
                  subscores: scoreData.ai_score.subscores,
                };
              }
            }
          }
        }
      );
    });

    // Update states with version data
    setScores(newHumanScores);
    setRationales(newHumanRationales);
    setAiScores(newAiScores);
    setIdealScores(newIdealScores); // Update ideal scores from version
  }, [
    currentVersionIndex,
    evaluationVersions,
    isComparingMode, // Add this to prevent updates when not in comparing mode
    // Remove derived.items and responses from dependencies to prevent infinite loop
    // Use stable string representations instead
    derived.items.map((item) => item.id).join(","),
    responses.map((r) => r.id).join(","),
    currentIdealResponseId,
  ]);

  // Track previous AI scores count to detect new evaluation completion
  const prevAiScoresCount = useRef(0);

  // Remove auto-save functionality - data should only be uploaded when clicking "Compare with AI Grader"
  useEffect(() => {
    const currentAiScoresCount = Object.keys(aiScores).length;
    // Update the previous count
    prevAiScoresCount.current = currentAiScoresCount;
  }, [aiScores]); // Monitor aiScores changes

  // Auto-trigger AI evaluation when model outputs are ready
  useEffect(() => {
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

    if (shouldTriggerEvaluation) {
      // Add a small delay to ensure everything is fully loaded
      const timer = setTimeout(() => {
        triggerAiEvaluation();
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [modelOutputs, testCase, aiScores, isEvaluating, derived.items.length]);

  const triggerAiEvaluation = async () => {
    // Validate model outputs have actual content
    const hasValidModelOutputs =
      modelOutputs &&
      modelOutputs.length > 0 &&
      modelOutputs.some((mo) => mo.output && mo.output.trim().length > 0);

    if (!hasValidModelOutputs) {
      setEvaluationError("No valid model outputs available for evaluation");
      return;
    }

    if (!testCase) {
      setEvaluationError("No test case available for evaluation");
      return;
    }

    if (derived.items.length === 0) {
      setEvaluationError("No rubric criteria available for evaluation");
      return;
    }

    setIsEvaluating(true);
    setEvaluationError(null);

    try {
      // Prepare criteria in the format expected by the API
      const criteriaForApi = derived.items.map((item, index) => ({
        id: item.id,
        name: item.name,
        description: item.requirement, // Use the actual prompt requirement
        scoreRange: `Score range: 0-${idealPoints[index] || 1}`, // Include score range for each criterion
      }));

      console.log("Evaluation criteria:", criteriaForApi);
      console.log(derived);

      console.log(derived.items[0]);
      console.log(modelOutputs);

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
                  idealTestCase: idealResponses.find(
                    (ir) => ir.name === currentIdealResponseId
                  )!.testCaseInput,
                }
              : undefined
            : undefined,
          criteriaSheetName: restoreIndependentCriteriaSelection() ?? undefined, // Pass the selected criteria version
        }),
      });

      if (!response.ok) {
        throw new Error(`Evaluation failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Store evaluation metadata for later use
      if (data.metadata) {
        // Store in window or session storage for later retrieval by evaluation data collector
        const metadataToStore = {
          evaluationDurationMs: data.metadata.evaluationDurationMs,
          judgmentStrategy: data.metadata.judgmentStrategy,
          totalRuns: data.metadata.totalRuns,
          assistantsUsed: data.metadata.assistantsUsed,
          timestamp: new Date().toISOString(),
        };
        window.sessionStorage.setItem(
          "lastEvaluationMetadata",
          JSON.stringify(metadataToStore)
        );
        console.log("✅ Stored evaluation metadata:", {
          duration: `${data.metadata.evaluationDurationMs}ms`,
          strategy: data.metadata.judgmentStrategy,
          totalRuns: data.metadata.totalRuns,
          assistants: data.metadata.assistantsUsed?.length || 0,
        });
      } else {
        console.warn("⚠️ No metadata in evaluation response");
      }

      if (data.success && data.evaluations) {
        // Store raw evaluations with subscores for data collector
        window.sessionStorage.setItem(
          "lastEvaluationRawData",
          JSON.stringify({
            evaluations: data.evaluations,
            timestamp: new Date().toISOString(),
          })
        );
        console.log("✅ Stored raw evaluation data with subscores");

        // Transform evaluation results to match our aiScores format
        let transformedScores: Record<
          string,
          Record<
            string,
            {
              score: number;
              rationale: string;
              subscores?: any[];
              aggregation_method?: string;
            }
          >
        > = {};

        data.evaluations.forEach((evaluation: any, evalIndex: number) => {
          // Check if this is the ideal response evaluation
          const isIdealResponseEval =
            evaluation.isIdealResponse ||
            evaluation.modelId === currentIdealResponseId ||
            evaluation.modelId === "ideal-response";

          let responseId: string;

          if (isIdealResponseEval && currentIdealResponseId) {
            // This is the ideal response evaluation - use the currentIdealResponseId
            responseId = currentIdealResponseId;
          } else {
            // Find the corresponding response ID from our responses array
            // The API returns evaluations with modelId, but we need to map them to our response IDs
            responseId = evaluation.modelId;

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
                responseId =
                  responses[evalIndex]?.id || `resp-${evalIndex + 1}`;
              }
            }
          }

          // Map criteria scores to rubric items (including subscores)
          Object.entries(evaluation.criteriaScores || {}).forEach(
            ([criteriaId, scoreData]: [string, any]) => {
              if (!transformedScores[criteriaId]) {
                transformedScores[criteriaId] = {};
              }
              transformedScores[criteriaId][responseId] = {
                score: scoreData.score || 0,
                rationale:
                  scoreData.reasoning ||
                  scoreData.rationale ||
                  "No rationale provided",
                subscores: scoreData.subscores || [],
                aggregation_method: scoreData.aggregation_method || undefined,
              };
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
          // Create a mapping from simplified IDs to actual response IDs
          const responseIdMapping: Record<string, string> = {};
          responses.forEach((response, index) => {
            responseIdMapping[`resp-${index + 1}`] = response.id;
          });

          // Transform the scores to use actual response IDs
          const correctedScores: Record<
            string,
            Record<
              string,
              {
                score: number;
                rationale: string;
                subscores?: any[];
                aggregation_method?: string;
              }
            >
          > = {};

          Object.entries(transformedScores).forEach(
            ([criteriaId, responseScores]) => {
              correctedScores[criteriaId] = {};
              Object.entries(responseScores).forEach(
                ([responseId, scoreData]) => {
                  const actualResponseId =
                    responseIdMapping[responseId] || responseId;
                  correctedScores[criteriaId][actualResponseId] = scoreData;
                }
              );
            }
          );

          transformedScores = correctedScores;
        }

        setAiScores(transformedScores);
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

  const refreshAiGrader = async () => {
    setIsRefreshingRubric(true);
    setEvaluationError(null);

    try {
      // Step 1: Exit compare mode to use latest rubric (not archived version)
      setIsComparingMode(false);

      // Notify parent component that we're exiting compare mode
      if (onCompareClick) {
        onCompareClick(false);
      }

      // Step 2: Re-fetch the latest rubric data from the spreadsheet
      // This ensures we get any changes made to the rubric since last evaluation
      refetchCriteria();

      // Step 3: The cached data will be automatically restored by the useEffect
      // that watches for rubric changes, using the session-based cache
      // No need to manually restore as the cache is keyed by row index

      // Step 4: Clear existing AI scores
      setAiScores({});

      // Step 5: Wait a moment for the criteria to update and cached data to restore,
      // then trigger new AI evaluation (but don't save automatically)

      // Trigger AI evaluation after a short delay to ensure state updates are complete
      setTimeout(() => {
        triggerAiEvaluation();
      }, 0); // Short delay to ensure state updates are complete
    } catch (error) {
      console.error(
        "[InputScoringTable] ❌ Error refreshing AI Grader:",
        error
      );
      setEvaluationError(
        error instanceof Error ? error.message : "Failed to refresh AI Grader"
      );
    } finally {
      setIsRefreshingRubric(false);
    }
  };

  const uploadEvaluationData = async () => {
    setIsUploadingData(true);

    try {
      // Generate a unique session ID for each test case if not already present
      // This ensures each test case has independent version history
      let effectiveSessionId = testCase?.sessionId || sessionId;

      // If no session ID exists, create one unique to this test case
      if (!effectiveSessionId && testCase) {
        effectiveSessionId = `${
          testCase.id || "test"
        }-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      }

      const result = await collectAndUploadEvaluationData({
        testCase: testCase,
        modelOutputs: modelOutputs,
        rubricItems: derived.items,
        rubricPoints: derived.points,
        humanScores: scores,
        humanRationales: rationales,
        aiScores: aiScores,
        evaluatorModel: "gpt-4-turbo", // This should be determined from AI evaluation
        evaluatorSystemPrompt: "Evaluation system prompt", // This should come from the actual evaluation
        idealResponses: idealResponses,
        sessionId: effectiveSessionId ?? undefined,
        groupId: testCase?.groupId || `group-${Date.now()}`,
        idealExpectedScores: idealScores,
      });

      if (result.success) {
        console.log(`Successfully saved evaluation data (ID: ${result.id})`);
      } else {
        console.error("[InputScoringTable] Upload failed:", result.error);
      }
    } catch (error) {
      console.error(
        "[InputScoringTable] ❌ Error uploading evaluation data:",
        error
      );
    } finally {
      setIsUploadingData(false);
    }
  };

  const handleScoreChange = (
    rubricId: string,
    responseId: string,
    value: number
  ) => {
    setScores((prev) => ({
      ...prev,
      [rubricId]: { ...prev[rubricId], [responseId]: value },
    }));

    // Cache by criterion num
    if (effectiveSessionId && !isComparingMode) {
      const item = derived.items.find((item) => item.id === rubricId);
      if (item) {
        const currentRationale = rationales[rubricId]?.[responseId] || "";
        cacheSessionScore(
          effectiveSessionId,
          item.num,
          responseId,
          value,
          currentRationale
        );
      }
    }
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

    // Cache by criterion num
    if (effectiveSessionId && !isComparingMode) {
      const item = derived.items.find((item) => item.id === rubricId);
      if (item) {
        const currentScore = scores[rubricId]?.[responseId] || 0;
        cacheSessionScore(
          effectiveSessionId,
          item.num,
          responseId,
          currentScore,
          value
        );
      }
    }
  };

  const handleIdealScoreChange = (criteriaId: string, newScore: number) => {
    if (!currentIdealResponseId) {
      return;
    }

    try {
      // Update the score in cache using the scoring utility
      updateIdealResponseScore(
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
    } catch (error) {
      console.error(
        `[InputScoringTable] Error updating ideal score for ${criteriaId}:`,
        error
      );
    }
  };

  // Helper function to get subscore rationale that matches the final score
  const getMatchingSubscoreRationale = (
    rubricId: string,
    responseId: string
  ): string | null => {
    const scoreData = aiScores[rubricId]?.[responseId];

    // Debug logging
    console.log("Getting subscore rationale for:", {
      rubricId,
      responseId,
      scoreData,
    });

    if (
      !scoreData ||
      !scoreData.subscores ||
      scoreData.subscores.length === 0
    ) {
      console.log("No subscores found");
      return null;
    }

    // Find a subscore that matches the final score
    const matchingSubscore = scoreData.subscores.find(
      (subscore: any) => subscore.score === scoreData.score
    );

    if (matchingSubscore && matchingSubscore.rationale) {
      console.log("Found matching subscore:", matchingSubscore);
      return matchingSubscore.rationale;
    }

    // If no exact match, return the first subscore's rationale as fallback
    if (scoreData.subscores[0] && scoreData.subscores[0].rationale) {
      console.log("Using first subscore as fallback:", scoreData.subscores[0]);
      return scoreData.subscores[0].rationale;
    }

    console.log("No rationale found in subscores");
    return null;
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
        if (score === undefined) {
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

  return (
    <div className="overflow-x-auto">
      <InputScoringMatrix
        rubricItems={derived.items}
        responses={responses}
        scores={scores}
        rationales={rationales}
        aiScores={aiScores}
        isComparingMode={isComparingMode}
        currentIdealResponseId={currentIdealResponseId || undefined}
        idealScores={idealScores}
        idealPoints={idealPoints}
        handleScoreChange={handleScoreChange}
        handleRationaleChange={handleRationaleChange}
        handleIdealScoreChange={handleIdealScoreChange}
        autoResize={autoResize}
        getMatchingSubscoreRationale={getMatchingSubscoreRationale}
      />

      <InputScoringActions
        isComparingMode={isComparingMode}
        evaluationError={evaluationError}
        isEvaluating={isEvaluating}
        areAiResultsAvailable={areAiResultsAvailable}
        canCompare={canCompare}
        isUploadingData={isUploadingData}
        isRefreshingRubric={isRefreshingRubric}
        onRefreshAiGrader={refreshAiGrader}
        onCompareToggle={async () => {
          if (canCompare && !isUploadingData) {
            if (!isComparingMode) {
              await uploadEvaluationData();
              await new Promise((resolve) => setTimeout(resolve, 0));
            }
            setIsComparingMode(!isComparingMode);
            onCompareClick?.(!isComparingMode);
          }
        }}
      />
    </div>
  );
});

export default InputScoringTable;
