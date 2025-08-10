'use client';

import { useState, useEffect } from 'react';
import VerticalStepper from '@/components/steps/VerticalStepper';
import SetupStep from '@/components/steps/SetupStep';
import AnalysisStep from '@/components/steps/AnalysisStep';
import { RefreshIcon } from '@/components/icons';
import { TestCase, TestCaseWithModelOutputs, RubricOutcomeWithModelComparison, ModelOutput } from '@/types';

interface UnifiedAnalysisProps {
  // Data states from parent
  testCases: TestCase[];
  testCasesWithModelOutputs: TestCaseWithModelOutputs[];
  outcomesWithModelComparison: RubricOutcomeWithModelComparison[];
  
  // Selection states from parent
  selectedUseCaseId: string;
  selectedSystemPrompt: string;
  selectedTestCaseIndex: number;
  
  // Loading and evaluation states from parent
  isLoading: boolean;
  shouldStartEvaluation: boolean;
  evaluationProgress: any;
  currentTestCaseIndex: number;
  validationError: string;
  
  // Event handlers from parent
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

export default function UnifiedAnalysis(props: UnifiedAnalysisProps) {
  // Internal state management for the analysis process
  const [analysisStep, setAnalysisStep] = useState<'setup' | 'running' | 'complete'>('setup');
  const [hasStartedEvaluation, setHasStartedEvaluation] = useState(false);
  const [expandedOriginalText, setExpandedOriginalText] = useState<Set<string>>(new Set());
  const [isStep1Collapsed, setIsStep1Collapsed] = useState(false);
  const [localTestCasesWithModelOutputs, setLocalTestCasesWithModelOutputs] = useState<TestCaseWithModelOutputs[]>([]);
  const [isGeneratingOutputs, setIsGeneratingOutputs] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'generating' | 'evaluating' | 'complete'>('generating');

  // Helper function to toggle original text expansion
  const toggleOriginalTextExpansion = (modelId: string) => {
    setExpandedOriginalText(prev => {
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
    if (props.outcomesWithModelComparison.length > 0 && currentPhase === 'complete') {
      setAnalysisStep('complete');
    } else if (hasStartedEvaluation || props.shouldStartEvaluation || isGeneratingOutputs) {
      setAnalysisStep('running');
    } else {
      setAnalysisStep('setup');
    }
  }, [props.outcomesWithModelComparison.length, hasStartedEvaluation, props.shouldStartEvaluation, isGeneratingOutputs, currentPhase]);

  // Effect to start model output generation when evaluation starts
  useEffect(() => {
    if (hasStartedEvaluation && !isGeneratingOutputs && props.testCases.length > 0) {
      generateModelOutputs();
    }
  }, [hasStartedEvaluation, isGeneratingOutputs, props.testCases.length]);

  // Model output generation function
  const generateModelOutputs = async () => {
    setIsGeneratingOutputs(true);
    setCurrentPhase('generating');
    
    try {
      console.log('🚀 Starting model output generation for', props.testCases.length, 'test cases');
      
      // Generate outputs for all test cases in parallel
      const outputPromises = props.testCases.map(async (testCase, index) => {
        try {
          const response = await fetch('/api/model-evaluation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              testCase,
              phase: 'generate',
              currentUseCaseType: 'original_system123_instructions'
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          console.log(`✅ Completed test case ${index + 1}/${props.testCases.length}:`, data);
          
          // Update progress
          props.onEvaluationProgress(index, ((index + 1) / props.testCases.length) * 50); // 50% for generation
          
          return data;
        } catch (error) {
          console.error(`❌ Failed test case ${index + 1}:`, error);
          throw error;
        }
      });

      const results = await Promise.allSettled(outputPromises);
      
      // Process results and create TestCasesWithModelOutputs
      const processedTestCases: TestCaseWithModelOutputs[] = [];
      
      for (let i = 0; i < props.testCases.length; i++) {
        const originalTestCase = props.testCases[i];
        const result = results[i];
        
        if (result.status === 'fulfilled') {
          const apiResponse = result.value as any;
          
          if (apiResponse?.success) {
            const modelOutputs = apiResponse.outputs || [];
            processedTestCases.push({
              id: originalTestCase.id,
              input: originalTestCase.input,
              context: originalTestCase.context,
              modelOutputs: modelOutputs,
              useCase: originalTestCase.useCase,
              scenarioCategory: originalTestCase.scenarioCategory
            });
          } else {
            processedTestCases.push({
              id: originalTestCase.id,
              input: originalTestCase.input,
              context: originalTestCase.context,
              modelOutputs: [],
              useCase: originalTestCase.useCase,
              scenarioCategory: originalTestCase.scenarioCategory
            });
          }
        } else {
          // Create empty structure for failed test cases
          processedTestCases.push({
            id: originalTestCase.id,
            input: originalTestCase.input,
            context: originalTestCase.context,
            modelOutputs: [],
            useCase: originalTestCase.useCase,
            scenarioCategory: originalTestCase.scenarioCategory
          });
        }
      }
      
      console.log('📋 Created testCasesWithModelOutputs:', processedTestCases);
      
      setLocalTestCasesWithModelOutputs(processedTestCases);
      setCurrentPhase('evaluating');
      
      // Now start the evaluation phase with the generated outputs
      startEvaluationPhase(processedTestCases);
      
    } catch (error) {
      console.error('❌ Error during model output generation:', error);
      props.onEvaluationError(error instanceof Error ? error.message : 'Unknown error during generation');
      setIsGeneratingOutputs(false);
      setHasStartedEvaluation(false);
      setCurrentPhase('complete');
      setAnalysisStep('setup');
    }
  };

  // Start evaluation phase with generated outputs
  const startEvaluationPhase = async (testCasesWithOutputs: TestCaseWithModelOutputs[]) => {
    try {
      // Process evaluation results and trigger the completion handlers
      const evaluationResults = testCasesWithOutputs.map(testCase => ({
        testCaseId: testCase.id,
        modelOutputs: testCase.modelOutputs,
        rubricEffectiveness: 'medium' as const,
        refinementSuggestions: ['Model outputs generated successfully']
      }));

      console.log('✅ Evaluation phase completed!');
      props.onModelComparisonEvaluationComplete(evaluationResults);
      props.onEvaluationProgress(props.testCases.length - 1, 100);
      setCurrentPhase('complete');
      setIsGeneratingOutputs(false);
      setHasStartedEvaluation(false);
      setAnalysisStep('complete');
      
    } catch (error) {
      console.error('❌ Error during evaluation phase:', error);
      props.onEvaluationError(error instanceof Error ? error.message : 'Unknown error during evaluation');
      setIsGeneratingOutputs(false);
      setHasStartedEvaluation(false);
      setCurrentPhase('complete');
      setAnalysisStep('setup');
    }
  };

  const handleConfirmSelections = () => {
    if (!props.selectedUseCaseId || props.testCases.length === 0) {
      props.setValidationError('Please select a use case and ensure test cases are loaded.');
      return;
    }
    
    props.setValidationError('');
    setHasStartedEvaluation(true);
    setIsStep1Collapsed(true);
    props.onStartEvaluation();
  };

  // Inline UI rendering (previously in UnifiedAnalysisView)
  const hasValidSelections = Boolean(props.selectedUseCaseId && props.testCases.length > 0);

  // Create steps for the vertical stepper
  const steps = [
    {
      id: 'setup',
      title: 'Load Test Cases',
      description: 'Choose a set of test cases from a use case.',
      status: analysisStep === 'setup' ? 'current' as const : (analysisStep === 'running' || analysisStep === 'complete') ? 'completed' as const : 'upcoming' as const,
      isCollapsed: isStep1Collapsed,
      content: (
        <SetupStep
          testCases={props.testCases}
          selectedTestCaseIndex={props.selectedTestCaseIndex}
          validationError={props.validationError}
          hasValidSelections={hasValidSelections}
          analysisStep={analysisStep}
          onMultiLevelSelectionChange={props.onMultiLevelSelectionChange}
          onUseCaseSelected={props.onUseCaseSelected}
          onScenarioCategorySelected={props.onScenarioCategorySelected}
          onUseCaseDataLoaded={props.onUseCaseDataLoaded}
          onUseCaseError={props.onUseCaseError}
          onTestCaseSelect={props.onTestCaseSelect}
          onConfirmSelections={handleConfirmSelections}
        />
      )
    },
    {
      id: 'analysis',
      title: 'Test the Rubric',
      description: 'Review possible responses to the selected test cases.',
      status: analysisStep === 'running' ? 'current' as const : analysisStep === 'complete' ? 'completed' as const : 'upcoming' as const,
      isCollapsed: false, // Never collapse step 2
      content: (
        <AnalysisStep
          testCases={props.testCases}
          testCasesWithModelOutputs={props.testCasesWithModelOutputs}
          localTestCasesWithModelOutputs={localTestCasesWithModelOutputs}
          selectedTestCaseIndex={props.selectedTestCaseIndex}
          selectedSystemPrompt={props.selectedSystemPrompt}
          analysisStep={analysisStep}
          currentPhase={currentPhase}
          shouldStartEvaluation={props.shouldStartEvaluation}
          onTestCaseSelect={props.onTestCaseSelect}
          onEvaluationComplete={props.onEvaluationComplete}
          onModelComparisonEvaluationComplete={props.onModelComparisonEvaluationComplete}
          onEvaluationError={props.onEvaluationError}
          onEvaluationProgress={props.onEvaluationProgress}
        />
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Vertical Stepper */}
      <VerticalStepper steps={steps} />

      {/* Footer action after completion */}
      {analysisStep === 'complete' && props.onRestart && (
        <div className="flex justify-center">
          <button
            onClick={props.onRestart}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            <RefreshIcon className="w-5 h-5" />
            Start Over
          </button>
        </div>
      )}
    </div>
  );
}