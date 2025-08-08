'use client';

import { useState, useEffect } from 'react';
import UseCaseSelectorFull from '@/components/output/UseCaseSelectorFull';
import RubricEvaluator from '@/components/output/RubricEvaluator';
import ModelComparisonEvaluator from './ModelComparisonEvaluator';
import VerticalStepper from './VerticalStepper';
import { TestCase, TestCaseWithModelOutputs, Criteria, RubricOutcomeWithModelComparison, ModelOutput } from '../types';

// Helper function to safely calculate average score from rubric scores
const calculateSafeAverageScore = (rubricScores: any): number => {
  if (!rubricScores || typeof rubricScores !== 'object') {
    return 0;
  }
  const scores = Object.values(rubricScores) as number[];
  return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
};

// Helper function to get consistent model display info
const getModelDisplayInfo = (modelId: string, modelName: string) => {
  // Define consistent color scheme and display names for models
  const modelDisplayMap: { [key: string]: { color: string, displayName: string, shortName: string } } = {
    'claude-4-sonnet': { 
      color: 'bg-purple-500', 
      displayName: 'Claude 4 Sonnet', 
      shortName: 'Claude-4'
    },
    'claude-3-sonnet': { 
      color: 'bg-purple-400', 
      displayName: 'Claude 3 Sonnet', 
      shortName: 'Claude-3'
    },
    'claude-3-opus': { 
      color: 'bg-purple-600', 
      displayName: 'Claude 3 Opus', 
      shortName: 'Claude-3-Opus'
    },
    'gpt-4o': { 
      color: 'bg-green-500', 
      displayName: 'GPT-4o', 
      shortName: 'GPT-4o'
    },
    'gpt-4o-mini': { 
      color: 'bg-green-400', 
      displayName: 'GPT-4o Mini', 
      shortName: 'GPT-4o-mini'
    },
    'gpt-4': { 
      color: 'bg-blue-500', 
      displayName: 'GPT-4', 
      shortName: 'GPT-4'
    },
    'gpt-4.1': { 
      color: 'bg-blue-600', 
      displayName: 'GPT-4.1', 
      shortName: 'GPT-4.1'
    },
    'gpt-4.5': { 
      color: 'bg-blue-700', 
      displayName: 'GPT-4.5', 
      shortName: 'GPT-4.5'
    },
    'gpt-4.1-mini': { 
      color: 'bg-blue-300', 
      displayName: 'GPT-4.1 Mini', 
      shortName: 'GPT-4.1-mini'
    },
    'gpt-5': { 
      color: 'bg-emerald-600', 
      displayName: 'GPT-5', 
      shortName: 'GPT-5'
    },
    'gpt-5-mini': { 
      color: 'bg-emerald-400', 
      displayName: 'GPT-5 Mini', 
      shortName: 'GPT-5-mini'
    },
    'gpt-3.5-turbo': { 
      color: 'bg-blue-400', 
      displayName: 'GPT-3.5 Turbo', 
      shortName: 'GPT-3.5'
    },
    'o1': { 
      color: 'bg-orange-500', 
      displayName: 'OpenAI o1', 
      shortName: 'o1'
    },
    'o1-mini': { 
      color: 'bg-orange-400', 
      displayName: 'OpenAI o1-mini', 
      shortName: 'o1-mini'
    },
    'o3-mini': { 
      color: 'bg-orange-600', 
      displayName: 'OpenAI o3-mini', 
      shortName: 'o3-mini'
    },
    'o3-pro': { 
      color: 'bg-orange-700', 
      displayName: 'OpenAI o3-pro', 
      shortName: 'o3-pro'
    },
    'o4': { 
      color: 'bg-amber-600', 
      displayName: 'OpenAI o4', 
      shortName: 'o4'
    },
    'o4-mini': { 
      color: 'bg-amber-400', 
      displayName: 'OpenAI o4-mini', 
      shortName: 'o4-mini'
    },
    'gemini-pro': { 
      color: 'bg-red-500', 
      displayName: 'Gemini Pro', 
      shortName: 'Gemini'
    }
  };

  // Check if we have a specific mapping for this model
  const mappedInfo = modelDisplayMap[modelId] || modelDisplayMap[modelName];
  if (mappedInfo) {
    return mappedInfo;
  }

  // Fallback: generate info based on model name with expanded color palette
  const fallbackColors = [
    'bg-gray-500', 'bg-indigo-500', 'bg-pink-500', 'bg-yellow-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-rose-500', 'bg-violet-500', 'bg-lime-500', 'bg-fuchsia-500',
    'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-slate-500', 'bg-zinc-500'
  ];
  const hash = modelId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const colorIndex = hash % fallbackColors.length;

  return {
    color: fallbackColors[colorIndex],
    displayName: modelName || modelId,
    shortName: (modelName || modelId).length > 12 ? (modelName || modelId).substring(0, 12) + '...' : (modelName || modelId)
  };
};

// Helper function to check if evaluation is in progress for a model output
const isEvaluationInProgress = (rubricScores: any): boolean => {
  if (!rubricScores || typeof rubricScores !== 'object') {
    return false; // No scores available, not evaluated yet
  }
  const scores = Object.values(rubricScores) as number[];
  return scores.length === 0; // Empty scores object means evaluation in progress
};

// Helper function to check if a model output has been evaluated
const hasBeenEvaluated = (rubricScores: any): boolean => {
  if (!rubricScores || typeof rubricScores !== 'object') {
    return false;
  }
  const scores = Object.values(rubricScores) as number[];
  return scores.length > 0 && scores.every(score => typeof score === 'number' && !isNaN(score));
};

// Component for displaying simple content comparison without section-based grouping
const GroupedContentDisplay = ({ modelOutputs }: { modelOutputs: any[] }) => {
  if (modelOutputs.length < 2) return null;

  return (
    <div className="mb-6">
      <h5 className="font-medium text-gray-900 mb-3 flex items-center">
        <span className="mr-2">🔍</span>
        Content Overview
      </h5>
      
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h6 className="font-medium text-gray-900 flex items-center mb-3">
            <span className="mr-2">📄</span>
            All Model Outputs
          </h6>
          
          <div className={`grid gap-4 ${
            modelOutputs.length === 1 
              ? 'grid-cols-1 max-w-lg mx-auto'
              : modelOutputs.length === 2 
                ? 'grid-cols-1 lg:grid-cols-2' 
                : modelOutputs.length === 3
                  ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}>
            {modelOutputs.map((modelOutput) => {
              const modelInfo = getModelDisplayInfo(modelOutput.modelId, modelOutput.modelName);
              const isInProgress = isEvaluationInProgress(modelOutput.rubricScores);
              const isEvaluated = hasBeenEvaluated(modelOutput.rubricScores);
              
              return (
                <div key={modelOutput.modelId} className="bg-white p-3 rounded border shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${modelInfo.color}`}></div>
                      <span className="text-sm font-medium text-gray-700">{modelInfo.displayName}</span>
                    </div>
                    {isInProgress ? (
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="text-xs text-gray-500">Loading...</span>
                      </div>
                    ) : isEvaluated ? (
                      <span className="text-xs font-bold text-blue-600">
                        {calculateSafeAverageScore(modelOutput.rubricScores).toFixed(1)}/5
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Pending</span>
                    )}
                  </div>
                  
                  <div className="text-sm leading-relaxed">
                    {isInProgress ? (
                      <div className="bg-blue-50 p-2 rounded">
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                          <span className="text-xs text-blue-700">Generating output...</span>
                        </div>
                      </div>
                    ) : modelOutput.output ? (
                      <div className="text-gray-700 whitespace-pre-wrap line-clamp-6">
                        {modelOutput.output.length > 300 
                          ? modelOutput.output.substring(0, 300) + '...' 
                          : modelOutput.output
                        }
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">No content available</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

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
  setValidationError: (error: string) => void;
}

export default function UnifiedAnalysisView({
  testCases,
  testCasesWithModelOutputs,
  criteria,
  outcomes,
  outcomesWithModelComparison,
  selectedUseCaseId,
  selectedScenarioCategory,
  selectedSystemPrompt,
  selectedTestCaseIndex,
  currentUseCaseType,
  isLoading,
  shouldStartEvaluation,
  evaluationProgress,
  currentTestCaseIndex,
  validationError,
  onUseCaseSelected,
  onScenarioCategorySelected,
  onUseCaseDataLoaded,
  onUseCaseError,
  onEvaluationComplete,
  onModelComparisonEvaluationComplete,
  onEvaluationError,
  onEvaluationProgress,
  onStartEvaluation,
  onTestCaseSelect,
  setValidationError,
}: UnifiedAnalysisViewProps) {
  const [analysisStep, setAnalysisStep] = useState<'setup' | 'running' | 'complete'>('setup');
  const [hasStartedEvaluation, setHasStartedEvaluation] = useState(false);
  const [isStep1Collapsed, setIsStep1Collapsed] = useState(false);
  const [showComparisonTool, setShowComparisonTool] = useState(true);
  const [expandedOutputs, setExpandedOutputs] = useState<Set<string>>(new Set());

  // Helper function to toggle output expansion
  const toggleOutputExpansion = (modelId: string) => {
    setExpandedOutputs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(modelId)) {
        newSet.delete(modelId);
      } else {
        newSet.add(modelId);
      }
      return newSet;
    });
  };

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
          {/* Use Case Selection */}
          <div>
            <UseCaseSelectorFull
              onUseCaseSelected={onUseCaseSelected}
              onScenarioCategorySelected={onScenarioCategorySelected}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Context:</span>
                      <p className="text-gray-600 mt-1">{testCases[selectedTestCaseIndex].expectedOutput?.substring(0, 150) || 'No context available'}...</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Input:</span>
                      <p className="text-gray-600 mt-1">{testCases[selectedTestCaseIndex].input?.substring(0, 150) || 'No input available'}...</p>
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
      description: 'Running model evaluations and comparisons',
      status: analysisStep === 'running' ? 'current' as const : analysisStep === 'complete' ? 'completed' as const : 'upcoming' as const,
      isCollapsed: false, // Never collapse step 2
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

          {/* ModelComparisonStepFull-style Results Display */}
          {(analysisStep === 'running' || analysisStep === 'complete') && outcomesWithModelComparison.length > 0 && outcomesWithModelComparison[selectedTestCaseIndex] && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-medium text-gray-900 mb-2">
                  Results Review
                </h2>
                <p className="text-gray-600">Review and compare model performance</p>
              </div>

              {/* Test Case Navigation */}
              <div className="flex justify-center space-x-2 mb-8">
                {outcomesWithModelComparison.map((outcome, index) => (
                  <button
                    key={outcome.testCaseId}
                    onClick={() => onTestCaseSelect(index)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedTestCaseIndex === index
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Test Case {index + 1}
                  </button>
                ))}
              </div>

              {/* Shared Input and Context Section */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Test Case {selectedTestCaseIndex + 1} - Shared Input & Context
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Context</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      {outcomesWithModelComparison[selectedTestCaseIndex].testCase.expectedOutput}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Input</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      {outcomesWithModelComparison[selectedTestCaseIndex].testCase.input}
                    </div>
                  </div>
                </div>
              </div>

              {/* Model Outputs Comparison */}
              <div className="bg-white border rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Model Comparison ({outcomesWithModelComparison[selectedTestCaseIndex].testCase.modelOutputs.length} models)
                </h3>

                {/* Grouped Content Display */}
                {outcomesWithModelComparison[selectedTestCaseIndex].testCase.modelOutputs.length > 1 && (
                  <GroupedContentDisplay modelOutputs={outcomesWithModelComparison[selectedTestCaseIndex].testCase.modelOutputs} />
                )}

                {outcomesWithModelComparison[selectedTestCaseIndex].testCase.modelOutputs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No model outputs available for comparison.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {outcomesWithModelComparison[selectedTestCaseIndex].testCase.modelOutputs.map((modelOutput, index) => {
                      const modelInfo = getModelDisplayInfo(modelOutput.modelId, modelOutput.modelName);
                      const isInProgress = isEvaluationInProgress(modelOutput.rubricScores);
                      const isEvaluated = hasBeenEvaluated(modelOutput.rubricScores);
                      
                      return (
                        <div key={modelOutput.modelId} className="border rounded-lg p-4 bg-white">
                          {/* Model Header */}
                          <div className="flex items-center justify-between mb-3 pb-2 border-b">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${modelInfo.color}`}></div>
                              <h4 className="font-medium text-gray-900">
                                {modelInfo.displayName}
                              </h4>
                            </div>
                            {isInProgress && (
                              <div className="flex items-center space-x-1">
                                <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                                <span className="text-xs text-gray-500">Loading...</span>
                              </div>
                            )}
                          </div>

                          {/* Rubric Scores */}
                          <div className="mb-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Scores</h5>
                            {isInProgress ? (
                              <div className="bg-blue-50 p-2 rounded">
                                <div className="flex items-center space-x-2">
                                  <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                                  <span className="text-xs text-blue-700">Evaluating...</span>
                                </div>
                              </div>
                            ) : isEvaluated && modelOutput.rubricScores && Object.keys(modelOutput.rubricScores).length > 0 ? (
                              <div className="space-y-1">
                                {Object.entries(modelOutput.rubricScores).map(([criteria, score]) => (
                                  <div key={criteria} className="flex justify-between items-center py-1">
                                    <span className="text-sm text-gray-600 capitalize">{criteria}</span>
                                    <span className="text-sm font-medium">{score}/5</span>
                                  </div>
                                ))}
                                {outcomesWithModelComparison[selectedTestCaseIndex].testCase.modelOutputs.length > 1 && (
                                  <div className="pt-1 mt-2 border-t border-gray-200">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium text-gray-700">Average</span>
                                      <span className="text-sm font-bold text-blue-600">
                                        {calculateSafeAverageScore(modelOutput.rubricScores).toFixed(1)}/5
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-gray-400">No scores available</div>
                            )}
                          </div>

                          {/* Feedback */}
                          <div className="mb-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Feedback</h5>
                            <div className="text-sm text-gray-600 leading-relaxed">
                              {isInProgress ? (
                                <div className="bg-blue-50 p-2 rounded">
                                  <span className="text-xs text-blue-700">Generating feedback...</span>
                                </div>
                              ) : (
                                modelOutput.feedback || 'No feedback available'
                              )}
                            </div>
                          </div>

                          {/* Output Display */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="text-sm font-medium text-gray-700">Full Output</h5>
                              <button
                                onClick={() => toggleOutputExpansion(modelOutput.modelId)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                              >
                                {expandedOutputs.has(modelOutput.modelId) ? 'Hide' : 'Show'}
                              </button>
                            </div>
                            
                            {expandedOutputs.has(modelOutput.modelId) && (
                              <div className="bg-gray-50 border rounded p-3 max-h-80 overflow-y-auto">
                                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                  {isInProgress ? (
                                    <div className="bg-blue-50 p-2 rounded">
                                      <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                                        <span className="text-xs text-blue-700">Generating output...</span>
                                      </div>
                                    </div>
                                  ) : (
                                    modelOutput.output || 'No output available'
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Floating Comparison Tool */}
              {outcomesWithModelComparison[selectedTestCaseIndex].testCase.modelOutputs.length > 1 && showComparisonTool && (
                <div className={`fixed bottom-6 right-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 ${
                  outcomesWithModelComparison[selectedTestCaseIndex].testCase.modelOutputs.length > 6 ? 'max-w-md' : 'max-w-sm'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 flex items-center">
                      <span className="mr-2">🔍</span>
                      Live Comparison ({outcomesWithModelComparison[selectedTestCaseIndex].testCase.modelOutputs.length})
                    </h4>
                    <button 
                      onClick={() => setShowComparisonTool(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className={`space-y-2 ${
                    outcomesWithModelComparison[selectedTestCaseIndex].testCase.modelOutputs.length > 8 ? 'max-h-64 overflow-y-auto' : ''
                  }`}>
                    {outcomesWithModelComparison[selectedTestCaseIndex].testCase.modelOutputs.map((modelOutput, index) => {
                      const isEvaluated = hasBeenEvaluated(modelOutput.rubricScores);
                      const isInProgress = isEvaluationInProgress(modelOutput.rubricScores);
                      const avgScore = calculateSafeAverageScore(modelOutput.rubricScores);
                      const maxScore = Math.max(...outcomesWithModelComparison[selectedTestCaseIndex].testCase.modelOutputs.map(mo => calculateSafeAverageScore(mo.rubricScores)));
                      const isBest = isEvaluated && avgScore === maxScore && avgScore > 0;
                      const modelInfo = getModelDisplayInfo(modelOutput.modelId, modelOutput.modelName);
                      
                      return (
                        <div key={modelOutput.modelId} className={`flex items-center justify-between p-2 rounded border ${
                          isBest ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${modelInfo.color}`}></div>
                            <span className="text-sm font-medium">{modelInfo.shortName}</span>
                            {isBest && <span className="text-xs bg-green-100 text-green-800 px-1 rounded">Best</span>}
                          </div>
                          {isInProgress ? (
                            <div className="flex items-center space-x-1">
                              <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                              <span className="text-xs text-gray-500">Evaluating...</span>
                            </div>
                          ) : isEvaluated ? (
                            <span className={`font-bold text-sm ${
                              isBest ? 'text-green-600' : 'text-gray-600'
                            }`}>
                              {avgScore.toFixed(1)}/5
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">Not evaluated</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Show Comparison Tool Button */}
              {outcomesWithModelComparison[selectedTestCaseIndex].testCase.modelOutputs.length > 1 && !showComparisonTool && (
                <div className="fixed bottom-6 right-6 z-50">
                  <button 
                    onClick={() => setShowComparisonTool(true)}
                    className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                    title="Show Comparison Tool"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Refinement Suggestions */}
              {outcomesWithModelComparison[selectedTestCaseIndex].refinementSuggestions.length > 0 && (
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Suggestions for Improvement
                  </h3>
                  <ul className="space-y-1">
                    {outcomesWithModelComparison[selectedTestCaseIndex].refinementSuggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        • {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
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

      {/* Detailed Results View - Only show when completed and expanded */}
      {analysisStep === 'complete' && outcomesWithModelComparison.length > 0 && outcomesWithModelComparison[selectedTestCaseIndex] && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Detailed Results - Test Case {selectedTestCaseIndex + 1}
          </h2>
          
          <div className="space-y-6">
            {/* Input and Expected Output */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Input</h3>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  {outcomesWithModelComparison[selectedTestCaseIndex].testCase.input}
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Expected Output</h3>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  {outcomesWithModelComparison[selectedTestCaseIndex].testCase.expectedOutput}
                </div>
              </div>
            </div>

            {/* Model Outputs */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Model Outputs & Scores</h3>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {outcomesWithModelComparison[selectedTestCaseIndex].testCase.modelOutputs.map((output, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{output.modelName}</h4>
                      {output.rubricScores && Object.keys(output.rubricScores).length > 0 && (
                        <span className="text-sm font-bold text-blue-600">
                          {(Object.values(output.rubricScores).reduce((a: number, b: number) => a + b, 0) / Object.values(output.rubricScores).length).toFixed(1)}/5
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-3">
                      {output.output ? (
                        output.output.length > 150 
                          ? output.output.substring(0, 150) + '...'
                          : output.output
                      ) : 'No output available'}
                    </div>

                    {output.rubricScores && Object.keys(output.rubricScores).length > 0 && (
                      <div className="space-y-1 mb-3">
                        {Object.entries(output.rubricScores).map(([criteria, score]) => (
                          <div key={criteria} className="flex justify-between text-xs">
                            <span className="text-gray-600 capitalize">{criteria}</span>
                            <span className="font-medium">{score}/5</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {output.feedback && (
                      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        <strong>Feedback:</strong> {output.feedback.substring(0, 120)}
                        {output.feedback.length > 120 && '...'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}