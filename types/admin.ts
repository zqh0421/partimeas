export interface ModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google';
  model: string;
  isEnabled: boolean;
  isEvaluationModel: boolean;
  isOutputGenerationModel: boolean;
}

export interface PromptConfig {
  id: string;
  name: string;
  content: string;
  type: 'system' | 'evaluation';
}

export interface Assistant {
  id: number;
  name: string;
  model_ids: string[]; // Support multiple models
  system_prompt_id: string;
  required_to_show: boolean;
  type: 'output_generation' | 'evaluation';
  created_at?: string;
  updated_at?: string;
}

// New interface for the many-to-many relationship between assistants and models
export interface AssistantModel {
  id: number;
  assistant_id: number;
  model_id: string;
  created_at?: string;
}

export interface ConfigValue {
  name: string;
  value: string;
  scope: string;
  created_at?: string;
  updated_at?: string;
}

export interface AdminState {
  modelConfigs: ModelConfig[];
  promptConfigs: PromptConfig[];
  assistants: Assistant[];
  assistantModels: AssistantModel[]; // Add the new many-to-many relationship
  configValues: ConfigValue[];
  isLoading: boolean;
  hasChanges: boolean;
  hasModelChanges: boolean;
  hasPromptChanges: boolean;
  hasAssistantChanges: boolean;
  hasConfigChanges: boolean;
  error: string | null;
  success: string | null;
  activeSection: 'output-generation' | 'evaluation' | 'models' | 'assistants';
  // Track database-backed models the user removed in the UI, to delete on save
  deletedModels?: { id: string; provider: 'openai' | 'anthropic' | 'google'; model: string }[];
  // Track database-backed prompts the user removed in the UI, to delete on save
  deletedPrompts?: { id: string; type: 'system' | 'evaluation' }[];
  // Track database-backed assistants the user removed in the UI, to delete on save
  deletedAssistants?: { id: number; type: 'output_generation' | 'evaluation' }[];
  // Track database-backed assistant-model relationships the user removed in the UI, to delete on save
  deletedAssistantModels?: { id: number; assistant_id: number; model_id: string }[];
}

export type AdminSection = 'output-generation' | 'evaluation' | 'models' | 'assistants'; 