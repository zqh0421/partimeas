import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Space, Row, Col, Input, Switch, Select, Modal, Form, message, Table } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import { Assistant, ModelConfig, PromptConfig } from '../../types/admin';

const { Title, Text } = Typography;
const { Option } = Select;

interface AssistantsSectionProps {
  assistants: Assistant[];
  modelConfigs: ModelConfig[];
  promptConfigs: PromptConfig[];
  onAddAssistant: (assistant: Omit<Assistant, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdateAssistant: (id: number, updates: Partial<Assistant>) => void;
  onRemoveAssistant: (id: number) => void;
  onSaveAssistants: () => void;
  hasAssistantChanges?: boolean;
}

export function AssistantsSection({
  assistants,
  modelConfigs,
  promptConfigs,
  onAddAssistant,
  onUpdateAssistant,
  onRemoveAssistant,
  onSaveAssistants,
  hasAssistantChanges = false
}: AssistantsSectionProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAssistant, setEditingAssistant] = useState<Partial<Assistant> | null>(null);
  const [form] = Form.useForm();

  const handleAddAssistant = (type: 'output_generation' | 'evaluation') => {
    const newAssistant = {
      name: '',
      model_id: '',
      system_prompt_id: '',
      required_to_show: false,
      type: type
    };
    setEditingAssistant(newAssistant);
    form.setFieldsValue(newAssistant);
    setIsModalVisible(true);
  };

  const handleEditAssistant = (assistant: Assistant) => {
    setEditingAssistant(assistant);
    setEditingId(assistant.id);
    form.setFieldsValue(assistant);
    setIsModalVisible(true);
  };

  const handleSaveAssistant = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingId) {
        // Update existing assistant
        onUpdateAssistant(editingId, values);
        message.success('Assistant updated successfully');
      } else {
        // Create new assistant
        onAddAssistant(values);
        message.success('Assistant created successfully');
      }
      
      setIsModalVisible(false);
      setEditingId(null);
      setEditingAssistant(null);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // Validate that at most one evaluation assistant is activated
  const validateEvaluationAssistants = () => {
    const activeEvaluations = assistants.filter(a => a.type === 'evaluation' && a.required_to_show).length;
    if (activeEvaluations > 1) {
      message.error('At most one evaluation assistant can be activated');
      return false;
    }
    return true;
  };

  // Wrapper function to update assistant with single-activation behavior for evaluation assistants
  const handleUpdateAssistant = (id: number, updates: Partial<Assistant>) => {
    const target = assistants.find(a => a.id === id);
    if (!target) {
      return;
    }

    // For evaluation assistants: turning one on should turn others off. Turning off is allowed.
    if (target.type === 'evaluation' && updates.required_to_show !== undefined) {
      if (updates.required_to_show === true) {
        // Deactivate all other evaluation assistants
        assistants
          .filter(a => a.type === 'evaluation' && a.id !== id && a.required_to_show)
          .forEach(other => onUpdateAssistant(other.id, { required_to_show: false }));
      }
    }

    onUpdateAssistant(id, updates);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingId(null);
    setEditingAssistant(null);
    form.resetFields();
  };

  const isUuid = (value: string | undefined | null) => {
    if (!value) return false;
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value);
  };

  const getModelName = (modelId: string) => {
    const model = modelConfigs.find(m => m.id === modelId);
    return model ? `${model.provider}/${model.model}` : 'Unknown Model';
  };

  const getPromptName = (promptId: string) => {
    const prompt = promptConfigs.find(p => p.id === promptId);
    return prompt ? prompt.name : 'Unknown Prompt';
  };

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div>
          <Title level={2}>Main Settings</Title>
          <Text type="secondary">
            Manage AI assistants for output generation and evaluation tasks. Configure which models and prompts each assistant uses.
          </Text>
        </div>

        {/* Output Generation Assistants Section */}
        <Card 
          title={
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={4} style={{ margin: 0 }}>Output Generation Assistants</Title>
              </Col>
              <Col>
                <Space>
                  <Button 
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={() => {
                      if (validateEvaluationAssistants()) {
                        onSaveAssistants();
                      }
                    }}
                    disabled={!hasAssistantChanges}
                    size="small"
                  >
                    Save Assistants
                  </Button>
                  <Button 
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleAddAssistant('output_generation')}
                    size="small"
                  >
                    Add Assistant
                  </Button>
                </Space>
              </Col>
            </Row>
          }
          className="shadow-sm"
        >
          <Table
            dataSource={assistants.filter(a => a.type === 'output_generation')}
            pagination={false}
            rowKey="id"
            locale={{ emptyText: 'No output generation assistants configured' }}
            columns={[
              {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
              },
              {
                title: 'Model',
                dataIndex: 'model_id',
                key: 'model_id',
                render: (modelId: string) => getModelName(modelId),
              },
              {
                title: 'System Prompt',
                dataIndex: 'system_prompt_id',
                key: 'system_prompt_id',
                render: (systemPromptId: string) => getPromptName(systemPromptId),
              },
              {
                title: 'Required to Show',
                dataIndex: 'required_to_show',
                key: 'required_to_show',
                render: (requiredToShow: boolean, record: Assistant) => (
                  <Switch
                    checked={requiredToShow}
                    onChange={(checked) => handleUpdateAssistant(record.id, { required_to_show: checked })}
                    size="small"
                  />
                ),
              },
              {
                title: 'Actions',
                key: 'actions',
                render: (_, record: Assistant) => (
                  <Space>
                    <Button
                      type="default"
                      icon={<EditOutlined />}
                      onClick={() => handleEditAssistant(record)}
                      size="small"
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => onRemoveAssistant(record.id)}
                      size="small"
                    />
                  </Space>
                ),
              },
            ]}
          />
        </Card>

        {/* Evaluation Assistants Section */}
        <Card 
          style={{ marginTop: '20px' }}
          title={
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={4} style={{ margin: 0 }}>Evaluation Assistants</Title>
              </Col>
              <Col>
                <Space>
                  <Button 
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={() => {
                      if (validateEvaluationAssistants()) {
                        onSaveAssistants();
                      }
                    }}
                    disabled={!hasAssistantChanges}
                    size="small"
                  >
                    Save Assistants
                  </Button>
                  <Button 
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleAddAssistant('evaluation')}
                    size="small"
                  >
                    Add Assistant
                  </Button>
                </Space>
              </Col>
            </Row>
          }
          className="shadow-sm"
        >
          <Table
            dataSource={assistants.filter(a => a.type === 'evaluation')}
            pagination={false}
            rowKey="id"
            locale={{ emptyText: 'No evaluation assistants configured' }}
            columns={[
              {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
              },
              {
                title: 'Model',
                dataIndex: 'model_id',
                key: 'model_id',
                render: (modelId: string) => getModelName(modelId),
              },
              {
                title: 'System Prompt',
                dataIndex: 'system_prompt_id',
                key: 'system_prompt_id',
                render: (systemPromptId: string) => getPromptName(systemPromptId),
              },
              {
                title: 'Activate',
                dataIndex: 'required_to_show',
                key: 'required_to_show',
                render: (requiredToShow: boolean, record: Assistant) => (
                  <Switch
                    checked={requiredToShow}
                    onChange={(checked) => handleUpdateAssistant(record.id, { required_to_show: checked })}
                    size="small"
                  />
                ),
              },
              {
                title: 'Actions',
                key: 'actions',
                render: (_, record: Assistant) => (
                  <Space>
                    <Button
                      type="default"
                      icon={<EditOutlined />}
                      onClick={() => handleEditAssistant(record)}
                      size="small"
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => onRemoveAssistant(record.id)}
                      size="small"
                    />
                  </Space>
                ),
              },
            ]}
          />
          <div style={{ marginTop: 12 }}>
            <Text type="secondary">
              For evaluation, at most one assistant can be activated. The activated one will be used as evaluator. If none is activated, evaluation results will be hidden in the workshop assistant.
            </Text>
          </div>
        </Card>
      </div>

      {/* Add/Edit Assistant Modal */}
      <Modal
        title={editingId ? 'Edit Assistant' : 'Add Assistant'}
        open={isModalVisible}
        onOk={handleSaveAssistant}
        onCancel={handleCancel}
        okText={editingId ? 'Update' : 'Create'}
        cancelText="Cancel"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="Assistant Name"
            rules={[{ required: true, message: 'Please enter assistant name' }]}
          >
            <Input placeholder="Enter assistant name" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: 'Please select assistant type' }]}
          >
            <Select 
              placeholder="Select assistant type"
              disabled={true} // Type is pre-selected based on button clicked
            >
              <Option value="output_generation">Output Generation</Option>
              <Option value="evaluation">Evaluation</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="model_id"
            label="Model"
            rules={[{ required: true, message: 'Please select a model' }]}
          >
              <Select placeholder="Select a model">
               {modelConfigs
                 .filter(model => isUuid(model.id))
                 .map(model => (
                <Option key={model.id} value={model.id}>
                  {model.provider}/{model.model}
                </Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="system_prompt_id"
            label="System Prompt"
            rules={[{ required: true, message: 'Please select a system prompt' }]}
          >
              <Select placeholder="Select a system prompt">
               {promptConfigs
                .filter(prompt => {
                  if (editingAssistant?.type === 'evaluation') return prompt.type === 'evaluation';
                  // Default to 'system' for output_generation or when type is not set yet
                  return prompt.type === 'system';
                 })
                .filter(prompt => isUuid(prompt.id))
                .map(prompt => (
                  <Option key={prompt.id} value={prompt.id}>
                    {prompt.name}
                  </Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="required_to_show"
            label={editingAssistant?.type === 'evaluation' ? 'Activate' : 'Required to Show'}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
} 