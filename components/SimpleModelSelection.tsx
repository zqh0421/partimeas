'use client';

import React, { useState } from 'react';
import { Card, Button, Select, Space, Tag, message, Popconfirm, List, Typography, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { useModelsAPI } from '../hooks/useModelsAPI';

const { Option } = Select;
const { Text, Title } = Typography;

// 预定义的模型选项
const PROVIDER_MODELS = {
  openai: [
    'gpt-3.5-turbo',
    'gpt-4',
    'gpt-4o-mini',
    'gpt-4o',
    'gpt-5',
    'gpt-5-mini'
  ],
  anthropic: [
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-4-sonnet-20250219'
  ],
  google: [
    'gemini-pro',
    'gemini-1.5-pro',
    'gemini-1.5-flash'
  ]
};

const PROVIDER_LABELS = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google'
};

export default function SimpleModelSelection() {
  const {
    models,
    isLoading,
    error,
    loadModels,
    createModel,
    deleteModel,
    getModelsByProvider
  } = useModelsAPI();

  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  // 按提供商分组模型
  const openaiModels = getModelsByProvider('openai');
  const anthropicModels = getModelsByProvider('anthropic');
  const googleModels = getModelsByProvider('google');

  // 创建新模型
  const handleCreateModel = async () => {
    if (!selectedProvider || !selectedModel) {
      message.error('请选择提供商和模型');
      return;
    }

    setIsCreating(true);
    try {
      const result = await createModel({
        provider: selectedProvider,
        modelId: selectedModel,
        temperature: null
      });

      if (result.success) {
        message.success('模型创建成功！');
        // 重置选择
        setSelectedModel('');
      } else {
        message.error(result.error || '创建失败');
      }
    } catch (err) {
      message.error('创建模型时发生错误');
    } finally {
      setIsCreating(false);
    }
  };

  // 删除模型
  const handleDeleteModel = async (id: string) => {
    try {
      const result = await deleteModel(id);
      if (result.success) {
        message.success('模型删除成功！');
      } else {
        message.error(result.error || '删除失败');
      }
    } catch (err) {
      message.error('删除模型时发生错误');
    }
  };

  // 刷新模型列表
  const handleRefresh = () => {
    loadModels();
    message.info('正在刷新模型列表...');
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <Title level={2}>模型管理</Title>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={handleRefresh}
          loading={isLoading}
        >
          刷新
        </Button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <Text type="danger">错误: {error}</Text>
        </div>
      )}

      {/* 添加新模型 */}
      <Card title="添加新模型" className="shadow-sm">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 提供商选择 */}
            <div>
              <Text strong>提供商</Text>
              <Select
                value={selectedProvider}
                onChange={setSelectedProvider}
                style={{ width: '100%', marginTop: 8 }}
                placeholder="选择提供商"
              >
                {Object.entries(PROVIDER_LABELS).map(([key, label]) => (
                  <Option key={key} value={key}>{label}</Option>
                ))}
              </Select>
            </div>

            {/* 模型选择 - 只显示预定义模型，无自动完成 */}
            <div>
              <Text strong>模型</Text>
              <Select
                value={selectedModel}
                onChange={setSelectedModel}
                style={{ width: '100%', marginTop: 8 }}
                placeholder="选择模型"
                showSearch={false}
              >
                {PROVIDER_MODELS[selectedProvider as keyof typeof PROVIDER_MODELS]?.map(model => (
                  <Option key={model} value={model}>{model}</Option>
                ))}
              </Select>
            </div>
          </div>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateModel}
            loading={isCreating}
            disabled={!selectedProvider || !selectedModel}
            size="large"
          >
            添加模型
          </Button>
        </Space>
      </Card>

      {/* 模型列表 */}
      <div className="space-y-4">
        {/* OpenAI Models */}
        {openaiModels.length > 0 && (
          <Card title="OpenAI Models" className="shadow-sm">
            <List
              dataSource={openaiModels}
              renderItem={(model) => (
                <List.Item
                  actions={[
                    <Popconfirm
                      key="delete"
                      title="确定要删除这个模型吗？"
                      onConfirm={() => handleDeleteModel(model.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                      >
                        删除
                      </Button>
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    title={model.modelId}
                    description={`Provider: ${model.provider}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        )}

        {/* Anthropic Models */}
        {anthropicModels.length > 0 && (
          <Card title="Anthropic Models" className="shadow-sm">
            <List
              dataSource={anthropicModels}
              renderItem={(model) => (
                <List.Item
                  actions={[
                    <Popconfirm
                      key="delete"
                      title="确定要删除这个模型吗？"
                      onConfirm={() => handleDeleteModel(model.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                      >
                        删除
                      </Button>
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    title={model.modelId}
                    description={`Provider: ${model.provider}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        )}

        {/* Google Models */}
        {googleModels.length > 0 && (
          <Card title="Google Models" className="shadow-sm">
            <List
              dataSource={googleModels}
              renderItem={(model) => (
                <List.Item
                  actions={[
                    <Popconfirm
                      key="delete"
                      title="确定要删除这个模型吗？"
                      onConfirm={() => handleDeleteModel(model.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                      >
                        删除
                      </Button>
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    title={model.modelId}
                    description={`Provider: ${model.provider}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        )}

        {/* 空状态 */}
        {models.length === 0 && !isLoading && (
          <Card className="shadow-sm">
            <div className="text-center py-8">
              <Text type="secondary">暂无模型，请添加新模型</Text>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
} 