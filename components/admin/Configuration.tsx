import React, { useState } from 'react';
import { Card, Form, InputNumber, Button, Space, Typography, Alert } from 'antd';
import { ConfigValue } from '../../types/admin';

const { Title, Text } = Typography;

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
    const initialValues: { [key: string]: number } = {};
    configValues.forEach(config => {
      initialValues[config.name] = parseInt(config.value) || 0;
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

  const handleValueChange = (name: string, value: number | null) => {
    if (value === null) return;
    
    const updatedConfigs = configValues.map(config => 
      config.name === name 
        ? { ...config, value: value.toString() }
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
          Configure how many model outputs to generate and display in the interface.
        </Text>
      </Card>

      <Card>
        <Form form={form} layout="vertical">
          <Form.Item
            label="Number of Outputs to Generate (numOutputsToRun)"
            name="numOutputsToRun"
            rules={[
              { required: true, message: 'Please enter a number' },
              { type: 'number', min: 1, max: 10, message: 'Must be between 1 and 10' }
            ]}
            extra="This controls how many different model responses are generated for each test case."
          >
            <InputNumber
              min={1}
              max={10}
              style={{ width: '100%' }}
              onChange={(value) => handleValueChange('numOutputsToRun', value)}
            />
          </Form.Item>

          <Form.Item
            label="Number of Outputs to Show (numOutputsToShow)"
            name="numOutputsToShow"
            rules={[
              { required: true, message: 'Please enter a number' },
              { type: 'number', min: 1, max: 10, message: 'Must be between 1 and 10' }
            ]}
            extra="This controls how many responses are displayed in the user interface. Should be less than or equal to numOutputsToRun."
          >
            <InputNumber
              min={1}
              max={10}
              style={{ width: '100%' }}
              onChange={(value) => handleValueChange('numOutputsToShow', value)}
            />
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