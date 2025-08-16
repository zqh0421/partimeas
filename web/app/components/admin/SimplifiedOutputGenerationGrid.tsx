import { Row, Col } from "antd";
import { ModelConfig, PromptConfig } from "@/app/types/admin";
import { SimplifiedModelsSection } from "./SimplifiedModelsSection";
import { SimplifiedPromptsSection } from "./SimplifiedPromptsSection";

interface SimplifiedOutputGenerationGridProps {
  models: ModelConfig[];
  prompts: PromptConfig[];
  onAddModel: (modelData: Omit<ModelConfig, "id">) => void;
  onUpdateModel: (id: string, updates: Partial<ModelConfig>) => void;
  onRemoveModel: (id: string) => void;
  onAddPrompt: (type: "system" | "evaluation") => void;
  onUpdatePrompt: (id: string, updates: Partial<PromptConfig>) => void;
  onRemovePrompt: (id: string) => void;
  promptType: "system" | "evaluation";
}

export function SimplifiedOutputGenerationGrid({
  models,
  prompts,
  onAddModel,
  onUpdateModel,
  onRemoveModel,
  onAddPrompt,
  onUpdatePrompt,
  onRemovePrompt,
  promptType,
}: SimplifiedOutputGenerationGridProps) {
  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={12}>
        <SimplifiedModelsSection
          models={models}
          onAddModel={onAddModel}
          onUpdateModel={onUpdateModel}
          onRemoveModel={onRemoveModel}
        />
      </Col>
      <Col xs={24} lg={12}>
        <SimplifiedPromptsSection
          prompts={prompts}
          onAddPrompt={onAddPrompt}
          onUpdatePrompt={onUpdatePrompt}
          onRemovePrompt={onRemovePrompt}
          promptType={promptType}
        />
      </Col>
    </Row>
  );
}
