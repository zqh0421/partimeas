import { ModelConfig, PromptConfig, AssistantConfig } from '../../types/admin';
import { SectionHeader } from './SectionHeader';
import { ModelsAndPromptsGrid } from './ModelsAndPromptsGrid';
import { AssistantsList } from './AssistantsList';

interface OutputGenerationSectionProps {
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

export function OutputGenerationSection({
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
}: OutputGenerationSectionProps) {
  const outputGenerationModels = modelConfigs.filter(model => model.isOutputGenerationModel);
  const systemPrompts = promptConfigs.filter(prompt => prompt.type === 'system');
  const outputGenerationAssistants = assistantConfigs.filter(a => a.type === 'output-generation');

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <SectionHeader
          title="Output Generation"
          description="Configure assistants, models, and prompts for generating workshop outputs and responses"
          buttonText="Add Output Generation Assistant"
          buttonColor="bg-blue-600"
          onAddClick={() => onAddAssistant('output-generation')}
        />

        {/* Models and Prompts for Output Generation */}
        <ModelsAndPromptsGrid
          models={outputGenerationModels}
          prompts={systemPrompts}
          onAddModel={onAddModel}
          onUpdateModel={onUpdateModel}
          onRemoveModel={onRemoveModel}
          onAddPrompt={onAddPrompt}
          onUpdatePrompt={onUpdatePrompt}
          onSetDefaultPrompt={onSetDefaultPrompt}
          onRemovePrompt={onRemovePrompt}
          modelsTitle="Output Generation Models"
          promptsTitle="System Prompts"
          addButtonColor="bg-blue-600"
          checkboxColor="text-blue-600"
          radioColor="text-blue-600"
          promptType="system"
        />

        {/* Output Generation Assistants */}
        <AssistantsList
          assistants={outputGenerationAssistants}
          models={modelConfigs}
          prompts={promptConfigs}
          onUpdate={onUpdateAssistant}
          onRemove={onRemoveAssistant}
          emptyStateIcon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
          emptyStateTitle="No output generation assistants"
          emptyStateDescription="Add your first output generation assistant to get started."
        />
      </div>
    </div>
  );
} 