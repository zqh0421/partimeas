import { EvaluationResult } from '@/components/RubricEvaluator';
import { TestCase, RubricOutcome, Criteria, TestCaseWithModelOutputs, RubricOutcomeWithModelComparison, ModelOutput } from '@/types/types';

export function useAnalysisHandlers(
  setTestCases: (testCases: TestCase[]) => void,
  setTestCasesWithModelOutputs: (testCases: TestCaseWithModelOutputs[]) => void,
  setCriteria: (criteria: Criteria[]) => void,
  setOutcomes: (outcomes: RubricOutcome[]) => void,
  setOutcomesWithModelComparison: (outcomes: RubricOutcomeWithModelComparison[]) => void,
  setIsLoading: (loading: boolean) => void,
  setCurrentStep: (step: 'sync' | 'run' | 'outcomes') => void,
  setSelectedUseCaseId: (id: string) => void,
  setSelectedScenarioCategory: (category: string) => void,
  setSelectedCriteriaId: (id: string) => void,
  setValidationError: (error: string) => void,
  setShouldStartEvaluation: (start: boolean) => void,
  setSelectedTestCaseIndex: (index: number) => void,
  setCurrentTestCaseIndex: (index: number) => void,
  setEvaluationProgress: (progress: number) => void,
  testCases: TestCase[],
  testCasesWithModelOutputs: TestCaseWithModelOutputs[],
  updateSystemPromptForUseCase?: (testCases: TestCase[]) => void
) {
  const handleEvaluationComplete = (results: EvaluationResult[]) => {
    const processedOutcomes: RubricOutcome[] = results.map(result => ({
      testCaseId: result.testCaseId,
      testCase: {
        id: result.testCaseId,
        input: testCases.find(tc => tc.id === result.testCaseId)?.input || '',
        context: testCases.find(tc => tc.id === result.testCaseId)?.context || '',
        rubricScores: result.scores,
        feedback: result.feedback,
        suggestions: result.testCaseSpecificSuggestions
      },
      rubricEffectiveness: result.rubricEffectiveness,
      refinementSuggestions: result.refinementSuggestions
    }));
    
    setOutcomes(processedOutcomes);
    setIsLoading(false);
    setShouldStartEvaluation(false);
    setCurrentStep('outcomes');
  };

  const handleModelComparisonEvaluationComplete = (results: Array<{
    testCaseId: string;
    modelOutputs: ModelOutput[];
    rubricEffectiveness: 'high' | 'medium' | 'low';
    refinementSuggestions: string[];
  }>) => {
    // First, update testCasesWithModelOutputs with the model outputs
    const updatedTestCasesWithModelOutputs: TestCaseWithModelOutputs[] = results.map(result => {
      const originalTestCase = testCases.find(tc => tc.id === result.testCaseId);
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
    
    // Then create the outcomes
    const processedOutcomes: RubricOutcomeWithModelComparison[] = results.map(result => ({
      testCaseId: result.testCaseId,
      testCase: {
        id: result.testCaseId,
        input: testCases.find(tc => tc.id === result.testCaseId)?.input || '',
        context: testCases.find(tc => tc.id === result.testCaseId)?.context || '',
        modelOutputs: result.modelOutputs
      },
      rubricEffectiveness: result.rubricEffectiveness,
      refinementSuggestions: result.refinementSuggestions
    }));
    
    setOutcomesWithModelComparison(processedOutcomes);
    setIsLoading(false);
    setShouldStartEvaluation(false);
    setCurrentStep('outcomes');
  };

  const handleEvaluationProgress = (currentIndex: number, progress: number) => {
    // Progress is now based on individual LLM responses, not just test cases
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
  };

  const handleEvaluationError = (error: string) => {
    alert(`Evaluation failed: ${error}`);
    setIsLoading(false);
  };

  const handleUseCaseSelected = (useCaseId: string) => {
    setSelectedUseCaseId(useCaseId);
    setSelectedScenarioCategory(''); // Reset scenario category when use case changes
    setValidationError(''); // Clear any previous validation errors
    console.log('Use case selected:', useCaseId);
  };

  const handleScenarioCategorySelected = (categoryId: string) => {
    setSelectedScenarioCategory(categoryId);
    setValidationError(''); // Clear any previous validation errors
    console.log('Scenario category selected:', categoryId);
  };

  // New handler for multi-level multi-select functionality
  const handleMultiLevelSelectionChange = (selections: Array<{
    useCaseId: string;
    scenarioCategoryIds: string[];
  }>) => {
    setValidationError(''); // Clear any previous validation errors
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
  };

  const handleUseCaseDataLoaded = (useCaseTestCases: Array<{
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
    // Convert use case data to internal format
    const processedTestCases: TestCase[] = useCaseTestCases.map(testCase => ({
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
    const processedTestCasesWithModelOutputs: TestCaseWithModelOutputs[] = useCaseTestCases.map(testCase => ({
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
    console.log('Test cases loaded:', processedTestCases.length);
    
    // Update system prompt based on loaded test cases (if function provided)
    if (updateSystemPromptForUseCase) {
      updateSystemPromptForUseCase(processedTestCases);
    }
  };

  const handleCriteriaSelected = (criteriaId: string) => {
    setSelectedCriteriaId(criteriaId);
    setValidationError(''); // Clear any previous validation errors
    console.log('Criteria selected:', criteriaId);
  };

  const handleCriteriaLoaded = (loadedCriteria: Criteria[]) => {
    setCriteria(loadedCriteria);
    console.log('Criteria loaded:', loadedCriteria.length);
  };



  const handleUseCaseError = (error: string) => {
    setValidationError(error);
    console.error('Use case error:', error);
  };

  const handleCriteriaError = (error: string) => {
    setValidationError(error);
    console.error('Criteria error:', error);
  };

  const handleConfirmSelections = () => {
    setValidationError(''); // Clear any previous validation errors
    setCurrentStep('run');
  };

  const handleTestCaseSelect = (index: number) => {
    setSelectedTestCaseIndex(index);
  };

  const handleBackToSync = () => {
    setCurrentStep('sync');
  };

  const handleStartEvaluation = () => {
    setIsLoading(true);
    setShouldStartEvaluation(true);
  };

  const handleRestart = () => {
    // Reset all analysis state
    setTestCases([]);
    setTestCasesWithModelOutputs([]);
    setCriteria([]);
    setOutcomes([]);
    setOutcomesWithModelComparison([]);
    setSelectedUseCaseId('');
    setSelectedScenarioCategory('');
    setSelectedCriteriaId('');
    setSelectedTestCaseIndex(0);
    setCurrentTestCaseIndex(0);
    setEvaluationProgress(0);
    setShouldStartEvaluation(false);
    setIsLoading(false);
    setValidationError('');
    
    // Go back to sync step
    setCurrentStep('sync');
    
    // Refresh the page to ensure clean state
    window.location.reload();
  };

  return {
    handleEvaluationComplete,
    handleModelComparisonEvaluationComplete,
    handleEvaluationProgress,
    handleEvaluationError,
    handleUseCaseSelected,
    handleScenarioCategorySelected,
    handleMultiLevelSelectionChange,
    handleUseCaseDataLoaded,
    handleCriteriaSelected,
    handleCriteriaLoaded,
    handleUseCaseError,
    handleCriteriaError,
    handleConfirmSelections,
    handleTestCaseSelect,
    handleBackToSync,
    handleStartEvaluation,
    handleRestart,
  };
} 