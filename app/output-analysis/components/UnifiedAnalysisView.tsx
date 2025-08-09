'use client';

import { useState, useEffect } from 'react';
import MultiLevelSelector from '@/components/output/MultiLevelSelector';
import RubricEvaluator from '@/components/output/RubricEvaluator';
import ModelComparisonEvaluator from './ModelComparisonEvaluator';
import ModelComparisonStepFull from './ModelComparisonStepFull';
import VerticalStepper from './VerticalStepper';
import { TestCase, TestCaseWithModelOutputs, Criteria, RubricOutcomeWithModelComparison, ModelOutput } from '../types';



interface UnifiedAnalysisViewProps {
  // Data states
  testCases: TestCase[];
  testCasesWithModelOutputs: TestCaseWithModelOutputs[];
  criteria: Criteria[];
  outcomes: any[];
  outcomesWithModelComparison: RubricOutcomeWithModelComparison[];
  
  // Selection states
  selectedUseCaseId: string;
  selectedScenarioCategory: string;
  selectedSystemPrompt: string;
  selectedTestCaseIndex: number;
  currentUseCaseType?: string;
  
  // Loading and evaluation states
  isLoading: boolean;
  shouldStartEvaluation: boolean;
  evaluationProgress: any;
  currentTestCaseIndex: number;
  validationError: string;
  
  // Event handlers
  onUseCaseSelected: (useCaseId: string) => void;
  onScenarioCategorySelected: (categoryId: string) => void;
  onMultiLevelSelectionChange?: (selections: Array<{
    useCaseId: string;
    scenarioCategoryIds: string[];
  }>) => void;
  onUseCaseDataLoaded: (testCases: TestCase[]) => void;
  onUseCaseError: (error: string) => void;
  onEvaluationComplete: (results: any[]) => void;
  onModelComparisonEvaluationComplete: (results: Array<{
    testCaseId: string;
    modelOutputs: ModelOutput[];
    rubricEffectiveness: 'high' | 'medium' | 'low';
    refinementSuggestions: string[];
  }>) => void;
  onEvaluationError: (error: string) => void;
  onEvaluationProgress: (currentIndex: number, progress: number) => void;
  onStartEvaluation: () => void;
  onTestCaseSelect: (index: number) => void;
  onRestart?: () => void;
  setValidationError: (error: string) => void;
}

export default function UnifiedAnalysisView({
  testCases,
  testCasesWithModelOutputs,
  outcomesWithModelComparison,
  selectedUseCaseId,
  selectedSystemPrompt,
  selectedTestCaseIndex,
  isLoading,
  shouldStartEvaluation,
  evaluationProgress,
  currentTestCaseIndex,
  validationError,
  onUseCaseSelected,
  onScenarioCategorySelected,
  onMultiLevelSelectionChange,
  onUseCaseDataLoaded,
  onUseCaseError,
  onEvaluationComplete,
  onModelComparisonEvaluationComplete,
  onEvaluationError,
  onEvaluationProgress,
  onStartEvaluation,
  onTestCaseSelect,
  onRestart,
  setValidationError,
}: UnifiedAnalysisViewProps) {
  const [analysisStep, setAnalysisStep] = useState<'setup' | 'running' | 'complete'>('setup');
  const [hasStartedEvaluation, setHasStartedEvaluation] = useState(false);
  const [isStep1Collapsed, setIsStep1Collapsed] = useState(false);

  // Determine current analysis step based on data availability
  useEffect(() => {
    if (outcomesWithModelComparison.length > 0) {
      setAnalysisStep('complete');
    } else if (hasStartedEvaluation || shouldStartEvaluation) {
      setAnalysisStep('running');
    } else {
      setAnalysisStep('setup');
    }
  }, [outcomesWithModelComparison.length, hasStartedEvaluation, shouldStartEvaluation]);

  const handleConfirmSelections = () => {
    if (!selectedUseCaseId || testCases.length === 0) {
      setValidationError('Please select a use case and ensure test cases are loaded.');
      return;
    }
    
    setValidationError('');
    setHasStartedEvaluation(true);
    setIsStep1Collapsed(true); // Fold step 1 after confirm
    onStartEvaluation();
  };

  const hasValidSelections = selectedUseCaseId && testCases.length > 0;
  const showTestCaseSelector = testCases.length > 0;
  const showEvaluationSection = analysisStep !== 'setup';
  const showResultsSection = analysisStep === 'complete';

  // Create steps for the vertical stepper
  const steps = [
    {
      id: 'setup',
      title: 'Load',
      description: 'Select a set of test cases from a use case.',
      status: analysisStep === 'setup' ? 'current' as const : (analysisStep === 'running' || analysisStep === 'complete') ? 'completed' as const : 'upcoming' as const,
      isCollapsed: isStep1Collapsed,
      content: (
        <div className="space-y-6">
          {/* Use Case & Scenario Category Selection */}
          <div>
            <MultiLevelSelector
              onSelectionChange={(selections) => {
                onMultiLevelSelectionChange?.(selections);
                // For backward compatibility, still call individual handlers
                if (selections.length > 0) {
                  const firstSelection = selections[0];
                  onUseCaseSelected(firstSelection.useCaseId);
                  if (firstSelection.scenarioCategoryIds.length > 0) {
                    onScenarioCategorySelected(firstSelection.scenarioCategoryIds[0]);
                  }
                }
              }}
              onDataLoaded={(testCases: any[]) => onUseCaseDataLoaded(testCases)}
              onError={onUseCaseError}
              testCases={testCases}
            />
          </div>

          {/* Test Case Selection */}
          {showTestCaseSelector && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Test Cases ({testCases.length})</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {testCases.slice(0, 8).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => onTestCaseSelect(index)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      selectedTestCaseIndex === index
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                {testCases.length > 8 && (
                  <span className="px-3 py-1 text-sm text-gray-500">
                    +{testCases.length - 8} more
                  </span>
                )}
              </div>
              
              {/* Selected test case preview */}
              {testCases[selectedTestCaseIndex] && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Test Case {selectedTestCaseIndex + 1} Preview</h4>
                  <div className="grid grid-cols-1 text-sm">
                    <div>
                      <p className="text-gray-600 mt-1 font-bold">{testCases[selectedTestCaseIndex].context || 'No context available'}</p>
                      <p className="text-gray-600 mt-1">{testCases[selectedTestCaseIndex].input || 'No input available'}</p>
                    </div>
                    
                    
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{validationError}</p>
            </div>
          )}

          {/* Start Analysis Button */}
          {hasValidSelections && analysisStep === 'setup' && (
            <div className="flex justify-end">
              <button
                onClick={handleConfirmSelections}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                Confirm →
              </button>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'analysis',
      title: 'Test',
      description: 'Review possible responses to selected test cases.',
      status: analysisStep === 'running' ? 'current' as const : analysisStep === 'complete' ? 'completed' as const : 'upcoming' as const,
      isCollapsed: false, // Never collapse step 2
      isLoading: analysisStep === 'running' && (isLoading || shouldStartEvaluation),
      content: (
        <div className="space-y-6">
          {/* Loading State */}
          {analysisStep === 'running' && isLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Evaluating models... ({currentTestCaseIndex + 1}/{testCases.length})
                  </p>
                  {evaluationProgress && (
                    <p className="text-xs text-blue-700">
                      {evaluationProgress.message || 'Processing...'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Loading State - Show when running */}
          {analysisStep === 'running' && isLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Evaluating models... ({currentTestCaseIndex + 1}/{testCases.length})
                  </p>
                  {evaluationProgress && (
                    <p className="text-xs text-blue-700">
                      {evaluationProgress.message || 'Processing...'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Hidden but functional evaluation components */}
          <div style={{ display: 'none' }}>
            <RubricEvaluator
              testCases={testCases}
              shouldStart={shouldStartEvaluation}
              onEvaluationComplete={onEvaluationComplete}
              onError={onEvaluationError}
              onProgress={(currentIndex: number, progress: number) => onEvaluationProgress(currentIndex, progress)}
            />

            <ModelComparisonEvaluator
              testCases={testCasesWithModelOutputs}
              systemPrompt={selectedSystemPrompt}
              shouldStart={shouldStartEvaluation}
              onEvaluationComplete={onModelComparisonEvaluationComplete}
              onError={onEvaluationError}
              onProgress={(currentIndex: number, progress: number) => onEvaluationProgress(currentIndex, progress)}
            />
          </div>

          {/* ModelComparisonStepFull Component */}
          {(analysisStep === 'running' || analysisStep === 'complete') && outcomesWithModelComparison.length > 0 && outcomesWithModelComparison[selectedTestCaseIndex] && (
            <ModelComparisonStepFull
              outcomes={outcomesWithModelComparison}
              selectedTestCaseIndex={selectedTestCaseIndex}
              onTestCaseSelect={onTestCaseSelect}
              onBackToSync={() => {
                setAnalysisStep('setup');
                setHasStartedEvaluation(false);
                setIsStep1Collapsed(false);
              }}
              onRestart={onRestart}
              isLoading={analysisStep === 'running'}
            />
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Evaluation Components - Hidden but functional */}
      <div style={{ display: 'none' }}>
        <RubricEvaluator
          testCases={testCases}
          shouldStart={shouldStartEvaluation}
          onEvaluationComplete={onEvaluationComplete}
          onError={onEvaluationError}
          onProgress={(currentIndex: number, progress: number) => onEvaluationProgress(currentIndex, progress)}
        />

        <ModelComparisonEvaluator
          testCases={testCasesWithModelOutputs}
          systemPrompt={selectedSystemPrompt}
          shouldStart={shouldStartEvaluation}
          onEvaluationComplete={onModelComparisonEvaluationComplete}
          onError={onEvaluationError}
          onProgress={(currentIndex: number, progress: number) => onEvaluationProgress(currentIndex, progress)}
        />
      </div>

      {/* Vertical Stepper */}
      <VerticalStepper steps={steps} />
    </div>
  );
}