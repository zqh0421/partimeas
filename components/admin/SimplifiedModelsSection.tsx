import { Card, Button, List, Switch, Typography, Space, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { ModelConfig } from '../../types/admin';
import { AddModelModal } from './AddModelModal';

const { Title, Text } = Typography;

interface SimplifiedModelsSectionProps {
  models: ModelConfig[];
  onAddModel: (modelData: Omit<ModelConfig, 'id'>) => void;
  onUpdateModel: (id: string, updates: Partial<ModelConfig>) => void;
  onRemoveModel: (id: string) => void;
}

export function SimplifiedModelsSection({ 
  models, 
  onAddModel, 
  onUpdateModel, 
  onRemoveModel
}: SimplifiedModelsSectionProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const handleAddModel = (modelData: Omit<ModelConfig, 'id'>) => {
    onAddModel(modelData);
  };
  return (
    <Card
      title={
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>Output Generation Models</Title>
          </Col>
          <Col>
            <Button 
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalVisible(true)}
              size="small"
            >
              Add Model
            </Button>
          </Col>
        </Row>
      }
      style={{ marginBottom: 24 }}
    >
      <List
        dataSource={models}
        renderItem={(model) => (
          <List.Item style={{ padding: '12px 0' }}>
            <Row style={{ width: '100%' }} align="middle" justify="space-between">
              <Col flex="auto">
                <Space direction="vertical" size={4}>
                  <Text strong style={{ fontSize: '16px' }}>{model.name}</Text>
                  <Text type="secondary" style={{ fontSize: '14px' }}>
                    {model.provider}/{model.model}
                  </Text>
                </Space>
              </Col>
              <Col>
                <Space size="middle">
                  <Space align="center">
                    <Text style={{ fontSize: '14px' }}>Enabled</Text>
                    <Switch
                      checked={model.isEnabled}
                      onChange={(checked) => onUpdateModel(model.id, { isEnabled: checked })}
                      size="small"
                    />
                  </Space>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => onRemoveModel(model.id)}
                    size="small"
                  />
                </Space>
              </Col>
            </Row>
          </List.Item>
        )}
        locale={{ emptyText: 'No models configured' }}
      />
      
      <AddModelModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onConfirm={handleAddModel}
      />
    </Card>
  );
}