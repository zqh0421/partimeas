'use client';

import { useEffect, useState } from 'react';
import { useAnalysisState } from '@/hooks/useAnalysisState';
import { useAnalysisHandlers } from '@/hooks/useAnalysisHandlers';
import { useConfig } from '@/hooks/useConfig';
import { USE_CASE_PROMPTS } from '@/app/api/shared/constants';
import VerticalStepper from '@/components/steps/VerticalStepper';
import SetupStep from '@/components/steps/SetupStep';
import AnalysisStep from '@/components/steps/AnalysisStep';
import { RefreshIcon } from '@/components/icons';
import { AnalysisHeaderFull } from '@/components';
import { TestCaseWithModelOutputs, ModelOutput } from '@/types';
import { Assistant } from '@/types/admin';

export default function OutputAnalysisFullPage() {
  const {
    // Step management
    currentStep,
    setCurrentStep,
    
    // Loading states
    isLoading,
    setIsLoading,
    
    // Data states
    testCases,
    setTestCases,
    testCasesWithModelOutputs,
    setTestCasesWithModelOutputs,
    criteria,
    setCriteria,
    outcomes,
    setOutcomes,
    outcomesWithModelComparison,
    setOutcomesWithModelComparison,
    
    // Selection states
    selectedTestCaseIndex,
    setSelectedTestCaseIndex,
    selectedUseCaseId,
    setSelectedUseCaseId,
    selectedScenarioCategory,
    setSelectedScenarioCategory,
    selectedCriteriaId,
    setSelectedCriteriaId,
    selectedSystemPrompt,
    setSelectedSystemPrompt,
    currentUseCaseType,
    updateSystemPromptForUseCase,
    
    // Evaluation states
    shouldStartEvaluation,
    setShouldStartEvaluation,
    evaluationProgress,
    setEvaluationProgress,
    currentTestCaseIndex,
    setCurrentTestCaseIndex,
    
    // Validation
    validationError,
    setValidationError,
  } = useAnalysisState(); // Use dynamic default from USE_CASE_PROMPTS

  // Analysis-specific internal state (previously in UnifiedAnalysis component)
  const [analysisStep, setAnalysisStep] = useState<'setup' | 'running' | 'complete'>('setup');
  const [hasStartedEvaluation, setHasStartedEvaluation] = useState(false);
  const [expandedOriginalText, setExpandedOriginalText] = useState<Set<string>>(new Set());
  const [isStep1Collapsed, setIsStep1Collapsed] = useState(false);
  const [localTestCasesWithModelOutputs, setLocalTestCasesWithModelOutputs] = useState<TestCaseWithModelOutputs[]>([]);
  const [isGeneratingOutputs, setIsGeneratingOutputs] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'generating' | 'evaluating' | 'complete'>('generating');
  const [showEvaluationFeatures, setShowEvaluationFeatures] = useState<boolean>(true);
  const [selectedOutputModelIds, setSelectedOutputModelIds] = useState<string[]>([]);
  const [isRealEvaluation, setIsRealEvaluation] = useState<boolean>(false);

  // Get configuration values
  const { numOutputsToShow } = useConfig();

  const handlers = useAnalysisHandlers({
    stateSetters: {
      setTestCases,
      setTestCasesWithModelOutputs,
      setCriteria,
      setOutcomes,
      setOutcomesWithModelComparison,
      setIsLoading,
      setCurrentStep,
      setSelectedUseCaseId,
      setSelectedScenarioCategory,
      setSelectedCriteriaId,
      setValidationError,
      setShouldStartEvaluation,
      setSelectedTestCaseIndex,
      setCurrentTestCaseIndex,
      setEvaluationProgress
    },
    data: {
      testCases,
      testCasesWithModelOutputs,
      updateSystemPromptForUseCase
    }
  });

  // Fetch active evaluation assistant to decide if real or mock evaluation
  useEffect(() => {
    const fetchActiveEvaluator = async () => {
      try {
        const res = await fetch('/api/admin/assistants?type=evaluation');
        if (!res.ok) throw new Error('Failed to load assistants');
        const data = await res.json();
        const active = (data.assistants || []).find((a: Assistant) => a.required_to_show);
        // Always show evaluation features; toggle real vs mock
        setShowEvaluationFeatures(true);
        setIsRealEvaluation(Boolean(active));
      } catch (e) {
        // Fallback to mock evaluation UI
        setShowEvaluationFeatures(true);
        setIsRealEvaluation(false);
      }
    };
    fetchActiveEvaluator();
  }, []);

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
          
          // Flatten all model_ids from selected assistants into a single array
          const placeholderIds: string[] = selected.flatMap((a: any) => 
            Array.isArray(a.model_ids) ? a.model_ids : [a.id || 'loading']
          );
          
          if (placeholderIds.length > 0) setSelectedOutputModelIds(placeholderIds);
        } else {
          // Fallback placeholders
          setSelectedOutputModelIds(['loading-1', 'loading-2']);
        }
      } catch {
        setSelectedOutputModelIds(['loading-1', 'loading-2']);
      }

      console.log('🚀 Starting model output generation for', testCases.length, 'test cases');
      
      // Generate outputs for all test cases in parallel
      const outputPromises = testCases.map(async (testCase, index) => {
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
          console.log(`✅ Completed test case ${index + 1}/${testCases.length}:`, data);
          // Capture the selected assistant models as soon as we get the first successful response
          if (Array.isArray(data?.selectedAssistantsModels) && data.selectedAssistantsModels.length > 0) {
            setSelectedOutputModelIds(prev => (prev && prev.length > 0 ? prev : data.selectedAssistantsModels));
          }
          
          // Update progress
          handlers.handleEvaluationProgress(index, ((index + 1) / testCases.length) * 50); // 50% for generation
          
          return data;
        } catch (error) {
          console.error(`❌ Failed test case ${index + 1}:`, error);
          throw error;
        }
      });

      const results = await Promise.allSettled(outputPromises);
      
      // Process results and create TestCasesWithModelOutputs
      const processedTestCases: TestCaseWithModelOutputs[] = [];
      
      for (let i = 0; i < testCases.length; i++) {
        const originalTestCase = testCases[i];
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
      
      console.log('🔄 About to call startEvaluationPhase with', processedTestCases.length, 'test cases');
      // Now start the evaluation phase with the generated outputs
      startEvaluationPhase(processedTestCases);
      
    } catch (error) {
      console.error('❌ Error during model output generation:', error);
      handlers.handleEvaluationError(error instanceof Error ? error.message : 'Unknown error during generation');
      setIsGeneratingOutputs(false);
      setHasStartedEvaluation(false);
      setCurrentPhase('complete');
      setAnalysisStep('setup');
    }
  };

  // Start evaluation phase with generated outputs
  const startEvaluationPhase = async (testCasesWithOutputs: TestCaseWithModelOutputs[]) => {
    console.log('🚀 Starting evaluation phase with:', testCasesWithOutputs.length, 'test cases');
    console.log('🔍 isRealEvaluation:', isRealEvaluation);
    
    try {
      if (isRealEvaluation) {
        console.log('📡 Starting real evaluation API calls...');
        
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
        
        // Call API to perform real evaluations using active evaluator assistant
        const evaluationPromises = testCasesWithOutputs.map(async (testCase, index) => {
          console.log(`📋 Evaluating test case ${index + 1}:`, testCase.id);
          if (!testCase.modelOutputs || testCase.modelOutputs.length === 0) {
            console.log(`⚠️ Test case ${index + 1} has no model outputs`);
            return { testCaseIndex: index, evaluatedOutputs: [] };
          }
          
          console.log(`📤 Sending evaluation request for test case ${index + 1} with ${testCase.modelOutputs.length} outputs`);
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
              criteria: evaluationCriteria, // Use real criteria instead of empty array
              modelOutputs: testCase.modelOutputs
            })
          });
          
          console.log(`📥 Received response for test case ${index + 1}:`, response.status);
          if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || `HTTP ${response.status}`);
          }
          const data = await response.json();
          console.log(`✅ Evaluation data for test case ${index + 1}:`, data);
          
          // Update progress for this test case evaluation
          const progress = ((index + 1) / testCasesWithOutputs.length) * 50 + 50; // 50-100% for evaluation
          handlers.handleEvaluationProgress(index, progress);
          
          return { testCaseIndex: index, data };
        });

        console.log('⏳ Waiting for all evaluation promises to settle...');
        const settled = await Promise.allSettled(evaluationPromises);
        console.log('📊 Evaluation promises settled:', settled.map((s, i) => ({ index: i, status: s.status })));

        // Map API evaluations back to local structure
        const evaluationResults = testCasesWithOutputs.map((tc, idx) => {
          const res = settled[idx];
          let evaluatedOutputs = tc.modelOutputs;
          if (res.status === 'fulfilled') {
            const payload = res.value.data;
            // If server returned rubric-like scores, attach to modelOutputs if possible
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
            refinementSuggestions: ['Evaluation completed']
          };
        });

        console.log('✅ Real evaluation phase completed!');
        
        // Update progress to show evaluation completion
        handlers.handleEvaluationProgress(testCasesWithOutputs.length - 1, 100);
        
        // Set phase to complete after evaluation
        setCurrentPhase('complete');
        
        handlers.handleModelComparisonEvaluationComplete(evaluationResults);
      } else {
        console.log('🎭 Starting mock evaluation...');
        // Mock evaluation: generate mock scores for demonstration
        const evaluationResults = testCasesWithOutputs.map(testCase => ({
          testCaseId: testCase.id,
          modelOutputs: testCase.modelOutputs.map(output => ({
            ...output,
            // Add mock rubric scores for demonstration
            rubricScores: {
              relevance: Math.floor(Math.random() * 3) + 1, // 1-3
              accuracy: Math.floor(Math.random() * 3) + 1, // 1-3
              completeness: Math.floor(Math.random() * 3) + 1 // 1-3
            }
          })),
          rubricEffectiveness: 'medium' as const,
          refinementSuggestions: ['Mock evaluation - scores generated for demonstration']
        }));
        console.log('✅ Mock evaluation phase completed!');
        handlers.handleModelComparisonEvaluationComplete(evaluationResults);
      }

      console.log('🎯 Setting final states...');
      handlers.handleEvaluationProgress(testCases.length - 1, 100);
      console.log('🔄 Setting currentPhase to complete');
      setCurrentPhase('complete');
      setIsGeneratingOutputs(false);
      setHasStartedEvaluation(false);
      setAnalysisStep('complete');
      
    } catch (error) {
      console.error('❌ Error during evaluation phase:', error);
      handlers.handleEvaluationError(error instanceof Error ? error.message : 'Unknown error during evaluation');
      setIsGeneratingOutputs(false);
      setHasStartedEvaluation(false);
      setCurrentPhase('complete');
      setAnalysisStep('setup');
    }
  };

  const handleConfirmSelections = () => {
    if (!selectedUseCaseId || testCases.length === 0) {
      setValidationError('Please select a use case and ensure test cases are loaded.');
      return;
    }
    
    setValidationError('');
    setHasStartedEvaluation(true);
    setIsStep1Collapsed(true);
    handlers.handleStartEvaluation();
  };

  // Determine current analysis step based on data availability
  useEffect(() => {
    if (outcomesWithModelComparison.length > 0 && currentPhase === 'complete') {
      setAnalysisStep('complete');
    } else if (hasStartedEvaluation || shouldStartEvaluation || isGeneratingOutputs) {
      setAnalysisStep('running');
    } else {
      setAnalysisStep('setup');
    }
  }, [outcomesWithModelComparison.length, hasStartedEvaluation, shouldStartEvaluation, isGeneratingOutputs, currentPhase]);

  // Effect to start model output generation when evaluation starts
  useEffect(() => {
    if (hasStartedEvaluation && !isGeneratingOutputs && testCases.length > 0) {
      generateModelOutputs();
    }
  }, [hasStartedEvaluation, isGeneratingOutputs, testCases.length]);

  // Ensure we navigate to outcomes once results are available
  useEffect(() => {
    if (currentStep !== 'outcomes') {
      if (outcomesWithModelComparison.length > 0 || outcomes.length > 0) {
        setCurrentStep('outcomes');
        setShouldStartEvaluation(false);
      }
    }
  }, [currentStep, outcomesWithModelComparison.length, outcomes.length, setCurrentStep, setShouldStartEvaluation]);

  // UI logic (previously in UnifiedAnalysis component)
  const hasValidSelections = Boolean(selectedUseCaseId && testCases.length > 0);

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
          testCases={testCases}
          selectedTestCaseIndex={selectedTestCaseIndex}
          validationError={validationError}
          hasValidSelections={hasValidSelections}
          analysisStep={analysisStep}
          onMultiLevelSelectionChange={handlers.handleMultiLevelSelectionChange}
          onUseCaseSelected={handlers.handleUseCaseSelected}
          onScenarioCategorySelected={handlers.handleScenarioCategorySelected}
          onUseCaseDataLoaded={handlers.handleUseCaseDataLoaded}
          onUseCaseError={handlers.handleUseCaseError}
          onTestCaseSelect={handlers.handleTestCaseSelect}
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
          testCases={testCases}
          testCasesWithModelOutputs={testCasesWithModelOutputs}
          selectedTestCaseIndex={selectedTestCaseIndex}
          selectedSystemPrompt={selectedSystemPrompt}
          analysisStep={analysisStep}
          currentPhase={currentPhase}
          shouldStartEvaluation={shouldStartEvaluation}
          showEvaluationFeatures={showEvaluationFeatures}
          isRealEvaluation={isRealEvaluation}
          numOutputsToShow={numOutputsToShow}
          onTestCaseSelect={handlers.handleTestCaseSelect}
          onEvaluationComplete={handlers.handleEvaluationComplete}
          onModelComparisonEvaluationComplete={handlers.handleModelComparisonEvaluationComplete}
          onEvaluationError={handlers.handleEvaluationError}
          onEvaluationProgress={handlers.handleEvaluationProgress}
          loadingModelListOverride={selectedOutputModelIds}
        />
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AnalysisHeaderFull />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Vertical Stepper */}
          <VerticalStepper steps={steps} />

          {/* Footer action after completion */}
          {analysisStep === 'complete' && handlers.handleRestart && (
            <div className="flex justify-center">
              <button
                onClick={handlers.handleRestart}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                <RefreshIcon className="w-5 h-5" />
                Start Over
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}