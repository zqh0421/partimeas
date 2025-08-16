import { ModelConfig, PromptConfig } from "../../types/admin";
import { ModelsSection } from "./ModelsSection";
import { PromptsSection } from "./PromptsSection";

interface ModelsAndPromptsGridProps {
  models: ModelConfig[];
  prompts: PromptConfig[];
  onAddModel: () => void;
  onUpdateModel: (id: string, updates: Partial<ModelConfig>) => void;
  onRemoveModel: (id: string) => void;
  onAddPrompt: (type: "system" | "evaluation") => void;
  onUpdatePrompt: (id: string, updates: Partial<PromptConfig>) => void;
  onRemovePrompt: (id: string) => void;
  modelsTitle: string;
  promptsTitle: string;
  addButtonColor: string;
  checkboxColor: string;
  radioColor: string;
  promptType: "system" | "evaluation";
}

export function ModelsAndPromptsGrid({
  models,
  prompts,
  onAddModel,
  onUpdateModel,
  onRemoveModel,
  onAddPrompt,
  onUpdatePrompt,
  onRemovePrompt,
  modelsTitle,
  promptsTitle,
  addButtonColor,
  checkboxColor,
  radioColor,
  promptType,
}: ModelsAndPromptsGridProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <ModelsSection
        models={models}
        onAddModel={onAddModel}
        onUpdateModel={onUpdateModel}
        onRemoveModel={onRemoveModel}
        title={modelsTitle}
        addButtonColor={addButtonColor}
        checkboxColor={checkboxColor}
      />

      <PromptsSection
        prompts={prompts}
        onAddPrompt={onAddPrompt}
        onUpdatePrompt={onUpdatePrompt}
        onRemovePrompt={onRemovePrompt}
        title={promptsTitle}
        addButtonColor={addButtonColor}
        radioColor={radioColor}
        promptType={promptType}
      />
    </div>
  );
}
