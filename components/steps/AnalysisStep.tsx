'use client';

import RubricEvaluator from '@/components/RubricEvaluator';
import ModelComparisonEvaluator from '@/components/(archived)/output-analysis/ModelComparisonEvaluator';
import GeneratingResponsesContent from '@/components/GeneratingResponsesContent';
import TestCaseNavigation from '@/components/TestCaseNavigation';
import TestCaseContext from '@/components/TestCaseContext';
import ModelOutputsGrid from '@/components/ModelOutputsGrid';
import { TestCase, TestCaseWithModelOutputs } from '@/types';
import { OUTPUT_GENERATION_MODELS } from '@/app/api/model-evaluation/route';

interface AnalysisStepProps {
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
}

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
}: AnalysisStepProps) {
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
          {(() => {
            const displayTestCases = localTestCasesWithModelOutputs.length > 0 ? localTestCasesWithModelOutputs : testCasesWithModelOutputs;
            const currentTestCase = displayTestCases[selectedTestCaseIndex];
            
            console.log('🔍 UI Render Debug:', {
              currentPhase,
              localTestCasesLength: localTestCasesWithModelOutputs.length,
              propsTestCasesLength: testCasesWithModelOutputs.length,
              displayTestCasesLength: displayTestCases.length,
              selectedTestCaseIndex,
              currentTestCase: currentTestCase ? 'exists' : 'null',
              modelOutputsLength: currentTestCase?.modelOutputs?.length || 0,
              analysisStep,
              shouldStartEvaluation
            });
            
            // Additional debug for current test case
            if (currentTestCase) {
              console.log('🔍 Current test case details:', {
                id: currentTestCase.id,
                hasModelOutputs: !!currentTestCase.modelOutputs,
                modelOutputsArray: currentTestCase.modelOutputs,
                modelOutputsCount: currentTestCase.modelOutputs?.length || 0
              });
            }
            
            // Show loading cards during generation phase
            if (currentPhase === 'generating') {
              const modelList = OUTPUT_GENERATION_MODELS; // From API route

              return (
                <GeneratingResponsesContent 
                  testCases={testCases}
                  selectedTestCaseIndex={selectedTestCaseIndex}
                  onTestCaseSelect={onTestCaseSelect}
                  modelList={modelList}
                  getGridCols={getGridCols}
                />
              );
            }
            
            if (!currentTestCase) {
              return (
                <div className="text-center py-8 text-gray-500">
                  No test case data available. Please ensure test cases are loaded and try again.
                </div>
              );
            }

            return (
              <>
                {/* Test Case Navigation */}
                <TestCaseNavigation
                  testCasesCount={displayTestCases.length}
                  selectedTestCaseIndex={selectedTestCaseIndex}
                  onTestCaseSelect={onTestCaseSelect}
                  className="mb-6"
                />

                {/* Test Case Context */}
                <TestCaseContext
                  testCase={currentTestCase}
                  testCaseIndex={selectedTestCaseIndex}
                  className="mb-6"
                />

                {/* Model Outputs Grid */}
                <ModelOutputsGrid
                  modelOutputs={currentTestCase.modelOutputs || []}
                />
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}