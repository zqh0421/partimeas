import { ModelConfig, PromptConfig, AssistantConfig } from '../../types/admin';
import { SectionHeader } from './SectionHeader';
import { ModelsAndPromptsGrid } from './ModelsAndPromptsGrid';
import { AssistantsList } from './AssistantsList';

interface EvaluationSectionProps {
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

export function EvaluationSection({
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
}: EvaluationSectionProps) {
  const evaluationModels = modelConfigs.filter(model => model.isEvaluationModel);
  const evaluationPrompts = promptConfigs.filter(prompt => prompt.type === 'evaluation');
  const evaluationAssistants = assistantConfigs.filter(a => a.type === 'evaluation');

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <SectionHeader
          title="Evaluation"
          description="Configure assistants, models, and prompts for evaluating workshop outputs and responses"
          buttonText="Add Evaluation Assistant"
          buttonColor="bg-green-600"
          onAddClick={() => onAddAssistant('evaluation')}
        />

        {/* Models and Prompts for Evaluation */}
        <ModelsAndPromptsGrid
          models={evaluationModels}
          prompts={evaluationPrompts}
          onAddModel={onAddModel}
          onUpdateModel={onUpdateModel}
          onRemoveModel={onRemoveModel}
          onAddPrompt={onAddPrompt}
          onUpdatePrompt={onUpdatePrompt}
          onSetDefaultPrompt={onSetDefaultPrompt}
          onRemovePrompt={onRemovePrompt}
          modelsTitle="Evaluation Models"
          promptsTitle="Evaluation Prompts"
          addButtonColor="bg-green-600"
          checkboxColor="text-green-600"
          radioColor="text-green-600"
          promptType="evaluation"
        />

        {/* Evaluation Assistants */}
        <AssistantsList
          assistants={evaluationAssistants}
          models={modelConfigs}
          prompts={promptConfigs}
          onUpdate={onUpdateAssistant}
          onRemove={onRemoveAssistant}
          emptyStateIcon={
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m21 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          emptyStateTitle="No evaluation assistants"
          emptyStateDescription="Add your first evaluation assistant to get started."
        />
      </div>
    </div>
  );
} 