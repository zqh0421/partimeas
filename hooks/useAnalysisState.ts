import { useState, useEffect, useMemo } from 'react';
import { TestCase, RubricOutcome, CriteriaData, AnalysisStep, TestCaseWithModelOutputs, RubricOutcomeWithModelComparison } from '@/types';
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

  // Simplified update function - now works with any use case
  const updateSystemPromptForUseCase = (testCases: TestCase[]) => {
    // Check if current use case type exists in available use case prompts
    if (!useCaseConfig.USE_CASE_TYPES.includes(useCaseType)) return;
    
    const detectedUseCase = determineUseCase(testCases);
    const prompt = useCaseConfig.USE_CASE_PROMPTS[detectedUseCase as keyof typeof useCaseConfig.USE_CASE_PROMPTS];
    
    setSelectionState(prev => ({
      ...prev,
      currentUseCaseType: detectedUseCase,
      selectedSystemPrompt: prompt || ''
    }));
  };

  // Initialize system prompt
  useEffect(() => {
    const prompt = useCaseConfig.USE_CASE_PROMPTS[selectionState.currentUseCaseType as keyof typeof useCaseConfig.USE_CASE_PROMPTS];
    if (prompt && !selectionState.selectedSystemPrompt) {
      setSelectionState(prev => ({ ...prev, selectedSystemPrompt: prompt }));
    }
  }, [selectionState.currentUseCaseType, useCaseConfig, selectionState.selectedSystemPrompt]);

  // Helper functions for state updates
  const updateUIState = (updates: Partial<UIState>) => {
    setUIState(prev => ({ ...prev, ...updates }));
  };

  const updateDataState = (updates: Partial<DataState>) => {
    setDataState(prev => ({ ...prev, ...updates }));
  };

  const updateEvaluationState = (updates: Partial<EvaluationState>) => {
    setEvaluationState(prev => ({ ...prev, ...updates }));
  };

  const updateSelectionState = (updates: Partial<SelectionState>) => {
    setSelectionState(prev => ({ ...prev, ...updates }));
  };

  // Organized return object
  return {
    // UI State
    ui: {
      ...uiState,
      update: updateUIState,
      setCurrentStep: (step: AnalysisStep) => updateUIState({ currentStep: step }),
      setIsLoading: (isLoading: boolean) => updateUIState({ isLoading }),
      setIsTestCasesSummaryOpen: (isOpen: boolean) => updateUIState({ isTestCasesSummaryOpen: isOpen }),
      setValidationError: (error: string) => updateUIState({ validationError: error }),
    },

    // Data State  
    data: {
      ...dataState,
      update: updateDataState,
      setTestCases: (testCases: TestCase[]) => updateDataState({ testCases }),
      setTestCasesWithModelOutputs: (testCasesWithModelOutputs: TestCaseWithModelOutputs[]) => 
        updateDataState({ testCasesWithModelOutputs }),
      setCriteria: (criteria: CriteriaData[]) => updateDataState({ criteria }),
      setOutcomes: (outcomes: RubricOutcome[]) => updateDataState({ outcomes }),
      setOutcomesWithModelComparison: (outcomesWithModelComparison: RubricOutcomeWithModelComparison[]) => 
        updateDataState({ outcomesWithModelComparison }),
    },

    // Evaluation State
    evaluation: {
      ...evaluationState,
      update: updateEvaluationState,
      setShouldStartEvaluation: (shouldStart: boolean) => updateEvaluationState({ shouldStartEvaluation: shouldStart }),
      setEvaluationProgress: (progress: number) => updateEvaluationState({ evaluationProgress: progress }),
      setCurrentTestCaseIndex: (index: number) => updateEvaluationState({ currentTestCaseIndex: index }),
    },

    // Selection State
    selection: {
      ...selectionState,
      update: updateSelectionState,
      setSelectedTestCaseIndex: (index: number) => updateSelectionState({ selectedTestCaseIndex: index }),
      setSelectedUseCaseId: (id: string) => updateSelectionState({ selectedUseCaseId: id }),
      setSelectedScenarioCategory: (category: string) => updateSelectionState({ selectedScenarioCategory: category }),
      setSelectedCriteriaId: (id: string) => updateSelectionState({ selectedCriteriaId: id }),
      setSelectedSystemPrompt: (prompt: string) => updateSelectionState({ selectedSystemPrompt: prompt }),
      setCurrentUseCaseType: (type: string) => updateSelectionState({ currentUseCaseType: type }),
    },

    // Use Case Functions
    useCase: {
      updateSystemPromptForUseCase,
      determineUseCase,
    },

    // Legacy support (for backward compatibility)
    currentStep: uiState.currentStep,
    setCurrentStep: (step: AnalysisStep) => updateUIState({ currentStep: step }),
    isLoading: uiState.isLoading,
    setIsLoading: (isLoading: boolean) => updateUIState({ isLoading }),
    validationError: uiState.validationError,
    setValidationError: (error: string) => updateUIState({ validationError: error }),
    
    // Data state legacy support
    testCases: dataState.testCases,
    setTestCases: (testCases: TestCase[]) => updateDataState({ testCases }),
    testCasesWithModelOutputs: dataState.testCasesWithModelOutputs,
    setTestCasesWithModelOutputs: (testCasesWithModelOutputs: TestCaseWithModelOutputs[]) => 
      updateDataState({ testCasesWithModelOutputs }),
    criteria: dataState.criteria,
    setCriteria: (criteria: CriteriaData[]) => updateDataState({ criteria }),
    outcomes: dataState.outcomes,
    setOutcomes: (outcomes: RubricOutcome[]) => updateDataState({ outcomes }),
    outcomesWithModelComparison: dataState.outcomesWithModelComparison,
    setOutcomesWithModelComparison: (outcomesWithModelComparison: RubricOutcomeWithModelComparison[]) => 
      updateDataState({ outcomesWithModelComparison }),
    
    // Selection state legacy support
    selectedTestCaseIndex: selectionState.selectedTestCaseIndex,
    setSelectedTestCaseIndex: (index: number) => updateSelectionState({ selectedTestCaseIndex: index }),
    selectedUseCaseId: selectionState.selectedUseCaseId,
    setSelectedUseCaseId: (id: string) => updateSelectionState({ selectedUseCaseId: id }),
    selectedScenarioCategory: selectionState.selectedScenarioCategory,
    setSelectedScenarioCategory: (category: string) => updateSelectionState({ selectedScenarioCategory: category }),
    selectedCriteriaId: selectionState.selectedCriteriaId,
    setSelectedCriteriaId: (id: string) => updateSelectionState({ selectedCriteriaId: id }),
    selectedSystemPrompt: selectionState.selectedSystemPrompt,
    setSelectedSystemPrompt: (prompt: string) => updateSelectionState({ selectedSystemPrompt: prompt }),
    currentUseCaseType: selectionState.currentUseCaseType,
    setCurrentUseCaseType: (type: string) => updateSelectionState({ currentUseCaseType: type }),
    
    // Evaluation state legacy support
    shouldStartEvaluation: evaluationState.shouldStartEvaluation,
    setShouldStartEvaluation: (shouldStart: boolean) => updateEvaluationState({ shouldStartEvaluation: shouldStart }),
    evaluationProgress: evaluationState.evaluationProgress,
    setEvaluationProgress: (progress: number) => updateEvaluationState({ evaluationProgress: progress }),
    currentTestCaseIndex: evaluationState.currentTestCaseIndex,
    setCurrentTestCaseIndex: (index: number) => updateEvaluationState({ currentTestCaseIndex: index }),
    
    // Use case functions
    updateSystemPromptForUseCase,
  };
} 