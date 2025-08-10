'use client';

import React, { useState, useEffect } from 'react';
import { ModelOutput, TestCase } from '@/types';
import { createPrettifiedMarkdown } from '@/utils/markdownUtils';
import { useStepLoading } from '@/components/steps/VerticalStepper';
import TestCaseNavigation from '@/components/TestCaseNavigation';
import { ModelEvaluationCard, EvaluationResultsTable } from '@/components/evaluation';

// Helper function to determine grid columns based on model count
const getGridCols = (count: number) => {
  switch (count) {
    case 1: return 'grid-cols-1';
    case 2: return 'grid-cols-1 md:grid-cols-2';
    case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
    default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  }
};

export default function ModelOutputsGrid({ 
  modelOutputs,
  isLoading = false,
  loadingModelList = [],
  testCases,
  selectedTestCaseIndex,
  onTestCaseSelect,
  stepId,
  className = "",
  showEvaluationFeatures = true
}: {
  modelOutputs?: ModelOutput[];
  isLoading?: boolean;
  loadingModelList?: string[];
  testCases?: TestCase[];
  selectedTestCaseIndex?: number;
  onTestCaseSelect?: (index: number) => void;
  stepId?: string;
  className?: string;
  showEvaluationFeatures?: boolean;
}) {
  const [viewMode, setViewMode] = useState<'enhanced' | 'simple'>('enhanced');
  const [evaluationViewMode, setEvaluationViewMode] = useState<'cards' | 'table'>('cards');
  
  // Register loading state if stepId is provided
  useStepLoading(stepId || '', isLoading);

  // Determine which models to show - prioritize actual outputs, fall back to loading models
  const displayModels = modelOutputs && modelOutputs.length > 0 ? modelOutputs : 
    loadingModelList.map((modelId, index) => ({ modelId, output: '', index }));

  // Empty state
  if (displayModels.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        No model outputs available yet. Please try running the evaluation again.
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Test Case Navigation with Context */}
      {testCases && selectedTestCaseIndex !== undefined && onTestCaseSelect && (
        <TestCaseNavigation
          testCases={testCases}
          selectedTestCaseIndex={selectedTestCaseIndex}
          onTestCaseSelect={onTestCaseSelect}
          className="mb-6"
        />
      )}

      {/* Model Outputs */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Possible 
        Responses</h3>
        <div className={`grid ${getGridCols(displayModels.length)} gap-4`}>
          {displayModels.map((item, index) => {
            // Check if this specific model is loading
            const isLoadingModel = loadingModelList.includes(item.modelId);
            const hasOutput = 'output' in item && item.output;
            
            return (
              <div key={index} className="border border-gray-200 
              rounded-lg overflow-hidden h-fit">
                {/* Model Header */}
                <div className="bg-gray-50 px-3 py-2 border-b 
                border-gray-200">
                  <div className="flex flex-col space-y-1">
                    <h4 className="text-base font-bold text-gray-900 
                    truncate">
                      Response {index + 1} 
                      <span className="text-xs text-gray-400 font-normal">
                        {" "}(For internal testing only: {item.modelId})
                      </span>
                    </h4>
                  </div>
                </div>
                
                {/* Model Output Content or Loading */}
                <div className="p-6 space-y-4">
                  {isLoadingModel || !hasOutput ? (
                    // Loading state for content
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="w-6 h-6 border-2 
                        border-transparent border-t-blue-600 rounded-full 
                        animate-spin mx-auto mb-3"></div>
                        <p className="text-sm text-slate-600">Creating 
                        response...</p>
                      </div>
                    </div>
                  ) : (
                    // Actual content
                    <div 
                      className="text-sm leading-relaxed overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: 
                      createPrettifiedMarkdown(item.output) }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 mt-6">
        {/* Header with view toggle */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Evaluation Results
          </h3>
          
          {/* Evaluation View Toggle */}
          {!isLoading && modelOutputs && modelOutputs.length > 0 && (
            <div className="flex space-x-2">
              <button
                onClick={() => setEvaluationViewMode('cards')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  evaluationViewMode === 'cards'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setEvaluationViewMode('table')}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  evaluationViewMode === 'table'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Table
              </button>
            </div>
          )}
        </div>

        {showEvaluationFeatures && (
          <>
            {/* Loading State - Waiting for responses */}
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="w-6 h-6 border-2 border-transparent border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm text-slate-600">Waiting for responses to be ready</p>
                </div>
              </div>
            )}

            {/* Loading State - Some models still loading */}
            {!isLoading && loadingModelList.length > 0 && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="w-6 h-6 border-2 border-transparent border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm text-slate-600">Waiting for {loadingModelList.length} model(s) to complete...</p>
                </div>
              </div>
            )}

            {/* Evaluation Results - When responses are ready */}
            {!isLoading && modelOutputs && modelOutputs.length > 0 && (
              <>
                {evaluationViewMode === 'cards' ? (
                  <div className="grid gap-6 lg:grid-cols-2">
                    {modelOutputs.map((modelOutput, index) => (
                      <ModelEvaluationCard 
                        key={modelOutput.modelId}
                        modelOutput={modelOutput}
                        showDetailedRubric={true}
                        responseIndex={index}
                      />
                    ))}
                  </div>
                ) : (
                  <EvaluationResultsTable
                    criteria={[
                      {
                        id: 'overall',
                        name: 'Overall Response Quality',
                        description: 'Comprehensive evaluation of the model response',
                        subcriteria: [
                          {
                            id: 'relevance',
                            name: 'Relevance to Question',
                            description: 'How well the response addresses the given question',
                            scoreLevels: {
                              0: 'Completely irrelevant or off-topic',
                              1: 'Partially relevant but misses key points',
                              2: 'Highly relevant and directly addresses the question'
                            }
                          },
                          {
                            id: 'accuracy',
                            name: 'Accuracy of Information',
                            description: 'Factual correctness and reliability of content',
                            scoreLevels: {
                              0: 'Contains significant factual errors',
                              1: 'Mostly accurate with minor inaccuracies',
                              2: 'Completely accurate and reliable'
                            }
                          },
                          {
                            id: 'completeness',
                            name: 'Completeness of Response',
                            description: 'Whether the response covers all necessary aspects',
                            scoreLevels: {
                              0: 'Incomplete or missing key information',
                              1: 'Partially complete with some gaps',
                              2: 'Comprehensive and complete coverage'
                            }
                          }
                        ]
                      }
                    ]}
                    modelScores={modelOutputs.map((modelOutput, index) => ({
                      modelId: modelOutput.modelId,
                      modelName: `Score (Response ${index + 1})`,
                      scores: {
                        relevance: modelOutput.rubricScores?.relevance || 0,
                        accuracy: modelOutput.rubricScores?.accuracy || 0,
                        completeness: modelOutput.rubricScores?.completeness || 0
                      }
                    }))}
                    title=""
                  />
                )}
              </>
            )}

            {/* No responses available */}
            {!isLoading && (!modelOutputs || modelOutputs.length === 0) && loadingModelList.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No evaluation results available
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}