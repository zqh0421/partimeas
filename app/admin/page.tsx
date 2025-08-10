'use client';

import { useAdminState } from '../../hooks/useAdminState';
import {
  StatusMessages,
  ActionButtons,
  SectionNavigation,
  MainContent,
  LoadingSpinner,
  Breadcrumb,
  PageHeader
} from '../../components/admin';

export default function AdminPage() {
  const {
    state,
    loadConfiguration,
    saveConfiguration,
    updateModelConfig,
    updatePromptConfig,
    addModelConfig,
    addPromptConfig,
    removeModelConfig,
    removePromptConfig,
    setDefaultPrompt,
    addAssistantConfig,
    updateAssistantConfig,
    removeAssistantConfig,
    setActiveSection,
    clearError,
    clearSuccess
  } = useAdminState();

  if (state.isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Breadcrumb />

      <PageHeader
        title="Admin Configuration"
        description="Manage models, prompts, and assistants for output generation and evaluation"
      />

      <StatusMessages
        error={state.error}
        success={state.success}
        onClearError={clearError}
        onClearSuccess={clearSuccess}
      />

      <ActionButtons
        hasChanges={state.hasChanges}
        onSave={saveConfiguration}
        onReload={loadConfiguration}
      />

      <SectionNavigation
        activeSection={state.activeSection}
        onSectionChange={setActiveSection}
      />

      {/* Main Content */}
      <MainContent
        activeSection={state.activeSection}
        modelConfigs={state.modelConfigs}
        promptConfigs={state.promptConfigs}
        assistantConfigs={state.assistantConfigs}
        onAddModel={addModelConfig}
        onUpdateModel={updateModelConfig}
        onRemoveModel={removeModelConfig}
        onAddPrompt={addPromptConfig}
        onUpdatePrompt={updatePromptConfig}
        onSetDefaultPrompt={setDefaultPrompt}
        onRemovePrompt={removePromptConfig}
        onAddAssistant={addAssistantConfig}
        onUpdateAssistant={updateAssistantConfig}
        onRemoveAssistant={removeAssistantConfig}
      />
    </div>
  );
} 