'use client';

import { Suspense, useEffect, useState } from 'react';
import { useAnalysisState } from '@/hooks/useAnalysisState';
import { useAnalysisHandlers } from '@/hooks/useAnalysisHandlers';
import { useConfig } from '@/hooks/useConfig';
// Removed useSessionLoader - now using dedicated session pages
import VerticalStepper from '@/components/steps/VerticalStepper';
import SetupStep from '@/components/steps/SetupStep';
import AnalysisStep from '@/components/steps/AnalysisStep';
import { RefreshIcon } from '@/components/icons';
import { AnalysisHeaderFull } from '@/components';
import { GroupIdModal } from '@/components/GroupIdModal';
import { TestCaseWithModelOutputs, ModelOutput } from '@/types';
import { Assistant } from '@/types/admin';
import { selectionCache } from '@/utils/selectionCache';

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

// Main component wrapped in Suspense
function OutputAnalysisFullPageContent() {
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

  // Session functionality - now using dedicated session pages
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

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
  
  // Track current session ID from generated responses (removed duplicate declaration)

  // Get configuration values
  const config = useConfig();
  const { numOutputsToShow, enableGroupIdCollection, isLoading: configLoading } = config;

  // Debug logging for configuration
  useEffect(() => {
    console.log('Configuration Debug:', {
      config,
      enableGroupIdCollection,
      configLoading,
      numOutputsToShow
    });
  }, [config, enableGroupIdCollection, configLoading, numOutputsToShow]);

  // Group ID state
  const [showGroupIdModal, setShowGroupIdModal] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(() => {
    // Try to load from localStorage on component mount
    if (typeof window !== 'undefined') {
      return localStorage.getItem('partimeas_group_id');
    }
    return null;
  });

  // Debug logging for group ID modal
  useEffect(() => {
    console.log('Group ID Modal Debug:', {
      enableGroupIdCollection,
      currentGroupId,
      showGroupIdModal,
      testCasesLength: testCases.length
    });
  }, [enableGroupIdCollection, currentGroupId, showGroupIdModal, testCases.length]);

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

  // Session functionality - currentSessionId will be set when responses are generated

  // Session error handling removed - now using dedicated session pages

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

  // Check if group ID is required and not yet provided
  useEffect(() => {
    console.log('Group ID Modal Logic Check:', {
      enableGroupIdCollection,
      currentGroupId,
      shouldShowModal: enableGroupIdCollection && !currentGroupId
    });
    
    if (enableGroupIdCollection && !currentGroupId) {
      console.log('Setting modal to visible!');
      setShowGroupIdModal(true);
    }
  }, [enableGroupIdCollection, currentGroupId]);



  // Handle group ID confirmation
  const handleGroupIdConfirm = (groupId: string) => {
    setCurrentGroupId(groupId);
    setShowGroupIdModal(false);
    
    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('partimeas_group_id', groupId);
    }
  };

  // Handle group ID modal cancel
  const handleGroupIdCancel = () => {
    setShowGroupIdModal(false);
    // Reset to setup step if user cancels group ID entry
    setCurrentStep('sync');
    
    // Clear group ID from localStorage when user cancels
    if (typeof window !== 'undefined') {
      localStorage.removeItem('partimeas_group_id');
    }
    setCurrentGroupId(null);
  };

  // Function to clear group ID (for reset purposes)
  const clearGroupId = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('partimeas_group_id');
    }
    setCurrentGroupId(null);
    setShowGroupIdModal(true); // Show modal again for new input
  };

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
              currentUseCaseType: 'original_system123_instructions',
              groupId: currentGroupId // Include group ID in the request
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
          
          // Capture session ID if available
          if (data?.sessionId && !currentSessionId) {
            setCurrentSessionId(data.sessionId);
            console.log(`📋 Captured session ID: ${data.sessionId}`);
            console.log(`🔗 Copy Link button will now appear for session: ${data.sessionId}`);
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
    // Check if we have current selections
    if (!selectedUseCaseId || testCases.length === 0) {
      setValidationError('Please select a use case and ensure test cases are loaded.');
      return;
    }
    
    setValidationError('');
    setHasStartedEvaluation(true);
    setIsStep1Collapsed(true);
    handlers.handleStartEvaluation();
  };

  // Custom restart handler
  const handleRestart = () => {
    // Reset all state
    setTestCases([]);
    setTestCasesWithModelOutputs([]);
    setLocalTestCasesWithModelOutputs([]);
    setCriteria([]);
    setOutcomes([]);
    setOutcomesWithModelComparison([]);
    setSelectedUseCaseId('');
    setSelectedScenarioCategory('');
    setSelectedCriteriaId('');
    setSelectedSystemPrompt('');
    setValidationError('');
    setShouldStartEvaluation(false);
    setEvaluationProgress(0);
    setCurrentTestCaseIndex(0);
    setSelectedTestCaseIndex(0);
    
    // Reset analysis state
    setAnalysisStep('setup');
    setHasStartedEvaluation(false);
    setIsStep1Collapsed(false);
    setIsGeneratingOutputs(false);
    setCurrentPhase('generating');
    setSelectedOutputModelIds([]);
    
    // Clear current session ID and group ID
    setCurrentSessionId(null);
    setCurrentGroupId(null);
    
    // Go back to first step
    setCurrentStep('sync');
    
    // Refresh the page to ensure clean state
    if (typeof window !== 'undefined' && typeof window.location !== 'undefined' && typeof window.location.reload === 'function') {
      window.location.reload();
    }
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
  const [hasCachedSelections, setHasCachedSelections] = useState(false);
  
  // Check for cached selections on client side only and restore them if no current selections
  useEffect(() => {
    const hasCache = selectionCache.hasCache();
    setHasCachedSelections(hasCache);
    
    // If there are cached selections but no current selections, restore them automatically
    if (hasCache && !selectedUseCaseId && testCases.length === 0) {
      const restored = selectionCache.restoreSelections();
      if (restored && restored.selections.length > 0) {
        // Trigger the selection change handlers to restore the state
        if (handlers.handleMultiLevelSelectionChange) {
          handlers.handleMultiLevelSelectionChange(restored.selections);
        }
      }
    }
  }, [selectedUseCaseId, testCases.length, handlers.handleMultiLevelSelectionChange]);
  
  // Only show confirm button when there are current selections with preview
  // Cached selections alone are not sufficient - user must make current selections
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

  // No session loading state needed - using dedicated session pages

  return (
    <div className="min-h-screen bg-gray-50">
      <AnalysisHeaderFull 
        sessionId={null} 
        currentSessionId={currentSessionId}
        isGeneratingOutputs={isGeneratingOutputs}
        groupId={currentGroupId}
        onEditGroupId={() => setShowGroupIdModal(true)}
        onClearGroupId={clearGroupId}
      />

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <div className="space-y-6">
          {/* Session error display removed - using dedicated session pages */}

          {/* Vertical Stepper */}
          <VerticalStepper steps={steps} />

          {/* Footer action after completion */}
          {analysisStep === 'complete' && (
            <div className="flex justify-center mb-8">
              <button
                onClick={handleRestart}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                <RefreshIcon className="w-5 h-5" />
                Start Over
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Group ID Modal */}
      <GroupIdModal
        visible={showGroupIdModal}
        onConfirm={handleGroupIdConfirm}
        onCancel={handleGroupIdCancel}
        loading={false}
      />
    </div>
  );
}

export default function OutputAnalysisFullPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OutputAnalysisFullPageContent />
    </Suspense>
  );
} 