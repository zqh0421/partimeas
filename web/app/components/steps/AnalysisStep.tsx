"use client";

import { useMemo } from "react";
import RubricEvaluator from "@/app/components/RubricEvaluator";
// import { ModelComparisonEvaluator } from "@/app/components";
import ModelOutputsGrid from "@/app/components/ModelOutputsGrid";
import { TestCase, TestCaseWithModelOutputs, ModelOutput } from "@/app/types";
// No longer import constants from API; UI receives dynamic selection via props

interface AnalysisStepProps {
  testCases: TestCase[];
  testCasesWithModelOutputs: TestCaseWithModelOutputs[];

  selectedTestCaseIndex: number;
  selectedSystemPrompt: string;
  analysisStep: "setup" | "running" | "complete";
  currentPhase: "generating" | "evaluating" | "complete";
  shouldStartEvaluation: boolean;
  showEvaluationFeatures?: boolean;
  isRealEvaluation?: boolean;
  numOutputsToShow?: number;
  onTestCaseSelect: (index: number) => void;
  onEvaluationComplete: (results: any[]) => void;
  onModelComparisonEvaluationComplete: (
    results: Array<{
      testCaseId: string;
      modelOutputs: ModelOutput[];
      rubricEffectiveness: "high" | "medium" | "low";
      refinementSuggestions: string[];
    }>
  ) => void;
  onEvaluationError: (error: string) => void;
  onEvaluationProgress: (currentIndex: number, progress: number) => void;
  // Optional override for loading model list to reflect actual DB-selected models
  loadingModelListOverride?: string[];
  // Session ID to control when copy button appears
  sessionId?: string | null;
}

export default function AnalysisStep({
  currentPhase,
  testCasesWithModelOutputs,
  selectedTestCaseIndex,
  testCases,
  shouldStartEvaluation,
  analysisStep,
  selectedSystemPrompt,
  showEvaluationFeatures = true,
  isRealEvaluation = false,
  numOutputsToShow = 2,
  onTestCaseSelect,
  onEvaluationComplete,
  onEvaluationError,
  onEvaluationProgress,
  onModelComparisonEvaluationComplete,
  loadingModelListOverride,
  sessionId,
}: AnalysisStepProps) {
  const gridConfig = useMemo(() => {
    const isLoading = currentPhase === "generating";
    const currentTestCase = testCasesWithModelOutputs[selectedTestCaseIndex];
    // Prefer dynamic selected model ids captured during generation, fallback to constants
    const dynamicLoadingModels: string[] = Array.isArray(
      loadingModelListOverride
    )
      ? (loadingModelListOverride as string[])
      : [];

    return {
      isLoading,
      modelOutputs: isLoading ? [] : currentTestCase?.modelOutputs || [],
      testCases: isLoading ? testCases : testCasesWithModelOutputs,
      loadingModelList: isLoading ? dynamicLoadingModels : [],
      stepId: isLoading ? "analysis" : undefined,
    };
  }, [
    currentPhase,
    testCasesWithModelOutputs,
    selectedTestCaseIndex,
    testCases,
    loadingModelListOverride,
  ]);

  return (
    <div className="space-y-6">
      {/* Hidden but functional evaluation components */}
      <div style={{ display: "none" }}>
        <RubricEvaluator
          testCases={testCases}
          shouldStart={shouldStartEvaluation}
          onEvaluationComplete={onEvaluationComplete}
          onError={onEvaluationError}
          onProgress={onEvaluationProgress}
        />
      </div>

      {/* Test Case Results Display */}
      {(analysisStep === "running" || analysisStep === "complete") && (
        <div className="space-y-4">
          {testCasesWithModelOutputs[selectedTestCaseIndex] ||
          gridConfig.isLoading ? (
            <ModelOutputsGrid
              modelOutputs={gridConfig.modelOutputs}
              isLoading={gridConfig.isLoading}
              loadingModelList={gridConfig.loadingModelList}
              testCases={gridConfig.testCases}
              selectedTestCaseIndex={selectedTestCaseIndex}
              onTestCaseSelect={onTestCaseSelect}
              stepId={gridConfig.stepId}
              className="space-y-4"
              showEvaluationFeatures={showEvaluationFeatures}
              isRealEvaluation={isRealEvaluation}
              currentPhase={currentPhase}
              numOutputsToShow={numOutputsToShow}
              sessionId={sessionId}
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
