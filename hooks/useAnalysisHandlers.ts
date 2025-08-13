import { useCallback } from 'react';
import { EvaluationResult } from '@/components/RubricEvaluator';
import { TestCase, RubricOutcome, CriteriaData, TestCaseWithModelOutputs, RubricOutcomeWithModelComparison, ModelOutput } from '@/types';

// Types for better organization and type safety
interface StateSetters {
  setTestCases: (testCases: TestCase[]) => void;
  setTestCasesWithModelOutputs: (testCases: TestCaseWithModelOutputs[]) => void;
  setCriteria: (criteria: CriteriaData[]) => void;
  setOutcomes: (outcomes: RubricOutcome[]) => void;
  setOutcomesWithModelComparison: (outcomes: RubricOutcomeWithModelComparison[]) => void;
  setIsLoading: (loading: boolean) => void;
  setCurrentStep: (step: 'sync' | 'run' | 'outcomes') => void;
  setSelectedUseCaseId: (id: string) => void;
  setSelectedScenarioCategory: (category: string) => void;
  setSelectedCriteriaId: (id: string) => void;
  setValidationError: (error: string) => void;
  setShouldStartEvaluation: (start: boolean) => void;
  setSelectedTestCaseIndex: (index: number) => void;
  setCurrentTestCaseIndex: (index: number) => void;
  setEvaluationProgress: (progress: number) => void;
}

interface AnalysisData {
  testCases: TestCase[];
  testCasesWithModelOutputs: TestCaseWithModelOutputs[];
  updateSystemPromptForUseCase?: (testCases: TestCase[]) => void;
}

interface UseAnalysisHandlersParams {
  stateSetters: StateSetters;
  data: AnalysisData;
}

export function useAnalysisHandlers({
  stateSetters,
  data
}: UseAnalysisHandlersParams) {
  const { testCases, testCasesWithModelOutputs, updateSystemPromptForUseCase } = data;
  const {
    setTestCases,
    setTestCasesWithModelOutputs,
    setCriteria,
    setOutcomes,
    setOutcomesWithModelComparison,
    setIsLoading,
    setCurrentStep,
    setSelectedUseCaseId,
    setSelectedScenarioCategory,
    setSelectedCriteriaId,
    setValidationError,
    setShouldStartEvaluation,
    setSelectedTestCaseIndex,
    setCurrentTestCaseIndex,
    setEvaluationProgress
  } = stateSetters;

  // Utility functions for common patterns
  const findTestCaseById = useCallback((id: string) => 
    testCases.find(tc => tc.id === id), [testCases]);

  const clearValidationError = useCallback(() => 
    setValidationError(''), [setValidationError]);

  const finishEvaluation = useCallback(() => {
    setIsLoading(false);
    setShouldStartEvaluation(false);
    setCurrentStep('outcomes');
  }, [setIsLoading, setShouldStartEvaluation, setCurrentStep]);

  // Memoized evaluation handlers
  const handleEvaluationComplete = useCallback((results: EvaluationResult[]) => {
    const processedOutcomes: RubricOutcome[] = results.map(result => {
      const testCase = findTestCaseById(result.testCaseId);
      return {
        testCaseId: result.testCaseId,
        testCase: {
          id: result.testCaseId,
          input: testCase?.input || '',
          context: testCase?.context || '',
          rubricScores: result.scores,
          feedback: result.feedback,
          suggestions: result.testCaseSpecificSuggestions
        },
        rubricEffectiveness: result.rubricEffectiveness,
        refinementSuggestions: result.refinementSuggestions
      };
    });
    
    setOutcomes(processedOutcomes);
    finishEvaluation();
  }, [findTestCaseById, setOutcomes, finishEvaluation]);

  const handleModelComparisonEvaluationComplete = useCallback((results: Array<{
    testCaseId: string;
    modelOutputs: ModelOutput[];
    rubricEffectiveness: 'high' | 'medium' | 'low';
    refinementSuggestions: string[];
  }>) => {
    // Create updated test cases with model outputs
    const updatedTestCasesWithModelOutputs: TestCaseWithModelOutputs[] = results.map(result => {
      const originalTestCase = findTestCaseById(result.testCaseId);
      return {
        id: result.testCaseId,
        input: originalTestCase?.input || '',
        context: originalTestCase?.context || '',
        modelOutputs: result.modelOutputs,
        useCase: originalTestCase?.useCase || '',
        scenarioCategory: originalTestCase?.scenarioCategory || ''
      };
    });
    
    console.log('📊 Updating testCasesWithModelOutputs:', updatedTestCasesWithModelOutputs);
    setTestCasesWithModelOutputs(updatedTestCasesWithModelOutputs);
    
    // Create the outcomes with model comparison
    const processedOutcomes: RubricOutcomeWithModelComparison[] = results.map(result => {
      const testCase = findTestCaseById(result.testCaseId);
      return {
        testCaseId: result.testCaseId,
        testCase: {
          id: result.testCaseId,
          input: testCase?.input || '',
          context: testCase?.context || '',
          modelOutputs: result.modelOutputs
        },
        rubricEffectiveness: result.rubricEffectiveness,
        refinementSuggestions: result.refinementSuggestions
      };
    });
    
    setOutcomesWithModelComparison(processedOutcomes);
    // Don't automatically navigate to outcomes - let the user stay on the analysis step
    // to see the evaluation results
    console.log('📊 Evaluation completed, staying on analysis step to show results');
  }, [findTestCaseById, setTestCasesWithModelOutputs, setOutcomesWithModelComparison]);

  const handleEvaluationProgress = useCallback((currentIndex: number, progress: number) => {
    // Calculate model count dynamically from actual data
    const modelCount = testCasesWithModelOutputs.length > 0 
      ? testCasesWithModelOutputs[0].modelOutputs?.length || 0 
      : 0;
    const totalEvaluations = testCasesWithModelOutputs.length * modelCount;
    const completedCount = Math.round((progress / 100) * totalEvaluations);
    
    console.log(`📊 Progress update: ${completedCount}/${totalEvaluations} LLM responses completed (${Math.round(progress)}%)`);
    console.log(`📍 Current test case: ${currentIndex + 1}/${testCasesWithModelOutputs.length}, Models: ${modelCount}`);
    
    setCurrentTestCaseIndex(currentIndex);
    setEvaluationProgress(progress);
  }, [testCasesWithModelOutputs, setCurrentTestCaseIndex, setEvaluationProgress]);

  const handleEvaluationError = useCallback((error: string) => {
    alert(`Evaluation failed: ${error}`);
    setIsLoading(false);
  }, [setIsLoading]);

  // Selection handlers group
  const selectionHandlers = {
    handleUseCaseSelected: useCallback((useCaseId: string) => {
      setSelectedUseCaseId(useCaseId);
      setSelectedScenarioCategory(''); // Reset scenario category when use case changes
      clearValidationError();
      console.log('Use case selected:', useCaseId);
    }, [setSelectedUseCaseId, setSelectedScenarioCategory, clearValidationError]),

    handleScenarioCategorySelected: useCallback((categoryId: string) => {
      setSelectedScenarioCategory(categoryId);
      clearValidationError();
      console.log('Scenario category selected:', categoryId);
    }, [setSelectedScenarioCategory, clearValidationError]),

    handleMultiLevelSelectionChange: useCallback((selections: Array<{
      useCaseId: string;
      scenarioCategoryIds: string[];
    }>) => {
      clearValidationError();
      console.log('Multi-level selections changed:', selections);
      
      // For backward compatibility, set the first selection as primary
      if (selections.length > 0) {
        const firstSelection = selections[0];
        setSelectedUseCaseId(firstSelection.useCaseId);
        if (firstSelection.scenarioCategoryIds.length > 0) {
          setSelectedScenarioCategory(firstSelection.scenarioCategoryIds[0]);
        }
      } else {
        setSelectedUseCaseId('');
        setSelectedScenarioCategory('');
      }
    }, [setSelectedUseCaseId, setSelectedScenarioCategory, clearValidationError]),

    handleCriteriaSelected: useCallback((criteriaId: string) => {
      setSelectedCriteriaId(criteriaId);
      clearValidationError();
      console.log('Criteria selected:', criteriaId);
    }, [setSelectedCriteriaId, clearValidationError]),

    handleTestCaseSelect: useCallback((index: number) => {
      setSelectedTestCaseIndex(index);
    }, [setSelectedTestCaseIndex])
  };

  // Data loading handlers group
  const dataHandlers = {
    handleUseCaseDataLoaded: useCallback((useCaseTestCases: Array<{
      id: string;
      input: string;
      context: string;
      modelName?: string;
      timestamp?: string;
      use_case_title?: string;
      use_case_index?: string;
      useCase?: string;
      scenarioCategory?: string;
    }>) => {
      // Remove duplicates by ID to prevent multiple loading of same test cases
      const uniqueTestCasesMap = new Map<string, any>();
      useCaseTestCases.forEach(testCase => {
        uniqueTestCasesMap.set(testCase.id, testCase);
      });
      const uniqueUseCaseTestCases = Array.from(uniqueTestCasesMap.values());
      
      // Convert use case data to internal format
      const processedTestCases: TestCase[] = uniqueUseCaseTestCases.map(testCase => ({
        id: testCase.id,
        input: testCase.input,
        context: testCase.context,
        rubricScores: {}, // Will be filled by evaluation
        feedback: '', // Will be filled by evaluation
        suggestions: [], // Will be filled by evaluation
        useCase: testCase.useCase,
        scenarioCategory: testCase.scenarioCategory,
        use_case_title: testCase.use_case_title,
        use_case_index: testCase.use_case_index
      }));
      
      // Also create test cases with model outputs for comparison
      const processedTestCasesWithModelOutputs: TestCaseWithModelOutputs[] = uniqueUseCaseTestCases.map(testCase => ({
        id: testCase.id,
        input: testCase.input,
        context: testCase.context,
        modelOutputs: [], // Will be filled by model comparison evaluation
        useCase: testCase.useCase,
        scenarioCategory: testCase.scenarioCategory,
        use_case_title: testCase.use_case_title,
        use_case_index: testCase.use_case_index
      }));
      
      setTestCases(processedTestCases);
      setTestCasesWithModelOutputs(processedTestCasesWithModelOutputs);
      console.log('Test cases loaded (after deduplication):', processedTestCases.length);
      
      // Update system prompt based on loaded test cases (if function provided)
      if (updateSystemPromptForUseCase) {
        updateSystemPromptForUseCase(processedTestCases);
      }
    }, [setTestCases, setTestCasesWithModelOutputs, updateSystemPromptForUseCase]),

    handleCriteriaLoaded: useCallback((loadedCriteria: CriteriaData[]) => {
      setCriteria(loadedCriteria);
      console.log('Criteria loaded:', loadedCriteria.length);
    }, [setCriteria])
  };

  // Error handlers group
  const errorHandlers = {
    handleUseCaseError: useCallback((error: string) => {
      setValidationError(error);
      console.error('Use case error:', error);
    }, [setValidationError]),

    handleCriteriaError: useCallback((error: string) => {
      setValidationError(error);
      console.error('Criteria error:', error);
    }, [setValidationError])
  };

  // Flow control handlers group
  const flowHandlers = {
    handleConfirmSelections: useCallback(() => {
      clearValidationError();
      setCurrentStep('run');
    }, [clearValidationError, setCurrentStep]),

    handleBackToSync: useCallback(() => {
      setCurrentStep('sync');
    }, [setCurrentStep]),

    handleStartEvaluation: useCallback(() => {
      setIsLoading(true);
      setShouldStartEvaluation(true);
    }, [setIsLoading, setShouldStartEvaluation]),

    handleRestart: useCallback(() => {
      // Go back to sync step first
      setCurrentStep('sync');
      
      // Refresh the page to ensure clean state - no need to clear state manually
      window.location.reload();
    }, [
      setCurrentStep
    ])
  };

  // Return handlers both individually and grouped for flexibility
  return {
    // Evaluation handlers
    handleEvaluationComplete,
    handleModelComparisonEvaluationComplete,
    handleEvaluationProgress,
    handleEvaluationError,
    
    // Individual handlers (spread from groups for backward compatibility)
    ...selectionHandlers,
    ...dataHandlers,
    ...errorHandlers,
    ...flowHandlers,
    
    // Grouped handlers for new consumers who want cleaner organization
    selectionHandlers,
    dataHandlers,
    errorHandlers,
    flowHandlers,
  };
} 