import React, { useState } from 'react';
import { Card, Form, Button, Space, Typography, Alert, Switch, App } from 'antd';
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
  const { message } = App.useApp();

  // Initialize form with current values
  React.useEffect(() => {
    const initialValues: { [key: string]: string } = {};
    configValues.forEach(config => {
      initialValues[config.name] = config.value;
    });
    form.setFieldsValue(initialValues);
  }, [configValues, form]);

  // Save configuration values to API
  const saveConfigValues = async () => {
    try {
      // Save each configuration value individually
      const savePromises = configValues.map(async (config) => {
        const response = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: config.name,
            value: config.value,
            scope: config.scope || 'global'
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to save ${config.name}`);
        }

        return response.json();
      });

      await Promise.all(savePromises);
      message.success('Configuration saved successfully');
      
      // Call the parent onSave to update the parent state
      onSave();
    } catch (error) {
      console.error('Error saving configuration:', error);
      message.error(error instanceof Error ? error.message : 'Failed to save configuration');
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveConfigValues();
    } finally {
      setIsSaving(false);
    }
  };

  const handleValueChange = (name: string, value: string) => {
    const updatedConfigs = configValues.map(config => 
      config.name === name 
        ? { ...config, value }
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
        <Title level={4}>Configuration</Title>
        <Text type="secondary">
          Miscellaneous configuration settings for the workshop assistant.
        </Text>
      </Card>

      <Card>
        <Form form={form} layout="vertical">

          <Form.Item
            label="Enable Group ID Collection (enableGroupIdCollection)"
            name="enableGroupIdCollection"
            extra="When enabled, users will be prompted to enter a group ID before starting the workshop. This group ID will be stored with each session for tracking purposes."
          >
            <Switch
              checked={getConfigValue('enableGroupIdCollection') === '1'}
              onChange={(checked) => handleValueChange('enableGroupIdCollection', checked ? '1' : '0')}
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
    </div>
  );
} 