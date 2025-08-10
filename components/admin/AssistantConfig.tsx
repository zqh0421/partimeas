import { AssistantConfig, ModelConfig, PromptConfig } from '../../types/admin';
import { AssistantHeader } from './AssistantHeader';
import { AssistantForm } from './AssistantForm';

interface AssistantConfigProps {
  assistant: AssistantConfig;
  models: ModelConfig[];
  prompts: PromptConfig[];
  onUpdate: (id: string, updates: Partial<AssistantConfig>) => void;
  onRemove: (id: string) => void;
}

export function AssistantConfig({ 
  assistant, 
  models, 
  prompts, 
  onUpdate, 
  onRemove 
}: AssistantConfigProps) {
  return (
    <div className="border-2 border-gray-200 rounded-lg p-6">
      <AssistantHeader
        name={assistant.name}
        isEnabled={assistant.isEnabled}
        onNameChange={(name) => onUpdate(assistant.id, { name })}
        onEnabledChange={(isEnabled) => onUpdate(assistant.id, { isEnabled })}
        onRemove={() => onRemove(assistant.id)}
      />
      
      <AssistantForm
        assistant={assistant}
        models={models}
        prompts={prompts}
        onUpdate={onUpdate}
      />
    </div>
  );
} 