import { ModelConfig, PromptConfig } from "../../types/admin";
import { SectionHeader } from "./SectionHeader";
import { SimplifiedPromptsSection } from "./SimplifiedPromptsSection";
import { Row, Col } from "antd";

interface EvaluationSectionProps {
  modelConfigs: ModelConfig[];
  promptConfigs: PromptConfig[];
  onAddProviderModels: (
    provider: "openai" | "anthropic" | "google" | "openrouter",
    modelNames: string[]
  ) => void;
  onUpdateModel: (id: string, updates: Partial<ModelConfig>) => void;
  onRemoveModel: (id: string) => void;
  onAddPrompt: (type: "system" | "evaluation") => void;
  onUpdatePrompt: (id: string, updates: Partial<PromptConfig>) => void;
  onRemovePrompt: (id: string) => void;
  onSaveModels: () => void;
  onSavePrompts: () => void;
  hasModelChanges?: boolean;
  hasPromptChanges?: boolean;
}

export function EvaluationSection({
  modelConfigs,
  promptConfigs,
  onAddProviderModels,
  onUpdateModel,
  onRemoveModel,
  onAddPrompt,
  onUpdatePrompt,
  onRemovePrompt,
  onSaveModels,
  onSavePrompts,
  hasModelChanges = false,
  hasPromptChanges = false,
}: EvaluationSectionProps) {
  const evaluationModels = modelConfigs.filter(
    (model) => model.isEvaluationModel
  );
  const evaluationPrompts = promptConfigs.filter(
    (prompt) => prompt.type === "evaluation"
  );

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <SectionHeader
          title="Evaluation"
          description="Configure prompts for evaluating workshop outputs and responses"
        />

        {/* Prompts for Evaluation */}
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <SimplifiedPromptsSection
              prompts={evaluationPrompts}
              onAddPrompt={onAddPrompt}
              onUpdatePrompt={onUpdatePrompt}
              onRemovePrompt={onRemovePrompt}
              onSave={onSavePrompts}
              hasChanges={hasPromptChanges}
              promptType="evaluation"
            />
          </Col>
        </Row>
      </div>
    </div>
  );
}
