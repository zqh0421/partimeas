'use client';

import { useEffect } from 'react';
import { useAnalysisState } from '../output-analysis/hooks/useAnalysisState';
import { useAnalysisHandlers } from '../output-analysis/hooks/useAnalysisHandlers';

import UnifiedAnalysisView from '../output-analysis/components/UnifiedAnalysisView';

export default function OutputAnalysisFullPage() {
  const {
    // Step management
    currentStep,
    setCurrentStep,
    
    // Loading states
    isLoading,
    setIsLoading,
    
    // Data states
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
    
    // Selection states
    selectedTestCaseIndex,
    setSelectedTestCaseIndex,
    selectedUseCaseId,
    setSelectedUseCaseId,
    selectedScenarioCategory,
    setSelectedScenarioCategory,
    selectedCriteriaId,
    setSelectedCriteriaId,
    selectedSystemPrompt,
    setSelectedSystemPrompt,
    currentUseCaseType,
    updateSystemPromptForUseCase,
    
    // Evaluation states
    shouldStartEvaluation,
    setShouldStartEvaluation,
    evaluationProgress,
    setEvaluationProgress,
    currentTestCaseIndex,
    setCurrentTestCaseIndex,
    
    // Validation
    validationError,
    setValidationError,
  } = useAnalysisState('general_analysis_full'); // Use the full version

  const handlers = useAnalysisHandlers(
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
    setEvaluationProgress,
    testCases,
    testCasesWithModelOutputs,
    updateSystemPromptForUseCase
  );

  // Ensure we navigate to outcomes once results are available
  useEffect(() => {
    if (currentStep !== 'outcomes') {
      if (outcomesWithModelComparison.length > 0 || outcomes.length > 0) {
        setCurrentStep('outcomes');
        setShouldStartEvaluation(false);
      }
    }
  }, [currentStep, outcomesWithModelComparison.length, outcomes.length, setCurrentStep, setShouldStartEvaluation]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simplified Header without steps */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="text-gray-500 hover:text-gray-700"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Output Analysis</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UnifiedAnalysisView
          // Data states
          testCases={testCases}
          testCasesWithModelOutputs={testCasesWithModelOutputs}
          criteria={criteria}
          outcomes={outcomes}
          outcomesWithModelComparison={outcomesWithModelComparison}
          
          // Selection states
          selectedUseCaseId={selectedUseCaseId}
          selectedScenarioCategory={selectedScenarioCategory}
          selectedSystemPrompt={selectedSystemPrompt}
          selectedTestCaseIndex={selectedTestCaseIndex}
          currentUseCaseType={currentUseCaseType}
          
          // Loading and evaluation states
          isLoading={isLoading}
          shouldStartEvaluation={shouldStartEvaluation}
          evaluationProgress={evaluationProgress}
          currentTestCaseIndex={currentTestCaseIndex}
          validationError={validationError}
          
          // Event handlers
          onUseCaseSelected={handlers.handleUseCaseSelected}
          onScenarioCategorySelected={handlers.handleScenarioCategorySelected}
          onMultiLevelSelectionChange={handlers.handleMultiLevelSelectionChange}
          onUseCaseDataLoaded={handlers.handleUseCaseDataLoaded}
          onUseCaseError={handlers.handleUseCaseError}
          onEvaluationComplete={handlers.handleEvaluationComplete}
          onModelComparisonEvaluationComplete={handlers.handleModelComparisonEvaluationComplete}
          onEvaluationError={handlers.handleEvaluationError}
          onEvaluationProgress={handlers.handleEvaluationProgress}
          onStartEvaluation={handlers.handleStartEvaluation}
          onTestCaseSelect={handlers.handleTestCaseSelect}
          setValidationError={setValidationError}
        />
      </div>
    </div>
  );
}