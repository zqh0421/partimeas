"use client";

import { Suspense, useEffect, useState } from "react";
import { useAnalysisState } from "@/app/hooks/useAnalysisState";
import { useAnalysisHandlers } from "@/app/hooks/useAnalysisHandlers";
import { useConfig } from "@/app/hooks/useConfig";
// Removed useSessionLoader - now using dedicated session pages
import VerticalStepper from "@/app/components/steps/VerticalStepper";
import SetupStep from "@/app/components/steps/SetupStep";
import AnalysisStep from "@/app/components/steps/AnalysisStep";
import ModelOutputsGrid from "@/app/components/ModelOutputsGrid";
import { RefreshIcon } from "@/app/components/icons";
import { AnalysisHeaderFull } from "@/app/components";
import { GroupIdModal } from "@/app/components/GroupIdModal";
import { TestCaseWithModelOutputs, ModelOutput } from "@/app/types";
import { Assistant } from "@/app/types/admin";
import { selectionCache } from "@/app/utils/selectionCache";
import { TEST_CASE_CONFIG } from "@/app/config/useCases";

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
    // selectedUseCaseId,
    // setSelectedUseCaseId,
    selectedScenarioCategory,
    setSelectedScenarioCategory,
    selectedCriteriaId,
    setSelectedCriteriaId,
    selectedSystemPrompt,
    setSelectedSystemPrompt,
    // currentUseCaseType,
    updateSystemPromptForUseCase,

    // Evaluation states
    shouldStartEvaluation,
    setShouldStartEvaluation,
    evaluationProgress,
    setEvaluationProgress,

    // Validation
    validationError,
    setValidationError,
  } = useAnalysisState(); // Use dynamic default from USE_CASE_PROMPTS

  // Session functionality - now using dedicated session pages
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [testCaseSessionIds, setTestCaseSessionIds] = useState<
    Map<number, string>
  >(new Map());

  // Analysis-specific internal state (previously in UnifiedAnalysis component)
  const [analysisStep, setAnalysisStep] = useState<
    "setup" | "running" | "complete"
  >("setup");
  const [hasStartedEvaluation, setHasStartedEvaluation] = useState(false);
  const [expandedOriginalText, setExpandedOriginalText] = useState<Set<string>>(
    new Set()
  );
  const [isStep1Collapsed, setIsStep1Collapsed] = useState(false);
  const [localTestCasesWithModelOutputs, setLocalTestCasesWithModelOutputs] =
    useState<TestCaseWithModelOutputs[]>([]);
  const [isGeneratingOutputs, setIsGeneratingOutputs] = useState(false);
  const [hasComparedWithAi, setHasComparedWithAi] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<
    "generating" | "evaluating" | "complete"
  >("generating");
  const [showEvaluationFeatures, setShowEvaluationFeatures] =
    useState<boolean>(true);
  const [selectedOutputModelIds, setSelectedOutputModelIds] = useState<
    string[]
  >([]);
  const [isRealEvaluation, setIsRealEvaluation] = useState<boolean>(false);

  // Track current session ID from generated responses (removed duplicate declaration)

  // Get configuration values
  const config = useConfig();
  const {
    numOutputsToShow,
    enableGroupIdCollection,
    isLoading: configLoading,
  } = config;

  // Debug logging for configuration
  useEffect(() => {
    console.log("🔧 Configuration Debug:", {
      config,
      enableGroupIdCollection,
      configLoading,
      numOutputsToShow,
    });
  }, [config, enableGroupIdCollection, configLoading, numOutputsToShow]);

  // Group ID state
  const [showGroupIdModal, setShowGroupIdModal] = useState(false);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load group ID from localStorage after hydration
  useEffect(() => {
    setIsHydrated(true);
    const savedGroupId = localStorage.getItem("partimeas_group_id");
    if (savedGroupId) {
      setCurrentGroupId(savedGroupId);
      console.log("📋 Loaded group ID from localStorage:", savedGroupId);
    } else {
      console.log("📋 No saved group ID found in localStorage");
    }
  }, []);

  // Debug logging for group ID modal
  useEffect(() => {
    console.log("🔍 Group ID Modal Debug:", {
      enableGroupIdCollection,
      currentGroupId,
      showGroupIdModal,
      testCasesLength: testCases.length,
    });
  }, [
    enableGroupIdCollection,
    currentGroupId,
    showGroupIdModal,
    testCases.length,
  ]);

  const handlers = useAnalysisHandlers({
    stateSetters: {
      setTestCases,
      setTestCasesWithModelOutputs,
      setCriteria,
      setOutcomes,
      setOutcomesWithModelComparison,
      setIsLoading,
      setCurrentStep,
      // setSelectedUseCaseId,
      setSelectedScenarioCategory,
      setSelectedCriteriaId,
      setValidationError,
      setShouldStartEvaluation,
      setSelectedTestCaseIndex,
      setEvaluationProgress,
    },
    data: {
      testCases,
      testCasesWithModelOutputs,
      updateSystemPromptForUseCase,
    },
  });

  // Session functionality - currentSessionId will be set when responses are generated

  // Session error handling removed - now using dedicated session pages

  // Fetch active evaluation assistant to decide if real or mock evaluation
  useEffect(() => {
    const fetchActiveEvaluator = async () => {
      try {
        console.log("🔍 Fetching active evaluation assistant...");
        const res = await fetch("/api/admin/assistants?type=evaluation");
        if (!res.ok) throw new Error("Failed to load assistants");
        const data = await res.json();
        console.log("📋 Evaluation assistants response:", data);

        const active = (data.assistants || []).find(
          (a: Assistant) => a.required_to_show
        );
        console.log("✅ Active evaluation assistant found:", active);

        // Always show evaluation features; toggle real vs mock
        setShowEvaluationFeatures(true);
        setIsRealEvaluation(Boolean(active));
        console.log(
          "🎯 Evaluation mode set to:",
          Boolean(active) ? "REAL" : "MOCK"
        );
      } catch (e) {
        console.error("❌ Error fetching evaluation assistant:", e);
        // Fallback to mock evaluation UI
        setShowEvaluationFeatures(true);
        setIsRealEvaluation(false);
        console.log("🔄 Falling back to mock evaluation mode");
      }
    };
    fetchActiveEvaluator();
  }, []);

  // Check if group ID is required and not yet provided
  useEffect(() => {
    // Only show modal after hydration to prevent SSR mismatch
    if (!isHydrated) return;

    console.log("Group ID Modal Logic Check:", {
      enableGroupIdCollection,
      currentGroupId,
      shouldShowModal: enableGroupIdCollection && !currentGroupId,
    });

    if (enableGroupIdCollection && !currentGroupId) {
      console.log("Setting modal to visible!");
      setShowGroupIdModal(true);
    }
  }, [enableGroupIdCollection, currentGroupId, isHydrated]);

  // Handle group ID confirmation
  const handleGroupIdConfirm = (groupId: string) => {
    console.log("✅ Group ID confirmed:", groupId);
    setCurrentGroupId(groupId);
    setShowGroupIdModal(false);

    // Save to localStorage for persistence
    if (typeof window !== "undefined") {
      localStorage.setItem("partimeas_group_id", groupId);
      console.log("💾 Group ID saved to localStorage");
    }
  };

  // Handle group ID modal cancel
  const handleGroupIdCancel = () => {
    console.log("❌ Group ID modal cancelled");
    setShowGroupIdModal(false);
    // Reset to setup step if user cancels group ID entry
    setCurrentStep("sync");

    // Clear group ID from localStorage when user cancels
    if (typeof window !== "undefined") {
      localStorage.removeItem("partimeas_group_id");
      console.log("🗑️ Group ID cleared from localStorage");
    }
    setCurrentGroupId(null);
  };

  // Function to clear group ID (for reset purposes)
  const clearGroupId = () => {
    console.log("🗑️ Clearing group ID for reset");
    if (typeof window !== "undefined") {
      localStorage.removeItem("partimeas_group_id");
      console.log("💾 Group ID removed from localStorage");
    }
    setCurrentGroupId(null);
    // Only show modal if hydrated to prevent SSR mismatch
    if (isHydrated) {
      setShowGroupIdModal(true); // Show modal again for new input
      console.log("🔄 Group ID modal will be shown again");
    }
  };

  // Helper function to toggle original text expansion
  const toggleOriginalTextExpansion = (modelId: string) => {
    setExpandedOriginalText((prev) => {
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
    console.log("🚀 Starting model output generation...");
    console.log("📊 Test cases to process:", testCases.length);
    console.log("🔍 Current group ID:", currentGroupId);

    setIsGeneratingOutputs(true);
    setCurrentPhase("generating");
    setSelectedOutputModelIds([]);

    try {
      // Pre-seed loading placeholders from configured assistants to avoid empty state flicker
      try {
        console.log("🔍 Fetching output generation assistants...");
        const assistantsRes = await fetch(
          "/api/admin/assistants?type=output_generation"
        );
        if (assistantsRes.ok) {
          const assistantsData = await assistantsRes.json();
          console.log("📋 Output generation assistants:", assistantsData);

          const assistants = Array.isArray(assistantsData?.assistants)
            ? assistantsData.assistants
            : [];
          const required = assistants.filter((a: any) => a.required_to_show);
          const optional = assistants.filter((a: any) => !a.required_to_show);
          const desired = Math.min(2, assistants.length || 0);
          const selected = [
            ...required.slice(0, desired),
            ...optional.slice(0, Math.max(0, desired - required.length)),
          ].slice(0, desired);

          console.log(
            "🎯 Selected assistants for output generation:",
            selected
          );

          // Flatten all model_ids from selected assistants into a single array
          const placeholderIds: string[] = selected.flatMap((a: any) =>
            Array.isArray(a.model_ids) ? a.model_ids : [a.id || "loading"]
          );

          if (placeholderIds.length > 0) {
            setSelectedOutputModelIds(placeholderIds);
            console.log("📋 Set placeholder model IDs:", placeholderIds);
          }
        } else {
          console.log(
            "⚠️ Failed to fetch assistants, using fallback placeholders"
          );
          // Fallback placeholders
          setSelectedOutputModelIds(["loading-1", "loading-2"]);
        }
      } catch (error) {
        console.error("❌ Error fetching assistants:", error);
        setSelectedOutputModelIds(["loading-1", "loading-2"]);
      }

      console.log(
        "🚀 Starting model output generation for",
        testCases.length,
        "test cases"
      );

      // Generate outputs for all test cases in parallel
      const outputPromises = testCases.map(async (testCase, index) => {
        try {
          console.log(
            `📤 Sending API request for test case ${index + 1}/${
              testCases.length
            }:`,
            {
              testCaseId: testCase.id,
              useCase: testCase.useCase,
              scenarioCategory: testCase.scenarioCategory,
            }
          );

          const response = await fetch("/api/model-evaluation", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              testCase,
              phase: "generate",
              currentUseCaseType: "original_system123_instructions",
              groupId: currentGroupId, // Include group ID in the request
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          console.log(
            `✅ Completed test case ${index + 1}/${testCases.length}:`,
            {
              testCaseId: testCase.id,
              responseStatus: response.status,
              hasOutputs: Array.isArray(data?.outputs),
              outputsCount: data?.outputs?.length || 0,
              sessionId: data?.sessionId,
            }
          );

          // Capture the selected assistant models as soon as we get the first successful response
          if (
            Array.isArray(data?.selectedAssistantsModels) &&
            data.selectedAssistantsModels.length > 0
          ) {
            console.log(
              "🎯 Captured selected assistant models:",
              data.selectedAssistantsModels
            );
            setSelectedOutputModelIds((prev) =>
              prev && prev.length > 0 ? prev : data.selectedAssistantsModels
            );
          }

          // Capture session ID if available - store per test case
          if (data?.sessionId) {
            setTestCaseSessionIds((prev) =>
              new Map(prev).set(index, data.sessionId)
            );
            console.log(
              `📋 Captured session ID for test case ${index + 1}: ${
                data.sessionId
              }`
            );

            // Also set currentSessionId for backward compatibility (first test case)
            if (index === 0) {
              setCurrentSessionId(data.sessionId);
              console.log(
                `🔗 Copy Link button will now appear for session: ${data.sessionId}`
              );
            }
          }

          // Update progress
          handlers.handleEvaluationProgress(
            index,
            ((index + 1) / testCases.length) * 50
          ); // 50% for generation

          return data;
        } catch (error) {
          console.error(`❌ Failed test case ${index + 1}:`, error);
          throw error;
        }
      });

      console.log("⏳ Waiting for all output generation promises to settle...");
      const results = await Promise.allSettled(outputPromises);
      console.log(
        "📊 Output generation results:",
        results.map((r, i) => ({
          index: i,
          status: r.status,
          testCaseId: testCases[i]?.id,
        }))
      );

      // Process results and create TestCasesWithModelOutputs
      const processedTestCases: TestCaseWithModelOutputs[] = [];

      for (let i = 0; i < testCases.length; i++) {
        const originalTestCase = testCases[i];
        const result = results[i];

        if (result.status === "fulfilled") {
          const apiResponse = result.value as any;

          if (apiResponse?.success) {
            const modelOutputs = apiResponse.outputs || [];
            processedTestCases.push({
              id: originalTestCase.id,
              input: originalTestCase.input,
              context: originalTestCase.context,
              modelOutputs: modelOutputs,
              useCase: originalTestCase.useCase,
              scenarioCategory: originalTestCase.scenarioCategory,
            });
            console.log(
              `✅ Processed test case ${i + 1} with ${
                modelOutputs.length
              } outputs`
            );
          } else {
            console.log(
              `⚠️ Test case ${i + 1} API response not successful:`,
              apiResponse
            );
            processedTestCases.push({
              id: originalTestCase.id,
              input: originalTestCase.input,
              context: originalTestCase.context,
              modelOutputs: [],
              useCase: originalTestCase.useCase,
              scenarioCategory: originalTestCase.scenarioCategory,
            });
          }
        } else {
          console.log(`❌ Test case ${i + 1} failed:`, result.reason);
          // Create empty structure for failed test cases
          processedTestCases.push({
            id: originalTestCase.id,
            input: originalTestCase.input,
            context: originalTestCase.context,
            modelOutputs: [],
            useCase: originalTestCase.useCase,
            scenarioCategory: originalTestCase.scenarioCategory,
          });
        }
      }

      console.log("📋 Created testCasesWithModelOutputs:", {
        total: processedTestCases.length,
        withOutputs: processedTestCases.filter(
          (tc) => tc.modelOutputs.length > 0
        ).length,
        withoutOutputs: processedTestCases.filter(
          (tc) => tc.modelOutputs.length === 0
        ).length,
      });

      setLocalTestCasesWithModelOutputs(processedTestCases);
      setCurrentPhase("evaluating");

      console.log(
        "🔄 About to call startEvaluationPhase with",
        processedTestCases.length,
        "test cases"
      );
      // Now start the evaluation phase with the generated outputs
      startEvaluationPhase(processedTestCases);
    } catch (error) {
      console.error("❌ Error during model output generation:", error);
      handlers.handleEvaluationError(
        error instanceof Error
          ? error.message
          : "Unknown error during generation"
      );
      setIsGeneratingOutputs(false);
      setHasStartedEvaluation(false);
      setCurrentPhase("complete");
      setAnalysisStep("setup");
    }
  };

  // Start evaluation phase with generated outputs
  const startEvaluationPhase = async (
    testCasesWithOutputs: TestCaseWithModelOutputs[]
  ) => {
    console.log(
      "🚀 Starting evaluation phase with:",
      testCasesWithOutputs.length,
      "test cases"
    );
    console.log("🔍 isRealEvaluation:", isRealEvaluation);

    try {
      if (isRealEvaluation) {
        console.log("📡 Starting real evaluation API calls...");

        // Ensure we're in evaluating phase
        setCurrentPhase("evaluating");

        // Small delay to make the evaluating phase visible
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Load real evaluation criteria first
        console.log(
          "📋 Loading evaluation criteria from /api/criteria-data..."
        );
        const criteriaResponse = await fetch("/api/criteria-data");
        if (!criteriaResponse.ok) {
          throw new Error("Failed to load evaluation criteria");
        }
        const criteriaData = await criteriaResponse.json();
        console.log("📋 Raw criteria data received:", criteriaData);

        const rawCriteria = criteriaData.criteria || [];

        // Flatten the hierarchical criteria structure for the evaluation API
        const evaluationCriteria = rawCriteria.flatMap(
          (category: any) =>
            category.criteria?.flatMap(
              (criterion: any) =>
                criterion.subcriteria?.map((subcriteria: any) => ({
                  id: `${category.name}_${criterion.name}_${subcriteria.name}`
                    .replace(/\s+/g, "_")
                    .toLowerCase(),
                  name: `${criterion.name}: ${subcriteria.name}`,
                  description: subcriteria.description || subcriteria.name,
                  category: category.name,
                  criterion: criterion.name,
                  subcriteria: subcriteria.name,
                })) || []
            ) || []
        );

        console.log(
          `✅ Loaded ${evaluationCriteria.length} flattened evaluation criteria from ${rawCriteria.length} categories`
        );

        // Log sample criteria for debugging
        if (evaluationCriteria.length > 0) {
          console.log(
            "📋 Sample evaluation criteria:",
            evaluationCriteria.slice(0, 3)
          );
        }

        // Call API to perform real evaluations using active evaluator assistant
        const evaluationPromises = testCasesWithOutputs.map(
          async (testCase, index) => {
            console.log(`📋 Evaluating test case ${index + 1}:`, {
              testCaseId: testCase.id,
              useCase: testCase.useCase,
              scenarioCategory: testCase.scenarioCategory,
              outputsCount: testCase.modelOutputs?.length || 0,
            });

            if (!testCase.modelOutputs || testCase.modelOutputs.length === 0) {
              console.log(`⚠️ Test case ${index + 1} has no model outputs`);
              return { testCaseIndex: index, evaluatedOutputs: [] };
            }

            console.log(
              `📤 Sending evaluation request for test case ${index + 1} with ${
                testCase.modelOutputs.length
              } outputs to /api/evaluation-results`
            );

            const evaluationPayload = {
              testCase: {
                input: testCase.input,
                context: testCase.context,
                useCase: testCase.useCase,
                useContext: testCase.scenarioCategory,
              },
              criteria: evaluationCriteria, // Use real criteria instead of empty array
              modelOutputs: testCase.modelOutputs,
            };

            console.log("📤 Evaluation payload:", evaluationPayload);

            const response = await fetch("/api/evaluation-results", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(evaluationPayload),
            });

            console.log(
              `📥 Received response for test case ${index + 1}:`,
              response.status
            );
            if (!response.ok) {
              const err = await response.json().catch(() => ({}));
              throw new Error(err.error || `HTTP ${response.status}`);
            }
            const data = await response.json();
            console.log(`✅ Evaluation data for test case ${index + 1}:`, {
              hasEvaluations: Array.isArray(data?.evaluations),
              evaluationsCount: data?.evaluations?.length || 0,
              responseData: data,
            });

            // Update progress for this test case evaluation
            const progress =
              ((index + 1) / testCasesWithOutputs.length) * 50 + 50; // 50-100% for evaluation
            handlers.handleEvaluationProgress(index, progress);

            return { testCaseIndex: index, data };
          }
        );

        console.log("⏳ Waiting for all evaluation promises to settle...");
        const settled = await Promise.allSettled(evaluationPromises);
        console.log(
          "📊 Evaluation promises settled:",
          settled.map((s, i) => ({ index: i, status: s.status }))
        );

        // Map API evaluations back to local structure
        const evaluationResults = testCasesWithOutputs.map((tc, idx) => {
          const res = settled[idx];
          let evaluatedOutputs = tc.modelOutputs;
          if (res.status === "fulfilled") {
            const payload = res.value.data;
            console.log(
              `📋 Processing evaluation result for test case ${idx + 1}:`,
              {
                hasEvaluations: Array.isArray(payload?.evaluations),
                evaluationsCount: payload?.evaluations?.length || 0,
              }
            );

            // If server returned rubric-like scores, attach to modelOutputs if possible
            if (payload?.evaluations && Array.isArray(payload.evaluations)) {
              evaluatedOutputs = tc.modelOutputs.map((mo) => {
                const match = payload.evaluations.find(
                  (e: any) => e.modelId === mo.modelId
                );
                if (match) {
                  console.log(
                    `✅ Found evaluation match for model ${mo.modelId}:`,
                    match
                  );
                }
                return {
                  ...mo,
                  rubricScores: match?.criteriaScores || mo.rubricScores || {},
                } as any;
              });
            }
          } else {
            console.log(
              `❌ Evaluation failed for test case ${idx + 1}:`,
              res.reason
            );
          }
          return {
            testCaseId: tc.id,
            modelOutputs: evaluatedOutputs,
            rubricEffectiveness: "medium" as const,
            refinementSuggestions: ["Evaluation completed"],
          };
        });

        console.log("✅ Real evaluation phase completed!");

        // Update progress to show evaluation completion
        handlers.handleEvaluationProgress(testCasesWithOutputs.length - 1, 100);

        // Set phase to complete after evaluation
        setCurrentPhase("complete");

        handlers.handleModelComparisonEvaluationComplete(evaluationResults);
      } else {
        console.log("🎭 Starting mock evaluation...");
        // Mock evaluation: generate mock scores for demonstration
        const evaluationResults = testCasesWithOutputs.map((testCase) => ({
          testCaseId: testCase.id,
          modelOutputs: testCase.modelOutputs.map((output) => ({
            ...output,
            // Add mock rubric scores for demonstration
            rubricScores: {
              relevance: Math.floor(Math.random() * 3) + 1, // 1-3
              accuracy: Math.floor(Math.random() * 3) + 1, // 1-3
              completeness: Math.floor(Math.random() * 3) + 1, // 1-3
            },
          })),
          rubricEffectiveness: "medium" as const,
          refinementSuggestions: [
            "Mock evaluation - scores generated for demonstration",
          ],
        }));
        console.log("✅ Mock evaluation phase completed!");
        handlers.handleModelComparisonEvaluationComplete(evaluationResults);
      }

      console.log("🎯 Setting final states...");
      handlers.handleEvaluationProgress(testCases.length - 1, 100);
      console.log("🔄 Setting currentPhase to complete");
      setCurrentPhase("complete");
      setIsGeneratingOutputs(false);
      setHasStartedEvaluation(false);
      setAnalysisStep("complete");
    } catch (error) {
      console.error("❌ Error during evaluation phase:", error);
      handlers.handleEvaluationError(
        error instanceof Error
          ? error.message
          : "Unknown error during evaluation"
      );
      setIsGeneratingOutputs(false);
      setHasStartedEvaluation(false);
      setCurrentPhase("complete");
      setAnalysisStep("setup");
    }
  };

  const handleConfirmSelections = () => {
    console.log("✅ Confirm selections clicked");
    console.log("🔍 Current selections:", {
      useCaseName: TEST_CASE_CONFIG.name,
      testCasesCount: testCases.length,
      selectedTestCaseIndex,
      selectedScenarioCategory,
      selectedCriteriaId,
    });

    // Check if we have current selections
    const isUseCaseSelected = Boolean(TEST_CASE_CONFIG.name);
    const hasLoadedTestCases = testCases.length > 0;
    const hasScenarioCategory = Boolean(selectedScenarioCategory);
    const hasCriteriaVersion = Boolean(selectedCriteriaId);

    if (
      !isUseCaseSelected ||
      !hasLoadedTestCases ||
      !hasScenarioCategory ||
      !hasCriteriaVersion
    ) {
      console.log(
        "❌ Validation failed: missing one or more required selections"
      );
      setValidationError(
        "Please select a use case, scenario category, and criteria version, and ensure test cases are loaded."
      );
      return;
    }

    console.log("✅ Validation passed, starting evaluation");
    setValidationError("");
    setHasStartedEvaluation(true);
    setIsStep1Collapsed(true);
    handlers.handleStartEvaluation();
  };

  // Custom restart handler
  const handleRestart = () => {
    console.log("🔄 Restart requested - clearing all state");

    // Reset all state
    setTestCases([]);
    setTestCasesWithModelOutputs([]);
    setLocalTestCasesWithModelOutputs([]);
    setCriteria([]);
    setOutcomes([]);
    setOutcomesWithModelComparison([]);
    // setSelectedUseCaseId("");
    setSelectedScenarioCategory("");
    setSelectedCriteriaId("");
    setSelectedCriteriaId("");
    setSelectedSystemPrompt("");
    setValidationError("");
    setShouldStartEvaluation(false);
    setEvaluationProgress(0);
    // setCurrentTestCaseIndex(0);
    setSelectedTestCaseIndex(0);

    // Reset analysis state
    setAnalysisStep("setup");
    setHasStartedEvaluation(false);
    setIsStep1Collapsed(false);
    setIsGeneratingOutputs(false);
    setCurrentPhase("generating");
    setSelectedOutputModelIds([]);

    // Clear current session ID and group ID
    setCurrentSessionId(null);
    setTestCaseSessionIds(new Map()); // Clear per-test case session IDs
    setCurrentGroupId(null);

    // Go back to first step
    setCurrentStep("sync");

    console.log("🔄 Refreshing page for clean state");
    // Refresh the page to ensure clean state
    if (
      typeof window !== "undefined" &&
      typeof window.location !== "undefined" &&
      typeof window.location.reload === "function"
    ) {
      window.location.reload();
    }
  };

  // Determine current analysis step based on data availability
  useEffect(() => {
    if (outcomesWithModelComparison.length > 0 && currentPhase === "complete") {
      setAnalysisStep("complete");
    } else if (
      hasStartedEvaluation ||
      shouldStartEvaluation ||
      isGeneratingOutputs
    ) {
      setAnalysisStep("running");
    } else {
      setAnalysisStep("setup");
    }
  }, [
    outcomesWithModelComparison.length,
    hasStartedEvaluation,
    shouldStartEvaluation,
    isGeneratingOutputs,
    currentPhase,
  ]);

  // Effect to start model output generation when evaluation starts
  useEffect(() => {
    if (hasStartedEvaluation && !isGeneratingOutputs && testCases.length > 0) {
      console.log("🚀 Effect triggered: starting model output generation", {
        hasStartedEvaluation,
        isGeneratingOutputs,
        testCasesCount: testCases.length,
      });
      generateModelOutputs();
    }
  }, [hasStartedEvaluation, isGeneratingOutputs, testCases.length]);

  // Ensure we navigate to outcomes once results are available
  useEffect(() => {
    if (currentStep !== "outcomes") {
      if (outcomesWithModelComparison.length > 0 || outcomes.length > 0) {
        console.log("🔄 Navigating to outcomes step", {
          outcomesWithModelComparisonCount: outcomesWithModelComparison.length,
          outcomesCount: outcomes.length,
          currentStep,
        });
        setCurrentStep("outcomes");
        setShouldStartEvaluation(false);
      }
    }
  }, [
    currentStep,
    outcomesWithModelComparison.length,
    outcomes.length,
    setCurrentStep,
    setShouldStartEvaluation,
  ]);

  // UI logic (previously in UnifiedAnalysis component)
  const [hasCachedSelections, setHasCachedSelections] = useState(false);

  // Check for cached selections on client side only and restore them if no current selections
  useEffect(() => {
    const hasCache = selectionCache.hasCache();
    setHasCachedSelections(hasCache);
    console.log("🔍 Selection cache check:", {
      hasCache,
      testCasesCount: testCases.length,
    });

    // If there are cached selections but no current selections, restore them automatically
    if (hasCache && testCases.length === 0) {
      console.log("🔄 Restoring cached selections");
      const restored = selectionCache.restoreSelections();
      if (restored && restored.selections.length > 0) {
        console.log("✅ Cached selections restored:", restored);
        // Trigger the selection change handlers to restore the state
        if (handlers.handleMultiLevelSelectionChange) {
          handlers.handleMultiLevelSelectionChange(restored.selections);
        }
        // Restore criteria version selection if available
        if (restored.selectedCriteriaVersionId) {
          console.log(
            "✅ Cached criteria version restored:",
            restored.selectedCriteriaVersionId
          );
          setSelectedCriteriaId(restored.selectedCriteriaVersionId);
        }
      }
    }
  }, [testCases.length, handlers.handleMultiLevelSelectionChange]);

  // Only show confirm button when there are current selections with preview
  // Cached selections alone are not sufficient - user must make current selections
  const hasValidSelections = Boolean(
    TEST_CASE_CONFIG.name &&
      testCases.length > 0 &&
      selectedScenarioCategory &&
      selectedCriteriaId
  );

  // Create steps for the vertical stepper
  const steps = [
    {
      id: "setup",
      title: "Load Test Cases",
      description: "Choose a set of test cases from a use case.",
      status:
        analysisStep === "setup"
          ? ("current" as const)
          : analysisStep === "running" || analysisStep === "complete"
          ? ("completed" as const)
          : ("upcoming" as const),
      isCollapsed: isStep1Collapsed,
      content: (
        <SetupStep
          testCases={testCases}
          selectedTestCaseIndex={selectedTestCaseIndex}
          validationError={validationError}
          hasValidSelections={hasValidSelections}
          analysisStep={analysisStep}
          selectedCriteriaVersionId={selectedCriteriaId}
          onMultiLevelSelectionChange={handlers.handleMultiLevelSelectionChange}
          onUseCaseSelected={handlers.handleUseCaseSelected}
          onScenarioCategorySelected={handlers.handleScenarioCategorySelected}
          onUseCaseDataLoaded={handlers.handleUseCaseDataLoaded}
          onUseCaseError={handlers.handleUseCaseError}
          onTestCaseSelect={handlers.handleTestCaseSelect}
          onConfirmSelections={handleConfirmSelections}
          onCriteriaVersionSelected={setSelectedCriteriaId}
        />
      ),
    },
    {
      id: "analysis",
      title: "Test the Rubric",
      description: "Review possible responses to the selected test cases.",
      status:
        analysisStep === "running"
          ? ("current" as const)
          : analysisStep === "complete"
          ? ("completed" as const)
          : ("upcoming" as const),
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
          onModelComparisonEvaluationComplete={
            handlers.handleModelComparisonEvaluationComplete
          }
          onEvaluationError={handlers.handleEvaluationError}
          onEvaluationProgress={handlers.handleEvaluationProgress}
          loadingModelListOverride={selectedOutputModelIds}
          sessionId={testCaseSessionIds.get(selectedTestCaseIndex) || null}
          onCompareClick={() => setHasComparedWithAi(true)}
        />
      ),
    },
  ];

  // No session loading state needed - using dedicated session pages

  return (
    <div className="min-h-screen bg-gray-50">
      <AnalysisHeaderFull
        sessionId={null}
        currentSessionId={currentSessionId}
        isGeneratingOutputs={isGeneratingOutputs}
        groupId={currentGroupId}
        onEditGroupId={() => {
          if (isHydrated) {
            setShowGroupIdModal(true);
          }
        }}
        onClearGroupId={clearGroupId}
      />

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <div className="space-y-6">
          {/* Session error display removed - using dedicated session pages */}

          {/* Vertical Stepper */}
          <VerticalStepper steps={steps} />

          {/* Footer action after completion */}
          {analysisStep === "complete" && (
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
