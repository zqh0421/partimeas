"use client";

import MultiLevelSelector from "@/components/MultiLevelSelector";
import CriteriaMultiLevelSelector, {
  CriteriaItem,
} from "@/components/CriteriaMultiLevelSelector";
import IdealResponseSelector from "@/components/IdealResponseSelector";
import { TestCase, IdealModelResponse } from "@/types";
import { SelectionPath } from "@/components/GenericMultiLevelSelector";

interface SetupStepProps {
  testCases: TestCase[];
  selectedTestCaseIndex: number;
  validationError: string;
  hasValidSelections: boolean;
  analysisStep: "setup" | "running" | "complete";
  selectedCriteriaVersionId?: string;
  selectedIdealResponseId?: string;
  onMultiLevelSelectionChange?: (
    selections: Array<{
      useCaseId: string;
      scenarioCategoryIds: string[];
    }>,
  ) => void;
  onUseCaseSelected: (useCaseId: string) => void;
  onScenarioCategorySelected: (categoryId: string) => void;
  onUseCaseDataLoaded: (testCases: any[]) => void;
  onUseCaseError: (error: string) => void;
  onTestCaseSelect: (index: number) => void;
  onConfirmSelections: () => void;
  onCriteriaVersionSelected?: (versionId: string) => void;
  onCriteriaSelectionChange?: (selections: SelectionPath[]) => void;
  onCriteriaDataLoaded?: (requirements: CriteriaItem[]) => void;
  onCriteriaError?: (error: string) => void;
  onIdealResponseSelected?: (idealResponseId: string) => void;
  onIdealResponseDataLoaded?: (idealResponses: IdealModelResponse[]) => void;
  onIdealResponseError?: (error: string) => void;
}

export default function SetupStep({
  testCases,
  validationError,
  hasValidSelections,
  analysisStep,
  selectedIdealResponseId,
  onMultiLevelSelectionChange,
  onUseCaseSelected,
  onScenarioCategorySelected,
  onUseCaseDataLoaded,
  onUseCaseError,
  onConfirmSelections,
  onCriteriaVersionSelected,
  onCriteriaSelectionChange,
  onCriteriaDataLoaded,
  onCriteriaError,
  onIdealResponseSelected,
  onIdealResponseDataLoaded,
  onIdealResponseError,
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
                  firstSelection.scenarioCategoryIds[0],
                );
              }
            }
          }}
          onDataLoaded={onUseCaseDataLoaded}
          onError={onUseCaseError}
        />
      </div>

      {/* Criteria Selection */}
      <div>
        <CriteriaMultiLevelSelector
          onSelectionChange={(selections) => {
            // Bubble raw selection paths
            onCriteriaSelectionChange?.(selections);

            // Derive and bubble a single selected criteria version id (by node id)
            const selected = selections[0];
            if (selected && selected.node?.id) {
              onCriteriaVersionSelected?.(selected.node.id);
            } else {
              // Clear when no selection
              onCriteriaVersionSelected?.("");
            }
          }}
          onDataLoaded={onCriteriaDataLoaded || (() => {})}
          onError={onCriteriaError || (() => {})}
        />
      </div>

      {/* Ideal Response Selection */}
      <div>
        <IdealResponseSelector
          selectedIdealResponseId={selectedIdealResponseId}
          onSelectionChange={(idealResponseId) => {
            onIdealResponseSelected?.(idealResponseId);
          }}
          onDataLoaded={onIdealResponseDataLoaded || (() => {})}
          onError={onIdealResponseError || (() => {})}
        />
      </div>

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
