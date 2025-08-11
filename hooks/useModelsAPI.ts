import { useState, useEffect } from 'react';

// 后端API返回的模型数据结构
interface APIModel {
  id: string;
  provider: string;
  model_id: string;
  temperature: number | null;
  created_at: string;
}

// 前端使用的模型数据结构
interface Model {
  id: string;
  provider: string;
  modelId: string;
  temperature: number | null;
  createdAt: string;
}

export function useModelsAPI() {
  const [models, setModels] = useState<Model[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载所有模型
  const loadModels = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/models');
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.success) {
        // 转换API数据结构为前端使用的结构
        const convertedModels: Model[] = data.models.map((apiModel: APIModel) => ({
          id: apiModel.id,
          provider: apiModel.provider,
          modelId: apiModel.model_id,
          temperature: apiModel.temperature,
          createdAt: apiModel.created_at
        }));
        setModels(convertedModels);
      } else {
        throw new Error(data.error || 'Failed to load models');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error loading models:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 创建新模型
  const createModel = async (modelData: {
    provider: string;
    modelId: string;
    temperature?: number;
  }) => {
    try {
      setError(null);
      
      const response = await fetch('/api/admin/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create model: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.success) {
        // 如果模型已存在，不需要重新加载
        if (!data.skipped) {
          await loadModels();
        }
        return { success: true, data: data.data, skipped: data.skipped };
      } else {
        throw new Error(data.error || 'Failed to create model');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error creating model:', err);
      return { success: false, error: errorMessage };
    }
  };

  // 删除模型
  const deleteModel = async (id: string) => {
    try {
      setError(null);
      
      const response = await fetch(`/api/admin/models/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete model: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.success) {
        // 重新加载模型列表
        await loadModels();
        return { success: true };
      } else {
        throw new Error(data.error || 'Failed to delete model');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error deleting model:', err);
      return { success: false, error: errorMessage };
    }
  };

  // 按提供商过滤模型
  const getModelsByProvider = (provider: string) => {
    return models.filter(model => model.provider === provider);
  };

  // 初始化时加载模型
  useEffect(() => {
    loadModels();
  }, []);

  return {
    models,
    isLoading,
    error,
    loadModels,
    createModel,
    deleteModel,
    getModelsByProvider
  };
} 