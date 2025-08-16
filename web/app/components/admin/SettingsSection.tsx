import React from "react";
import { ModelConfig } from "../../types/admin";
import { ProvidersModelsGrid } from "./ProvidersModelsGrid";
import { Card, Typography, Space } from "antd";

const { Title, Text } = Typography;

interface SettingsSectionProps {
  modelConfigs: ModelConfig[];
  onAddProviderModels: (
    provider: "openai" | "anthropic" | "google" | "openrouter",
    modelNames: string[]
  ) => void;
  onUpdateModel: (id: string, updates: Partial<ModelConfig>) => void;
  onRemoveModel: (id: string) => void;
  onSaveModels: () => void;
  hasModelChanges?: boolean;
}

export function SettingsSection({
  modelConfigs,
  onAddProviderModels,
  onUpdateModel,
  onRemoveModel,
  onSaveModels,
  hasModelChanges = false,
}: SettingsSectionProps) {
  // Get all models for settings (both output generation and evaluation models)
  const allModels = modelConfigs;

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div>
          <Title level={2}>Settings</Title>
          <Text type="secondary">
            Configure global settings including model selection for creating
            assistants
          </Text>
        </div>

        {/* Model Selection Section */}
        <Card title="Model Configuration" className="shadow-sm">
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <Text>
              Configure which models are available for creating assistants.
              These models will be used across both output generation and
              evaluation tasks.
            </Text>

            <ProvidersModelsGrid
              models={allModels}
              onAddModels={onAddProviderModels}
              onUpdateModel={onUpdateModel}
              onRemoveModel={onRemoveModel}
              onSave={onSaveModels}
              hasChanges={hasModelChanges}
            />
          </Space>
        </Card>
      </div>
    </div>
  );
}
