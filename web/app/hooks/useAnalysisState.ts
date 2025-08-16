import { useState, useEffect, useMemo, useCallback } from 'react';
import { TestCase, RubricOutcome, CriteriaData, AnalysisStep, TestCaseWithModelOutputs, RubricOutcomeWithModelComparison } from '@/app/types';
import { USE_CASE_PROMPTS } from '@/app/api/shared/constants';

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
  selectedUseCaseId: string;
  selectedScenarioCategory: string;
  selectedCriteriaId: string;
  selectedSystemPrompt: string;
  currentUseCaseType: string;
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
    setSelectedUseCaseId: (id: string) => void;
    setSelectedScenarioCategory: (category: string) => void;
    setSelectedCriteriaId: (id: string) => void;
    setSelectedSystemPrompt: (prompt: string) => void;
    setCurrentUseCaseType: (type: string) => void;
  };
  useCase: {
    updateSystemPromptForUseCase: (testCases: TestCase[]) => void;
    determineUseCase: (testCases: TestCase[]) => string;
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
  selectedUseCaseId: string;
  setSelectedUseCaseId: (id: string) => void;
  selectedScenarioCategory: string;
  setSelectedScenarioCategory: (category: string) => void;
  selectedCriteriaId: string;
  setSelectedCriteriaId: (id: string) => void;
  selectedSystemPrompt: string;
  setSelectedSystemPrompt: (prompt: string) => void;
  currentUseCaseType: string;
  setCurrentUseCaseType: (type: string) => void;
  
  // Evaluation state legacy support
  shouldStartEvaluation: boolean;
  setShouldStartEvaluation: (shouldStart: boolean) => void;
  evaluationProgress: number;
  setEvaluationProgress: (progress: number) => void;
  currentTestCaseIndex: number;
  setCurrentTestCaseIndex: (index: number) => void;
  
  // Use case functions
  updateSystemPromptForUseCase: (testCases: TestCase[]) => void;
}

export function useAnalysisState(useCaseType: string = Object.keys(USE_CASE_PROMPTS)[0] || 'original_system123_instructions'): UseAnalysisStateReturn {
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
    selectedUseCaseId: '',
    selectedScenarioCategory: '',
    selectedCriteriaId: '',
    selectedSystemPrompt: '',
    currentUseCaseType: useCaseType,
  });

  // Memoized use case configuration - uses shared constants
  const useCaseConfig = useMemo(() => {
    // Use exact matching based on USE_CASE_PROMPTS keys from shared constants
    return { 
      USE_CASE_PROMPTS, 
      USE_CASE_TYPES: Object.keys(USE_CASE_PROMPTS),
      DEFAULT_USE_CASE: Object.keys(USE_CASE_PROMPTS)[0] || 'original_system123_instructions'
    };
  }, []);

  // Optimized use case detection with exact matching
  const determineUseCase = useMemo(() => {
    return (testCases: TestCase[]): string => {
      if (!testCases?.length) return useCaseConfig.DEFAULT_USE_CASE;
      
      const firstTestCase = testCases[0];
      
      // Check for exact useCase match first
      if (firstTestCase.useCase) {
        const useCaseValue = firstTestCase.useCase.toLowerCase().trim();
        if (useCaseConfig.USE_CASE_TYPES.includes(useCaseValue)) {
          return useCaseValue;
        }
      }
      
      // Check for exact match in use_case_title if available
      if (firstTestCase.use_case_title) {
        const titleValue = firstTestCase.use_case_title.toLowerCase().trim();
        if (useCaseConfig.USE_CASE_TYPES.includes(titleValue)) {
          return titleValue;
        }
      }
      
      return useCaseConfig.DEFAULT_USE_CASE;
    };
  }, [useCaseConfig]);


  // Initialize system prompt
  useEffect(() => {
    const prompt = useCaseConfig.USE_CASE_PROMPTS[selectionState.currentUseCaseType as keyof typeof useCaseConfig.USE_CASE_PROMPTS];
    if (prompt && !selectionState.selectedSystemPrompt) {
      setSelectionState(prev => ({ ...prev, selectedSystemPrompt: prompt }));
    }
  }, [selectionState.currentUseCaseType, useCaseConfig, selectionState.selectedSystemPrompt]);

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
  const setSelSelectedUseCaseId = useCallback((id: string) => updateSelectionState({ selectedUseCaseId: id }), [updateSelectionState]);
  const setSelSelectedScenarioCategory = useCallback((category: string) => updateSelectionState({ selectedScenarioCategory: category }), [updateSelectionState]);
  const setSelSelectedCriteriaId = useCallback((id: string) => updateSelectionState({ selectedCriteriaId: id }), [updateSelectionState]);
  const setSelSelectedSystemPrompt = useCallback((prompt: string) => updateSelectionState({ selectedSystemPrompt: prompt }), [updateSelectionState]);
  const setSelCurrentUseCaseType = useCallback((type: string) => updateSelectionState({ currentUseCaseType: type }), [updateSelectionState]);
  
  const updateSystemPromptForUseCase = useCallback((testCases: TestCase[]) => {
    if (!useCaseConfig.USE_CASE_TYPES.includes(useCaseType)) return;
    const detectedUseCase = determineUseCase(testCases);
    const prompt = useCaseConfig.USE_CASE_PROMPTS[detectedUseCase as keyof typeof useCaseConfig.USE_CASE_PROMPTS];
    setSelectionState(prev => ({
      ...prev,
      currentUseCaseType: detectedUseCase,
      selectedSystemPrompt: prompt || ''
    }));
  }, [determineUseCase, setSelectionState, useCaseConfig, useCaseType]);
  

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
    setSelectedUseCaseId: setSelSelectedUseCaseId,
    setSelectedScenarioCategory: setSelSelectedScenarioCategory,
    setSelectedCriteriaId: setSelSelectedCriteriaId,
    setSelectedSystemPrompt: setSelSelectedSystemPrompt,
    setCurrentUseCaseType: setSelCurrentUseCaseType,
  }), [selectionState, updateSelectionState, setSelSelectedTestCaseIndex, setSelSelectedUseCaseId, setSelSelectedScenarioCategory, setSelSelectedCriteriaId, setSelSelectedSystemPrompt, setSelCurrentUseCaseType]);

  
  const api = useMemo(() => ({
    ui: uiApi,
    data: dataApi,
    evaluation: evaluationApi,
    selection: selectionApi,
    useCase: { updateSystemPromptForUseCase, determineUseCase },
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
    selectedUseCaseId: selectionState.selectedUseCaseId,
    setSelectedUseCaseId: setSelSelectedUseCaseId,
    selectedScenarioCategory: selectionState.selectedScenarioCategory,
    setSelectedScenarioCategory: setSelSelectedScenarioCategory,
    selectedCriteriaId: selectionState.selectedCriteriaId,
    setSelectedCriteriaId: setSelSelectedCriteriaId,
    selectedSystemPrompt: selectionState.selectedSystemPrompt,
    setSelectedSystemPrompt: setSelSelectedSystemPrompt,
    currentUseCaseType: selectionState.currentUseCaseType,
    setCurrentUseCaseType: setSelCurrentUseCaseType,

    // ===== Legacy: Evaluation =====
    shouldStartEvaluation: evaluationState.shouldStartEvaluation,
    setShouldStartEvaluation: setEvalShouldStart,
    evaluationProgress: evaluationState.evaluationProgress,
    setEvaluationProgress: setEvalProgress,
    currentTestCaseIndex: evaluationState.currentTestCaseIndex,
    setCurrentTestCaseIndex: setEvalCurrentIndex,

    // ===== Legacy: Use case =====
    updateSystemPromptForUseCase,
  }), [uiApi, dataApi, evaluationApi, selectionApi, updateSystemPromptForUseCase, uiState, setUICurrentStep, setUIIsLoading, setUIValidationError, setDataTestCases, setDataTestCasesWithModelOutputs, setDataCriteria, setDataOutcomes, setDataOutcomesWithModelComparison, setSelSelectedTestCaseIndex, setSelSelectedUseCaseId, setSelSelectedScenarioCategory, setSelSelectedCriteriaId, setSelSelectedSystemPrompt, setSelCurrentUseCaseType, setEvalShouldStart, setEvalProgress, setEvalCurrentIndex]);
  return api;
} 