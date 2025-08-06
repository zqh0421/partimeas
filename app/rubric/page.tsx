"use client";

import { useState, useEffect } from "react";
import {
  SettingsModal,
  CriteriaHistory,
  ReactFlowBranchDiagram,
  ResultsComparisonAnalysis,
  Header,
  ConfigurationPanel,
  EvaluationCriteriaEditor,
  ResultsComparisonCard,
} from "@/components/rubric";
import {
  mockCurrentVersion,
} from "@/data/mockHistoryData";
import {
  RubricItem,
  RubricVersion,
  VersionData,
} from "@/types/rubric";
import { saveVersion } from "@/utils/rubricUtils";

export default function RubricPage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentVersion, setCurrentVersion] =
    useState<RubricVersion>(mockCurrentVersion);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedCriteriaForHistory, setSelectedCriteriaForHistory] =
    useState<RubricItem | null>(null);
  const [reactFlowBranchOpen, setReactFlowBranchOpen] = useState(false);
  const [resultsAnalysisOpen, setResultsAnalysisOpen] = useState(false);

  useEffect(() => {
    console.log("Current Version Updated:", {
      id: currentVersion.id,
      name: currentVersion.name,
      version: currentVersion.version,
      historyLength: currentVersion.history.length,
      rubricItemsCount: currentVersion.rubricItems.length,
    });
  }, [currentVersion]);

  const openHistoryModal = (item: RubricItem) => {
    setSelectedCriteriaForHistory(item);
    setHistoryModalOpen(true);
  };

  const openReactFlowBranch = () => {
    console.log("Opening ReactFlow branch diagram for overall criteria");
    setReactFlowBranchOpen(true);
  };

  const handleLoadVersion = (versionData: VersionData) => {
    console.log("Loading version into editing interface:", versionData);

    if (
      confirm(
        `Load version ${versionData.version} (${versionData.modifier}) into editing interface?`
      )
    ) {
      console.log("Version loading confirmed:", versionData);
      setReactFlowBranchOpen(false);
    }
  };

  const handleSaveVersion = () => {
    saveVersion(currentVersion);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <Header 
          onOpenVersionHistory={openReactFlowBranch}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-4 lg:gap-6">
          {/* Left Sidebar - Configuration */}
          <div className="lg:col-span-3">
            <ConfigurationPanel
              currentVersion={currentVersion}
              setCurrentVersion={setCurrentVersion}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-7 space-y-4 lg:space-y-6">
            {/* Evaluation Criteria Editor Card */}
            <EvaluationCriteriaEditor
              currentVersion={currentVersion}
              setCurrentVersion={setCurrentVersion}
              onOpenHistoryModal={openHistoryModal}
              onSaveVersion={handleSaveVersion}
            />

            {/* Results Comparison Card */}
            <ResultsComparisonCard
              currentVersion={currentVersion}
              setCurrentVersion={setCurrentVersion}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {selectedCriteriaForHistory && (
        <CriteriaHistory
          criteriaId={selectedCriteriaForHistory.id}
          criteriaName={selectedCriteriaForHistory.criteria}
          history={currentVersion.history}
          isOpen={historyModalOpen}
          onClose={() => {
            setHistoryModalOpen(false);
            setSelectedCriteriaForHistory(null);
          }}
        />
      )}

      {reactFlowBranchOpen && (
        <ReactFlowBranchDiagram
          criteriaId={currentVersion.id}
          criteriaName={currentVersion.name}
          history={currentVersion.history}
          isOpen={reactFlowBranchOpen}
          onClose={() => {
            setReactFlowBranchOpen(false);
          }}
          onLoadVersion={handleLoadVersion}
        />
      )}

      {resultsAnalysisOpen && (
        <ResultsComparisonAnalysis
          currentVersion={currentVersion}
          isOpen={resultsAnalysisOpen}
          onClose={() => {
            setResultsAnalysisOpen(false);
          }}
        />
      )}
    </div>
  );
}
