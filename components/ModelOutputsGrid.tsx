'use client';

import React, { useState } from 'react';
import { ModelOutput, TestCase } from '@/types';
import { createPrettifiedMarkdown } from '@/utils/markdownUtils';
import { useStepLoading } from '@/components/steps/VerticalStepper';
import TestCaseNavigation from '@/components/TestCaseNavigation';
import RealCriteriaTable from '@/components/evaluation/RealCriteriaTable';
import MockCriteriaTable from '@/components/evaluation/MockCriteriaTable';

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
  showEvaluationFeatures = true,
  isRealEvaluation = false,
  currentPhase = 'generating',
  numOutputsToShow = 2
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
  isRealEvaluation?: boolean;
  currentPhase?: 'generating' | 'evaluating' | 'complete';
  numOutputsToShow?: number;
}) {
  const [viewMode, setViewMode] = useState<'enhanced' | 'simple'>('enhanced');
  const [evaluationViewMode, setEvaluationViewMode] = useState<'cards' | 'table'>('cards');
  const [useRealCriteria, setUseRealCriteria] = useState(false);
  
  // Register loading state if stepId is provided
  useStepLoading(stepId || '', isLoading);

  // Determine which models to show - prioritize actual outputs, fall back to loading models
  // When loading, show the configured number of outputs to display
  const displayModels = modelOutputs && modelOutputs.length > 0 ? modelOutputs : 
    (isLoading ? 
      // Create loading placeholders based on numOutputsToShow
      Array.from({ length: numOutputsToShow }, (_, index) => ({ 
        modelId: `loading-${index + 1}`, 
        output: '', 
        index 
      })) :
      // Use actual loading model list if available
      loadingModelList.map((modelId, index) => ({ modelId, output: '', index }))
    );

  // Empty state - only show if we have no models to display at all
  if (displayModels.length === 0 && !isLoading) {
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
        <h3 className="text-lg font-medium text-gray-900">
          Possible Responses
        </h3>
        <div className={`grid ${getGridCols(displayModels.length)} gap-4`}>
          {displayModels.map((item, index) => {
            // Check if this specific model is loading
            const isLoadingModel = loadingModelList.includes(item.modelId) || (isLoading && item.modelId.startsWith('loading-'));
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
                       {/* <span className="text-xs text-gray-400 font-normal">
                         {!isLoadingModel && ` (Internal test: ${item.modelId})`}
                       </span> */}
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
                        <p className="text-sm text-slate-600">
                          {isLoading ? `Preparing response...` : 'Preparing response...'}
                        </p>
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

      {showEvaluationFeatures && (
        <div className="space-y-4 mt-6">
          {/* Header with view toggle */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {isRealEvaluation
                ? 'Evaluation Results'
                : ''}
            </h3>
          </div>

          <>
            {/* Loading State - Waiting for responses */}
            {isLoading && isRealEvaluation && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="w-6 h-6 border-2 border-transparent border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm text-slate-600">Waiting for responses to be ready...</p>
                </div>
              </div>
            )}

            {/* Loading State - Evaluating responses */}
            {!isLoading && currentPhase === 'evaluating' && isRealEvaluation && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="w-6 h-6 border-2 border-transparent border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm text-slate-600">Evaluating responses...</p>
                </div>
              </div>
            )}

            {/* Loading State - Some models still loading */}
            {!isLoading && currentPhase !== 'evaluating' && loadingModelList.length > 0 && isRealEvaluation && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="w-6 h-6 border-2 border-transparent border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm text-slate-600">Waiting for {loadingModelList.length} model(s) to complete...</p>
                </div>
              </div>
            )}

            {/* Evaluation Results - When responses are ready and evaluation is complete */}
            {!isLoading && currentPhase === 'complete' && modelOutputs && modelOutputs.length > 0 && (
              isRealEvaluation && (
                <RealCriteriaTable
                  modelScores={modelOutputs.map((modelOutput, index) => ({
                    modelId: modelOutput.modelId,
                    modelName: `Response ${index + 1} (${modelOutput.modelId})`,
                    scores: {
                      // Pass the actual rubricScores for mapping
                      relevance: modelOutput.rubricScores?.relevance || 0,
                      accuracy: modelOutput.rubricScores?.accuracy || 0,
                      completeness: modelOutput.rubricScores?.completeness || 0
                    }
                  }))}
                />
              ) 
            )}

            {/* No responses available */}
            {!isLoading && currentPhase === 'complete' && (!modelOutputs || modelOutputs.length === 0) && loadingModelList.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No evaluation results available
              </div>
            )}
          </>
        </div>
      )}
    </div>
  );
}