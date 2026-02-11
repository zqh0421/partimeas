"use client";

import React, { useCallback, useMemo } from "react";
import { useAdminState } from "@/hooks/useAdminState";
import LoadingState from "@/components/LoadingState";
import {
  StatusMessages,
  ActionButtons,
  SectionNavigation,
  OutputGenerationSection,
  EvaluationSection,
  ModelsSection,
  AssistantsSection,
  Configuration,
} from "@/components/admin";

export default function AdminPage() {
  const admin = useAdminState();
  const { state, actions } = admin;

  const wrapAsync = useCallback(
    (label: string, fn: () => Promise<unknown>) => async () => {
      try {
        await fn();
      } catch (err) {
        console.error(`Error saving ${label}:`, err);
      }
    },
    [],
  );

  const handleSaveModels = useMemo(
    () => wrapAsync("models", actions.models.save),
    [wrapAsync, actions.models.save],
  );
  const handleSavePrompts = useMemo(
    () => wrapAsync("prompts", actions.prompts.save),
    [wrapAsync, actions.prompts.save],
  );
  const handleSaveAssistants = useMemo(
    () => wrapAsync("assistants", actions.assistants.save),
    [wrapAsync, actions.assistants.save],
  );

  const onConfigChange = useCallback(
    (configs: Array<{ name: string; value: string }>) => {
      configs.forEach(({ name, value }) => {
        if (state.configValues?.find((c) => c.name === name)?.value !== value) {
          actions.config.updateValue(name, value);
        }
      });
    },
    [state.configValues, actions.config],
  );

  if (state.isLoading)
    return <LoadingState message="Loading admin configuration..." size="lg" />;

  const sectionData = {
    modelConfigs: state.modelConfigs,
    promptConfigs: state.promptConfigs,
    assistants: state.assistants,
    configValues: state.configValues || [],
  };

  const modelActions = {
    onAddProviderModels: actions.models.addProviderModels,
    onUpdateModel: actions.models.update,
    onRemoveModel: actions.models.remove,
    onSaveModels: handleSaveModels,
  };

  const promptActions = {
    onAddPrompt: actions.prompts.add,
    onUpdatePrompt: actions.prompts.update,
    onRemovePrompt: actions.prompts.remove,
    onSavePrompts: handleSavePrompts,
  };

  const assistantActions = {
    onAddAssistant: actions.assistants.add,
    onUpdateAssistant: actions.assistants.update,
    onRemoveAssistant: actions.assistants.remove,
    onSaveAssistants: handleSaveAssistants,
    onConfigChange: onConfigChange,
  };

  const sectionFlags = {
    hasModelChanges: state.hasModelChanges,
    hasPromptChanges: state.hasPromptChanges,
    hasAssistantChanges: state.hasAssistantChanges,
    hasConfigChanges: state.hasConfigChanges || false,
  };

  const content =
    state.activeSection === "output-generation" ? (
      <OutputGenerationSection
        modelConfigs={sectionData.modelConfigs}
        promptConfigs={sectionData.promptConfigs}
        {...modelActions}
        {...promptActions}
        hasModelChanges={sectionFlags.hasModelChanges}
        hasPromptChanges={sectionFlags.hasPromptChanges}
      />
    ) : state.activeSection === "evaluation" ? (
      <EvaluationSection
        modelConfigs={sectionData.modelConfigs}
        promptConfigs={sectionData.promptConfigs}
        {...modelActions}
        {...promptActions}
        hasModelChanges={sectionFlags.hasModelChanges}
        hasPromptChanges={sectionFlags.hasPromptChanges}
      />
    ) : state.activeSection === "models" ? (
      <ModelsSection
        modelConfigs={sectionData.modelConfigs}
        {...modelActions}
        hasModelChanges={sectionFlags.hasModelChanges}
      />
    ) : state.activeSection === "assistants" ? (
      <AssistantsSection
        assistants={sectionData.assistants}
        modelConfigs={sectionData.modelConfigs}
        promptConfigs={sectionData.promptConfigs}
        configValues={sectionData.configValues}
        {...assistantActions}
        hasAssistantChanges={sectionFlags.hasAssistantChanges}
      />
    ) : state.activeSection === "configuration" ? (
      <Configuration
        configValues={sectionData.configValues}
        onConfigChange={onConfigChange}
        hasChanges={sectionFlags.hasConfigChanges}
        onSave={() => {
          // This is handled by the Configuration component.
        }}
      />
    ) : null;

  return (
    <>
      <StatusMessages
        error={state.error}
        success={state.success}
        onClearError={actions.ui.clearError}
        onClearSuccess={actions.ui.clearSuccess}
      />

      <ActionButtons onReload={actions.lifecycle.loadConfiguration} />

      <SectionNavigation
        activeSection={state.activeSection}
        onSectionChange={actions.ui.setActiveSection}
      />

      {content}
    </>
  );
}
