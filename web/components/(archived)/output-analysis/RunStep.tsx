import RubricEvaluator, { EvaluationResult } from '@/components/RubricEvaluator';
import ModelComparisonEvaluator from './ModelComparisonEvaluator';
import { TestCase, TestCaseWithModelOutputs, Criteria } from '@/types/types';
import { useEffect, useState } from 'react';

// Helper function to convert test case results to TestCaseWithModelOutputs format
const createTestCasesWithModelOutputs = (
  originalTestCases: TestCase[], 
  results: Array<{ status: 'fulfilled' | 'rejected', value?: any, reason?: any }>
): TestCaseWithModelOutputs[] => {
  const testCasesWithOutputs: TestCaseWithModelOutputs[] = [];
  
  for (let i = 0; i < originalTestCases.length; i++) {
    const originalTestCase = originalTestCases[i];
    const result = results[i];
    
    if (result.status === 'fulfilled' && result.value) {
      testCasesWithOutputs.push({
        id: originalTestCase.id,
        input: originalTestCase.input,
        context: originalTestCase.context,
        modelOutputs: result.value.outputs || [],
        useCase: originalTestCase.useCase,
        scenarioCategory: originalTestCase.scenarioCategory
      });
    } else {
      // Create empty structure for failed test cases
      testCasesWithOutputs.push({
        id: originalTestCase.id,
        input: originalTestCase.input,
        context: originalTestCase.context,
        modelOutputs: [],
        useCase: originalTestCase.useCase,
        scenarioCategory: originalTestCase.scenarioCategory
      });
    }
  }
  
  return testCasesWithOutputs;
};

interface RunStepProps {
  testCases: TestCase[];
  testCasesWithModelOutputs: TestCaseWithModelOutputs[];
  criteria: Criteria[];
  selectedScenarioCategory: string;
  selectedUseCaseId: string;
  systemPrompt?: string;
  currentUseCaseType?: string;
  shouldStartEvaluation: boolean;
  onEvaluationComplete: (results: EvaluationResult[]) => void;
  onModelComparisonEvaluationComplete: (results: Array<{
    testCaseId: string;
    modelOutputs: Array<{
      modelId: string;
      modelName: string;
      output: string;
      rubricScores: { [criteriaId: string]: number };
      feedback: string;
      suggestions: string[];
      timestamp: string;
    }>;
    rubricEffectiveness: 'high' | 'medium' | 'low';
    refinementSuggestions: string[];
  }>) => void;
  onEvaluationError: (error: string) => void;
  onEvaluationProgress: (currentIndex: number, progress: number) => void;
  onStartEvaluation: () => void;
}

export default function RunStep({
  testCases,
  testCasesWithModelOutputs,
  criteria,
  selectedScenarioCategory,
  selectedUseCaseId,
  systemPrompt,
  currentUseCaseType,
  shouldStartEvaluation,
  onEvaluationComplete,
  onModelComparisonEvaluationComplete,
  onEvaluationError,
  onEvaluationProgress,
  onStartEvaluation,
}: RunStepProps) {
  
  const [isGeneratingOutputs, setIsGeneratingOutputs] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generatedOutputs, setGeneratedOutputs] = useState<any[]>([]);
  const [currentPhase, setCurrentPhase] = useState<'generating' | 'evaluating' | 'completed'>('generating');
  const [totalOutputsExpected, setTotalOutputsExpected] = useState(0);
  const [outputsCompleted, setOutputsCompleted] = useState(0);
  const [localTestCasesWithModelOutputs, setLocalTestCasesWithModelOutputs] = useState<TestCaseWithModelOutputs[]>([]);

  // Auto-start evaluation when component mounts
  useEffect(() => {
    if (!shouldStartEvaluation) {
      onStartEvaluation();
    }
  }, [shouldStartEvaluation, onStartEvaluation]);

  // Debug logging
  useEffect(() => {
    console.log(`📊 RunStep Debug - Props:`, {
      testCasesLength: testCases.length,
      testCasesWithModelOutputsLength: testCasesWithModelOutputs.length,
      localTestCasesWithModelOutputsLength: localTestCasesWithModelOutputs.length,
      currentPhase,
      shouldStartEvaluation
    });
  }, [testCases.length, testCasesWithModelOutputs.length, localTestCasesWithModelOutputs.length, currentPhase, shouldStartEvaluation]);

  // Start output generation when shouldStartEvaluation becomes true
  useEffect(() => {
    if (shouldStartEvaluation && !isGeneratingOutputs && generatedOutputs.length === 0) {
      generateOutputsPhase();
    }
  }, [shouldStartEvaluation, isGeneratingOutputs, generatedOutputs.length]);

  const generateOutputsPhase = async () => {
    setIsGeneratingOutputs(true);
    setCurrentPhase('generating');
    setGenerationProgress(0);
    setOutputsCompleted(0);
    setTotalOutputsExpected(testCases.length * 3); // initial estimate

    try {
      console.log(`🚀 Starting parallel generation for ${testCases.length} test cases...`);
      
      // Create all API calls for all test cases in parallel
      const testCasePromises = testCases.map(async (testCase, index) => {
        console.log(`📤 Starting test case ${index + 1}/${testCases.length}`);
        
        const response = await fetch('/api/model-evaluation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            testCase: {
              input: testCase.input,
              context: testCase.context,
              useCase: selectedUseCaseId,
              useContext: selectedScenarioCategory
            },
            currentUseCaseType: currentUseCaseType,
            phase: 'generate'
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Test case ${index + 1}: ${errorData.error || `HTTP ${response.status}: ${response.statusText}`}`);
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(`Test case ${index + 1}: ${data.error || 'Output generation failed'}`);
        }

        console.log(`✅ Completed test case ${index + 1}/${testCases.length}: ${data.outputs?.length || 0} model outputs`);
        return {
          testCaseIndex: index,
          outputs: data.outputs || []
        };
      });

      // Execute all test cases in parallel and track progress
      const results = await Promise.allSettled(testCasePromises);
      
      // Process results and collect all outputs
      const allOutputs = [];
      const errors = [];
      let totalExpectedOutputs = 0;
      
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        
        if (result.status === 'fulfilled') {
          const testCaseResult = result.value;
          allOutputs.push(...testCaseResult.outputs);
          
          // Update total expected outputs based on first successful result
          if (totalExpectedOutputs === 0 && testCaseResult.outputs.length > 0) {
            totalExpectedOutputs = testCases.length * testCaseResult.outputs.length;
            setTotalOutputsExpected(totalExpectedOutputs);
            console.log(`📊 Updated total expected outputs: ${totalExpectedOutputs} (${testCases.length} test cases × ${testCaseResult.outputs.length} models)`);
          }
        } else {
          errors.push(`Test case ${i + 1}: ${result.reason instanceof Error ? result.reason.message : 'Unknown error'}`);
          console.error(`❌ Failed test case ${i + 1}:`, result.reason);
        }
      }

      // Update final progress
      setOutputsCompleted(allOutputs.length);
      setGenerationProgress(100);
      onEvaluationProgress(testCases.length - 1, 100);
      
             console.log(`🎉 Parallel generation completed! Generated ${allOutputs.length} total outputs from ${testCases.length} test cases`);
       
       if (errors.length > 0) {
         console.warn(`⚠️ Some test cases failed:`, errors);
       }

       // Convert generated outputs to testCasesWithModelOutputs format
       const testCasesWithOutputs = createTestCasesWithModelOutputs(testCases, results);
       
       setGeneratedOutputs(allOutputs);
       setLocalTestCasesWithModelOutputs(testCasesWithOutputs);
       setCurrentPhase('evaluating');
       
       console.log(`📋 Created testCasesWithModelOutputs:`, testCasesWithOutputs);
       
       // Start evaluation phase
       await evaluateOutputsPhase(testCasesWithOutputs);
      
    } catch (error) {
      console.error('Error in parallel generation:', error);
      onEvaluationError(error instanceof Error ? error.message : 'Unknown error during parallel generation');
    } finally {
      setIsGeneratingOutputs(false);
    }
  };

  const evaluateOutputsPhase = async (testCasesWithOutputs: TestCaseWithModelOutputs[]) => {
    try {
      console.log('🔍 Starting evaluation phase...');
      
      // Process each test case for evaluation
      const evaluationPromises = testCasesWithOutputs.map(async (testCase, index) => {
        if (!testCase.modelOutputs || testCase.modelOutputs.length === 0) {
          console.warn(`⚠️ No model outputs for test case ${index + 1}, skipping evaluation`);
          return { testCaseIndex: index, evaluatedOutputs: [] };
        }

        console.log(`📤 Evaluating test case ${index + 1}/${testCasesWithOutputs.length}`);
        
        const response = await fetch('/api/model-evaluation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            testCase: {
              input: testCase.input,
              context: testCase.context,
              useCase: selectedUseCaseId,
              useContext: selectedScenarioCategory
            },
            criteria: criteria,
            outputs: testCase.modelOutputs,
            phase: 'evaluate'
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Test case ${index + 1}: ${errorData.error || `HTTP ${response.status}: ${response.statusText}`}`);
        }

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(`Test case ${index + 1}: ${data.error || 'Evaluation failed'}`);
        }

        console.log(`✅ Evaluated test case ${index + 1}/${testCasesWithOutputs.length}: ${data.evaluations?.length || 0} evaluations`);
        return {
          testCaseIndex: index,
          evaluatedOutputs: data.evaluations || []
        };
      });

      // Execute all evaluations in parallel
      const evaluationResults = await Promise.allSettled(evaluationPromises);
      
      // Process evaluation results and update model outputs with rubric scores
      const updatedTestCasesWithOutputs = [...testCasesWithOutputs];
      
      for (let i = 0; i < evaluationResults.length; i++) {
        const result = evaluationResults[i];
        
        if (result.status === 'fulfilled' && result.value.evaluatedOutputs.length > 0) {
          const { testCaseIndex, evaluatedOutputs } = result.value;
          
          // Update each model output with evaluation results
          const updatedModelOutputs = updatedTestCasesWithOutputs[testCaseIndex].modelOutputs.map(output => {
            const evaluation = evaluatedOutputs.find((evaluationResult: any) => evaluationResult.modelId === output.modelId);
            if (evaluation) {
              return {
                ...output,
                rubricScores: evaluation.rubricScores || {},
                feedback: evaluation.feedback || '',
                suggestions: evaluation.suggestions || []
              };
            }
            return output;
          });
          
          updatedTestCasesWithOutputs[testCaseIndex] = {
            ...updatedTestCasesWithOutputs[testCaseIndex],
            modelOutputs: updatedModelOutputs
          };
        } else {
          console.error(`❌ Failed to evaluate test case ${i + 1}:`, result.status === 'rejected' ? result.reason : 'No evaluation results');
        }
      }
      
      // Update state with evaluated model outputs
      setLocalTestCasesWithModelOutputs(updatedTestCasesWithOutputs);
      console.log('✅ Evaluation phase completed!');
      
    } catch (error) {
      console.error('Error in evaluation phase:', error);
      onEvaluationError(error instanceof Error ? error.message : 'Unknown error during evaluation');
    }
  };

  return (
    <div className="py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {currentPhase === 'generating' ? 'Generating Model Outputs' : 'Evaluating Results'}
          </h2>
          <p className="text-gray-600">
            {currentPhase === 'generating' 
              ? `Processing ${testCases.length} test cases × ${totalOutputsExpected / testCases.length || 'multiple'} models = ${totalOutputsExpected || testCases.length * 3} total outputs`
              : 'Analyzing and scoring the generated outputs'
            }
          </p>
        </div>

        {/* Phase 1: Output Generation Progress */}
        {currentPhase === 'generating' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
            <div className="text-center py-8">
              <div className="mb-4">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Generating outputs: {Math.round(generationProgress)}% complete
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {outputsCompleted} / {totalOutputsExpected} model outputs generated
                </p>
              </div>
              <p className="text-gray-600">
                Creating responses from multiple AI models...
              </p>
            </div>
          </div>
        )}

        {/* Phase 2: Evaluation Section */}
        {currentPhase === 'evaluating' && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            {localTestCasesWithModelOutputs.length > 0 ? (
              <ModelComparisonEvaluator
                testCases={localTestCasesWithModelOutputs}
                systemPrompt={systemPrompt}
                onEvaluationComplete={onModelComparisonEvaluationComplete}
                onError={onEvaluationError}
                onProgress={onEvaluationProgress}
                shouldStart={true}
              />
            ) : testCases.length > 0 ? (
              <RubricEvaluator
                testCases={testCases}
                onEvaluationComplete={onEvaluationComplete}
                onError={onEvaluationError}
                onProgress={onEvaluationProgress}
                shouldStart={true}
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                No test cases available for evaluation.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 