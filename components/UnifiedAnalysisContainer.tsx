'use client';

import { useState, useEffect } from 'react';
import { useConfig } from '@/hooks/useConfig';
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
  isRealEvaluation?: boolean;
  
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
  // Get configuration values
  const { numOutputsToShow } = useConfig();

  // Internal state management for the analysis process
  const [analysisStep, setAnalysisStep] = useState<'setup' | 'running' | 'complete'>('setup');
  const [hasStartedEvaluation, setHasStartedEvaluation] = useState(false);
  const [isStep1Collapsed, setIsStep1Collapsed] = useState(false);
  const [isGeneratingOutputs, setIsGeneratingOutputs] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'generating' | 'evaluating' | 'complete'>('generating');
  const [selectedOutputModelIds, setSelectedOutputModelIds] = useState<string[]>([]);

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
    setSelectedOutputModelIds([]);
    
    try {
      // Pre-seed loading placeholders from configured assistants to avoid empty state flicker
      try {
        const assistantsRes = await fetch('/api/admin/assistants?type=output_generation');
        if (assistantsRes.ok) {
          const assistantsData = await assistantsRes.json();
          const assistants = Array.isArray(assistantsData?.assistants) ? assistantsData.assistants : [];
          const required = assistants.filter((a: any) => a.required_to_show);
          const optional = assistants.filter((a: any) => !a.required_to_show);
          const desired = Math.min(2, assistants.length || 0);
          const selected = [
            ...required.slice(0, desired),
            ...optional.slice(0, Math.max(0, desired - required.length))
          ].slice(0, desired);
          const placeholderIds: string[] = selected.map((a: any) => String(a.model_id || a.id || 'loading'));
          if (placeholderIds.length > 0) setSelectedOutputModelIds(placeholderIds);
        } else {
          // Fallback placeholders
          setSelectedOutputModelIds(['loading-1', 'loading-2']);
        }
      } catch {
        setSelectedOutputModelIds(['loading-1', 'loading-2']);
      }

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
          // Capture the selected assistant models as soon as we get the first successful response
          if (Array.isArray(data?.selectedAssistantsModels) && data.selectedAssistantsModels.length > 0) {
            setSelectedOutputModelIds(prev => (prev && prev.length > 0 ? prev : data.selectedAssistantsModels));
          }
          
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
      // Track the selected models reported by the API for accurate loading-display
      const selectedModelsPerTestCase: string[][] = [];
      
      for (let i = 0; i < props.testCases.length; i++) {
        const originalTestCase = props.testCases[i];
        const result = results[i];
        
        if (result.status === 'fulfilled') {
          const apiResponse = result.value as any;
          
          if (apiResponse?.success) {
            const modelOutputs = apiResponse.outputs || [];
            const selectedModels: string[] = Array.isArray(apiResponse.selectedAssistantsModels) ? apiResponse.selectedAssistantsModels : [];
            processedTestCases.push({
              id: originalTestCase.id,
              input: originalTestCase.input,
              context: originalTestCase.context,
              modelOutputs: modelOutputs,
              useCase: originalTestCase.useCase,
              scenarioCategory: originalTestCase.scenarioCategory
            });
            selectedModelsPerTestCase.push(selectedModels);
          } else {
            processedTestCases.push({
              id: originalTestCase.id,
              input: originalTestCase.input,
              context: originalTestCase.context,
              modelOutputs: [],
              useCase: originalTestCase.useCase,
              scenarioCategory: originalTestCase.scenarioCategory
            });
            selectedModelsPerTestCase.push([]);
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
          selectedModelsPerTestCase.push([]);
        }
      }
      
      setCurrentPhase('evaluating');
      
      // Now start the evaluation phase with the generated outputs
      startEvaluationPhase(processedTestCases);

      // Stash the selected model ids on a custom property so the analysis step can display them during loading for the first render
      // Consumers can optionally read this from the latest API response as well
      // We will pass only the first test case's selected models for the loading grid, which determines the placeholder cards count/labels
      (processedTestCases as any).__selectedOutputModelIds = selectedModelsPerTestCase[0] || [];
      
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
      console.log('🚀 Starting evaluation phase with:', testCasesWithOutputs.length, 'test cases');
      
      // Check if real evaluation is enabled
      if (props.isRealEvaluation) {
        console.log('📡 Starting real evaluation...');
        
        // Ensure we're in evaluating phase
        setCurrentPhase('evaluating');
        
        // Small delay to make the evaluating phase visible
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Load real evaluation criteria first
        console.log('📋 Loading evaluation criteria...');
        const criteriaResponse = await fetch('/api/criteria-data');
        if (!criteriaResponse.ok) {
          throw new Error('Failed to load evaluation criteria');
        }
        const criteriaData = await criteriaResponse.json();
        const rawCriteria = criteriaData.criteria || [];
        
        // Flatten the hierarchical criteria structure for the evaluation API
        const evaluationCriteria = rawCriteria.flatMap((category: any) => 
          category.criteria?.flatMap((criterion: any) => 
            criterion.subcriteria?.map((subcriteria: any) => ({
              id: `${category.name}_${criterion.name}_${subcriteria.name}`.replace(/\s+/g, '_').toLowerCase(),
              name: `${criterion.name}: ${subcriteria.name}`,
              description: subcriteria.description || subcriteria.name,
              category: category.name,
              criterion: criterion.name,
              subcriteria: subcriteria.name
            })) || []
          ) || []
        );
        
        console.log(`✅ Loaded ${evaluationCriteria.length} flattened evaluation criteria from ${rawCriteria.length} categories`);
        
        // Log sample criteria for debugging
        if (evaluationCriteria.length > 0) {
          console.log('📋 Sample evaluation criteria:', evaluationCriteria.slice(0, 3));
        }
        
        // Perform real evaluation for each test case
        const evaluationPromises = testCasesWithOutputs.map(async (testCase, index) => {
          if (!testCase.modelOutputs || testCase.modelOutputs.length === 0) {
            console.log(`⚠️ Test case ${index + 1} has no model outputs`);
            return { testCaseIndex: index, evaluatedOutputs: [] };
          }
          
          console.log(`📤 Evaluating test case ${index + 1}/${testCasesWithOutputs.length}`);
          const response = await fetch('/api/evaluation-results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              testCase: {
                input: testCase.input,
                context: testCase.context,
                useCase: testCase.useCase,
                useContext: testCase.scenarioCategory
              },
              criteria: evaluationCriteria,
              modelOutputs: testCase.modelOutputs
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Test case ${index + 1}: ${errorData.error || `HTTP ${response.status}: ${response.statusText}`}`);
          }
          
          const data = await response.json();
          console.log(`✅ Evaluated test case ${index + 1}/${testCasesWithOutputs.length}: ${data.evaluations?.length || 0} evaluations`);
          
          // Update progress
          const progress = ((index + 1) / testCasesWithOutputs.length) * 50 + 50; // 50-100% for evaluation
          props.onEvaluationProgress(index, progress);
          
          return { testCaseIndex: index, data };
        });
        
        // Wait for all evaluations to complete
        const evaluationResults = await Promise.allSettled(evaluationPromises);
        
        // Process evaluation results
        const processedResults = testCasesWithOutputs.map((tc, idx) => {
          const res = evaluationResults[idx];
          let evaluatedOutputs = tc.modelOutputs;
          
          if (res.status === 'fulfilled') {
            const payload = res.value.data;
            if (payload?.evaluations && Array.isArray(payload.evaluations)) {
              evaluatedOutputs = tc.modelOutputs.map(mo => {
                const match = payload.evaluations.find((e: any) => e.modelId === mo.modelId);
                return {
                  ...mo,
                  rubricScores: match?.criteriaScores || mo.rubricScores || {},
                } as any;
              });
            }
          }
          
          return {
            testCaseId: tc.id,
            modelOutputs: evaluatedOutputs,
            rubricEffectiveness: 'medium' as const,
            refinementSuggestions: ['Real evaluation completed']
          };
        });
        
        console.log('✅ Real evaluation phase completed!');
        
        // Update progress to show evaluation completion
        props.onEvaluationProgress(testCasesWithOutputs.length - 1, 100);
        
        // Set phase to complete after evaluation
        setCurrentPhase('complete');
        
        props.onModelComparisonEvaluationComplete(processedResults);
      } else {
        console.log('🎭 Using mock evaluation...');
        // Process evaluation results and trigger the completion handlers
        const evaluationResults = testCasesWithOutputs.map(testCase => ({
          testCaseId: testCase.id,
          modelOutputs: testCase.modelOutputs,
          rubricEffectiveness: 'medium' as const,
          refinementSuggestions: ['Model outputs generated successfully (mock evaluation)']
        }));

        console.log('✅ Mock evaluation phase completed!');
        props.onModelComparisonEvaluationComplete(evaluationResults);
      }
      
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
          selectedTestCaseIndex={props.selectedTestCaseIndex}
          selectedSystemPrompt={props.selectedSystemPrompt}
          analysisStep={analysisStep}
          currentPhase={currentPhase}
          shouldStartEvaluation={props.shouldStartEvaluation}
          isRealEvaluation={props.isRealEvaluation}
          numOutputsToShow={numOutputsToShow}
          onTestCaseSelect={props.onTestCaseSelect}
          onEvaluationComplete={props.onEvaluationComplete}
          onModelComparisonEvaluationComplete={props.onModelComparisonEvaluationComplete}
          onEvaluationError={props.onEvaluationError}
          onEvaluationProgress={props.onEvaluationProgress}
          loadingModelListOverride={selectedOutputModelIds}
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
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-slate-700 font-medium"
          >
            <RefreshIcon className="w-5 h-5" />
            Start Over
          </button>
        </div>
      )}
    </div>
  );
}