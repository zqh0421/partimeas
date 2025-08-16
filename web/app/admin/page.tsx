'use client';

import { Layout, App } from 'antd';
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

const { Content } = Layout;

export default function AdminPage() {
  const {
    state,
    loadConfiguration,
    saveConfiguration,
    saveModelsOnly,
    savePromptsOnly,
    saveAssistantsOnly,
    updateModelConfig,
    updatePromptConfig,
    updateAssistant,
    addModelConfig,
    addProviderModels,
    addPromptConfig,
    addAssistant,
    removeModelConfig,
    removePromptConfig,
    removeAssistant,
    setActiveSection,
    clearError,
    clearSuccess,
    updateConfigValue
  } = useAdminState();

  // Individual save functions for models and prompts
  const handleSaveModels = async () => {
    try {
      await saveModelsOnly();
      // You could add specific success handling for models here
    } catch (error) {
      console.error('Error saving models:', error);
    }
  };

  const handleSavePrompts = async () => {
    try {
      await savePromptsOnly();
      // You could add specific success handling for prompts here
    } catch (error) {
      console.error('Error saving prompts:', error);
    }
  };

  const handleSaveAssistants = async () => {
    try {
      await saveAssistantsOnly();
      // You could add specific success handling for assistants here
    } catch (error) {
      console.error('Error saving assistants:', error);
    }
  };

  if (state.isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <App>
      <Layout style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <Content style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
          <Breadcrumb />

          <PageHeader
            title="Admin Configuration"
            description="Manage main settings, models, and prompts for output generation and evaluation"
          />

          <StatusMessages
            error={state.error}
            success={state.success}
            onClearError={clearError}
            onClearSuccess={clearSuccess}
          />

          <ActionButtons
            onReload={loadConfiguration}
          />

          <SectionNavigation
            activeSection={state.activeSection}
            onSectionChange={setActiveSection}
          />

          <MainContent
            activeSection={state.activeSection}
            modelConfigs={state.modelConfigs}
            promptConfigs={state.promptConfigs}
            assistants={state.assistants}
            configValues={state.configValues || []}
            onAddProviderModels={addProviderModels}
            onUpdateModel={updateModelConfig}
            onRemoveModel={removeModelConfig}
            onAddPrompt={addPromptConfig}
            onUpdatePrompt={updatePromptConfig}
            onRemovePrompt={removePromptConfig}
            onAddAssistant={addAssistant}
            onUpdateAssistant={updateAssistant}
            onRemoveAssistant={removeAssistant}
            onSaveModels={handleSaveModels}
            onSavePrompts={handleSavePrompts}
            onSaveAssistants={handleSaveAssistants}
            onConfigChange={(configs) => {
              // Update the state with the new config values
              configs.forEach(config => {
                updateConfigValue(config.name, config.value);
              });
            }}
            hasModelChanges={state.hasModelChanges}
            hasPromptChanges={state.hasPromptChanges}
            hasAssistantChanges={state.hasAssistantChanges}
            hasConfigChanges={state.hasConfigChanges || false}
          />
        </Content>
      </Layout>
    </App>
  );
} 