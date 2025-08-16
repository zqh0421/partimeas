"use client";

import { useState, useEffect } from "react";
import {
  SettingsModal,
  CriteriaHistory,
  ReactFlowBranchDiagram,
  Header,
  ConfigurationPanel,
  EvaluationCriteriaEditor,
  ResultsComparisonCard,
} from "@/app/components";
// Mock data import removed - use real configuration instead
import { RubricItem, RubricVersion, VersionData } from "@/app/types";
import { saveVersion } from "@/utils/rubricUtils";

export default function RubricPage() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<RubricVersion>({
    id: "1",
    version: "v1.0",
    name: "Default Rubric Version",
    systemPrompt: "Configure your system prompt here",
    evaluationPrompt: "Configure your evaluation prompt here",
    rubricItems: [],
    testCases: [],
    createdAt: new Date(),
    history: [],
  });
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedCriteriaForHistory, setSelectedCriteriaForHistory] =
    useState<RubricItem | null>(null);
  const [reactFlowBranchOpen, setReactFlowBranchOpen] = useState(false);
  const [isConfigPanelCollapsed, setIsConfigPanelCollapsed] = useState(false);

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

  const toggleConfigPanel = () => {
    setIsConfigPanelCollapsed(!isConfigPanelCollapsed);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <Header onOpenVersionHistory={openReactFlowBranch} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Left Sidebar - Configuration */}
          {!isConfigPanelCollapsed && (
            <div className="lg:col-span-3">
              <ConfigurationPanel
                currentVersion={currentVersion}
                setCurrentVersion={setCurrentVersion}
                onOpenSettings={() => setIsSettingsOpen(true)}
                isCollapsed={isConfigPanelCollapsed}
                onToggleCollapse={toggleConfigPanel}
              />
            </div>
          )}

          {/* Right Content Area */}
          <div
            className={`transition-all duration-300 ease-in-out ${
              isConfigPanelCollapsed ? "lg:col-span-12" : "lg:col-span-9"
            } space-y-4 lg:space-y-6`}
          >
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

        {/* Fixed Collapsed Configuration Panel */}
        {isConfigPanelCollapsed && (
          <div className="fixed left-0 top-1/5 transform -translate-y-1/2 z-50">
            <ConfigurationPanel
              currentVersion={currentVersion}
              setCurrentVersion={setCurrentVersion}
              onOpenSettings={() => setIsSettingsOpen(true)}
              isCollapsed={isConfigPanelCollapsed}
              onToggleCollapse={toggleConfigPanel}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        evaluationPrompt={currentVersion.evaluationPrompt}
        onEvaluationPromptChange={(prompt) =>
          setCurrentVersion((prev) => ({ ...prev, evaluationPrompt: prompt }))
        }
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
    </div>
  );
}
