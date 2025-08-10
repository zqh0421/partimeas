'use client';

import { useMemo } from 'react';
import RubricEvaluator from '@/components/RubricEvaluator';
import { ModelComparisonEvaluator } from '@/components';
import ModelOutputsGrid from '@/components/ModelOutputsGrid';
import { TestCase, TestCaseWithModelOutputs, ModelOutput } from '@/types';
import { OUTPUT_GENERATION_MODELS } from '@/app/api/model-evaluation/route';

interface AnalysisStepProps {
  testCases: TestCase[];
  testCasesWithModelOutputs: TestCaseWithModelOutputs[];
  
  selectedTestCaseIndex: number;
  selectedSystemPrompt: string;
  analysisStep: 'setup' | 'running' | 'complete';
  currentPhase: 'generating' | 'evaluating' | 'complete';
  shouldStartEvaluation: boolean;
  onTestCaseSelect: (index: number) => void;
  onEvaluationComplete: (results: any[]) => void;
  onModelComparisonEvaluationComplete: (results: Array<{
    testCaseId: string;
    modelOutputs: ModelOutput[];
    rubricEffectiveness: 'high' | 'medium' | 'low';
    refinementSuggestions: string[];
  }>) => void;
  onEvaluationError: (error: string) => void;
  onEvaluationProgress: (currentIndex: number, progress: number) => void;
}

export default function AnalysisStep({
  currentPhase,
  testCasesWithModelOutputs,
  selectedTestCaseIndex,
  testCases,
  shouldStartEvaluation,
  analysisStep,
  selectedSystemPrompt,
  onTestCaseSelect,
  onEvaluationComplete,
  onEvaluationError,
  onEvaluationProgress,
  onModelComparisonEvaluationComplete,
}: AnalysisStepProps) {
  const gridConfig = useMemo(() => {
    const isLoading = currentPhase === 'generating';
    const currentTestCase = testCasesWithModelOutputs[selectedTestCaseIndex];
    
    return {
      isLoading,
      modelOutputs: isLoading ? [] : (currentTestCase?.modelOutputs || []),
      testCases: isLoading ? testCases : testCasesWithModelOutputs,
      loadingModelList: isLoading ? OUTPUT_GENERATION_MODELS : [],
      stepId: isLoading ? "analysis" : undefined,
    };
  }, [
    currentPhase, 
    testCasesWithModelOutputs, 
    selectedTestCaseIndex, 
    testCases
  ]);

  return (
    <div className="space-y-6">
      {/* Hidden but functional evaluation components */}
      <div style={{ display: 'none' }}>
        <RubricEvaluator
          testCases={testCases}
          shouldStart={shouldStartEvaluation}
          onEvaluationComplete={onEvaluationComplete}
          onError={onEvaluationError}
          onProgress={onEvaluationProgress}
        />

        <ModelComparisonEvaluator
          testCases={testCasesWithModelOutputs}
          systemPrompt={selectedSystemPrompt}
          shouldStart={shouldStartEvaluation}
          onEvaluationComplete={onModelComparisonEvaluationComplete}
          onError={onEvaluationError}
          onProgress={onEvaluationProgress}
        />
      </div>

      {/* Test Case Results Display */}
      {(analysisStep === 'running' || analysisStep === 'complete') && (
        <div className="space-y-4">
          {testCasesWithModelOutputs[selectedTestCaseIndex] || gridConfig.isLoading ? (
            <ModelOutputsGrid
              modelOutputs={gridConfig.modelOutputs}
              isLoading={gridConfig.isLoading}
              loadingModelList={gridConfig.loadingModelList}
              testCases={gridConfig.testCases}
              selectedTestCaseIndex={selectedTestCaseIndex}
              onTestCaseSelect={onTestCaseSelect}
              stepId={gridConfig.stepId}
              className="space-y-4"
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              Failed to load test case data. Please refresh and try again.
            </div>
          )}
        </div>
      )}
    </div>
  );
}