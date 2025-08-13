import React, { useState } from 'react';
import { Card, Form, InputNumber, Button, Space, Typography, Alert, Select } from 'antd';
import { ConfigValue } from '../../types/admin';

const { Title, Text } = Typography;
const { Option } = Select;

interface ConfigurationProps {
  configValues: ConfigValue[];
  onConfigChange: (configs: ConfigValue[]) => void;
  hasChanges: boolean;
  onSave: () => void;
}

export function Configuration({ configValues, onConfigChange, hasChanges, onSave }: ConfigurationProps) {
  const [form] = Form.useForm();
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form with current values
  React.useEffect(() => {
    const initialValues: { [key: string]: number | string } = {};
    configValues.forEach(config => {
      if (config.name === 'numOutputsToRun' || config.name === 'numOutputsToShow') {
        initialValues[config.name] = parseInt(config.value) || 0;
      } else {
        initialValues[config.name] = config.value;
      }
    });
    form.setFieldsValue(initialValues);
  }, [configValues, form]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  const handleValueChange = (name: string, value: number | string | null) => {
    if (value === null) return;
    
    // Convert value to string for storage
    const stringValue = typeof value === 'number' ? value.toString() : value;
    
    const updatedConfigs = configValues.map(config => 
      config.name === name 
        ? { ...config, value: stringValue }
        : config
    );
    onConfigChange(updatedConfigs);
  };

  const getConfigValue = (name: string): string => {
    const config = configValues.find(c => c.name === name);
    return config?.value || '0';
  };

  return (
    <div className="space-y-6">
      <Card>
        <Title level={4}>Output Generation Configuration</Title>
        <Text type="secondary">
          Configure the maximum number of model outputs to generate and display in the interface.
        </Text>
      </Card>

      <Card>
        <Form form={form} layout="vertical">
          <Form.Item
            label="Maximum Outputs to Generate (numOutputsToRun)"
            name="numOutputsToRun"
            rules={[
              { required: true, message: 'Please enter a number' },
              { type: 'number', min: 1, max: 10, message: 'Must be between 1 and 10' }
            ]}
            extra="This controls the maximum number of different model responses that can be generated for each test case. The actual number will be the minimum of this value and the number of available assistants."
          >
            <InputNumber
              min={1}
              max={10}
              style={{ width: '100%' }}
              onChange={(value) => handleValueChange('numOutputsToRun', value)}
            />
          </Form.Item>

          <Form.Item
            label="Maximum Outputs to Show (numOutputsToShow)"
            name="numOutputsToShow"
            rules={[
              { required: true, message: 'Please enter a number' },
              { type: 'number', min: 1, max: 4, message: 'Must be between 1 and 4' }
            ]}
            extra="This controls the maximum number of responses that can be displayed in the user interface. Should be less than or equal to the maximum outputs to generate."
          >
            <InputNumber
              min={1}
              max={4}
              style={{ width: '100%' }}
              onChange={(value) => handleValueChange('numOutputsToShow', value)}
            />
          </Form.Item>

          <Form.Item
            label="Assistant Model Selection Algorithm (assistantModelAlgorithm)"
            name="assistantModelAlgorithm"
            rules={[
              { required: true, message: 'Please select an algorithm' }
            ]}
            extra="Choose how models are selected for assistants during output generation. Random Selection: Each assistant randomly selects one model independently. Unique Model: All assistants use different models to ensure variety."
          >
            <Select
              placeholder="Select algorithm"
              style={{ width: '100%' }}
              onChange={(value) => handleValueChange('assistantModelAlgorithm', value)}
            >
              <Option value="random_selection">Random Selection - Each assistant randomly selects one model independently</Option>
              <Option value="unique_model">Unique Model - All assistants use different models to ensure variety</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                onClick={handleSave}
                loading={isSaving}
                disabled={!hasChanges}
              >
                Save Configuration
              </Button>
              {hasChanges && (
                <Alert
                  message="You have unsaved changes"
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <Title level={5}>Current Configuration Values</Title>
        <div className="space-y-2">
          <div>
            <Text strong>numOutputsToRun:</Text> {getConfigValue('numOutputsToRun')}
          </div>
          <div>
            <Text strong>numOutputsToShow:</Text> {getConfigValue('numOutputsToShow')}
          </div>
        </div>
      </Card>
    </div>
  );
} 