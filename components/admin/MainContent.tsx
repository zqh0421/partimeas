import { ModelConfig, PromptConfig, Assistant } from '../../types/admin';
import { OutputGenerationSection } from './OutputGenerationSection';
import { EvaluationSection } from './EvaluationSection';
import { ModelsSection } from './ModelsSection';
import { AssistantsSection } from './AssistantsSection';

interface MainContentProps {
  activeSection: string;
  modelConfigs: ModelConfig[];
  promptConfigs: PromptConfig[];
  assistants: Assistant[];
  onAddProviderModels: (provider: 'openai' | 'anthropic' | 'google', modelNames: string[]) => void;
  onUpdateModel: (id: string, updates: Partial<ModelConfig>) => void;
  onRemoveModel: (id: string) => void;
  onAddPrompt: (type: 'system' | 'evaluation') => void;
  onUpdatePrompt: (id: string, updates: Partial<PromptConfig>) => void;
  onRemovePrompt: (id: string) => void;
  onAddAssistant: (assistant: Omit<Assistant, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdateAssistant: (id: number, updates: Partial<Assistant>) => void;
  onRemoveAssistant: (id: number) => void;
  onSaveModels: () => void;
  onSavePrompts: () => void;
  onSaveAssistants: () => void;
  hasModelChanges?: boolean;
  hasPromptChanges?: boolean;
  hasAssistantChanges?: boolean;
}

export function MainContent({
  activeSection,
  modelConfigs,
  promptConfigs,
  assistants,
  onAddProviderModels,
  onUpdateModel,
  onRemoveModel,
  onAddPrompt,
  onUpdatePrompt,
  onRemovePrompt,
  onAddAssistant,
  onUpdateAssistant,
  onRemoveAssistant,
  onSaveModels,
  onSavePrompts,
  onSaveAssistants,
  hasModelChanges = false,
  hasPromptChanges = false,
  hasAssistantChanges = false
}: MainContentProps) {
  if (activeSection === 'output-generation') {
    return (
      <OutputGenerationSection
        modelConfigs={modelConfigs}
        promptConfigs={promptConfigs}
        onAddProviderModels={onAddProviderModels}
        onUpdateModel={onUpdateModel}
        onRemoveModel={onRemoveModel}
        onAddPrompt={onAddPrompt}
        onUpdatePrompt={onUpdatePrompt}
        onRemovePrompt={onRemovePrompt}
        onSaveModels={onSaveModels}
        onSavePrompts={onSavePrompts}
        hasModelChanges={hasModelChanges}
        hasPromptChanges={hasPromptChanges}
      />
    );
  }

  if (activeSection === 'evaluation') {
    return (
      <EvaluationSection
        modelConfigs={modelConfigs}
        promptConfigs={promptConfigs}
        onAddProviderModels={onAddProviderModels}
        onUpdateModel={onUpdateModel}
        onRemoveModel={onRemoveModel}
        onAddPrompt={onAddPrompt}
        onUpdatePrompt={onUpdatePrompt}
        onRemovePrompt={onRemovePrompt}
        onSaveModels={onSaveModels}
        onSavePrompts={onSavePrompts}
        hasModelChanges={hasModelChanges}
        hasPromptChanges={hasPromptChanges}
      />
    );
  }

  if (activeSection === 'models') {
    return (
      <ModelsSection
        modelConfigs={modelConfigs}
        onAddProviderModels={onAddProviderModels}
        onUpdateModel={onUpdateModel}
        onRemoveModel={onRemoveModel}
        onSaveModels={onSaveModels}
        hasModelChanges={hasModelChanges}
      />
    );
  }

  if (activeSection === 'assistants') {
    return (
      <AssistantsSection
        assistants={assistants}
        modelConfigs={modelConfigs}
        promptConfigs={promptConfigs}
        onAddAssistant={onAddAssistant}
        onUpdateAssistant={onUpdateAssistant}
        onRemoveAssistant={onRemoveAssistant}
        onSaveAssistants={onSaveAssistants}
        hasAssistantChanges={hasAssistantChanges}
      />
    );
  }

  return null;
} 