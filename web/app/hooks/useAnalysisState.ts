import { useState, useEffect, useMemo, useCallback } from 'react';
import { TestCase, RubricOutcome, CriteriaData, AnalysisStep, TestCaseWithModelOutputs, RubricOutcomeWithModelComparison } from '@/app/types';

// Types for better organization
interface UIState {
  currentStep: AnalysisStep;
  isLoading: boolean;
  isTestCasesSummaryOpen: boolean;
  validationError: string;
}

interface DataState {
  testCases: TestCase[];
  testCasesWithModelOutputs: TestCaseWithModelOutputs[];
  criteria: CriteriaData[];
  outcomes: RubricOutcome[];
  outcomesWithModelComparison: RubricOutcomeWithModelComparison[];
}

interface EvaluationState {
  shouldStartEvaluation: boolean;
  evaluationProgress: number;
  currentTestCaseIndex: number;
}

interface SelectionState {
  selectedTestCaseIndex: number;
  selectedScenarioCategory: string;
  selectedCriteriaId: string;
  selectedCriteriaVersionId: string;
  selectedSystemPrompt: string;
}

// Hook return type for better type safety
export interface UseAnalysisStateReturn {
  ui: UIState & {
    update: (updates: Partial<UIState>) => void;
    setCurrentStep: (step: AnalysisStep) => void;
    setIsLoading: (isLoading: boolean) => void;
    setIsTestCasesSummaryOpen: (isOpen: boolean) => void;
    setValidationError: (error: string) => void;
  };
  data: DataState & {
    update: (updates: Partial<DataState>) => void;
    setTestCases: (testCases: TestCase[]) => void;
    setTestCasesWithModelOutputs: (testCasesWithModelOutputs: TestCaseWithModelOutputs[]) => void;
    setCriteria: (criteria: CriteriaData[]) => void;
    setOutcomes: (outcomes: RubricOutcome[]) => void;
    setOutcomesWithModelComparison: (outcomesWithModelComparison: RubricOutcomeWithModelComparison[]) => void;
  };
  evaluation: EvaluationState & {
    update: (updates: Partial<EvaluationState>) => void;
    setShouldStartEvaluation: (shouldStart: boolean) => void;
    setEvaluationProgress: (progress: number) => void;
    setCurrentTestCaseIndex: (index: number) => void;
  };
  selection: SelectionState & {
    update: (updates: Partial<SelectionState>) => void;
    setSelectedTestCaseIndex: (index: number) => void;
    setSelectedScenarioCategory: (category: string) => void;
    setSelectedCriteriaId: (id: string) => void;
    setSelectedCriteriaVersionId: (id: string) => void;
    setSelectedSystemPrompt: (prompt: string) => void;
  };
  useCase: {
    updateSystemPromptForUseCase: (testCases: TestCase[]) => void;
  };
  // Legacy support
  currentStep: AnalysisStep;
  setCurrentStep: (step: AnalysisStep) => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  validationError: string;
  setValidationError: (error: string) => void;
  
  // Data state legacy support
  testCases: TestCase[];
  setTestCases: (testCases: TestCase[]) => void;
  testCasesWithModelOutputs: TestCaseWithModelOutputs[];
  setTestCasesWithModelOutputs: (testCasesWithModelOutputs: TestCaseWithModelOutputs[]) => void;
  criteria: CriteriaData[];
  setCriteria: (criteria: CriteriaData[]) => void;
  outcomes: RubricOutcome[];
  setOutcomes: (outcomes: RubricOutcome[]) => void;
  outcomesWithModelComparison: RubricOutcomeWithModelComparison[];
  setOutcomesWithModelComparison: (outcomesWithModelComparison: RubricOutcomeWithModelComparison[]) => void;
  
  // Selection state legacy support
  selectedTestCaseIndex: number;
  setSelectedTestCaseIndex: (index: number) => void;
  selectedScenarioCategory: string;
  setSelectedScenarioCategory: (category: string) => void;
  selectedCriteriaId: string;
  setSelectedCriteriaId: (id: string) => void;
  selectedCriteriaVersionId: string;
  setSelectedCriteriaVersionId: (id: string) => void;
  selectedSystemPrompt: string;
  setSelectedSystemPrompt: (prompt: string) => void;
  
  // Evaluation state legacy support
  shouldStartEvaluation: boolean;
  setShouldStartEvaluation: (shouldStart: boolean) => void;
  evaluationProgress: number;
  setEvaluationProgress: (progress: number) => void;
  
  // Use case functions
  updateSystemPromptForUseCase: (testCases: TestCase[]) => void;
}

export function useAnalysisState(): UseAnalysisStateReturn {
  // Grouped state for better organization
  const [uiState, setUIState] = useState<UIState>({
    currentStep: 'sync',
    isLoading: false,
    isTestCasesSummaryOpen: false,
    validationError: '',
  });

  const [dataState, setDataState] = useState<DataState>({
    testCases: [],
    testCasesWithModelOutputs: [],
    criteria: [],
    outcomes: [],
    outcomesWithModelComparison: [],
  });

  const [evaluationState, setEvaluationState] = useState<EvaluationState>({
    shouldStartEvaluation: false,
    evaluationProgress: 0,
    currentTestCaseIndex: 0,
  });

  const [selectionState, setSelectionState] = useState<SelectionState>({
    selectedTestCaseIndex: 0,
    selectedScenarioCategory: '',
    selectedCriteriaId: '',
    selectedCriteriaVersionId: '',
    selectedSystemPrompt: ''
  });

  // Helper functions for state updates
  const updateUIState = useCallback((updates: Partial<UIState>) => {
    setUIState(prev => ({ ...prev, ...updates }));
  }, []);
  
  const updateDataState = useCallback((updates: Partial<DataState>) => {
    setDataState(prev => ({ ...prev, ...updates }));
  }, []);
  
  const updateEvaluationState = useCallback((updates: Partial<EvaluationState>) => {
    setEvaluationState(prev => ({ ...prev, ...updates }));
  }, []);
  
  const updateSelectionState = useCallback((updates: Partial<SelectionState>) => {
    setSelectionState(prev => ({ ...prev, ...updates }));
  }, []);

  // Stable setter functions to avoid recreating identities on every state change
  // UI setters
  const setUICurrentStep = useCallback((step: AnalysisStep) => updateUIState({ currentStep: step }), [updateUIState]);
  const setUIIsLoading = useCallback((isLoading: boolean) => updateUIState({ isLoading }), [updateUIState]);
  const setUIIsTestCasesSummaryOpen = useCallback((isOpen: boolean) => updateUIState({ isTestCasesSummaryOpen: isOpen }), [updateUIState]);
  const setUIValidationError = useCallback((error: string) => updateUIState({ validationError: error }), [updateUIState]);

  // Data setters
  const setDataTestCases = useCallback((testCases: TestCase[]) => updateDataState({ testCases }), [updateDataState]);
  const setDataTestCasesWithModelOutputs = useCallback((v: TestCaseWithModelOutputs[]) => updateDataState({ testCasesWithModelOutputs: v }), [updateDataState]);
  const setDataCriteria = useCallback((criteria: CriteriaData[]) => updateDataState({ criteria }), [updateDataState]);
  const setDataOutcomes = useCallback((outcomes: RubricOutcome[]) => updateDataState({ outcomes }), [updateDataState]);
  const setDataOutcomesWithModelComparison = useCallback((v: RubricOutcomeWithModelComparison[]) => updateDataState({ outcomesWithModelComparison: v }), [updateDataState]);

  // Evaluation setters
  const setEvalShouldStart = useCallback((shouldStart: boolean) => updateEvaluationState({ shouldStartEvaluation: shouldStart }), [updateEvaluationState]);
  const setEvalProgress = useCallback((progress: number) => updateEvaluationState({ evaluationProgress: progress }), [updateEvaluationState]);
  const setEvalCurrentIndex = useCallback((index: number) => updateEvaluationState({ currentTestCaseIndex: index }), [updateEvaluationState]);

  // Selection setters
  const setSelSelectedTestCaseIndex = useCallback((index: number) => updateSelectionState({ selectedTestCaseIndex: index }), [updateSelectionState]);
  const setSelSelectedScenarioCategory = useCallback((category: string) => updateSelectionState({ selectedScenarioCategory: category }), [updateSelectionState]);
  const setSelSelectedCriteriaId = useCallback((id: string) => updateSelectionState({ selectedCriteriaId: id }), [updateSelectionState]);
  const setSelSelectedCriteriaVersionId = useCallback((id: string) => updateSelectionState({ selectedCriteriaVersionId: id }), [updateSelectionState]);
  const setSelSelectedSystemPrompt = useCallback((prompt: string) => updateSelectionState({ selectedSystemPrompt: prompt }), [updateSelectionState]);
  
  const updateSystemPromptForUseCase = useCallback((testCases: TestCase[]) => {
  }, [setSelectionState]);
  

  // Organized return object

  const uiApi = useMemo(() => ({
    ...uiState,
    update: updateUIState,
    setCurrentStep: setUICurrentStep,
    setIsLoading: setUIIsLoading,
    setIsTestCasesSummaryOpen: setUIIsTestCasesSummaryOpen,
    setValidationError: setUIValidationError,
  }), [uiState, updateUIState, setUICurrentStep, setUIIsLoading, setUIIsTestCasesSummaryOpen, setUIValidationError]);
  
  const dataApi = useMemo(() => ({
    ...dataState,
    update: updateDataState,
    setTestCases: setDataTestCases,
    setTestCasesWithModelOutputs: setDataTestCasesWithModelOutputs,
    setCriteria: setDataCriteria,
    setOutcomes: setDataOutcomes,
    setOutcomesWithModelComparison: setDataOutcomesWithModelComparison,
  }), [dataState, updateDataState, setDataTestCases, setDataTestCasesWithModelOutputs, setDataCriteria, setDataOutcomes, setDataOutcomesWithModelComparison]);
  
  const evaluationApi = useMemo(() => ({
    ...evaluationState,
    update: updateEvaluationState,
    setShouldStartEvaluation: setEvalShouldStart,
    setEvaluationProgress: setEvalProgress,
    setCurrentTestCaseIndex: setEvalCurrentIndex,
  }), [evaluationState, updateEvaluationState, setEvalShouldStart, setEvalProgress, setEvalCurrentIndex]);
  
  const selectionApi = useMemo(() => ({
    ...selectionState,
    update: updateSelectionState,
    setSelectedTestCaseIndex: setSelSelectedTestCaseIndex,
    setSelectedScenarioCategory: setSelSelectedScenarioCategory,
    setSelectedCriteriaId: setSelSelectedCriteriaId,
    setSelectedCriteriaVersionId: setSelSelectedCriteriaVersionId,
    setSelectedSystemPrompt: setSelSelectedSystemPrompt,
  }), [selectionState, updateSelectionState, setSelSelectedTestCaseIndex, setSelSelectedScenarioCategory, setSelSelectedCriteriaId, setSelSelectedCriteriaVersionId, setSelSelectedSystemPrompt]);

  
  const api = useMemo(() => ({
    ui: uiApi,
    data: dataApi,
    evaluation: evaluationApi,
    selection: selectionApi,
    useCase: { updateSystemPromptForUseCase },
    currentStep: uiState.currentStep,
    setCurrentStep: setUICurrentStep,
    isLoading: uiState.isLoading,
    setIsLoading: setUIIsLoading,
    validationError: uiState.validationError,
    setValidationError: setUIValidationError,

    // ===== Legacy: Data =====
    testCases: dataState.testCases,
    setTestCases: setDataTestCases,
    testCasesWithModelOutputs: dataState.testCasesWithModelOutputs,
    setTestCasesWithModelOutputs: setDataTestCasesWithModelOutputs,
    criteria: dataState.criteria,
    setCriteria: setDataCriteria,
    outcomes: dataState.outcomes,
    setOutcomes: setDataOutcomes,
    outcomesWithModelComparison: dataState.outcomesWithModelComparison,
    setOutcomesWithModelComparison: setDataOutcomesWithModelComparison,

    // ===== Legacy: Selection =====
    selectedTestCaseIndex: selectionState.selectedTestCaseIndex,
    setSelectedTestCaseIndex: setSelSelectedTestCaseIndex,
    selectedScenarioCategory: selectionState.selectedScenarioCategory,
    setSelectedScenarioCategory: setSelSelectedScenarioCategory,
    selectedCriteriaId: selectionState.selectedCriteriaId,
    setSelectedCriteriaId: setSelSelectedCriteriaId,
    selectedCriteriaVersionId: selectionState.selectedCriteriaVersionId,
    setSelectedCriteriaVersionId: setSelSelectedCriteriaVersionId,
    selectedSystemPrompt: selectionState.selectedSystemPrompt,
    setSelectedSystemPrompt: setSelSelectedSystemPrompt,

    // ===== Legacy: Evaluation =====
    shouldStartEvaluation: evaluationState.shouldStartEvaluation,
    setShouldStartEvaluation: setEvalShouldStart,
    evaluationProgress: evaluationState.evaluationProgress,
    setEvaluationProgress: setEvalProgress,
    currentTestCaseIndex: evaluationState.currentTestCaseIndex,
    setCurrentTestCaseIndex: setEvalCurrentIndex,

    // ===== Legacy: Use case =====
    updateSystemPromptForUseCase,
  }), [uiApi, dataApi, evaluationApi, selectionApi, updateSystemPromptForUseCase, uiState, setUICurrentStep, setUIIsLoading, setUIValidationError, setDataTestCases, setDataTestCasesWithModelOutputs, setDataCriteria, setDataOutcomes, setDataOutcomesWithModelComparison, setSelSelectedTestCaseIndex, setSelSelectedScenarioCategory, setSelSelectedCriteriaId, setSelSelectedCriteriaVersionId, setSelSelectedSystemPrompt, setEvalShouldStart, setEvalProgress, setEvalCurrentIndex]);
  return api;
} 