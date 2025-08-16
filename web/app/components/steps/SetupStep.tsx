"use client";

import MultiLevelSelector from "@/app/components/MultiLevelSelector";
import { TestCase } from "@/app/types";

interface SetupStepProps {
  testCases: TestCase[];
  selectedTestCaseIndex: number;
  validationError: string;
  hasValidSelections: boolean;
  analysisStep: "setup" | "running" | "complete";
  onMultiLevelSelectionChange?: (
    selections: Array<{
      useCaseId: string;
      scenarioCategoryIds: string[];
    }>
  ) => void;
  onUseCaseSelected: (useCaseId: string) => void;
  onScenarioCategorySelected: (categoryId: string) => void;
  onUseCaseDataLoaded: (testCases: any[]) => void;
  onUseCaseError: (error: string) => void;
  onTestCaseSelect: (index: number) => void;
  onConfirmSelections: () => void;
}

export default function SetupStep({
  testCases,
  selectedTestCaseIndex,
  validationError,
  hasValidSelections,
  analysisStep,
  onMultiLevelSelectionChange,
  onUseCaseSelected,
  onScenarioCategorySelected,
  onUseCaseDataLoaded,
  onUseCaseError,
  onTestCaseSelect,
  onConfirmSelections,
}: SetupStepProps) {
  const showTestCaseSelector = testCases.length > 0;

  return (
    <div className="space-y-6">
      {/* Use Case & Scenario Category Selection */}
      <div>
        <MultiLevelSelector
          onSelectionChange={(selections) => {
            onMultiLevelSelectionChange?.(selections);
            // For backward compatibility, still call individual handlers
            if (selections.length > 0) {
              const firstSelection = selections[0];
              onUseCaseSelected(firstSelection.useCaseId);
              if (firstSelection.scenarioCategoryIds.length > 0) {
                onScenarioCategorySelected(
                  firstSelection.scenarioCategoryIds[0]
                );
              }
            }
          }}
          onDataLoaded={onUseCaseDataLoaded}
          onError={onUseCaseError}
        />
      </div>

      {/* Test Case Selection */}
      {showTestCaseSelector && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Test Cases ({testCases.length})
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {testCases.map((_, index) => (
              <button
                key={index}
                onClick={() => onTestCaseSelect(index)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  selectedTestCaseIndex === index
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {/* Selected test case preview */}
          {testCases[selectedTestCaseIndex] && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">
                Test Case {selectedTestCaseIndex + 1} Preview
              </h4>
              <div className="grid grid-cols-1 text-sm">
                <div>
                  <p className="text-gray-600 mt-1 font-bold">
                    {testCases[selectedTestCaseIndex].scenarioCategory ||
                      "No context available"}
                  </p>
                  <p className="text-gray-600 mt-1">
                    {testCases[selectedTestCaseIndex].input ||
                      "No input available"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Validation Error */}
      {validationError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{validationError}</p>
        </div>
      )}

      {/* Start Analysis Button */}
      {hasValidSelections && analysisStep === "setup" && (
        <div className="flex justify-end">
          <button
            onClick={onConfirmSelections}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-slate-700 font-medium"
          >
            Confirm →
          </button>
        </div>
      )}
    </div>
  );
}
