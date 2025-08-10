import { ModelConfig, PromptConfig, AssistantConfig } from '../../types/admin';
import { OutputGenerationSection } from './OutputGenerationSection';
import { EvaluationSection } from './EvaluationSection';

interface MainContentProps {
  activeSection: string;
  modelConfigs: ModelConfig[];
  promptConfigs: PromptConfig[];
  assistantConfigs: AssistantConfig[];
  onAddModel: () => void;
  onUpdateModel: (id: string, updates: Partial<ModelConfig>) => void;
  onRemoveModel: (id: string) => void;
  onAddPrompt: (type: 'system' | 'evaluation') => void;
  onUpdatePrompt: (id: string, updates: Partial<PromptConfig>) => void;
  onSetDefaultPrompt: (type: 'system' | 'evaluation', id: string) => void;
  onRemovePrompt: (id: string) => void;
  onAddAssistant: (type: 'output-generation' | 'evaluation') => void;
  onUpdateAssistant: (id: string, updates: Partial<AssistantConfig>) => void;
  onRemoveAssistant: (id: string) => void;
}

export function MainContent({
  activeSection,
  modelConfigs,
  promptConfigs,
  assistantConfigs,
  onAddModel,
  onUpdateModel,
  onRemoveModel,
  onAddPrompt,
  onUpdatePrompt,
  onSetDefaultPrompt,
  onRemovePrompt,
  onAddAssistant,
  onUpdateAssistant,
  onRemoveAssistant
}: MainContentProps) {
  if (activeSection === 'output-generation') {
    return (
      <OutputGenerationSection
        modelConfigs={modelConfigs}
        promptConfigs={promptConfigs}
        assistantConfigs={assistantConfigs}
        onAddModel={onAddModel}
        onUpdateModel={onUpdateModel}
        onRemoveModel={onRemoveModel}
        onAddPrompt={onAddPrompt}
        onUpdatePrompt={onUpdatePrompt}
        onSetDefaultPrompt={onSetDefaultPrompt}
        onRemovePrompt={onRemovePrompt}
        onAddAssistant={onAddAssistant}
        onUpdateAssistant={onUpdateAssistant}
        onRemoveAssistant={onRemoveAssistant}
      />
    );
  }

  if (activeSection === 'evaluation') {
    return (
      <EvaluationSection
        modelConfigs={modelConfigs}
        promptConfigs={promptConfigs}
        assistantConfigs={assistantConfigs}
        onAddModel={onAddModel}
        onUpdateModel={onUpdateModel}
        onRemoveModel={onRemoveModel}
        onAddPrompt={onAddPrompt}
        onUpdatePrompt={onUpdatePrompt}
        onSetDefaultPrompt={onSetDefaultPrompt}
        onRemovePrompt={onRemovePrompt}
        onAddAssistant={onAddAssistant}
        onUpdateAssistant={onUpdateAssistant}
        onRemoveAssistant={onRemoveAssistant}
      />
    );
  }

  return null;
} 