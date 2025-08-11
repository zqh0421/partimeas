import React from 'react';
import { Row, Col, Card, Button, Typography } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { ModelConfig } from '../../types/admin';
import { ProviderModelsSection } from './ProviderModelsSection';

const { Text } = Typography;

interface ProvidersModelsGridProps {
  models: ModelConfig[];
  onAddModels: (provider: 'openai' | 'anthropic' | 'google', modelNames: string[]) => void;
  onUpdateModel: (id: string, updates: Partial<ModelConfig>) => void;
  onRemoveModel: (id: string) => void;
  onSave: () => void;
  hasChanges?: boolean;
}

export const ProvidersModelsGrid: React.FC<ProvidersModelsGridProps> = ({
  models,
  onAddModels,
  onUpdateModel,
  onRemoveModel,
  onSave,
  hasChanges = false
}) => {
  // Filter models by provider
  const openaiModels = models.filter(m => m.provider === 'openai');
  const anthropicModels = models.filter(m => m.provider === 'anthropic');
  const googleModels = models.filter(m => m.provider === 'google');

  return (
    <Card 
      title="Model Selection for Creating Assistants"
      extra={
        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={onSave}
          disabled={!hasChanges}
          size="small"
        >
          Save Models
        </Button>
      }
    >
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary" style={{ fontSize: '14px' }}>
          Note: Models are only officially in use after assistants for output generation or evaluation are created.
        </Text>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <ProviderModelsSection
            provider="openai"
            models={openaiModels}
            onAddModels={onAddModels}
            onUpdateModel={onUpdateModel}
            onRemoveModel={onRemoveModel}
          />
        </Col>
        <Col xs={24} lg={8}>
          <ProviderModelsSection
            provider="anthropic"
            models={anthropicModels}
            onAddModels={onAddModels}
            onUpdateModel={onUpdateModel}
            onRemoveModel={onRemoveModel}
          />
        </Col>
        <Col xs={24} lg={8}>
          <ProviderModelsSection
            provider="google"
            models={googleModels}
            onAddModels={onAddModels}
            onUpdateModel={onUpdateModel}
            onRemoveModel={onRemoveModel}
          />
        </Col>
      </Row>
    </Card>
  );
};