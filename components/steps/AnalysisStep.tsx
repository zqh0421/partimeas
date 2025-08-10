'use client';

import { useState, useEffect } from 'react';
import RubricEvaluator from '@/components/RubricEvaluator';
import { ModelComparisonEvaluator } from '@/components';
import ModelOutputsGrid from '@/components/ModelOutputsGrid';
import { TestCase, TestCaseWithModelOutputs, ModelOutput } from '@/types';
import { OUTPUT_GENERATION_MODELS } from '@/app/api/model-evaluation/route';



export default function AnalysisStep({
  testCases,
  testCasesWithModelOutputs,
  localTestCasesWithModelOutputs,
  selectedTestCaseIndex,
  selectedSystemPrompt,
  analysisStep,
  currentPhase,
  shouldStartEvaluation,
  onTestCaseSelect,
  onEvaluationComplete,
  onModelComparisonEvaluationComplete,
  onEvaluationError,
  onEvaluationProgress
}: {
  testCases: TestCase[];
  testCasesWithModelOutputs: TestCaseWithModelOutputs[];
  localTestCasesWithModelOutputs: TestCaseWithModelOutputs[];
  selectedTestCaseIndex: number;
  selectedSystemPrompt: string;
  analysisStep: 'setup' | 'running' | 'complete';
  currentPhase: 'generating' | 'evaluating' | 'complete';
  shouldStartEvaluation: boolean;
  onTestCaseSelect: (index: number) => void;
  onEvaluationComplete: (results: any[]) => void;
  onModelComparisonEvaluationComplete: (results: Array<{
    testCaseId: string;
    modelOutputs: any[];
    rubricEffectiveness: 'high' | 'medium' | 'low';
    refinementSuggestions: string[];
  }>) => void;
  onEvaluationError: (error: string) => void;
  onEvaluationProgress: (currentIndex: number, progress: number) => void;
}) {
  // Dynamic state management for ModelOutputsGrid parameters
  const [isGridLoading, setIsGridLoading] = useState(false);
  const [gridModelOutputs, setGridModelOutputs] = useState<ModelOutput[]>([]);
  const [displayTestCases, setDisplayTestCases] = useState<TestCaseWithModelOutputs[]>([]);

  // Update grid parameters based on current state
  useEffect(() => {
    if (currentPhase === 'generating') {
      setIsGridLoading(true);
      setGridModelOutputs([]);
    } else {
      setIsGridLoading(false);
      const currentDisplayTestCases = localTestCasesWithModelOutputs.length > 0 
        ? localTestCasesWithModelOutputs 
        : testCasesWithModelOutputs;
      
      setDisplayTestCases(currentDisplayTestCases);
      
      const currentTestCase = currentDisplayTestCases[selectedTestCaseIndex];
      if (currentTestCase?.modelOutputs) {
        setGridModelOutputs(currentTestCase.modelOutputs);
      } else {
        setGridModelOutputs([]);
      }
    }
  }, [currentPhase, localTestCasesWithModelOutputs, testCasesWithModelOutputs, selectedTestCaseIndex]);

  return (
    <div className="space-y-6">
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

      {/* Test Case Results Display */}
      {(analysisStep === 'running' || analysisStep === 'complete') && (
        <div className="space-y-4">
          {displayTestCases[selectedTestCaseIndex] || isGridLoading ? (
            <ModelOutputsGrid
              modelOutputs={gridModelOutputs}
              isLoading={isGridLoading}
              loadingModelList={isGridLoading ? OUTPUT_GENERATION_MODELS : []}
              testCases={isGridLoading ? testCases : displayTestCases}
              selectedTestCaseIndex={selectedTestCaseIndex}
              onTestCaseSelect={onTestCaseSelect}
              stepId={isGridLoading ? "analysis" : undefined}
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