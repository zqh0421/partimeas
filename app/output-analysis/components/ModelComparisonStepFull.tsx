import { useState } from 'react';
import { RubricOutcomeWithModelComparison } from '../types';

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
              
              return (
                <div key={modelOutput.modelId} className="bg-white p-3 rounded border shadow-sm">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className={`w-2 h-2 rounded-full ${modelInfo.color}`}></div>
                    <span className="text-sm font-medium text-gray-700">{modelInfo.displayName}</span>
                  </div>
                  
                  <div className="text-sm leading-relaxed">
                    {modelOutput.output ? (
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

interface ModelComparisonStepProps {
  outcomes: RubricOutcomeWithModelComparison[];
  selectedTestCaseIndex: number;
  onTestCaseSelect: (index: number) => void;
  onBackToSync: () => void;
  onRestart?: () => void;
  isLoading?: boolean;
}

export default function ModelComparisonStep({
  outcomes,
  selectedTestCaseIndex,
  onTestCaseSelect,
  onBackToSync,
  onRestart,
  isLoading = false,
}: ModelComparisonStepProps) {
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

  // Enhanced Loading state with progress tracking
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-900 mb-2">
            Possible Responses
          </h2>
          <p className="text-gray-600">Generating outputs from multiple AI models...</p>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="text-center py-8">
            {/* Loading spinner */}
            <div className="flex justify-center mb-4">
              <div className="w-8 h-8 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            
            {/* Progress information */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900">
                Processing Test Cases
              </h3>
              
              {outcomes.length > 0 && (
                <div>
                  <div className="flex justify-center text-sm text-gray-600 mb-2">
                    Test Case {selectedTestCaseIndex + 1} of {outcomes.length}
                  </div>
                  <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(10, ((selectedTestCaseIndex + 1) / outcomes.length) * 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round(((selectedTestCaseIndex + 1) / outcomes.length) * 100)}% analyzed
                  </div>
                </div>
              )}
              
              <div className="text-sm text-gray-500 space-y-1">
                <p>• Generating responses from multiple AI models</p>
                <p>• Evaluating outputs using rubric criteria</p>
                <p>• Preparing comparison results</p>
              </div>
              
              <div className="mt-4 text-xs text-gray-400">
                This may take a few minutes depending on the number of models and test cases.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!outcomes[selectedTestCaseIndex]) {
    return null;
  }

  const currentOutcome = outcomes[selectedTestCaseIndex];
  const { testCase } = currentOutcome;

  // Model outputs for display
  const allModelOutputs = testCase.modelOutputs;

  return (
    <div className="space-y-6">

      {/* Test Case Navigation */}
      <div className="flex justify-center space-x-2 mb-8">
        {outcomes.map((outcome, index) => (
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
          Test Case {selectedTestCaseIndex + 1}
        </h3>
        
        <div className="grid grid-cols-1 gap-6">
          <div>
            <div className="bg-gray-50 p-3 rounded text-sm">
              <p className="text-gray-600 mt-1 font-bold">{testCase.context || 'No context available'}</p>
              <p className="text-gray-600 mt-1">{testCase.input || 'No input available'}</p>
            </div>
          </div>
          </div>
      </div>

      {/* Model Outputs Comparison - Simplified */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
        {testCase.modelOutputs.length} Possible Responses
        </h3>

        {/* Grouped Content Display */}
        {testCase.modelOutputs.length > 1 && (
          <GroupedContentDisplay modelOutputs={testCase.modelOutputs} />
        )}

        {testCase.modelOutputs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No model outputs available for comparison.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {testCase.modelOutputs.map((modelOutput, index) => {
              const modelInfo = getModelDisplayInfo(modelOutput.modelId, modelOutput.modelName);
              return (
              <div key={modelOutput.modelId} className="border rounded-lg p-4 bg-white">
                {/* Model Header - Simplified */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${modelInfo.color}`}></div>
                    <h4 className="font-medium text-gray-900">
                      {modelInfo.displayName}
                    </h4>
                  </div>
                </div>

                {/* Rubric Scores - Simplified */}
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Scores</h5>
                  {modelOutput.rubricScores && Object.keys(modelOutput.rubricScores).length > 0 ? (
                    <div className="space-y-1">
                      {Object.entries(modelOutput.rubricScores).map(([criteria, score]) => (
                        <div key={criteria} className="flex justify-between items-center py-1">
                          <span className="text-sm text-gray-600 capitalize">{criteria}</span>
                          <span className="text-sm font-medium">{score}/5</span>
                        </div>
                      ))}
                      {testCase.modelOutputs.length > 1 && (
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

                {/* Feedback - Simplified */}
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Feedback</h5>
                  <div className="text-sm text-gray-600 leading-relaxed">
                    {modelOutput.feedback || 'No feedback available'}
                  </div>
                </div>

                {/* Suggestions - Simplified */}
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Suggestions</h5>
                  {modelOutput.suggestions && modelOutput.suggestions.length > 0 ? (
                    <ul className="space-y-1">
                      {modelOutput.suggestions.map((suggestion, suggestionIndex) => (
                        <li key={suggestionIndex} className="text-sm text-gray-600">
                          • {suggestion}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-gray-400">No suggestions available</div>
                  )}
                </div>

                {/* Output Display - Simplified */}
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
                  
                  {expandedOutputs.has(modelOutput.modelId) && modelOutput.output && (
                    <div className="bg-gray-50 border rounded p-3 max-h-80 overflow-y-auto">
                      <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {modelOutput.output}
                      </div>
                    </div>
                  )}
                </div>
              </div>);
            })}
          </div>
        )}
      </div>

      {/* Floating Comparison Tool */}
      {testCase.modelOutputs.length > 1 && showComparisonTool && (
        <div className={`fixed bottom-6 right-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 ${
          testCase.modelOutputs.length > 6 ? 'max-w-md' : 'max-w-sm'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 flex items-center">
              <span className="mr-2">🔍</span>
              Live Comparison ({testCase.modelOutputs.length})
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
            testCase.modelOutputs.length > 8 ? 'max-h-64 overflow-y-auto' : ''
          }`}>
            {testCase.modelOutputs.map((modelOutput, index) => {
              const isEvaluated = hasBeenEvaluated(modelOutput.rubricScores);
              const isInProgress = isEvaluationInProgress(modelOutput.rubricScores);
              const avgScore = calculateSafeAverageScore(modelOutput.rubricScores);
              const maxScore = Math.max(...testCase.modelOutputs.map(mo => calculateSafeAverageScore(mo.rubricScores)));
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
      {testCase.modelOutputs.length > 1 && !showComparisonTool && (
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

      {/* Refinement Suggestions - Simplified */}
      {currentOutcome.refinementSuggestions.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Suggestions for Improvement
          </h3>
          <ul className="space-y-1">
            {currentOutcome.refinementSuggestions.map((suggestion, index) => (
              <li key={index} className="text-sm text-gray-600">
                • {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={onBackToSync}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back to Configuration
        </button>
        {onRestart && (
          <button
            onClick={onRestart}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Restart Analysis</span>
          </button>
        )}
      </div>
    </div>
  );
} 