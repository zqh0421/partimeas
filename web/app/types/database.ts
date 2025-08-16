// Database types for the project - using SQL instead of Drizzle ORM

// System Prompts types
export interface SystemPrompt {
  id: string;
  name: string;
  description?: string;
  prompt: string;
  category?: string;
  version?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewSystemPrompt {
  name: string;
  description?: string;
  prompt: string;
  category?: string;
  version?: string;
  metadata?: any;
}

// System Settings types
export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
  category?: string;
  isEncrypted: boolean;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewSystemSetting {
  key: string;
  value: string;
  description?: string;
  category?: string;
  isEncrypted?: boolean;
  metadata?: any;
}

// Models types
export interface Model {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  type: string;
  isActive: boolean;
  maxTokens?: number;
  temperature?: string;
  costPerToken?: string;
  capabilities?: any;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewModel {
  name: string;
  provider: string;
  modelId: string;
  type: string;
  isActive?: boolean;
  maxTokens?: number;
  temperature?: string;
  costPerToken?: string;
  capabilities?: any;
  metadata?: any;
}

// Evaluator Prompts types
export interface EvaluatorPrompt {
  id: string;
  name: string;
  description?: string;
  prompt: string;
  evaluationType: string;
  criteria?: any;
  scoringMethod?: string;
  maxScore?: number;
  isActive: boolean;
  version?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewEvaluatorPrompt {
  name: string;
  description?: string;
  prompt: string;
  evaluationType: string;
  criteria?: any;
  scoringMethod?: string;
  maxScore?: number;
  isActive?: boolean;
  version?: string;
  metadata?: any;
}

// Evaluator Models types
export interface EvaluatorModel {
  id: string;
  name: string;
  description?: string;
  modelId?: string;
  evaluatorPromptId?: string;
  evaluationConfig?: any;
  isActive: boolean;
  priority?: number;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewEvaluatorModel {
  name: string;
  description?: string;
  modelId?: string;
  evaluatorPromptId?: string;
  evaluationConfig?: any;
  isActive?: boolean;
  priority?: number;
  metadata?: any;
}

// Extended types with relations
export interface SystemPromptWithRelations extends SystemPrompt {
  // Add relations here if needed
}

export interface ModelWithRelations extends Model {
  evaluatorModels?: EvaluatorModel[];
  assistants?: AssistantModel[];
}

export interface EvaluatorPromptWithRelations extends EvaluatorPrompt {
  evaluatorModels?: EvaluatorModel[];
}

export interface EvaluatorModelWithRelations extends EvaluatorModel {
  model?: Model;
  evaluatorPrompt?: EvaluatorPrompt;
}

export interface AssistantWithRelations extends Assistant {
  models?: Model[];
  assistantModels?: AssistantModel[];
}

export interface AssistantModelWithRelations extends AssistantModel {
  assistant?: Assistant;
  model?: Model;
}

// Utility types for API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter and query types
export interface SystemPromptFilters {
  category?: string;
  version?: string;
}

export interface ModelFilters {
  provider?: string;
  type?: string;
  isActive?: boolean;
}

export interface EvaluatorPromptFilters {
  evaluationType?: string;
  isActive?: boolean;
  version?: string;
}

export interface EvaluatorModelFilters {
  modelId?: string;
  evaluatorPromptId?: string;
  isActive?: boolean;
}

export interface AssistantFilters {
  type?: 'output_generation' | 'evaluation';
  required_to_show?: boolean;
}

export interface AssistantModelFilters {
  assistant_id?: number;
  model_id?: string;
}

// SQL CRUD Operations
export interface DatabaseOperations {
  // Create operations
  createSystemPrompt(data: NewSystemPrompt): Promise<SystemPrompt>;
  createSystemSetting(data: NewSystemSetting): Promise<SystemSetting>;
  createModel(data: NewModel): Promise<Model>;
  createEvaluatorPrompt(data: NewEvaluatorPrompt): Promise<EvaluatorPrompt>;
  createEvaluatorModel(data: NewEvaluatorModel): Promise<EvaluatorModel>;
  createAssistant(data: NewAssistant): Promise<Assistant>;
  createAssistantModel(data: NewAssistantModel): Promise<AssistantModel>;

  // Read operations
  getSystemPrompt(id: string): Promise<SystemPrompt | null>;
  getSystemPrompts(filters?: SystemPromptFilters, page?: number, limit?: number): Promise<PaginatedResponse<SystemPrompt>>;
  getSystemSetting(key: string): Promise<SystemSetting | null>;
  getSystemSettings(category?: string): Promise<SystemSetting[]>;
  getModel(id: string): Promise<Model | null>;
  getModels(filters?: ModelFilters, page?: number, limit?: number): Promise<PaginatedResponse<Model>>;
  getEvaluatorPrompt(id: string): Promise<EvaluatorPrompt | null>;
  getEvaluatorPrompts(filters?: EvaluatorPromptFilters, page?: number, limit?: number): Promise<PaginatedResponse<EvaluatorPrompt>>;
  getEvaluatorModel(id: string): Promise<EvaluatorModel | null>;
  getEvaluatorModels(filters?: EvaluatorModelFilters, page?: number, limit?: number): Promise<PaginatedResponse<EvaluatorModel>>;
  getAssistant(id: number): Promise<Assistant | null>;
  getAssistants(filters?: AssistantFilters, page?: number, limit?: number): Promise<PaginatedResponse<Assistant>>;
  getAssistantModel(id: number): Promise<AssistantModel | null>;
  getAssistantModels(filters?: AssistantModelFilters, page?: number, limit?: number): Promise<PaginatedResponse<AssistantModel>>;

  // Update operations
  updateSystemPrompt(id: string, data: Partial<NewSystemPrompt>): Promise<SystemPrompt>;
  updateSystemSetting(key: string, data: Partial<NewSystemSetting>): Promise<SystemSetting>;
  updateModel(id: string, data: Partial<NewModel>): Promise<Model>;
  updateEvaluatorPrompt(id: string, data: Partial<NewEvaluatorPrompt>): Promise<EvaluatorPrompt>;
  updateEvaluatorModel(id: string, data: Partial<NewEvaluatorModel>): Promise<EvaluatorModel>;
  updateAssistant(id: number, data: Partial<NewAssistant>): Promise<Assistant>;
  updateAssistantModel(id: number, data: Partial<NewAssistantModel>): Promise<AssistantModel>;

  // Delete operations
  deleteSystemPrompt(id: string): Promise<boolean>;
  deleteSystemSetting(key: string): Promise<boolean>;
  deleteModel(id: string): Promise<boolean>;
  deleteEvaluatorPrompt(id: string): Promise<boolean>;
  deleteEvaluatorModel(id: string): Promise<boolean>;
  deleteAssistant(id: number): Promise<boolean>;
  deleteAssistantModel(id: number): Promise<boolean>;
}

// Assistant types
export interface Assistant {
  id: number;
  name: string;
  system_prompt_id: string;
  required_to_show: boolean;
  type: 'output_generation' | 'evaluation';
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewAssistant {
  name: string;
  system_prompt_id: string;
  required_to_show?: boolean;
  type: 'output_generation' | 'evaluation';
  metadata?: any;
}

// Assistant-Model relationship types
export interface AssistantModel {
  id: number;
  assistant_id: number;
  model_id: string;
  metadata?: any;
  createdAt: Date;
}

export interface NewAssistantModel {
  assistant_id: number;
  model_id: string;
  metadata?: any;
} 