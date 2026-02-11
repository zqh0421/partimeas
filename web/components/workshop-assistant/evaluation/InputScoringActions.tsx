"use client";

import React from "react";
import {
  WarningIcon,
  CheckIcon,
  ClockIcon,
  RefreshArcIcon,
} from "@/components/icons";
import { InlineSpinner, ButtonSpinner } from "@/components/LoadingSpinner";

interface InputScoringActionsProps {
  isComparingMode: boolean;
  evaluationError: string | null;
  isEvaluating: boolean;
  areAiResultsAvailable: boolean;
  canCompare: boolean;
  isUploadingData: boolean;
  isRefreshingRubric: boolean;
  onRefreshAiGrader: () => void;
  onCompareToggle: () => Promise<void>;
}

export default function InputScoringActions({
  isComparingMode,
  evaluationError,
  isEvaluating,
  areAiResultsAvailable,
  canCompare,
  isUploadingData,
  isRefreshingRubric,
  onRefreshAiGrader,
  onCompareToggle,
}: InputScoringActionsProps) {
  return (
    <div className="flex flex-row justify-between">
      {isComparingMode ? (
        <div className="mt-4 mb-3 text-[14px] text-gray-800 text-left w-fit">
          <p className="w-fit whitespace-nowrap">
            <span className="bg-red-50 px-1 py-0.5 rounded-md border border-red-300 text-red-700">
              Red cells
            </span>{" "}
            mean that the AI Grader inaccurately scored the model response,
            using your rubric.
          </p>
          <p className="w-fit whitespace-nowrap">
            How might you revise your rubric instructions, so the AI Grader can
            do a better job?
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-3 mb-1 mr-4">
          <span
            className={`px-2 py-1 rounded-md border text-sm font-medium whitespace-nowrap inline-flex items-center gap-1 ${
              evaluationError
                ? "bg-red-50 border-red-300 text-red-700"
                : isEvaluating
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : areAiResultsAvailable
                    ? "bg-green-50 border-green-300 text-green-700"
                    : "bg-gray-50 border-gray-300 text-gray-600"
            }`}
          >
            {evaluationError ? (
              <>
                <WarningIcon className="w-3.5 h-3.5" />
                AI Grader error
              </>
            ) : isEvaluating ? (
              <InlineSpinner text="AI Grader is working" />
            ) : areAiResultsAvailable ? (
              <>
                <CheckIcon className="w-3.5 h-3.5" />
                AI Grader ready
              </>
            ) : (
              <>
                <ClockIcon className="w-3.5 h-3.5" />
                AI Grader pending
              </>
            )}
          </span>
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <div className="flex gap-3">
          {isComparingMode && (
            <button
              onClick={onRefreshAiGrader}
              disabled={isRefreshingRubric || isEvaluating}
              className={`px-4 py-2 rounded-md mb-2 transition-all duration-200 inline-flex items-center gap-2 h-10 ${
                isRefreshingRubric || isEvaluating
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {isRefreshingRubric ? (
                <>
                  <ButtonSpinner light />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshArcIcon className="w-4 h-4" />
                  Sync Updates to the Rubric
                </>
              )}
            </button>
          )}

          <button
            className={`px-4 py-2 rounded-md mb-2 transition-all duration-200 ${
              (!canCompare && !isUploadingData) || isUploadingData
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : isComparingMode && !isUploadingData
                  ? "hidden"
                  : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
            disabled={!canCompare || isUploadingData}
            onClick={onCompareToggle}
          >
            {isUploadingData
              ? "Uploading data..."
              : !isComparingMode
                ? "Compare with the AI Grader"
                : null}
          </button>
        </div>
      </div>
    </div>
  );
}
