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
  isDefault: boolean;
}

export interface AssistantConfig {
  id: string;
  name: string;
  description: string;
  systemPromptId: string;
  modelIds: string[];
  isEnabled: boolean;
  type: 'output-generation' | 'evaluation';
  responseCount: number; // Number of responses to show from this assistant
}

export interface AdminState {
  modelConfigs: ModelConfig[];
  promptConfigs: PromptConfig[];
  assistantConfigs: AssistantConfig[];
  isLoading: boolean;
  hasChanges: boolean;
  error: string | null;
  success: string | null;
  activeSection: 'output-generation' | 'evaluation';
}

export type AdminSection = 'output-generation' | 'evaluation'; 