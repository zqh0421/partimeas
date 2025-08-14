import React from 'react';
import { ModelConfig } from '../../types/admin';

interface ProviderAddModelModalProps {
  onAddModels: (provider: 'openai' | 'anthropic' | 'google' | 'openrouter', modelNames: string[]) => void;
}

export const ProviderAddModelModal: React.FC<ProviderAddModelModalProps> = ({
  onAddModels
}) => {
  const handleAddModels = (provider: 'openai' | 'anthropic' | 'google' | 'openrouter', modelNames: string[]) => {
    // Create model configurations for each selected model
    modelNames.forEach(modelName => {
      const modelData: Omit<ModelConfig, 'id'> = {
        name: modelName,
        provider,
        model: modelName,
        isEnabled: true,
        isOutputGenerationModel: true,
        isEvaluationModel: false
      };
      
      // Call the parent's add function for each model
      onAddModels(provider, [modelName]);
    });
  };

  return null; // This is just a logic component, no UI
};