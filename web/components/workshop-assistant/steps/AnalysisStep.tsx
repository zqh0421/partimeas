"use client";

import { useMemo } from "react";
import { useStepLoading } from "@/components/workshop-assistant/steps/VerticalStepper";
import TestCaseNavigation from "@/components/workshop-assistant/model-output/TestCaseNavigation";
import ModelOutputCards from "@/components/workshop-assistant/model-output/ModelOutputCards";
import EvaluationScoringSection from "@/components/workshop-assistant/model-output/EvaluationScoringSection";
import {
  ModelOutput,
  TestCase,
  TestCaseWithModelOutputs,
  IdealModelResponse,
} from "@/types";

type DisplayModel = {
  modelId: string;
  output: string;
  index: number;
  isStreaming?: boolean;
  isPlaceholder?: boolean;
};

interface AnalysisStepProps {
  data: {
    testCases: TestCase[];
    testCasesWithModelOutputs: TestCaseWithModelOutputs[];
    idealResponses?: IdealModelResponse[];
    loadingModelListOverride?: string[];
    streamingOutputs?: Array<{
      modelId: string;
      output: string;
      timestamp: string;
    }>;
    streamingErrors?: Array<{
      modelId: string;
      error: string;
      timestamp: string;
    }>;
  };
  state: {
    selectedTestCaseIndex: number;
    analysisStep: "setup" | "running" | "complete";
    currentPhase: "generating" | "evaluating" | "complete";
    showEvaluationFeatures?: boolean;
    isRealEvaluation?: boolean;
    numOutputsToShow?: number;
    sessionId?: string | null;
    isStreaming?: boolean;
    selectedCriteriaId?: string;
    selectedIdealResponseId?: string;
  };
  actions: {
    onTestCaseSelect: (index: number) => void;
    onCompareClick?: () => void;
  };
}

export default function AnalysisStep({
  data,
  state,
  actions,
}: AnalysisStepProps) {
  const {
    testCases,
    testCasesWithModelOutputs,
    loadingModelListOverride,
    idealResponses = [],
    streamingOutputs = [],
    streamingErrors = [],
  } = data;
  const {
    currentPhase,
    selectedTestCaseIndex,
    analysisStep,
    showEvaluationFeatures = true,
    isRealEvaluation = false,
    numOutputsToShow = 2,
    sessionId,
    isStreaming = false,
    selectedCriteriaId,
  } = state;
  const { onTestCaseSelect, onCompareClick } = actions;

  const isLoading = currentPhase === "generating";
  useStepLoading("analysis", isLoading);

  const currentTestCase = testCasesWithModelOutputs[selectedTestCaseIndex];
  const modelOutputs: ModelOutput[] = useMemo(
    () => (isLoading ? [] : currentTestCase?.modelOutputs || []),
    [currentTestCase?.modelOutputs, isLoading],
  );
  const testCasesForDisplay = isLoading ? testCases : testCasesWithModelOutputs;
  const loadingModelList = useMemo(
    () =>
      isLoading
        ? Array.isArray(loadingModelListOverride)
          ? loadingModelListOverride
          : []
        : [],
    [isLoading, loadingModelListOverride],
  );

  const displayModels = useMemo<DisplayModel[]>(() => {
    if (isStreaming && streamingOutputs.length > 0) {
      const streamingModels = streamingOutputs
        .slice(0, numOutputsToShow)
        .map((output, index) => ({
          modelId: output.modelId,
          output: output.output,
          index,
          isStreaming: true,
        }));

      const placeholders = Array.from(
        { length: Math.max(numOutputsToShow - streamingModels.length, 0) },
        (_, index) => ({
          modelId: `streaming-placeholder-${streamingModels.length + index + 1}`,
          output: "",
          index: streamingModels.length + index,
          isStreaming: true,
          isPlaceholder: true,
        }),
      );

      return [...streamingModels, ...placeholders];
    }

    if (modelOutputs.length > 0) {
      return modelOutputs
        .slice(0, numOutputsToShow)
        .map((output, index) => ({
          modelId: output.modelId,
          output: output.output,
          index,
        }));
    }

    if (isLoading) {
      return Array.from({ length: numOutputsToShow }, (_, index) => ({
        modelId: `loading-${index + 1}`,
        output: "",
        index,
      }));
    }

    return loadingModelList
      .slice(0, numOutputsToShow)
      .map((modelId, index) => ({ modelId, output: "", index }));
  }, [
    isLoading,
    isStreaming,
    loadingModelList,
    modelOutputs,
    numOutputsToShow,
    streamingOutputs,
  ]);

  return (
    <div className="space-y-4">
      {/* Test Case Results Display */}
      {(analysisStep === "running" || analysisStep === "complete") && (
        <>
          {testCasesWithModelOutputs[selectedTestCaseIndex] || isLoading ? (
            <>
              {testCasesForDisplay &&
                selectedTestCaseIndex !== undefined &&
                onTestCaseSelect && (
                  <TestCaseNavigation
                    testCases={testCasesForDisplay}
                    selectedTestCaseIndex={selectedTestCaseIndex}
                    onTestCaseSelect={onTestCaseSelect}
                    className="mb-6"
                  />
                )}

              {showEvaluationFeatures && (
                <EvaluationScoringSection
                  isLoading={isLoading}
                  currentPhase={currentPhase}
                  loadingModelList={loadingModelList}
                  isRealEvaluation={isRealEvaluation}
                  showFinalResultsHere={false}
                  modelOutputs={modelOutputs}
                  testCases={testCasesForDisplay}
                  selectedTestCaseIndex={selectedTestCaseIndex}
                  sessionId={sessionId}
                  selectedCriteriaId={selectedCriteriaId}
                  idealResponses={idealResponses}
                  onCompareClick={onCompareClick}
                />
              )}

              <ModelOutputCards
                displayModels={displayModels}
                loadingModelList={loadingModelList}
                isLoading={isLoading}
                isStreaming={isStreaming}
                streamingErrors={streamingErrors}
                numOutputsToShow={numOutputsToShow}
                totalOutputCount={modelOutputs.length}
              />
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Failed to load test case data. Please refresh and try again.
            </div>
          )}
        </>
      )}
    </div>
  );
}
