import { ModelConfig, PromptConfig } from './admin';

export interface AdminFunctions {
  // Model functions
  addModelConfig: (provider: 'openai' | 'anthropic' | 'google' | 'openrouter', modelNames: string[]) => void;
  addProviderModels: (provider: 'openai' | 'anthropic' | 'google' | 'openrouter', modelNames: string[]) => void;
  updateModelConfig: (id: string, updates: Partial<ModelConfig>) => void;
  removeModelConfig: (id: string) => void;
  
  // Prompt functions
  addPromptConfig: (type: 'system' | 'evaluation') => void;
  updatePromptConfig: (id: string, updates: Partial<PromptConfig>) => void;
  removePromptConfig: (id: string) => void;
  
  // Configuration functions
  loadConfiguration: () => Promise<void>;
  saveConfiguration: () => Promise<void>;
  saveModelsOnly: () => Promise<void>;
  
  // State management
  setActiveSection: (section: 'output-generation' | 'evaluation') => void;
  clearError: () => void;
  clearSuccess: () => void;
} 