"use client";

import React, { useCallback, useMemo, useState } from "react";
import InputScoringTable from "@/components/workshop-assistant/evaluation/InputScoringTable";
import RealCriteriaTable from "@/components/workshop-assistant/evaluation/RealCriteriaTable";
import {
  IdealModelResponse,
  ModelOutput,
  TestCase,
  TestCaseWithModelOutputs,
} from "@/types";

interface EvaluationScoringSectionProps {
  isLoading: boolean;
  currentPhase: "generating" | "evaluating" | "complete";
  loadingModelList: string[];
  isRealEvaluation: boolean;
  showFinalResultsHere: boolean;
  modelOutputs?: ModelOutput[];
  testCases?: TestCase[] | TestCaseWithModelOutputs[];
  selectedTestCaseIndex?: number;
  sessionId?: string | null;
  selectedCriteriaId?: string;
  idealResponses: IdealModelResponse[];
  onCompareClick?: () => void;
}

export default function EvaluationScoringSection({
  isLoading,
  currentPhase,
  loadingModelList,
  isRealEvaluation,
  showFinalResultsHere,
  modelOutputs,
  testCases,
  selectedTestCaseIndex,
  sessionId,
  selectedCriteriaId,
  idealResponses,
  onCompareClick,
}: EvaluationScoringSectionProps) {
  const [comparingStates, setComparingStates] = useState<
    Map<string | number, boolean>
  >(new Map());
  const inputScoringTableRef = React.useRef<{ changeVersion: (index: number) => void } | null>(null);
  const [versionInfo, setVersionInfo] = useState<{ currentIndex: number | null; totalVersions: number }>({
    currentIndex: null,
    totalVersions: 0,
  });
  const handleVersionInfo = useCallback(
    (currentIndex: number | null, totalVersions: number) => {
      setVersionInfo((prev) => {
        if (
          prev.currentIndex === currentIndex &&
          prev.totalVersions === totalVersions
        ) {
          return prev;
        }
        return { currentIndex, totalVersions };
      });
    },
    [],
  );

  const selectedTestCase = useMemo(
    () =>
      testCases && selectedTestCaseIndex !== undefined
        ? testCases[selectedTestCaseIndex]
        : undefined,
    [selectedTestCaseIndex, testCases],
  );

  const testCaseId = selectedTestCase?.id || selectedTestCaseIndex || 0;
  const isComparing = comparingStates.get(testCaseId) || false;

  if (!isRealEvaluation) {
    return null;
  }

  return (
    <div className="space-y-4 mt-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Response Scoring</h3>
          {!isComparing && (
            <p className="mt-1 text-sm text-gray-600">
              Provide your expected scoring points with rationale before comparing with AI grader.
            </p>
          )}
        </div>

        {isComparing && versionInfo.totalVersions > 0 && (
          <div className="flex items-center gap-2">
            <span className="ml-2 text-xs font-normal text-gray-500">
              Version {Math.max(versionInfo.totalVersions - (versionInfo.currentIndex ?? 0), 1)} of {Math.max(versionInfo.totalVersions, 1)}
            </span>
            <button
              className={`px-2 py-1 rounded border text-sm ${
                versionInfo.currentIndex !== null && versionInfo.currentIndex < versionInfo.totalVersions - 1
                  ? "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                  : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
              }`}
              disabled={!(versionInfo.currentIndex !== null && versionInfo.currentIndex < versionInfo.totalVersions - 1)}
              onClick={() => inputScoringTableRef.current?.changeVersion((versionInfo.currentIndex || 0) + 1)}
              title="Previous version"
            >
              {"<"}
            </button>
            <button
              className={`px-2 py-1 rounded border text-sm ${
                versionInfo.currentIndex !== null && versionInfo.currentIndex > 0
                  ? "bg-white hover:bg-gray-50 text-gray-700 border-gray-300"
                  : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
              }`}
              disabled={!(versionInfo.currentIndex !== null && versionInfo.currentIndex > 0)}
              onClick={() => inputScoringTableRef.current?.changeVersion((versionInfo.currentIndex || 0) - 1)}
              title="Next version"
            >
              {">"}
            </button>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-transparent border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-600">Waiting for responses to be ready...</p>
          </div>
        </div>
      )}

      {!isLoading && currentPhase === "evaluating" && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-transparent border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-600">Loading the Rubric...</p>
          </div>
        </div>
      )}

      {!isLoading && currentPhase !== "evaluating" && loadingModelList.length > 0 && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-transparent border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-600">Waiting for {loadingModelList.length} model(s) to complete...</p>
          </div>
        </div>
      )}

      {!isLoading && currentPhase === "complete" && !showFinalResultsHere && (
        <InputScoringTable
          key={`scoring-table-${testCaseId}`}
          ref={inputScoringTableRef}
          responses={(modelOutputs || []).map((mo, i) => ({
            id: mo.modelId || `resp-${i + 1}`,
            label: `Response ${i + 1}`,
          }))}
          modelOutputs={modelOutputs}
          testCase={selectedTestCase}
          onCompareClick={(enabled) => {
            setComparingStates((prev) => {
              const next = new Map(prev);
              next.set(testCaseId, enabled);
              return next;
            });
            onCompareClick?.();
          }}
          idealResponses={idealResponses}
          sessionId={sessionId}
          linkedCriteriaId={selectedCriteriaId}
          onVersionInfo={handleVersionInfo}
        />
      )}

      {!isLoading && currentPhase === "complete" && showFinalResultsHere && modelOutputs && modelOutputs.length > 0 && (
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

      {!isLoading && currentPhase === "complete" && (!modelOutputs || modelOutputs.length === 0) && loadingModelList.length === 0 && (
        <div className="text-center py-8 text-gray-500">No evaluation results available</div>
      )}
    </div>
  );
}
