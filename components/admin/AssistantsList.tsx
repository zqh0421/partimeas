import { AssistantConfig, ModelConfig, PromptConfig } from '../../types/admin';
import { AssistantConfig as AssistantConfigComponent } from './AssistantConfig';
import { EmptyState } from './EmptyState';

interface AssistantsListProps {
  assistants: AssistantConfig[];
  models: ModelConfig[];
  prompts: PromptConfig[];
  onUpdate: (id: string, updates: Partial<AssistantConfig>) => void;
  onRemove: (id: string) => void;
  emptyStateIcon: React.ReactNode;
  emptyStateTitle: string;
  emptyStateDescription: string;
}

export function AssistantsList({
  assistants,
  models,
  prompts,
  onUpdate,
  onRemove,
  emptyStateIcon,
  emptyStateTitle,
  emptyStateDescription
}: AssistantsListProps) {
  if (assistants.length === 0) {
    return (
      <EmptyState
        icon={emptyStateIcon}
        title={emptyStateTitle}
        description={emptyStateDescription}
      />
    );
  }

  return (
    <div className="space-y-4">
      {assistants.map((assistant) => (
        <AssistantConfigComponent
          key={assistant.id}
          assistant={assistant}
          models={models}
          prompts={prompts}
          onUpdate={onUpdate}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
} 