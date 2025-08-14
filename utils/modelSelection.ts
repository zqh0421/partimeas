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
 * FIXED: Improved randomness by using proper random selection
 */
export function randomSelectionAlgorithm(
  assistants: AssistantModelInfo[],
  modelConfigs: Array<{ id: string; provider: string; model: string }>
): SelectedModel[] {
  const selectedModels: SelectedModel[] = [];
  
  console.log('🔧 Random Selection Algorithm: Starting model selection for', assistants.length, 'assistants');
  
  for (const assistant of assistants) {
    if (assistant.model_ids.length === 0) {
      console.log(`  ⚠️ Assistant ${assistant.name} has no linked models, skipping`);
      continue;
    }
    
    // FIXED: Use proper random selection with better randomness
    const randomIndex = Math.floor(Math.random() * assistant.model_ids.length);
    const selectedModelId = assistant.model_ids[randomIndex];
    
    console.log(`  🎲 Assistant ${assistant.name}: Randomly selected model ${selectedModelId} from ${assistant.model_ids.length} options`);
    
    // Find the model configuration
    const modelConfig = modelConfigs.find(m => m.id === selectedModelId);
    if (modelConfig) {
      selectedModels.push({
        assistantId: assistant.assistantId,
        modelId: selectedModelId,
        provider: modelConfig.provider,
        model: modelConfig.model
      });
      console.log(`    ✅ Model ${selectedModelId} (${modelConfig.provider}/${modelConfig.model}) assigned`);
    } else {
      console.log(`    ❌ Model ${selectedModelId} not found in modelConfigs`);
    }
  }
  
  console.log(`🔧 Random Selection Algorithm: Completed. ${selectedModels.length} models selected`);
  return selectedModels;
}

/**
 * Unique Model Algorithm
 * All assistants use different models to ensure variety and avoid duplication
 * FIXED: Improved randomness in model assignment
 */
export function uniqueModelAlgorithm(
  assistants: AssistantModelInfo[],
  modelConfigs: Array<{ id: string; provider: string; model: string }>
): SelectedModel[] {
  const selectedModels: SelectedModel[] = [];
  const usedModelIds = new Set<string>();
  
  console.log('🔧 Unique Model Algorithm: Starting unique model assignment for', assistants.length, 'assistants');
  
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
    if (assistant.model_ids.length === 0) {
      console.log(`  ⚠️ Assistant ${assistant.name} has no linked models, skipping`);
      continue;
    }
    
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
        console.log(`  🔄 Assistant ${assistant.name}: Fallback to model ${fallbackModelId} (${modelConfig.provider}/${modelConfig.model})`);
      }
    } else {
      // FIXED: Randomly select from available unique models instead of always taking the first
      const randomIndex = Math.floor(Math.random() * availableModels.length);
      const selectedModelId = availableModels[randomIndex];
      const modelConfig = modelConfigs.find(m => m.id === selectedModelId);
      if (modelConfig) {
        selectedModels.push({
          assistantId: assistant.assistantId,
          modelId: selectedModelId,
          provider: modelConfig.provider,
          model: modelConfig.model
        });
        usedModelIds.add(selectedModelId);
        console.log(`  🎯 Assistant ${assistant.name}: Assigned unique model ${selectedModelId} (${modelConfig.provider}/${modelConfig.model})`);
      }
    }
  }
  
  console.log(`🔧 Unique Model Algorithm: Completed. ${selectedModels.length} unique models assigned`);
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
  console.log(`🔧 Model Selection: Using algorithm: ${algorithm}`);
  console.log(`  - Assistants: ${assistants.length}`);
  console.log(`  - Available models: ${modelConfigs.length}`);
  
  switch (algorithm) {
    case 'random_selection':
      return randomSelectionAlgorithm(assistants, modelConfigs);
    case 'unique_model':
      return uniqueModelAlgorithm(assistants, modelConfigs);
    default:
      // Default to random selection
      console.log(`  ⚠️ Unknown algorithm '${algorithm}', falling back to random_selection`);
      return randomSelectionAlgorithm(assistants, modelConfigs);
  }
} 