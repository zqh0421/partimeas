"use client";

import VerticalStepper from "@/components/workshop-assistant/steps/VerticalStepper";
import SetupStep from "@/components/workshop-assistant/steps/SetupStep";
import AnalysisStep from "@/components/workshop-assistant/steps/AnalysisStep";
import { RefreshIcon } from "@/components/icons";
import { AnalysisHeaderFull } from "@/components";
import { GroupIdModal } from "@/components/GroupIdModal";
import { useWorkshopAssistantController } from "@/hooks/useWorkshopAssistantController";

export default function Page() {
  const { state, actions } = useWorkshopAssistantController();
  const { ui, data, selection, derived } = state;
  const {
    flow,
    groupId,
    selection: selectionActions,
    handlers: analysisHandlers,
  } = actions;

  const steps = [
    {
      id: "setup",
      title: "Load Test Data",
      description: "Choose a set of test data to help examine your rubric.",
      status:
        ui.analysisStep === "setup"
          ? ("current" as const)
          : ui.analysisStep === "running" || ui.analysisStep === "complete"
            ? ("completed" as const)
            : ("upcoming" as const),
      isCollapsed: ui.isStep1Collapsed,
      content: (
        <SetupStep
          state={{
            validationError: ui.validationError,
            hasValidSelections: derived.hasValidSelections,
            analysisStep: ui.analysisStep,
          }}
          selection={{
            selectedIdealResponseId: selection.selectedIdealResponseId,
          }}
          handlers={{
            onMultiLevelSelectionChange:
              analysisHandlers.handleMultiLevelSelectionChange,
            onUseCaseSelected: analysisHandlers.handleUseCaseSelected,
            onScenarioCategorySelected:
              analysisHandlers.handleScenarioCategorySelected,
            onUseCaseDataLoaded: analysisHandlers.handleUseCaseDataLoaded,
            onUseCaseError: analysisHandlers.handleUseCaseError,
            onConfirmSelections: flow.confirmSelections,
            onCriteriaVersionSelected: selectionActions.setSelectedCriteriaId,
            onIdealResponseSelected:
              analysisHandlers.handleIdealResponseSelected,
            onIdealResponseDataLoaded:
              analysisHandlers.handleIdealResponseDataLoaded,
            onIdealResponseError: analysisHandlers.handleIdealResponseError,
          }}
        />
      ),
    },
    {
      id: "analysis",
      title: "Test the Rubric",
      description: "Review possible responses to the selected test cases.",
      status:
        ui.analysisStep === "running"
          ? ("current" as const)
          : ui.analysisStep === "complete"
            ? ("completed" as const)
            : ("upcoming" as const),
      isCollapsed: false,
      content: (
        <AnalysisStep
          data={{
            testCases: data.testCases,
            testCasesWithModelOutputs: data.testCasesWithModelOutputs,
            loadingModelListOverride: data.selectedOutputModelIds,
            idealResponses: data.idealResponses,
            streamingOutputs: data.streamingOutputs,
            streamingErrors: data.streamingErrors,
          }}
          state={{
            selectedTestCaseIndex: selection.selectedTestCaseIndex,
            analysisStep: ui.analysisStep,
            currentPhase: ui.currentPhase,
            showEvaluationFeatures: ui.showEvaluationFeatures,
            isRealEvaluation: ui.isRealEvaluation,
            numOutputsToShow: data.numOutputsToShow,
            sessionId:
              data.testCaseSessionIds.get(selection.selectedTestCaseIndex) ||
              null,
            isStreaming: data.isStreaming,
            selectedCriteriaId: selection.selectedCriteriaId,
            selectedIdealResponseId: selection.selectedIdealResponseId,
          }}
          actions={{
            onTestCaseSelect: analysisHandlers.handleTestCaseSelect,
            onCompareClick: () => {},
          }}
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AnalysisHeaderFull
        sessionId={null}
        isGeneratingOutputs={ui.isGeneratingOutputs}
        groupId={selection.currentGroupId}
        onEditGroupId={groupId.openModal}
        onClearGroupId={groupId.clear}
        shareableLink={data.shareableLink}
      />

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <div className="space-y-6">
          <VerticalStepper steps={steps} />

          {ui.analysisStep === "complete" && (
            <div className="flex justify-center mb-8">
              <button
                onClick={flow.restart}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                <RefreshIcon className="w-5 h-5" />
                Start Over
              </button>
            </div>
          )}
        </div>
      </div>

      <GroupIdModal
        visible={ui.showGroupIdModal}
        onConfirm={groupId.confirm}
        onCancel={groupId.cancel}
        loading={false}
      />
    </div>
  );
}
