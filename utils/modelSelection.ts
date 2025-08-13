/**
 * Model Selection Algorithms for Assistants
 * 
 * This file contains algorithms for selecting models for assistants during output generation.
 * Two algorithms are implemented:
 * 1. random_selection: Each assistant randomly selects one model independently
 * 2. unique_model: All assistants use different models to ensure variety
 */

export interface AssistantModelInfo {
  assistantId: number;
  name: string;
  model_ids: string[];
  type: 'output_generation' | 'evaluation';
  required_to_show: boolean;
}

export interface SelectedModel {
  assistantId: number;
  modelId: string;
  provider: string;
  model: string;
}

/**
 * Random Selection Algorithm
 * Each assistant randomly selects one model independently, regardless of other assistants' choices
 */
export function randomSelectionAlgorithm(
  assistants: AssistantModelInfo[],
  modelConfigs: Array<{ id: string; provider: string; model: string }>
): SelectedModel[] {
  const selectedModels: SelectedModel[] = [];
  
  for (const assistant of assistants) {
    if (assistant.model_ids.length === 0) continue;
    
    // Randomly select one model from this assistant's available models
    const randomIndex = Math.floor(Math.random() * assistant.model_ids.length);
    const selectedModelId = assistant.model_ids[randomIndex];
    
    // Find the model configuration
    const modelConfig = modelConfigs.find(m => m.id === selectedModelId);
    if (modelConfig) {
      selectedModels.push({
        assistantId: assistant.assistantId,
        modelId: selectedModelId,
        provider: modelConfig.provider,
        model: modelConfig.model
      });
    }
  }
  
  return selectedModels;
}

/**
 * Unique Model Algorithm
 * All assistants use different models to ensure variety and avoid duplication
 */
export function uniqueModelAlgorithm(
  assistants: AssistantModelInfo[],
  modelConfigs: Array<{ id: string; provider: string; model: string }>
): SelectedModel[] {
  const selectedModels: SelectedModel[] = [];
  const usedModelIds = new Set<string>();
  
  // Sort assistants by priority (required_to_show first, then by type)
  const sortedAssistants = [...assistants].sort((a, b) => {
    if (a.required_to_show !== b.required_to_show) {
      return b.required_to_show ? 1 : -1; // required_to_show = true comes first
    }
    // Then sort by type (output_generation first)
    if (a.type !== b.type) {
      return a.type === 'output_generation' ? -1 : 1;
    }
    return 0;
  });
  
  for (const assistant of sortedAssistants) {
    if (assistant.model_ids.length === 0) continue;
    
    // Find available models that haven't been used yet
    const availableModels = assistant.model_ids.filter(modelId => !usedModelIds.has(modelId));
    
    if (availableModels.length === 0) {
      // If no unique models available, fall back to any available model
      const fallbackModelId = assistant.model_ids[0];
      const modelConfig = modelConfigs.find(m => m.id === fallbackModelId);
      if (modelConfig) {
        selectedModels.push({
          assistantId: assistant.assistantId,
          modelId: fallbackModelId,
          provider: modelConfig.provider,
          model: modelConfig.model
        });
        usedModelIds.add(fallbackModelId);
      }
    } else {
      // Select a unique model
      const selectedModelId = availableModels[0]; // Take the first available unique model
      const modelConfig = modelConfigs.find(m => m.id === selectedModelId);
      if (modelConfig) {
        selectedModels.push({
          assistantId: assistant.assistantId,
          modelId: selectedModelId,
          provider: modelConfig.provider,
          model: modelConfig.model
        });
        usedModelIds.add(selectedModelId);
      }
    }
  }
  
  return selectedModels;
}

/**
 * Main function to select models based on the configured algorithm
 */
export function selectModelsForAssistants(
  assistants: AssistantModelInfo[],
  modelConfigs: Array<{ id: string; provider: string; model: string }>,
  algorithm: 'random_selection' | 'unique_model'
): SelectedModel[] {
  switch (algorithm) {
    case 'random_selection':
      return randomSelectionAlgorithm(assistants, modelConfigs);
    case 'unique_model':
      return uniqueModelAlgorithm(assistants, modelConfigs);
    default:
      // Default to random selection
      return randomSelectionAlgorithm(assistants, modelConfigs);
  }
} 