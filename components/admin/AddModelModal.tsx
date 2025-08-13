import { useState } from 'react';
import { Modal, Select, Form, Input, Switch, Typography, Space, Tag, Divider } from 'antd';
import { ModelConfig } from '../../types/admin';

const { Title, Text } = Typography;
const { Option } = Select;

interface AddModelModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (modelData: Omit<ModelConfig, 'id'>) => void;
}

// Predefined model templates
const PREDEFINED_MODELS = {
  'Lucy': {
    provider: 'openai' as const,
    model: 'gpt-4o-mini',
    description: 'OpenAI GPT-4o-mini for fast, efficient responses'
  },
  'Jack': {
    provider: 'anthropic' as const,
    model: 'claude-3-sonnet-20240229',
    description: 'Anthropic Claude 3 Sonnet for thoughtful analysis'
  },
  'Emma': {
    provider: 'google' as const,
    model: 'gemini-pro',
    description: 'Google Gemini Pro for versatile AI assistance'
  }
};

const PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI', color: '#10B981' },
  { value: 'anthropic', label: 'Anthropic', color: '#8B5CF6' },
  { value: 'google', label: 'Google', color: '#F59E0B' }
];

const MODEL_OPTIONS = {
  openai: [
    'gpt-3.5-turbo',
    'gpt-4',
    'gpt-4o-mini',
    'gpt-4o',
    'o1-mini',
    'o1'
  ],
  anthropic: [
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-4-sonnet-20250219'
  ],
  google: [
    'gemini-pro'
  ]
};

export function AddModelModal({ visible, onCancel, onConfirm }: AddModelModalProps) {
  const [form] = Form.useForm();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customName, setCustomName] = useState('');
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'google'>('openai');
  const [model, setModel] = useState('');
  const [pasteInput, setPasteInput] = useState('');

  const handleTagSelect = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }

    // Auto-fill form with predefined model data
    const modelData = PREDEFINED_MODELS[tag as keyof typeof PREDEFINED_MODELS];
    if (modelData) {
      setProvider(modelData.provider);
      setModel(modelData.model);
      form.setFieldsValue({
        provider: modelData.provider,
        model: modelData.model,
        name: tag
      });
    }
  };

  const handlePasteInput = (value: string) => {
    setPasteInput(value);
    
    // Parse comma-separated values and automatically select matching tags
    const names = value
      .split(',')
      .map(name => name.trim())
      .filter(name => name && PREDEFINED_MODELS[name as keyof typeof PREDEFINED_MODELS]);
    
    setSelectedTags(names);
  };

  const handleOk = () => {
    form.validateFields().then(values => {
      // Create models from selected tags
      selectedTags.forEach(tag => {
        const predefinedData = PREDEFINED_MODELS[tag as keyof typeof PREDEFINED_MODELS];
        if (predefinedData) {
          onConfirm({
            name: tag,
            provider: predefinedData.provider,
            model: predefinedData.model,
            isEnabled: true,
            isOutputGenerationModel: true,
            isEvaluationModel: true
          });
        }
      });

      // Create custom model if name is provided
      if (customName && provider && model) {
        onConfirm({
          name: customName,
          provider,
          model,
          isEnabled: true,
          isOutputGenerationModel: true,
          isEvaluationModel: true
        });
      }

      // Reset form
      setSelectedTags([]);
      setCustomName('');
      setProvider('openai');
      setModel('');
      setPasteInput('');
      form.resetFields();
      onCancel();
    });
  };

  const handleCancel = () => {
    setSelectedTags([]);
    setCustomName('');
    setProvider('openai');
    setModel('');
    setPasteInput('');
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="Add Models"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      width={600}
      okText="Add Models"
      cancelText="Cancel"
      forceRender
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Predefined Models Section */}
        <div>
          <Title level={5}>Quick Add - Predefined Models</Title>
          <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
            Select from our curated AI assistants. Try copying and pasting: 
            <Text code copyable={{ text: 'Lucy,Jack,Emma' }}> Lucy, Jack, Emma </Text>
          </Text>

          <Input
            placeholder="Paste model names here (e.g., Lucy, Jack, Emma)"
            value={pasteInput}
            onChange={(e) => handlePasteInput(e.target.value)}
            style={{ marginBottom: 16 }}
            allowClear
          />
          
          <Space wrap size="small">
            {Object.entries(PREDEFINED_MODELS).map(([name, data]) => {
              const provider = PROVIDER_OPTIONS.find(p => p.value === data.provider);
              return (
                <Tag.CheckableTag
                  key={name}
                  checked={selectedTags.includes(name)}
                  onChange={() => handleTagSelect(name)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: selectedTags.includes(name) 
                      ? `2px solid ${provider?.color}` 
                      : '1px solid #d9d9d9',
                    backgroundColor: selectedTags.includes(name) 
                      ? `${provider?.color}10` 
                      : 'white'
                  }}
                >
                  <Space>
                    <strong>{name}</strong>
                    <span style={{ color: provider?.color }}>({provider?.label})</span>
                  </Space>
                </Tag.CheckableTag>
              );
            })}
          </Space>

          {selectedTags.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <Text strong>Selected: </Text>
              {selectedTags.map(tag => (
                <Tag key={tag} color="blue" style={{ marginBottom: 4 }}>
                  {tag}
                </Tag>
              ))}
            </div>
          )}
        </div>

        <Divider>OR</Divider>

        {/* Custom Model Section */}
        <div>
          <Title level={5}>Custom Model</Title>
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              provider: 'openai',
              isOutputGeneration: true,
              isEvaluation: false
            }}
          >
            <Form.Item
              label="Model Name"
              name="name"
            >
              <Input
                placeholder="Enter custom model name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </Form.Item>

            <Form.Item
              label="Provider"
              name="provider"
              rules={[{ required: !!customName, message: 'Please select a provider' }]}
            >
              <Select
                value={provider}
                onChange={(value) => {
                  setProvider(value);
                  setModel(''); // Reset model when provider changes
                }}
              >
                {PROVIDER_OPTIONS.map(option => (
                  <Option key={option.value} value={option.value}>
                    <Space>
                      <div 
                        style={{ 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          backgroundColor: option.color 
                        }} 
                      />
                      {option.label}
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Model"
              name="model"
              rules={[{ required: !!customName, message: 'Please select a model' }]}
            >
              <Select
                value={model}
                onChange={setModel}
                placeholder="Select a model"
              >
                {MODEL_OPTIONS[provider]?.map(modelOption => (
                  <Option key={modelOption} value={modelOption}>
                    {modelOption}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </div>

        {/* Model Type Selection */}
        <div>
          <Title level={5}>Model Usage</Title>
          <Space direction="vertical">
            <Space>
              <Switch
                checked={true} // Always true for predefined models
                onChange={() => {}}
              />
              <Text>Use for Output Generation</Text>
            </Space>
            <Space>
              <Switch
                checked={true} // Always true for predefined models
                onChange={() => {}}
              />
              <Text>Use for Evaluation</Text>
            </Space>
          </Space>
        </div>
      </Space>
    </Modal>
  );
}