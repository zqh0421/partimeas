'use client';

import { useEffect } from 'react';
import { useAnalysisState } from '@/hooks/useAnalysisState';
import { useAnalysisHandlers } from '@/hooks/useAnalysisHandlers';
import AnalysisHeader from '@/components/(archived)/output-analysis/AnalysisHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import SyncStep from '@/components/(archived)/output-analysis/SyncStep';
import RunStep from '@/components/(archived)/output-analysis/RunStep';
import ModelComparisonStep from '@/components/(archived)/output-analysis/ModelComparisonStep';

export default function OutputAnalysisPage() {
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
  } = useAnalysisState('general_analysis'); // Use the sectioned version

  const handlers = useAnalysisHandlers({
    stateSetters: {
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
    },
    data: {
      testCases,
      testCasesWithModelOutputs,
      updateSystemPromptForUseCase
    }
  });

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
      
      <AnalysisHeader currentStep={currentStep} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && (
          <LoadingSpinner
            currentStep={currentStep}
            currentTestCaseIndex={currentTestCaseIndex}
            testCasesLength={testCases.length}
            evaluationProgress={evaluationProgress}
            testCasesWithModelOutputs={testCasesWithModelOutputs}
          />
        )}

        {!isLoading && currentStep === 'sync' && (
          <SyncStep
            testCases={testCases}
            criteria={criteria}
            selectedUseCaseId={selectedUseCaseId}
            selectedScenarioCategory={selectedScenarioCategory}
            selectedCriteriaId={selectedCriteriaId}
            selectedSystemPrompt={selectedSystemPrompt}
            validationError={validationError}
            onUseCaseSelected={handlers.handleUseCaseSelected}
            onScenarioCategorySelected={handlers.handleScenarioCategorySelected}
            onUseCaseDataLoaded={handlers.handleUseCaseDataLoaded}
            onCriteriaSelected={handlers.handleCriteriaSelected}
            onCriteriaLoaded={handlers.handleCriteriaLoaded}
            onUseCaseError={handlers.handleUseCaseError}
            onCriteriaError={handlers.handleCriteriaError}
            onConfirmSelections={handlers.handleConfirmSelections}
            setValidationError={setValidationError}
          />
        )}

        {!isLoading && currentStep === 'run' && (
          <RunStep
            testCases={testCases}
            testCasesWithModelOutputs={testCasesWithModelOutputs}
            criteria={criteria}
            selectedScenarioCategory={selectedScenarioCategory}
            selectedUseCaseId={selectedUseCaseId}
            systemPrompt={selectedSystemPrompt}
            currentUseCaseType={currentUseCaseType}
            shouldStartEvaluation={shouldStartEvaluation}
            onEvaluationComplete={handlers.handleEvaluationComplete}
            onModelComparisonEvaluationComplete={handlers.handleModelComparisonEvaluationComplete}
            onEvaluationError={handlers.handleEvaluationError}
            onEvaluationProgress={handlers.handleEvaluationProgress}
            onStartEvaluation={handlers.handleStartEvaluation}
          />
        )}

        {currentStep === 'outcomes' && (
          <>
            {outcomesWithModelComparison.length > 0 ? (
              <ModelComparisonStep
                outcomes={outcomesWithModelComparison}
                selectedTestCaseIndex={selectedTestCaseIndex}
                onTestCaseSelect={handlers.handleTestCaseSelect}
                onBackToSync={handlers.handleBackToSync}
                onRestart={handlers.handleRestart}
                isLoading={isLoading}
              />
            ) : isLoading ? (
              <ModelComparisonStep
                outcomes={[]}
                selectedTestCaseIndex={0}
                onTestCaseSelect={handlers.handleTestCaseSelect}
                onBackToSync={handlers.handleBackToSync}
                onRestart={handlers.handleRestart}
                isLoading={true}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
} 