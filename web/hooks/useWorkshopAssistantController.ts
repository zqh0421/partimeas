import { useCallback, useEffect, useState } from "react";
import { useAnalysisState } from "@/hooks/useAnalysisState";
import { useAnalysisHandlers } from "@/hooks/useAnalysisHandlers";
import { useConfig } from "@/hooks/useConfig";
import useStreamingGeneration from "@/hooks/useStreamingGeneration";
import { TestCaseWithModelOutputs, ModelOutput } from "@/types";
import { Assistant } from "@/types/admin";
import {
  runEvaluationWorkflow,
  runGenerationWorkflow,
} from "@/hooks/workshop-assistant/workflows";
import { selectionCache } from "@/utils/selectionCache";
import { TEST_CASE_CONFIG } from "@/config/useCases";

type StateUpdate<T> = Partial<T> | ((prev: T) => T);

type SessionState = {
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
};

type GenerationState = {
  isGeneratingOutputs: boolean;
  selectedOutputModelIds: string[];
  isRealEvaluation: boolean;
  isUsingStreaming: boolean;
};

export function useWorkshopAssistantController() {
  // 1) Shared domain state from analysis hooks
  const {
    ui,
    data,
    evaluation,
    selection,
    useCase: { updateSystemPromptForUseCase },
  } = useAnalysisState();

  const {
    currentStep,
    setCurrentStep,
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
    setEvaluationProgress,
  } = evaluation;

  // 2) Local UI/session state for workshop assistant flow
  const [sessionState, setSessionState] = useState<SessionState>({
    testCaseSessionIds: new Map(),
    currentGroupId: null,
    showGroupIdModal: false,
    isHydrated: false,
  });

  const updateSessionState = useCallback(
    (updates: StateUpdate<SessionState>) =>
      setSessionState((prev) =>
        typeof updates === "function" ? updates(prev) : { ...prev, ...updates },
      ),
    [],
  );

  const { testCaseSessionIds, currentGroupId, showGroupIdModal, isHydrated } =
    sessionState;

  const [analysisViewState, setAnalysisViewState] = useState<AnalysisViewState>(
    {
      analysisStep: "setup",
      hasStartedEvaluation: false,
      isStep1Collapsed: false,
      currentPhase: "generating",
      showEvaluationFeatures: true,
    },
  );

  const updateAnalysisViewState = useCallback(
    (updates: StateUpdate<AnalysisViewState>) =>
      setAnalysisViewState((prev) =>
        typeof updates === "function" ? updates(prev) : { ...prev, ...updates },
      ),
    [],
  );

  const {
    analysisStep,
    hasStartedEvaluation,
    isStep1Collapsed,
    currentPhase,
    showEvaluationFeatures,
  } = analysisViewState;

  const [generationState, setGenerationState] = useState<GenerationState>({
    isGeneratingOutputs: false,
    selectedOutputModelIds: [],
    isRealEvaluation: false,
    isUsingStreaming: false,
  });

  const updateGenerationState = useCallback(
    (updates: StateUpdate<GenerationState>) =>
      setGenerationState((prev) =>
        typeof updates === "function" ? updates(prev) : { ...prev, ...updates },
      ),
    [],
  );

  const {
    isGeneratingOutputs,
    selectedOutputModelIds,
    isRealEvaluation,
    isUsingStreaming,
  } = generationState;

  // 3) Streaming API state
  const {
    modelOutputs: streamingOutputs,
    errors: streamingErrors,
    isStreaming,
    isComplete: isStreamingComplete,
    sessionId: streamingSessionId,
    startStreaming,
    resetStream,
  } = useStreamingGeneration();

  const shareableLink = streamingSessionId
    ? `${
        typeof window !== "undefined" ? window.location.origin : ""
      }/workshop-assistant/session/${streamingSessionId}`
    : null;

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
      rubricStructure: undefined,
      updateSystemPromptForUseCase,
    },
  });

  const startEvaluationPhase = useCallback(
    async (testCasesWithOutputs: TestCaseWithModelOutputs[]) => {
      try {
        if (isRealEvaluation) {
          updateAnalysisViewState({ currentPhase: "evaluating" });
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        await runEvaluationWorkflow({
          testCasesWithOutputs,
          isRealEvaluation,
          idealResponses,
          selectedIdealResponseId,
          selectedCriteriaId,
          totalTestCases: testCases.length,
          onProgress: handlers.handleEvaluationProgress,
          onComplete: handlers.handleModelComparisonEvaluationComplete,
        });

        updateAnalysisViewState({ currentPhase: "complete" });
        updateGenerationState({ isGeneratingOutputs: false });
        updateAnalysisViewState((prev) => ({
          ...prev,
          currentPhase: "complete",
          hasStartedEvaluation: false,
          analysisStep: "complete",
        }));
      } catch (error) {
        handlers.handleEvaluationError(
          error instanceof Error
            ? error.message
            : "Unknown error during evaluation",
        );
        updateGenerationState({ isGeneratingOutputs: false });
        updateAnalysisViewState((prev) => ({
          ...prev,
          hasStartedEvaluation: false,
          currentPhase: "complete",
          analysisStep: "setup",
        }));
      }
    },
    [
      handlers,
      idealResponses,
      isRealEvaluation,
      selectedCriteriaId,
      selectedIdealResponseId,
      testCases.length,
      updateAnalysisViewState,
      updateGenerationState,
    ],
  );

  const generateModelOutputs = useCallback(async () => {
    updateGenerationState({ isGeneratingOutputs: true });
    updateAnalysisViewState({ currentPhase: "generating" });
    updateGenerationState({ selectedOutputModelIds: [] });

    try {
      await runGenerationWorkflow({
        testCase: testCases[0],
        currentGroupId,
        idealResponses,
        selectedIdealResponseId,
        selectedCriteriaId,
        resetStream,
        startStreaming,
        setLoadingModelIds: (ids) =>
          updateGenerationState({ selectedOutputModelIds: ids }),
        onUsingStreamingChange: (isUsingStreaming) =>
          updateGenerationState({ isUsingStreaming }),
      });
    } catch (error) {
      handlers.handleEvaluationError(
        error instanceof Error
          ? error.message
          : "Unknown error during generation",
      );
      updateGenerationState({ isGeneratingOutputs: false });
      updateAnalysisViewState((prev) => ({
        ...prev,
        hasStartedEvaluation: false,
        currentPhase: "complete",
        analysisStep: "setup",
      }));
    }
  }, [
    currentGroupId,
    handlers,
    idealResponses,
    resetStream,
    selectedCriteriaId,
    selectedIdealResponseId,
    startStreaming,
    testCases,
    updateAnalysisViewState,
    updateGenerationState,
  ]);

  useEffect(() => {
    if (
      isUsingStreaming &&
      isStreamingComplete &&
      streamingOutputs.length > 0 &&
      testCases.length > 0
    ) {
      const modelOutputsFromStream: ModelOutput[] = streamingOutputs.map(
        (output) => ({
          modelId: output.modelId,
          modelName: output.modelId,
          output: output.output,
          rubricScores: {},
          feedback: "",
          suggestions: [],
          timestamp: new Date().toISOString(),
        }),
      );

      const updatedTestCase: TestCaseWithModelOutputs = {
        ...testCases[0],
        modelOutputs: modelOutputsFromStream,
        sessionId: streamingSessionId || undefined,
      };

      if (streamingSessionId) {
        updateSessionState((prev) => {
          const nextMap = new Map(prev.testCaseSessionIds);
          nextMap.set(0, streamingSessionId);
          return { ...prev, testCaseSessionIds: nextMap };
        });
      }

      setTestCasesWithModelOutputs([updatedTestCase]);
      updateAnalysisViewState({ currentPhase: "evaluating" });
      startEvaluationPhase([updatedTestCase]);
      updateGenerationState({ isUsingStreaming: false });
    }
  }, [
    isStreamingComplete,
    isUsingStreaming,
    setTestCasesWithModelOutputs,
    startEvaluationPhase,
    streamingOutputs,
    streamingSessionId,
    testCases,
    updateAnalysisViewState,
    updateGenerationState,
    updateSessionState,
  ]);

  const config = useConfig();
  const { numOutputsToShow, enableGroupIdCollection } = config;

  // 4) Boot-time effects
  useEffect(() => {
    updateSessionState((prev) => ({ ...prev, isHydrated: true }));
    const savedGroupId = localStorage.getItem("partimeas_group_id");
    if (savedGroupId) {
      updateSessionState((prev) => ({ ...prev, currentGroupId: savedGroupId }));
    }
  }, [updateSessionState]);

  useEffect(() => {
    const fetchActiveEvaluator = async () => {
      try {
        const res = await fetch("/api/admin/assistants?type=evaluation");
        if (!res.ok) {
          throw new Error("Failed to load assistants");
        }
        const payload = await res.json();
        const active = (payload.assistants || []).find(
          (a: Assistant) => a.required_to_show,
        );
        updateAnalysisViewState({ showEvaluationFeatures: true });
        updateGenerationState({ isRealEvaluation: Boolean(active) });
      } catch {
        updateAnalysisViewState({ showEvaluationFeatures: true });
        updateGenerationState({ isRealEvaluation: false });
      }
    };

    fetchActiveEvaluator();
  }, [updateAnalysisViewState, updateGenerationState]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }
    if (enableGroupIdCollection && !currentGroupId && !showGroupIdModal) {
      updateSessionState({ showGroupIdModal: true });
    }
  }, [
    currentGroupId,
    enableGroupIdCollection,
    isHydrated,
    showGroupIdModal,
    updateSessionState,
  ]);

  // 5) User actions
  const handleGroupIdConfirm = useCallback(
    (groupId: string) => {
      updateSessionState((prev) => ({
        ...prev,
        currentGroupId: groupId,
        showGroupIdModal: false,
      }));

      if (typeof window !== "undefined") {
        localStorage.setItem("partimeas_group_id", groupId);
      }
    },
    [updateSessionState],
  );

  const handleGroupIdCancel = useCallback(() => {
    setCurrentStep("sync");
    if (typeof window !== "undefined") {
      localStorage.removeItem("partimeas_group_id");
    }
    updateSessionState((prev) => ({
      ...prev,
      showGroupIdModal: false,
      currentGroupId: null,
    }));
  }, [setCurrentStep, updateSessionState]);

  const clearGroupId = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("partimeas_group_id");
    }
    updateSessionState((prev) => ({
      ...prev,
      currentGroupId: null,
      showGroupIdModal: isHydrated ? true : prev.showGroupIdModal,
    }));
  }, [isHydrated, updateSessionState]);

  const openGroupIdModal = useCallback(() => {
    if (isHydrated) {
      updateSessionState({ showGroupIdModal: true });
    }
  }, [isHydrated, updateSessionState]);

  const handleConfirmSelections = useCallback(() => {
    const hasValidSelection = Boolean(
      TEST_CASE_CONFIG.name &&
        testCases.length > 0 &&
        selectedScenarioCategory &&
        selectedCriteriaId &&
        selectedIdealResponseId,
    );

    if (!hasValidSelection) {
      setValidationError(
        "Please select a use case, scenario category, criteria version, and ideal response, and ensure test cases are loaded.",
      );
      return;
    }

    setValidationError("");
    updateAnalysisViewState((prev) => ({
      ...prev,
      hasStartedEvaluation: true,
      isStep1Collapsed: true,
    }));
    handlers.handleStartEvaluation();
  }, [
    handlers,
    selectedCriteriaId,
    selectedIdealResponseId,
    selectedScenarioCategory,
    setValidationError,
    testCases.length,
    updateAnalysisViewState,
  ]);

  const handleRestart = useCallback(() => {
    setTestCases([]);
    setTestCasesWithModelOutputs([]);
    setCriteria([]);
    setOutcomes([]);
    setOutcomesWithModelComparison([]);
    setIdealResponses([]);
    setSelectedScenarioCategory("");
    setSelectedCriteriaId("");
    setSelectedIdealResponseId("");
    setSelectedSystemPrompt("");
    setValidationError("");
    setShouldStartEvaluation(false);
    setEvaluationProgress(0);
    setSelectedTestCaseIndex(0);

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

    updateSessionState((prev) => ({
      ...prev,
      testCaseSessionIds: new Map(),
      currentGroupId: null,
    }));

    setCurrentStep("sync");

    if (
      typeof window !== "undefined" &&
      typeof window.location !== "undefined" &&
      typeof window.location.reload === "function"
    ) {
      window.location.reload();
    }
  }, [
    setCriteria,
    setCurrentStep,
    setEvaluationProgress,
    setIdealResponses,
    setOutcomes,
    setOutcomesWithModelComparison,
    setSelectedCriteriaId,
    setSelectedIdealResponseId,
    setSelectedScenarioCategory,
    setSelectedSystemPrompt,
    setSelectedTestCaseIndex,
    setShouldStartEvaluation,
    setTestCases,
    setTestCasesWithModelOutputs,
    setValidationError,
    updateAnalysisViewState,
    updateGenerationState,
    updateSessionState,
  ]);

  // 6) Derived flow effects
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
    currentPhase,
    hasStartedEvaluation,
    isGeneratingOutputs,
    outcomesWithModelComparison.length,
    shouldStartEvaluation,
    updateAnalysisViewState,
  ]);

  useEffect(() => {
    if (hasStartedEvaluation && !isGeneratingOutputs && testCases.length > 0) {
      generateModelOutputs();
    }
  }, [
    generateModelOutputs,
    hasStartedEvaluation,
    isGeneratingOutputs,
    testCases.length,
  ]);

  useEffect(() => {
    if (currentStep !== "outcomes") {
      if (outcomesWithModelComparison.length > 0 || outcomes.length > 0) {
        setCurrentStep("outcomes");
        setShouldStartEvaluation(false);
      }
    }
  }, [
    currentStep,
    outcomes.length,
    outcomesWithModelComparison.length,
    setCurrentStep,
    setShouldStartEvaluation,
  ]);

  useEffect(() => {
    const hasCache = selectionCache.hasCache();
    if (hasCache && testCases.length === 0) {
      const restored = selectionCache.restoreSelections();
      if (restored && restored.selections.length > 0) {
        if (handlers.handleMultiLevelSelectionChange) {
          handlers.handleMultiLevelSelectionChange(restored.selections);
        }
        if (restored.selectedCriteriaVersionId) {
          setSelectedCriteriaId(restored.selectedCriteriaVersionId);
        }
      }
    }
  }, [
    handlers,
    setSelectedCriteriaId,
    testCases.length,
    handlers.handleMultiLevelSelectionChange,
  ]);

  // 7) Derived view-model + grouped actions API
  const hasValidSelections = Boolean(
    TEST_CASE_CONFIG.name &&
      testCases.length > 0 &&
      selectedScenarioCategory &&
      selectedCriteriaId &&
      selectedIdealResponseId,
  );

  const state = {
    ui: {
      validationError,
      currentStep,
      analysisStep,
      currentPhase,
      shouldStartEvaluation,
      showEvaluationFeatures,
      isStep1Collapsed,
      isGeneratingOutputs,
      isRealEvaluation,
      showGroupIdModal,
      isHydrated,
    },
    data: {
      testCases,
      testCasesWithModelOutputs,
      idealResponses,
      selectedOutputModelIds,
      testCaseSessionIds,
      streamingOutputs,
      streamingErrors,
      isStreaming,
      numOutputsToShow,
      shareableLink,
    },
    selection: {
      selectedTestCaseIndex,
      selectedCriteriaId,
      selectedIdealResponseId,
      selectedSystemPrompt,
      currentGroupId,
    },
    derived: {
      hasValidSelections,
    },
  };

  const actions = {
    flow: {
      confirmSelections: handleConfirmSelections,
      restart: handleRestart,
    },
    groupId: {
      confirm: handleGroupIdConfirm,
      cancel: handleGroupIdCancel,
      clear: clearGroupId,
      openModal: openGroupIdModal,
    },
    selection: {
      setSelectedCriteriaId,
    },
    handlers,
  };

  return {
    state,
    actions,
    handlers,
    testCases,
    testCasesWithModelOutputs,
    idealResponses,
    validationError,
    currentStep,
    selectedTestCaseIndex,
    selectedCriteriaId,
    selectedIdealResponseId,
    selectedSystemPrompt,
    analysisStep,
    currentPhase,
    shouldStartEvaluation,
    showEvaluationFeatures,
    isRealEvaluation,
    isGeneratingOutputs,
    selectedOutputModelIds,
    testCaseSessionIds,
    streamingOutputs,
    streamingErrors,
    isStreaming,
    numOutputsToShow,
    showGroupIdModal,
    currentGroupId,
    isHydrated,
    shareableLink,
    isStep1Collapsed,
    hasValidSelections,
    handleConfirmSelections,
    handleRestart,
    handleGroupIdConfirm,
    handleGroupIdCancel,
    clearGroupId,
    openGroupIdModal,
    setSelectedCriteriaId,
  };
}
