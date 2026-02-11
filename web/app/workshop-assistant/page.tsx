"use client";

import { useCallback, useEffect, useState } from "react";
import { useAnalysisState } from "@/hooks/useAnalysisState";
import { useAnalysisHandlers } from "@/hooks/useAnalysisHandlers";
import { useConfig } from "@/hooks/useConfig";
import useStreamingGeneration from "@/hooks/useStreamingGeneration";
import VerticalStepper from "@/components/steps/VerticalStepper";
import SetupStep from "@/components/steps/SetupStep";
import AnalysisStep from "@/components/steps/AnalysisStep";
import { RefreshIcon } from "@/components/icons";
import { AnalysisHeaderFull } from "@/components";
import { GroupIdModal } from "@/components/GroupIdModal";
import { TestCaseWithModelOutputs, ModelOutput } from "@/types";
import { Assistant } from "@/types/admin";
import { selectionCache } from "@/utils/selectionCache";
import { TEST_CASE_CONFIG } from "@/config/useCases";

type StateUpdate<T> = Partial<T> | ((prev: T) => T);

type SessionState = {
  currentSessionId: string | null;
  testCaseSessionIds: Map<number, string>;
  currentGroupId: string | null;
  showGroupIdModal: boolean;
  isHydrated: boolean;
};

type AnalysisViewState = {
  analysisStep: "setup" | "running" | "complete";
  hasStartedEvaluation: boolean;
  isStep1Collapsed: boolean;
  currentPhase: "generating" | "evaluating" | "complete";
  showEvaluationFeatures: boolean;
  hasComparedWithAi: boolean;
  expandedOriginalText: Set<string>;
};

type GenerationState = {
  localTestCasesWithModelOutputs: TestCaseWithModelOutputs[];
  isGeneratingOutputs: boolean;
  selectedOutputModelIds: string[];
  isRealEvaluation: boolean;
  isUsingStreaming: boolean;
};

// Main component wrapped in Suspense
export default function Page() {
  const {
    ui,
    data,
    evaluation,
    selection,
    useCase: { updateSystemPromptForUseCase },
  } = useAnalysisState(); // Use dynamic default from USE_CASE_PROMPTS

  const {
    currentStep,
    setCurrentStep,
    isLoading,
    setIsLoading,
    validationError,
    setValidationError,
  } = ui;

  const {
    testCases,
    setTestCases,
    testCasesWithModelOutputs,
    setTestCasesWithModelOutputs,
    criteria,
    setCriteria,
    outcomes,
    setOutcomes,
    outcomesWithModelComparison,
    setOutcomesWithModelComparison,
    idealResponses,
    setIdealResponses,
  } = data;

  const {
    selectedTestCaseIndex,
    setSelectedTestCaseIndex,
    selectedScenarioCategory,
    setSelectedScenarioCategory,
    selectedCriteriaId,
    setSelectedCriteriaId,
    selectedIdealResponseId,
    setSelectedIdealResponseId,
    selectedSystemPrompt,
    setSelectedSystemPrompt,
  } = selection;

  const {
    shouldStartEvaluation,
    setShouldStartEvaluation,
    evaluationProgress,
    setEvaluationProgress,
  } = evaluation;

  const [sessionState, setSessionState] = useState<SessionState>({
    currentSessionId: null,
    testCaseSessionIds: new Map(),
    currentGroupId: null,
    showGroupIdModal: false,
    isHydrated: false,
  });
  const updateSessionState = useCallback(
    (updates: StateUpdate<SessionState>) =>
      setSessionState((prev) =>
        typeof updates === "function" ? updates(prev) : { ...prev, ...updates }
      ),
    []
  );
  const {
    currentSessionId,
    testCaseSessionIds,
    currentGroupId,
    showGroupIdModal,
    isHydrated,
  } = sessionState;

  const [analysisViewState, setAnalysisViewState] = useState<AnalysisViewState>({
    analysisStep: "setup",
    hasStartedEvaluation: false,
    isStep1Collapsed: false,
    currentPhase: "generating",
    showEvaluationFeatures: true,
    hasComparedWithAi: false,
    expandedOriginalText: new Set(),
  });
  const updateAnalysisViewState = useCallback(
    (updates: StateUpdate<AnalysisViewState>) =>
      setAnalysisViewState((prev) =>
        typeof updates === "function" ? updates(prev) : { ...prev, ...updates }
      ),
    []
  );
  const {
    analysisStep,
    hasStartedEvaluation,
    isStep1Collapsed,
    currentPhase,
    showEvaluationFeatures,
    hasComparedWithAi,
    expandedOriginalText,
  } = analysisViewState;

  const [generationState, setGenerationState] = useState<GenerationState>({
    localTestCasesWithModelOutputs: [],
    isGeneratingOutputs: false,
    selectedOutputModelIds: [],
    isRealEvaluation: false,
    isUsingStreaming: false,
  });
  const updateGenerationState = useCallback(
    (updates: StateUpdate<GenerationState>) =>
      setGenerationState((prev) =>
        typeof updates === "function" ? updates(prev) : { ...prev, ...updates }
      ),
    []
  );
  const {
    isGeneratingOutputs,
    selectedOutputModelIds,
    isRealEvaluation,
    isUsingStreaming,
  } = generationState;

  // Streaming generation hook
  const {
    modelOutputs: streamingOutputs,
    errors: streamingErrors,
    isStreaming,
    isComplete: isStreamingComplete,
    sessionId: streamingSessionId,
    startStreaming,
    resetStream,
  } = useStreamingGeneration();

  // Create shareable link when session is created
  const shareableLink = streamingSessionId
    ? `${
        typeof window !== "undefined" ? window.location.origin : ""
      }/workshop-assistant/session/${streamingSessionId}`
    : null;

  // Handle streaming completion - update testCasesWithModelOutputs when streaming finishes
  useEffect(() => {
    if (
      isUsingStreaming &&
      isStreamingComplete &&
      streamingOutputs.length > 0
    ) {
      console.log(
        "🔄 Streaming complete, updating test cases with",
        streamingOutputs.length,
        "outputs"
      );

      // Convert streaming outputs to model outputs format
      const modelOutputsFromStream: ModelOutput[] = streamingOutputs.map(
        (output) => ({
          modelId: output.modelId,
          modelName: output.modelId, // Use modelId as modelName for now
          output: output.output,
          rubricScores: {},
          feedback: "",
          suggestions: [],
          timestamp: new Date().toISOString(),
        })
      );

      // Update the first test case with streamed outputs
      if (testCases.length > 0) {
        const updatedTestCase: TestCaseWithModelOutputs = {
          ...testCases[0],
          modelOutputs: modelOutputsFromStream,
          sessionId: streamingSessionId || undefined,
        };

        // Store the session ID in the map for test case 0
        if (streamingSessionId) {
          updateSessionState((prev) => {
            const nextMap = new Map(prev.testCaseSessionIds);
            nextMap.set(0, streamingSessionId);
            console.log(
              `📋 Captured streaming session ID for test case 1: ${streamingSessionId}`
            );
            return { ...prev, testCaseSessionIds: nextMap };
          });
        }

        setTestCasesWithModelOutputs([updatedTestCase]);
        updateGenerationState({
          localTestCasesWithModelOutputs: [updatedTestCase],
        });

        // Start evaluation phase
        updateAnalysisViewState({ currentPhase: "evaluating" });
        startEvaluationPhase([updatedTestCase]);

        // Reset the streaming flag
        updateGenerationState({ isUsingStreaming: false });
      }
    }
  }, [
    isStreamingComplete,
    streamingOutputs,
    isUsingStreaming,
    testCases,
    updateSessionState,
    updateGenerationState,
    updateAnalysisViewState,
    setTestCasesWithModelOutputs,
  ]);

  // Track current session ID from generated responses (removed duplicate declaration)

  // Get configuration values
  const config = useConfig();
  const {
    numOutputsToShow,
    enableGroupIdCollection,
    isLoading: configLoading,
  } = config;

  // Debug logging for configuration
  useEffect(() => {
    console.log("🔧 Configuration Debug:", {
      config,
      enableGroupIdCollection,
      configLoading,
      numOutputsToShow,
    });
  }, [config, enableGroupIdCollection, configLoading, numOutputsToShow]);
  // Load group ID from localStorage after hydration
  useEffect(() => {
    updateSessionState((prev) => ({ ...prev, isHydrated: true }));
    const savedGroupId = localStorage.getItem("partimeas_group_id");
    if (savedGroupId) {
      updateSessionState((prev) => ({ ...prev, currentGroupId: savedGroupId }));
      console.log("📋 Loaded group ID from localStorage:", savedGroupId);
    } else {
      console.log("📋 No saved group ID found in localStorage");
    }
  }, [updateSessionState]);

  // Debug logging for group ID modal
  useEffect(() => {
    console.log("🔍 Group ID Modal Debug:", {
      enableGroupIdCollection,
      currentGroupId,
      showGroupIdModal,
      testCasesLength: testCases.length,
    });
  }, [
    enableGroupIdCollection,
    currentGroupId,
    showGroupIdModal,
    testCases.length,
  ]);

  const handlers = useAnalysisHandlers({
    stateSetters: {
      setTestCases,
      setTestCasesWithModelOutputs,
      setCriteria,
      setOutcomes,
      setOutcomesWithModelComparison,
      setIdealResponses,
      setIsLoading,
      setCurrentStep,
      // setSelectedUseCaseId,
      setSelectedScenarioCategory,
      setSelectedCriteriaId,
      setSelectedIdealResponseId,
      setValidationError,
      setShouldStartEvaluation,
      setSelectedTestCaseIndex,
      setEvaluationProgress,
    },
    data: {
      testCases,
      testCasesWithModelOutputs,
      criteria,
      rubricStructure: undefined, // TODO: Pass rubricStructure when available
      updateSystemPromptForUseCase,
    },
  });

  // Fetch active evaluation assistant to decide if real or mock evaluation
  useEffect(() => {
    const fetchActiveEvaluator = async () => {
      try {
        console.log("🔍 Fetching active evaluation assistant...");
        const res = await fetch("/api/admin/assistants?type=evaluation");
        if (!res.ok) throw new Error("Failed to load assistants");
        const data = await res.json();
        console.log("📋 Evaluation assistants response:", data);

        const active = (data.assistants || []).find(
          (a: Assistant) => a.required_to_show
        );
        console.log("✅ Active evaluation assistant found:", active);

        // Always show evaluation features; toggle real vs mock
        updateAnalysisViewState({ showEvaluationFeatures: true });
        updateGenerationState({ isRealEvaluation: Boolean(active) });
        console.log(
          "🎯 Evaluation mode set to:",
          Boolean(active) ? "REAL" : "MOCK"
        );
      } catch (e) {
        console.error("❌ Error fetching evaluation assistant:", e);
        // Fallback to mock evaluation UI
        updateAnalysisViewState({ showEvaluationFeatures: true });
        updateGenerationState({ isRealEvaluation: false });
        console.log("🔄 Falling back to mock evaluation mode");
      }
    };
    fetchActiveEvaluator();
  }, [updateAnalysisViewState, updateGenerationState]);

  // Check if group ID is required and not yet provided
  useEffect(() => {
    // Only show modal after hydration to prevent SSR mismatch
    if (!isHydrated) return;

    console.log("Group ID Modal Logic Check:", {
      enableGroupIdCollection,
      currentGroupId,
      shouldShowModal: enableGroupIdCollection && !currentGroupId,
    });

    if (enableGroupIdCollection && !currentGroupId && !showGroupIdModal) {
      console.log("Setting modal to visible!");
      updateSessionState({ showGroupIdModal: true });
    }
  }, [
    enableGroupIdCollection,
    currentGroupId,
    isHydrated,
    showGroupIdModal,
    updateSessionState,
  ]);

  // Handle group ID confirmation
  const handleGroupIdConfirm = (groupId: string) => {
    console.log("✅ Group ID confirmed:", groupId);
    updateSessionState((prev) => ({
      ...prev,
      currentGroupId: groupId,
      showGroupIdModal: false,
    }));

    // Save to localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("partimeas_group_id", groupId);
      console.log("💾 Group ID saved to localStorage");
    }
  };

  // Handle group ID modal cancel
  const handleGroupIdCancel = () => {
    console.log("❌ Group ID modal cancelled");
    // Reset to setup step if user cancels group ID entry
    setCurrentStep("sync");

    // Clear group ID from localStorage when user cancels
    if (typeof window !== "undefined") {
      localStorage.removeItem("partimeas_group_id");
      console.log("🗑️ Group ID cleared from localStorage");
    }
    updateSessionState((prev) => ({
      ...prev,
      showGroupIdModal: false,
      currentGroupId: null,
    }));
  };

  // Function to clear group ID (for reset purposes)
  const clearGroupId = () => {
    console.log("🗑️ Clearing group ID for reset");
    if (typeof window !== "undefined") {
      localStorage.removeItem("partimeas_group_id");
      console.log("💾 Group ID removed from localStorage");
    }
    updateSessionState((prev) => ({
      ...prev,
      currentGroupId: null,
      showGroupIdModal: isHydrated ? true : prev.showGroupIdModal,
    }));
    if (isHydrated) {
      console.log("🔄 Group ID modal will be shown again");
    }
  };

  // Helper function to toggle original text expansion
  const toggleOriginalTextExpansion = (modelId: string) => {
    updateAnalysisViewState((prev) => {
      const newSet = new Set(prev.expandedOriginalText);
      if (newSet.has(modelId)) {
        newSet.delete(modelId);
      } else {
        newSet.add(modelId);
      }
      return { ...prev, expandedOriginalText: newSet };
    });
  };

  // Model output generation function
  const generateModelOutputs = async () => {
    console.log("🚀 Starting model output generation...");
    console.log("📊 Test cases to process:", testCases.length);
    console.log("🔍 Current group ID:", currentGroupId);

    updateGenerationState({ isGeneratingOutputs: true });
    updateAnalysisViewState({ currentPhase: "generating" });
    updateGenerationState({ selectedOutputModelIds: [] });

    try {
      // Pre-seed loading placeholders from configured assistants to avoid empty state flicker
      try {
        console.log("🔍 Fetching output generation assistants...");
        const assistantsRes = await fetch(
          "/api/admin/assistants?type=output_generation"
        );
        if (assistantsRes.ok) {
          const assistantsData = await assistantsRes.json();
          console.log("📋 Output generation assistants:", assistantsData);

          const assistants = Array.isArray(assistantsData?.assistants)
            ? assistantsData.assistants
            : [];
          const required = assistants.filter((a: any) => a.required_to_show);
          const optional = assistants.filter((a: any) => !a.required_to_show);
          const desired = Math.min(2, assistants.length || 0);
          const selected = [
            ...required.slice(0, desired),
            ...optional.slice(0, Math.max(0, desired - required.length)),
          ].slice(0, desired);

          console.log(
            "🎯 Selected assistants for output generation:",
            selected
          );

          // Flatten all model_ids from selected assistants into a single array
          const placeholderIds: string[] = selected.flatMap((a: any) =>
            Array.isArray(a.model_ids) ? a.model_ids : [a.id || "loading"]
          );

          if (placeholderIds.length > 0) {
            updateGenerationState({ selectedOutputModelIds: placeholderIds });
            console.log("📋 Set placeholder model IDs:", placeholderIds);
          }
        } else {
          console.log(
            "⚠️ Failed to fetch assistants, using fallback placeholders"
          );
          // Fallback placeholders
          updateGenerationState({ selectedOutputModelIds: ["loading-1", "loading-2"] });
        }
      } catch (error) {
        console.error("❌ Error fetching assistants:", error);
        updateGenerationState({ selectedOutputModelIds: ["loading-1", "loading-2"] });
      }

      console.log(
        "🚀 Starting model output generation for",
        testCases.length,
        "test cases"
      );

      // Use streaming for single test case

      console.log("🌊 Using streaming generation for single test case");

      // Set flag to track streaming usage
      updateGenerationState({ isUsingStreaming: true });

      // Reset stream before starting
      resetStream();

      // Find the selected ideal response object
      const selectedIdealResponse = idealResponses.find(
        (ir) => ir.id === selectedIdealResponseId
      );

      // Start streaming - this will update streamingOutputs as responses arrive
      // The useEffect hook will handle updating testCasesWithModelOutputs when streaming completes
      await startStreaming(
        testCases[0],
        currentGroupId || undefined,
        selectedIdealResponse
          ? {
              id: selectedIdealResponse.id,
              idealTestCase: selectedIdealResponse.testCaseInput,
              testCaseInput: selectedIdealResponse.testCaseInput,
            }
          : null,
        selectedCriteriaId
      );
    } catch (error) {
      console.error("❌ Error during model output generation:", error);
      handlers.handleEvaluationError(
        error instanceof Error
          ? error.message
          : "Unknown error during generation"
      );
      updateGenerationState({ isGeneratingOutputs: false });
      updateAnalysisViewState((prev) => ({
        ...prev,
        hasStartedEvaluation: false,
        currentPhase: "complete",
        analysisStep: "setup",
      }));
    }
  };

  // Start evaluation phase with generated outputs
  const startEvaluationPhase = async (
    testCasesWithOutputs: TestCaseWithModelOutputs[]
  ) => {
    console.log(
      "🚀 Starting evaluation phase with:",
      testCasesWithOutputs.length,
      "test cases"
    );
    console.log(
      "🔍 Test cases with session IDs:",
      testCasesWithOutputs.map((tc, idx) => ({
        index: idx,
        id: tc.id,
        sessionId: tc.sessionId,
      }))
    );
    console.log("🔍 isRealEvaluation:", isRealEvaluation);

    try {
      if (isRealEvaluation) {
        console.log("📡 Starting real evaluation API calls...");

        // Ensure we're in evaluating phase
        updateAnalysisViewState({ currentPhase: "evaluating" });

        // Small delay to make the evaluating phase visible
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Load real evaluation criteria first
        console.log(
          "📋 Loading evaluation criteria from /api/criteria-data..."
        );
        const criteriaResponse = await fetch("/api/criteria-data");
        if (!criteriaResponse.ok) {
          throw new Error("Failed to load evaluation criteria");
        }
        const criteriaData = await criteriaResponse.json();
        console.log("📋 Raw criteria data received:", criteriaData);

        const rawCriteria = criteriaData.criteria || [];

        // Flatten the hierarchical criteria structure for the evaluation API
        const evaluationCriteria = rawCriteria.flatMap(
          (category: any) =>
            category.criteria?.flatMap(
              (criterion: any) =>
                criterion.subcriteria?.map((subcriteria: any) => ({
                  id: `${category.name}_${criterion.name}_${subcriteria.name}`
                    .replace(/\s+/g, "_")
                    .toLowerCase(),
                  name: `${criterion.name}: ${subcriteria.name}`,
                  description: subcriteria.description || subcriteria.name,
                  category: category.name,
                  criterion: criterion.name,
                  subcriteria: subcriteria.name,
                })) || []
            ) || []
        );

        console.log(
          `✅ Loaded ${evaluationCriteria.length} flattened evaluation criteria from ${rawCriteria.length} categories`
        );

        // Log sample criteria for debugging
        if (evaluationCriteria.length > 0) {
          console.log(
            "📋 Sample evaluation criteria:",
            evaluationCriteria.slice(0, 3)
          );
        }

        // Call API to perform real evaluations using active evaluator assistant
        const evaluationPromises = testCasesWithOutputs.map(
          async (testCase, index) => {
            console.log(`📋 Evaluating test case ${index + 1}:`, {
              testCaseId: testCase.id,
              useCase: testCase.useCase,
              scenarioCategory: testCase.scenarioCategory,
              outputsCount: testCase.modelOutputs?.length || 0,
            });

            if (!testCase.modelOutputs || testCase.modelOutputs.length === 0) {
              console.log(`⚠️ Test case ${index + 1} has no model outputs`);
              return { testCaseIndex: index, evaluatedOutputs: [] };
            }

            console.log(
              `📤 Sending evaluation request for test case ${index + 1} with ${
                testCase.modelOutputs.length
              } outputs to /api/evaluation-results`
            );

            const evaluationPayload = {
              testCase: {
                input: testCase.input,
                context: testCase.context,
                useCase: testCase.useCase,
                useContext: testCase.scenarioCategory,
              },
              criteria: evaluationCriteria, // Use real criteria instead of empty array
              modelOutputs: testCase.modelOutputs,
            };

            console.log("📤 Evaluation payload:", evaluationPayload);

            // Find the selected ideal response object
            const selectedIdealResponse = idealResponses.find(
              (ir) => ir.id === selectedIdealResponseId
            );

            const response = await fetch("/api/model-evaluation", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                phase: "evaluate",
                testCase: evaluationPayload.testCase,
                criteria: evaluationPayload.criteria,
                outputs: evaluationPayload.modelOutputs,
                criteriaSheetName: selectedCriteriaId, // Include criteria sheet name
                idealResponse: selectedIdealResponse
                  ? {
                      id: selectedIdealResponse.id,
                      idealTestCase: selectedIdealResponse.testCaseInput,
                      testCaseInput: selectedIdealResponse.testCaseInput,
                    }
                  : null, // Include ideal response with test case
              }),
            });

            console.log(
              `📥 Received response for test case ${index + 1}:`,
              response.status
            );
            if (!response.ok) {
              const err = await response.json().catch(() => ({}));
              throw new Error(err.error || `HTTP ${response.status}`);
            }
            const data = await response.json();
            console.log(`✅ Evaluation data for test case ${index + 1}:`, {
              hasEvaluations: Array.isArray(data?.evaluations),
              evaluationsCount: data?.evaluations?.length || 0,
              responseData: data,
            });

            // Update progress for this test case evaluation
            const progress =
              ((index + 1) / testCasesWithOutputs.length) * 50 + 50; // 50-100% for evaluation
            handlers.handleEvaluationProgress(index, progress);

            return { testCaseIndex: index, data };
          }
        );

        console.log("⏳ Waiting for all evaluation promises to settle...");
        const settled = await Promise.allSettled(evaluationPromises);
        console.log(
          "📊 Evaluation promises settled:",
          settled.map((s, i) => ({ index: i, status: s.status }))
        );

        // Map API evaluations back to local structure
        const evaluationResults = testCasesWithOutputs.map((tc, idx) => {
          const res = settled[idx];
          let evaluatedOutputs = tc.modelOutputs;
          if (res.status === "fulfilled") {
            const payload = res.value.data;
            console.log(
              `📋 Processing evaluation result for test case ${idx + 1}:`,
              {
                hasEvaluations: Array.isArray(payload?.evaluations),
                evaluationsCount: payload?.evaluations?.length || 0,
              }
            );

            // If server returned rubric-like scores, attach to modelOutputs if possible
            if (payload?.evaluations && Array.isArray(payload.evaluations)) {
              evaluatedOutputs = tc.modelOutputs.map((mo) => {
                const match = payload.evaluations.find(
                  (e: any) => e.modelId === mo.modelId
                );
                if (match) {
                  console.log(
                    `✅ Found evaluation match for model ${mo.modelId}:`,
                    match
                  );
                }
                return {
                  ...mo,
                  rubricScores: match?.criteriaScores || mo.rubricScores || {},
                } as any;
              });
            }
          } else {
            console.log(
              `❌ Evaluation failed for test case ${idx + 1}:`,
              res.reason
            );
          }
          return {
            testCaseId: tc.id,
            modelOutputs: evaluatedOutputs,
            rubricEffectiveness: "medium" as const,
            refinementSuggestions: ["Evaluation completed"],
          };
        });

        console.log("✅ Real evaluation phase completed!");

        // Update progress to show evaluation completion
        handlers.handleEvaluationProgress(testCasesWithOutputs.length - 1, 100);

        // Set phase to complete after evaluation
        updateAnalysisViewState({ currentPhase: "complete" });

        handlers.handleModelComparisonEvaluationComplete(evaluationResults);
      } else {
        console.log("🎭 Starting mock evaluation...");
        // Mock evaluation: generate mock scores for demonstration
        const evaluationResults = testCasesWithOutputs.map((testCase) => ({
          testCaseId: testCase.id,
          modelOutputs: testCase.modelOutputs.map((output) => ({
            ...output,
            // Add mock rubric scores for demonstration
            rubricScores: {
              relevance: Math.floor(Math.random() * 3) + 1, // 1-3
              accuracy: Math.floor(Math.random() * 3) + 1, // 1-3
              completeness: Math.floor(Math.random() * 3) + 1, // 1-3
            },
          })),
          rubricEffectiveness: "medium" as const,
          refinementSuggestions: [
            "Mock evaluation - scores generated for demonstration",
          ],
        }));
        console.log("✅ Mock evaluation phase completed!");
        handlers.handleModelComparisonEvaluationComplete(evaluationResults);
      }

      console.log("🎯 Setting final states...");
      handlers.handleEvaluationProgress(testCases.length - 1, 100);
      console.log("🔄 Setting currentPhase to complete");
      updateGenerationState({ isGeneratingOutputs: false });
      updateAnalysisViewState((prev) => ({
        ...prev,
        currentPhase: "complete",
        hasStartedEvaluation: false,
        analysisStep: "complete",
      }));
    } catch (error) {
      console.error("❌ Error during evaluation phase:", error);
      handlers.handleEvaluationError(
        error instanceof Error
          ? error.message
          : "Unknown error during evaluation"
      );
      updateGenerationState({ isGeneratingOutputs: false });
      updateAnalysisViewState((prev) => ({
        ...prev,
        hasStartedEvaluation: false,
        currentPhase: "complete",
        analysisStep: "setup",
      }));
    }
  };

  const handleConfirmSelections = () => {
    console.log("✅ Confirm selections clicked");
    console.log("🔍 Current selections:", {
      useCaseName: TEST_CASE_CONFIG.name,
      testCasesCount: testCases.length,
      selectedTestCaseIndex,
      selectedScenarioCategory,
      selectedCriteriaId,
      selectedIdealResponseId,
    });

    // Check if we have current selections
    const isUseCaseSelected = Boolean(TEST_CASE_CONFIG.name);
    const hasLoadedTestCases = testCases.length > 0;
    const hasScenarioCategory = Boolean(selectedScenarioCategory);
    const hasCriteriaVersion = Boolean(selectedCriteriaId);
    const hasIdealResponse = Boolean(selectedIdealResponseId);

    if (
      !isUseCaseSelected ||
      !hasLoadedTestCases ||
      !hasScenarioCategory ||
      !hasCriteriaVersion ||
      !hasIdealResponse
    ) {
      console.log(
        "❌ Validation failed: missing one or more required selections"
      );
      setValidationError(
        "Please select a use case, scenario category, criteria version, and ideal response, and ensure test cases are loaded."
      );
      return;
    }

    console.log("✅ Validation passed, starting evaluation");
    setValidationError("");
    updateAnalysisViewState((prev) => ({
      ...prev,
      hasStartedEvaluation: true,
      isStep1Collapsed: true,
    }));
    handlers.handleStartEvaluation();
  };

  // Custom restart handler
  const handleRestart = () => {
    console.log("🔄 Restart requested - clearing all state");

    // Reset all state
    setTestCases([]);
    setTestCasesWithModelOutputs([]);
    updateGenerationState((prev) => ({
      ...prev,
      localTestCasesWithModelOutputs: [],
    }));
    setCriteria([]);
    setOutcomes([]);
    setOutcomesWithModelComparison([]);
    setIdealResponses([]);
    // setSelectedUseCaseId("");
    setSelectedScenarioCategory("");
    setSelectedCriteriaId("");
    setSelectedIdealResponseId("");
    setSelectedSystemPrompt("");
    setValidationError("");
    setShouldStartEvaluation(false);
    setEvaluationProgress(0);
    // setCurrentTestCaseIndex(0);
    setSelectedTestCaseIndex(0);

    // Reset analysis state
    updateAnalysisViewState((prev) => ({
      ...prev,
      analysisStep: "setup",
      hasStartedEvaluation: false,
      isStep1Collapsed: false,
      currentPhase: "generating",
    }));
    updateGenerationState((prev) => ({
      ...prev,
      isGeneratingOutputs: false,
      selectedOutputModelIds: [],
    }));

    // Clear current session ID and group ID
    updateSessionState((prev) => ({
      ...prev,
      currentSessionId: null,
      testCaseSessionIds: new Map(),
      currentGroupId: null,
    }));

    // Go back to first step
    setCurrentStep("sync");

    console.log("🔄 Refreshing page for clean state");
    // Refresh the page to ensure clean state
    if (
      typeof window !== "undefined" &&
      typeof window.location !== "undefined" &&
      typeof window.location.reload === "function"
    ) {
      window.location.reload();
    }
  };

  // Determine current analysis step based on data availability
  useEffect(() => {
    if (outcomesWithModelComparison.length > 0 && currentPhase === "complete") {
      updateAnalysisViewState({ analysisStep: "complete" });
    } else if (
      hasStartedEvaluation ||
      shouldStartEvaluation ||
      isGeneratingOutputs
    ) {
      updateAnalysisViewState({ analysisStep: "running" });
    } else {
      updateAnalysisViewState({ analysisStep: "setup" });
    }
  }, [
    outcomesWithModelComparison.length,
    hasStartedEvaluation,
    shouldStartEvaluation,
    isGeneratingOutputs,
    currentPhase,
  ]);

  // Effect to start model output generation when evaluation starts
  useEffect(() => {
    if (hasStartedEvaluation && !isGeneratingOutputs && testCases.length > 0) {
      console.log("🚀 Effect triggered: starting model output generation", {
        hasStartedEvaluation,
        isGeneratingOutputs,
        testCasesCount: testCases.length,
      });
      generateModelOutputs();
    }
  }, [hasStartedEvaluation, isGeneratingOutputs, testCases.length]);

  // Ensure we navigate to outcomes once results are available
  useEffect(() => {
    if (currentStep !== "outcomes") {
      if (outcomesWithModelComparison.length > 0 || outcomes.length > 0) {
        console.log("🔄 Navigating to outcomes step", {
          outcomesWithModelComparisonCount: outcomesWithModelComparison.length,
          outcomesCount: outcomes.length,
          currentStep,
        });
        setCurrentStep("outcomes");
        setShouldStartEvaluation(false);
      }
    }
  }, [
    currentStep,
    outcomesWithModelComparison.length,
    outcomes.length,
    setCurrentStep,
    setShouldStartEvaluation,
  ]);

  // UI logic (previously in UnifiedAnalysis component)
  const [hasCachedSelections, setHasCachedSelections] = useState(false);

  // Check for cached selections on client side only and restore them if no current selections
  useEffect(() => {
    const hasCache = selectionCache.hasCache();
    setHasCachedSelections(hasCache);
    console.log("🔍 Selection cache check:", {
      hasCache,
      testCasesCount: testCases.length,
    });

    // If there are cached selections but no current selections, restore them automatically
    if (hasCache && testCases.length === 0) {
      console.log("🔄 Restoring cached selections");
      const restored = selectionCache.restoreSelections();
      if (restored && restored.selections.length > 0) {
        console.log("✅ Cached selections restored:", restored);
        // Trigger the selection change handlers to restore the state
        if (handlers.handleMultiLevelSelectionChange) {
          handlers.handleMultiLevelSelectionChange(restored.selections);
        }
        // Restore criteria version selection if available
        if (restored.selectedCriteriaVersionId) {
          console.log(
            "✅ Cached criteria version restored:",
            restored.selectedCriteriaVersionId
          );
          setSelectedCriteriaId(restored.selectedCriteriaVersionId);
        }
      }
    }
  }, [testCases.length, handlers.handleMultiLevelSelectionChange]);

  // Only show confirm button when there are current selections with preview
  // Cached selections alone are not sufficient - user must make current selections
  const hasValidSelections = Boolean(
    TEST_CASE_CONFIG.name &&
      testCases.length > 0 &&
      selectedScenarioCategory &&
      selectedCriteriaId &&
      selectedIdealResponseId
  );

  // Create steps for the vertical stepper
  const steps = [
    {
      id: "setup",
      title: "Load Test Data",
      description: "Choose a set of test data to help examine your rubric.",
      status:
        analysisStep === "setup"
          ? ("current" as const)
          : analysisStep === "running" || analysisStep === "complete"
          ? ("completed" as const)
          : ("upcoming" as const),
      isCollapsed: isStep1Collapsed,
      content: (
        <SetupStep
          testCases={testCases}
          selectedTestCaseIndex={selectedTestCaseIndex}
          validationError={validationError}
          hasValidSelections={hasValidSelections}
          analysisStep={analysisStep}
          selectedCriteriaVersionId={selectedCriteriaId}
          selectedIdealResponseId={selectedIdealResponseId}
          onMultiLevelSelectionChange={handlers.handleMultiLevelSelectionChange}
          onUseCaseSelected={handlers.handleUseCaseSelected}
          onScenarioCategorySelected={handlers.handleScenarioCategorySelected}
          onUseCaseDataLoaded={handlers.handleUseCaseDataLoaded}
          onUseCaseError={handlers.handleUseCaseError}
          onTestCaseSelect={handlers.handleTestCaseSelect}
          onConfirmSelections={handleConfirmSelections}
          onCriteriaVersionSelected={setSelectedCriteriaId}
          onIdealResponseSelected={handlers.handleIdealResponseSelected}
          onIdealResponseDataLoaded={handlers.handleIdealResponseDataLoaded}
          onIdealResponseError={handlers.handleIdealResponseError}
        />
      ),
    },
    {
      id: "analysis",
      title: "Test the Rubric",
      description: "Review possible responses to the selected test cases.",
      status:
        analysisStep === "running"
          ? ("current" as const)
          : analysisStep === "complete"
          ? ("completed" as const)
          : ("upcoming" as const),
      isCollapsed: false, // Never collapse step 2
      content: (
        <AnalysisStep
          testCases={testCases}
          testCasesWithModelOutputs={testCasesWithModelOutputs}
          selectedTestCaseIndex={selectedTestCaseIndex}
          selectedSystemPrompt={selectedSystemPrompt}
          analysisStep={analysisStep}
          currentPhase={currentPhase}
          shouldStartEvaluation={shouldStartEvaluation}
          showEvaluationFeatures={showEvaluationFeatures}
          isRealEvaluation={isRealEvaluation}
          numOutputsToShow={numOutputsToShow}
          onTestCaseSelect={handlers.handleTestCaseSelect}
          onModelComparisonEvaluationComplete={
            handlers.handleModelComparisonEvaluationComplete
          }
          onEvaluationError={handlers.handleEvaluationError}
          onEvaluationProgress={handlers.handleEvaluationProgress}
          loadingModelListOverride={selectedOutputModelIds}
          sessionId={testCaseSessionIds.get(selectedTestCaseIndex) || null}
          onCompareClick={() => updateAnalysisViewState({ hasComparedWithAi: true })}
          idealResponses={idealResponses}
          streamingOutputs={streamingOutputs}
          isStreaming={isStreaming}
          streamingErrors={streamingErrors}
          selectedCriteriaId={selectedCriteriaId}
          selectedIdealResponseId={selectedIdealResponseId}
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AnalysisHeaderFull
        sessionId={null}
        currentSessionId={currentSessionId}
        isGeneratingOutputs={isGeneratingOutputs}
        groupId={currentGroupId}
        onEditGroupId={() => {
          if (isHydrated) {
            updateSessionState({ showGroupIdModal: true });
          }
        }}
        onClearGroupId={clearGroupId}
        shareableLink={shareableLink}
      />

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <div className="space-y-6">
          {/* Vertical Stepper */}
          <VerticalStepper steps={steps} />

          {/* Footer action after completion */}
          {analysisStep === "complete" && (
            <div className="flex justify-center mb-8">
              <button
                onClick={handleRestart}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                <RefreshIcon className="w-5 h-5" />
                Start Over
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Group ID Modal */}
      <GroupIdModal
        visible={showGroupIdModal}
        onConfirm={handleGroupIdConfirm}
        onCancel={handleGroupIdCancel}
        loading={false}
      />
    </div>
  );
}
