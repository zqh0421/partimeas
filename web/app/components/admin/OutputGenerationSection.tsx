import { ModelConfig, PromptConfig } from "../../types/admin";
import { SectionHeader } from "./SectionHeader";
import { SimplifiedPromptsSection } from "./SimplifiedPromptsSection";
import { Row, Col } from "antd";

interface OutputGenerationSectionProps {
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

export function OutputGenerationSection({
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
}: OutputGenerationSectionProps) {
  const outputGenerationModels = modelConfigs.filter(
    (model) => model.isOutputGenerationModel
  );
  const systemPrompts = promptConfigs.filter(
    (prompt) => prompt.type === "system"
  );

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <SectionHeader
          title="Output Generation"
          description="Configure prompts for generating workshop outputs and responses"
          buttonText="Add Prompt"
          buttonColor="blue"
          onAddClick={() => onAddPrompt("system")}
        />

        {/* Prompts for Output Generation */}
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <SimplifiedPromptsSection
              prompts={systemPrompts}
              onAddPrompt={onAddPrompt}
              onUpdatePrompt={onUpdatePrompt}
              onRemovePrompt={onRemovePrompt}
              onSave={onSavePrompts}
              hasChanges={hasPromptChanges}
              promptType="system"
            />
          </Col>
        </Row>
      </div>
    </div>
  );
}
