"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ModelOutput,
  TestCase,
  TestCaseWithModelOutputs,
  IdealModelResponse,
} from "@/app/types";
import SimpleMarkdownRenderer from "@/app/components/SimpleMarkdownRenderer";
import { useStepLoading } from "@/app/components/steps/VerticalStepper";
import TestCaseNavigation from "@/app/components/TestCaseNavigation";
import RealCriteriaTable from "@/app/components/evaluation/RealCriteriaTable";
import InputScoringTable from "@/app/components/evaluation/InputScoringTable";
import { EvaluationRecord } from "@/app/types/database";

// Helper function to determine grid columns based on model count
const getGridCols = (count: number) => {
  switch (count) {
    case 1:
      return "grid-cols-1";
    case 2:
      return "grid-cols-1 md:grid-cols-2";
    case 3:
      return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
    case 4:
      return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4";
    default:
      return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
  }
};

export default function ModelOutputsGrid({
  modelOutputs,
  isLoading = false,
  loadingModelList = [],
  testCases,
  selectedTestCaseIndex,
  onTestCaseSelect,
  stepId,
  className = "",
  showEvaluationFeatures = true,
  isRealEvaluation = false,
  currentPhase = "generating",
  numOutputsToShow = 2,
  sessionId,
  showFinalResultsHere = true,
  onCompareClick,
  idealResponses = [],
  streamingOutputs = [],
  isStreaming = false,
  streamingErrors = [],
  selectedCriteriaId,
  selectedIdealResponseId,
}: {
  modelOutputs?: ModelOutput[];
  isLoading?: boolean;
  loadingModelList?: string[];
  testCases?: TestCase[] | TestCaseWithModelOutputs[];
  selectedTestCaseIndex?: number;
  onTestCaseSelect?: (index: number) => void;
  stepId?: string;
  className?: string;
  showEvaluationFeatures?: boolean;
  isRealEvaluation?: boolean;
  currentPhase?: "generating" | "evaluating" | "complete";
  numOutputsToShow?: number;
  sessionId?: string | null;
  showFinalResultsHere?: boolean;
  onCompareClick?: () => void;
  idealResponses?: IdealModelResponse[];
  streamingOutputs?: Array<{
    modelId: string;
    output: string;
    timestamp: string;
  }>;
  isStreaming?: boolean;
  streamingErrors?: Array<{
    modelId: string;
    error: string;
    timestamp: string;
  }>;
  selectedCriteriaId?: string;
  selectedIdealResponseId?: string;
}) {
  const [viewMode, setViewMode] = useState<"enhanced" | "simple">("enhanced");
  const [evaluationViewMode, setEvaluationViewMode] = useState<
    "cards" | "table"
  >("cards");
  const [useRealCriteria, setUseRealCriteria] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  // Track comparison state per test case
  const [comparingStates, setComparingStates] = useState<Map<string | number, boolean>>(new Map());
  const inputScoringTableRef = React.useRef<{
    changeVersion: (index: number) => void;
  } | null>(null);

  // Version info from InputScoringTable
  const [versionInfo, setVersionInfo] = useState<{
    currentIndex: number | null;
    totalVersions: number;
  }>({ currentIndex: null, totalVersions: 0 });

  // Memoize the version info callback to prevent infinite loops
  const handleVersionInfo = React.useCallback(
    (currentIndex: number | null, totalVersions: number) => {
      setVersionInfo({ currentIndex, totalVersions });
    },
    []
  );

  // Versioning state (saved evaluation records for this session/group)
  const [versions, setVersions] = useState<EvaluationRecord[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState<number | null>(
    null
  );
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [versionsError, setVersionsError] = useState<string | null>(null);

  // Fetch saved evaluation versions for this session and filter to same group
  useEffect(() => {
    const fetchVersions = async () => {
      // Check if any test case is in comparing mode
      const isAnyComparing = Array.from(comparingStates.values()).some(v => v);
      if (!sessionId || !isRealEvaluation || !isAnyComparing) {
        setVersions([]);
        setCurrentVersionIndex(null);
        return;
      }

      try {
        setIsLoadingVersions(true);
        setVersionsError(null);

        const apiUrl = `/api/evaluation-records?action=bySession&session_id=${encodeURIComponent(
          sessionId
        )}`;

        const res = await fetch(apiUrl);

        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(
            json.error || json.details || "Failed to load versions"
          );
        }

        const records: EvaluationRecord[] = (json.data || []).map((r: any) => ({
          ...r,
          created_at: r.created_at ? new Date(r.created_at) : new Date(),
        }));

        if (records.length === 0) {
          setVersions([]);
          setCurrentVersionIndex(0); // Default to 0 to show "Version 1 of 1"
          return;
        }

        // Records are already sorted by created_at ASC from the database
        const sorted = records;

        setVersions(sorted);
        setCurrentVersionIndex(sorted.length - 1);
      } catch (e) {
        setVersionsError(
          e instanceof Error ? e.message : "Failed to load versions"
        );
      } finally {
        setIsLoadingVersions(false);
      }
    };
    fetchVersions();
  }, [sessionId, isRealEvaluation, comparingStates]);

  const currentVersion: EvaluationRecord | null = useMemo(() => {
    if (currentVersionIndex === null) return null;
    return versions[currentVersionIndex] || null;
  }, [versions, currentVersionIndex]);

  // Log when versions state changes
  useEffect(() => {}, [versions, currentVersionIndex, currentVersion]);

  // Log when comparison state changes
  useEffect(() => {}, [
    comparingStates,
    sessionId,
    isRealEvaluation,
    versions.length,
    isLoadingVersions,
    versionsError,
  ]);

  // Register loading state if stepId is provided
  useStepLoading(stepId || "", isLoading);

  // Copy test case-specific session link to clipboard
  const handleCopySessionLink = async () => {
    if (!sessionId || selectedTestCaseIndex === undefined) return;

    const baseUrl = window.location.origin;
    let sharableUrl = `${baseUrl}/workshop-assistant/session/${sessionId}`;

    // Add rubricId and idealResponseId as query parameters if available
    const params = new URLSearchParams();
    if (selectedCriteriaId) {
      params.append("rubricId", selectedCriteriaId);
    }
    if (selectedIdealResponseId) {
      params.append("idealResponseId", selectedIdealResponseId);
    }

    if (params.toString()) {
      sharableUrl += `?${params.toString()}`;
    }

    try {
      await navigator.clipboard.writeText(sharableUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = sharableUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Determine which models to show - prioritize streaming outputs, then actual outputs, fall back to loading models
  // When loading, show the configured number of outputs to display
  // When showing actual outputs, limit to numOutputsToShow
  const displayModels = useMemo(() => {
    // If we have streaming outputs, prioritize them
    if (isStreaming && streamingOutputs.length > 0) {
      // Create a combined view: streaming outputs + placeholders for remaining slots
      const streamingModels = streamingOutputs
        .slice(0, numOutputsToShow)
        .map((output, index) => ({
          modelId: output.modelId,
          output: output.output,
          index,
          isStreaming: true,
        }));

      // Add placeholders for remaining slots if needed
      const remainingSlots = numOutputsToShow - streamingModels.length;
      const placeholders = Array.from(
        { length: remainingSlots },
        (_, index) => ({
          modelId: `streaming-placeholder-${
            streamingModels.length + index + 1
          }`,
          output: "",
          index: streamingModels.length + index,
          isStreaming: true,
          isPlaceholder: true,
        })
      );

      return [...streamingModels, ...placeholders];
    }

    // Fallback to existing logic for non-streaming
    if (modelOutputs && modelOutputs.length > 0) {
      return modelOutputs.slice(0, numOutputsToShow);
    }

    if (isLoading) {
      // Create loading placeholders based on numOutputsToShow
      return Array.from({ length: numOutputsToShow }, (_, index) => ({
        modelId: `loading-${index + 1}`,
        output: "",
        index,
      }));
    }

    // Use actual loading model list if available, but limit to numOutputsToShow
    return loadingModelList
      .slice(0, numOutputsToShow)
      .map((modelId, index) => ({ modelId, output: "", index }));
  }, [
    modelOutputs,
    isLoading,
    isStreaming,
    streamingOutputs,
    loadingModelList,
    numOutputsToShow,
  ]);

  // Debug: Log the modelOutputs array to see what modelId values it contains
  useEffect(() => {
    if (modelOutputs && modelOutputs.length > 0) {
    }
  }, [modelOutputs]);

  // Log when InputScoringTable should be shown with evaluation features
  useEffect(() => {
    if (showEvaluationFeatures && sessionId) {
    }
  }, [showEvaluationFeatures, sessionId, isRealEvaluation, modelOutputs]);

  // Empty state - only show if we have no models to display at all
  if (
    displayModels.length === 0 &&
    !isLoading &&
    currentPhase != "generating"
  ) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        No model outputs available yet. Please try running the evaluation again.
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Test Case Navigation with Context */}
      {testCases && selectedTestCaseIndex !== undefined && onTestCaseSelect && (
        <TestCaseNavigation
          testCases={testCases}
          selectedTestCaseIndex={selectedTestCaseIndex}
          onTestCaseSelect={onTestCaseSelect}
          className="mb-6"
        />
      )}

      {showEvaluationFeatures && (
        <div className="space-y-4 mt-6">
          {/* Header with view toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {isRealEvaluation ? <>Response Scoring</> : ""}
              </h3>
              {isRealEvaluation && !comparingStates.get(testCases?.[selectedTestCaseIndex || 0]?.id || selectedTestCaseIndex || 0) && (
                <p className="mt-1 text-sm text-gray-600">
                  Provide your expected scoring points with rationale on how the
                  model responses perform on your rubric, before proceeding and
                  comparing the AI Grader's scoring work.
                </p>
              )}
            </div>
            {/* Only show version navigation when in comparing mode for the current test case */}
            {isRealEvaluation &&
              comparingStates.get(testCases?.[selectedTestCaseIndex || 0]?.id || selectedTestCaseIndex || 0) &&
              versionInfo.totalVersions > 0 && (
                <div className="flex items-center gap-2">
                  <span className="ml-2 text-xs font-normal text-gray-500">
                    Version{" "}
                    {Math.max(
                      versionInfo.totalVersions -
                        (versionInfo.currentIndex ?? 0),
                      1
                    )}{" "}
                    of {Math.max(versionInfo.totalVersions, 1)}
                  </span>
                  <button
                    className={`px-2 py-1 rounded border text-sm ${
                      versionInfo.currentIndex !== null &&
                      versionInfo.currentIndex < versionInfo.totalVersions - 1
                        ? "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                        : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    }`}
                    disabled={
                      !(
                        versionInfo.currentIndex !== null &&
                        versionInfo.currentIndex < versionInfo.totalVersions - 1
                      )
                    }
                    title="Previous version"
                    onClick={() => {
                      if (
                        versionInfo.currentIndex !== null &&
                        versionInfo.currentIndex < versionInfo.totalVersions - 1
                      ) {
                        inputScoringTableRef.current?.changeVersion(
                          versionInfo.currentIndex + 1
                        );
                      }
                    }}
                  >
                    <span>{"<"}</span>
                  </button>
                  <button
                    className={`px-2 py-1 rounded border text-sm ${
                      versionInfo.currentIndex !== null &&
                      versionInfo.currentIndex > 0
                        ? "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                        : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    }`}
                    disabled={
                      !(
                        versionInfo.currentIndex !== null &&
                        versionInfo.currentIndex > 0
                      )
                    }
                    title="Next version"
                    onClick={() => {
                      if (
                        versionInfo.currentIndex !== null &&
                        versionInfo.currentIndex > 0
                      ) {
                        inputScoringTableRef.current?.changeVersion(
                          versionInfo.currentIndex - 1
                        );
                      }
                    }}
                  >
                    <span>{">"}</span>
                  </button>
                </div>
              )}
          </div>

          {isRealEvaluation && comparingStates.get(testCases?.[selectedTestCaseIndex || 0]?.id || selectedTestCaseIndex || 0) && (
            <div className="mt-2">
              {isLoadingVersions && (
                <div className="text-xs text-slate-500">Loading versions…</div>
              )}
              {versionsError && (
                <div className="text-xs text-red-600">{versionsError}</div>
              )}
            </div>
          )}

          <>
            {/* Loading State - Waiting for responses */}
            {isLoading && isRealEvaluation && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="w-6 h-6 border-2 border-transparent border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm text-slate-600">
                    Waiting for responses to be ready...
                  </p>
                </div>
              </div>
            )}

            {/* Loading State - Evaluating responses */}
            {!isLoading &&
              currentPhase === "evaluating" &&
              isRealEvaluation && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="w-6 h-6 border-2 border-transparent border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-slate-600">
                      Evaluating responses...
                    </p>
                  </div>
                </div>
              )}

            {/* Loading State - Some models still loading */}
            {!isLoading &&
              currentPhase !== "evaluating" &&
              loadingModelList.length > 0 &&
              isRealEvaluation && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="w-6 h-6 border-2 border-transparent border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-slate-600">
                      Waiting for {loadingModelList.length} model(s) to
                      complete...
                    </p>
                  </div>
                </div>
              )}

            {/* During evaluation complete in step 2, show input scoring table instead of final results */}
            {(() => {
              const shouldShow =
                !isLoading &&
                currentPhase === "complete" &&
                isRealEvaluation &&
                !showFinalResultsHere;
              return shouldShow;
            })() &&
              (() => {
                const selectedTestCase =
                  testCases && selectedTestCaseIndex !== undefined
                    ? testCases[selectedTestCaseIndex]
                    : undefined;

                console.log(
                  "[ModelOutputsGrid] Passing to InputScoringTable:",
                  {
                    selectedTestCaseIndex,
                    selectedTestCase: selectedTestCase
                      ? {
                          id: selectedTestCase.id,
                          sessionId:
                            "sessionId" in selectedTestCase
                              ? selectedTestCase.sessionId
                              : undefined,
                          hasModelOutputs:
                            "modelOutputs" in selectedTestCase
                              ? selectedTestCase.modelOutputs?.length > 0
                              : false,
                        }
                      : null,
                    sessionIdProp: sessionId,
                    testCasesCount: testCases?.length,
                    testCasesWithSessionIds: testCases?.map((tc: any, idx) => ({
                      index: idx,
                      id: tc.id,
                      sessionId: "sessionId" in tc ? tc.sessionId : undefined,
                    })),
                  }
                );

                // Create a unique key for each test case to force component remount
                const testCaseKey = `scoring-table-${selectedTestCase?.id || selectedTestCaseIndex || 0}`;
                const testCaseId = selectedTestCase?.id || selectedTestCaseIndex || 0;
                const isTestCaseComparing = comparingStates.get(testCaseId) || false;

                return (
                  <InputScoringTable
                    key={testCaseKey}
                    ref={inputScoringTableRef}
                    responses={(modelOutputs || []).map((mo, i) => ({
                      id: mo.modelId || mo.modelName || `Response ${i + 1}`,
                      label: mo.modelName || `Response ${i + 1}`,
                    }))}
                    modelOutputs={modelOutputs}
                    testCase={selectedTestCase}
                    onCompareClick={(enabled) => {
                      // Update the comparison state for this specific test case
                      setComparingStates(prev => {
                        const newMap = new Map(prev);
                        newMap.set(testCaseId, enabled);
                        return newMap;
                      });
                      if (onCompareClick) onCompareClick();
                    }}
                    idealResponses={idealResponses}
                    sessionId={sessionId}
                    onVersionInfo={handleVersionInfo}
                  />
                );
              })()}

            {/* Optionally render final results table here (used by session view) */}
            {!isLoading &&
              currentPhase === "complete" &&
              modelOutputs &&
              modelOutputs.length > 0 &&
              isRealEvaluation &&
              showFinalResultsHere && (
                <RealCriteriaTable
                  modelScores={modelOutputs.map((modelOutput, index) => ({
                    modelId: modelOutput.modelId,
                    modelName: `Response ${index + 1} (${modelOutput.modelId})`,
                    scores: {
                      relevance: modelOutput.rubricScores?.relevance || 0,
                      accuracy: modelOutput.rubricScores?.accuracy || 0,
                      completeness: modelOutput.rubricScores?.completeness || 0,
                    },
                  }))}
                />
              )}

            {/* No responses available */}
            {!isLoading &&
              currentPhase === "complete" &&
              (!modelOutputs || modelOutputs.length === 0) &&
              loadingModelList.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No evaluation results available
                </div>
              )}
          </>
        </div>
      )}

      {/* Model Outputs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Possible Responses
            </h3>
            {modelOutputs && modelOutputs.length > numOutputsToShow && (
              <p className="text-sm text-gray-500 mt-1">
                Showing {numOutputsToShow} of {modelOutputs.length} generated
                responses
              </p>
            )}
          </div>
          {/* Only show copy button when sessionId is available (database has returned session_id) */}
          {sessionId && testCases && selectedTestCaseIndex !== undefined && (
            <button
              onClick={handleCopySessionLink}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                copySuccess
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100"
              }`}
              title="Copy sharable session link"
            >
              {copySuccess ? (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy Sharable Link
                </>
              )}
            </button>
          )}
        </div>
        <div className={`grid ${getGridCols(displayModels.length)} gap-4`}>
          {displayModels.map((item, index) => {
            // Check if this specific model is loading
            const isLoadingModel =
              loadingModelList.includes(item.modelId) ||
              (isLoading && item.modelId.startsWith("loading-")) ||
              (isStreaming &&
                "isPlaceholder" in item &&
                (item as any).isPlaceholder);
            const hasOutput = "output" in item && item.output;
            const isStreamingModel =
              "isStreaming" in item &&
              (item as any).isStreaming &&
              !("isPlaceholder" in item && (item as any).isPlaceholder);
            const streamingError = streamingErrors.find(
              (error) => error.modelId === item.modelId
            );

            return (
              <div
                key={index}
                className="border border-gray-200 
              rounded-lg overflow-hidden h-fit"
              >
                {/* Model Header */}
                <div
                  className="bg-gray-50 px-3 py-2 border-b 
                border-gray-200 flex justify-between"
                >
                  <div className="flex flex-col space-y-1">
                    <h4
                      className="text-base font-bold text-gray-900 
                    truncate"
                    >
                      Response {index + 1}
                      {/* <span className="text-xs text-gray-400 font-normal">
                        {!isLoadingModel && ` (Internal test: ${item.modelId})`}
                      </span> */}
                    </h4>
                  </div>
                  {isStreamingModel && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-600 font-medium">
                        Live response
                      </span>
                    </div>
                  )}
                </div>

                {/* Model Output Content or Loading */}
                <div className="p-6 space-y-4">
                  {streamingError ? (
                    // Error state for streaming
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-red-600 text-sm">✕</span>
                        </div>
                        <p className="text-sm text-red-600 mb-2">
                          Generation failed
                        </p>
                        <p className="text-xs text-gray-500">
                          {streamingError.error}
                        </p>
                      </div>
                    </div>
                  ) : isLoadingModel || (!hasOutput && !isStreamingModel) ? (
                    // Loading state for content
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div
                          className="w-6 h-6 border-2 
                        border-transparent border-t-blue-600 rounded-full 
                        animate-spin mx-auto mb-3"
                        ></div>
                        <p className="text-sm text-slate-600">
                          {isStreaming
                            ? "Preparing response..."
                            : isLoading
                            ? "Preparing response..."
                            : "Preparing response..."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    // Actual content (regular or streaming)
                    <div className="text-sm leading-relaxed overflow-y-auto">
                      <SimpleMarkdownRenderer
                        content={item.output}
                        enableGfm={true}
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
