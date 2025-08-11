import React from 'react';
import { ModelConfig } from '../../types/admin';
import { ProvidersModelsGrid } from './ProvidersModelsGrid';
import { Card, Typography, Space } from 'antd';

const { Title, Text } = Typography;

interface ModelsSectionProps {
  modelConfigs: ModelConfig[];
  onAddProviderModels: (provider: 'openai' | 'anthropic' | 'google', modelNames: string[]) => void;
  onUpdateModel: (id: string, updates: Partial<ModelConfig>) => void;
  onRemoveModel: (id: string) => void;
  onSaveModels: () => void;
  hasModelChanges?: boolean;
}

export function ModelsSection({
  modelConfigs,
  onAddProviderModels,
  onUpdateModel,
  onRemoveModel,
  onSaveModels,
  hasModelChanges = false
}: ModelsSectionProps) {
  // Get all models for settings (both output generation and evaluation models)
  const allModels = modelConfigs;

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div>
          <Title level={2}>Models</Title>
          <Text type="secondary">
            Configure which models are available for creating assistants. This is opening access to update models that are currently not listed in the database.
          </Text>
        </div>

        {/* Model Selection Section */} 
        <ProvidersModelsGrid
          models={allModels}
          onAddModels={onAddProviderModels}
          onUpdateModel={onUpdateModel}
          onRemoveModel={onRemoveModel}
          onSave={onSaveModels}
          hasChanges={hasModelChanges}
        />
      </div>
    </div>
  );
} 