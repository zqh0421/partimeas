import { executeQuery, executeTransaction } from '../config/database';
import {
  SystemPrompt,
  NewSystemPrompt,
  SystemSetting,
  NewSystemSetting,
  Model,
  NewModel,
  EvaluatorPrompt,
  NewEvaluatorPrompt,
  EvaluatorModel,
  NewEvaluatorModel,
  SystemPromptFilters,
  ModelFilters,
  EvaluatorPromptFilters,
  EvaluatorModelFilters,
  PaginatedResponse,
  DatabaseOperations
} from '../types/database';

// SQL-based Database Operations Implementation
export class SQLDatabaseOperations implements DatabaseOperations {
  
  // ==================== CREATE OPERATIONS ====================
  
  async createSystemPrompt(data: NewSystemPrompt): Promise<SystemPrompt> {
    const query = `
      INSERT INTO system_prompts (name, description, prompt, category, version, is_active, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const params = [
      data.name,
      data.description || null,
      data.prompt,
      data.category || null,
      data.version || '1.0.0',
      data.isActive !== undefined ? data.isActive : true,
      data.metadata ? JSON.stringify(data.metadata) : null
    ];
    
    const result = await executeQuery(query, params);
    return this.mapSystemPromptFromDB(result[0]);
  }

  async createSystemSetting(data: NewSystemSetting): Promise<SystemSetting> {
    const query = `
      INSERT INTO system_settings (key, value, description, category, is_encrypted, metadata)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const params = [
      data.key,
      data.value,
      data.description || null,
      data.category || null,
      data.isEncrypted !== undefined ? data.isEncrypted : false,
      data.metadata ? JSON.stringify(data.metadata) : null
    ];
    
    const result = await executeQuery(query, params);
    return this.mapSystemSettingFromDB(result[0]);
  }

  async createModel(data: NewModel): Promise<Model> {
    const query = `
      INSERT INTO models (name, provider, model_id, type, is_active, max_tokens, temperature, cost_per_token, capabilities, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const params = [
      data.name,
      data.provider,
      data.modelId,
      data.type,
      data.isActive !== undefined ? data.isActive : true,
      data.maxTokens || null,
      data.temperature || null,
      data.costPerToken || null,
      data.capabilities ? JSON.stringify(data.capabilities) : null,
      data.metadata ? JSON.stringify(data.metadata) : null
    ];
    
    const result = await executeQuery(query, params);
    return this.mapModelFromDB(result[0]);
  }

  async createEvaluatorPrompt(data: NewEvaluatorPrompt): Promise<EvaluatorPrompt> {
    const query = `
      INSERT INTO evaluator_prompts (name, description, prompt, evaluation_type, criteria, scoring_method, max_score, is_active, version, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;
    const params = [
      data.name,
      data.description || null,
      data.prompt,
      data.evaluationType,
      data.criteria ? JSON.stringify(data.criteria) : null,
      data.scoringMethod || null,
      data.maxScore || null,
      data.isActive !== undefined ? data.isActive : true,
      data.version || '1.0.0',
      data.metadata ? JSON.stringify(data.metadata) : null
    ];
    
    const result = await executeQuery(query, params);
    return this.mapEvaluatorPromptFromDB(result[0]);
  }

  async createEvaluatorModel(data: NewEvaluatorModel): Promise<EvaluatorModel> {
    const query = `
      INSERT INTO evaluator_models (name, description, model_id, evaluator_prompt_id, evaluation_config, is_active, priority, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const params = [
      data.name,
      data.description || null,
      data.modelId || null,
      data.evaluatorPromptId || null,
      data.evaluationConfig ? JSON.stringify(data.evaluationConfig) : null,
      data.isActive !== undefined ? data.isActive : true,
      data.priority || 0,
      data.metadata ? JSON.stringify(data.metadata) : null
    ];
    
    const result = await executeQuery(query, params);
    return this.mapEvaluatorModelFromDB(result[0]);
  }

  // ==================== READ OPERATIONS ====================
  
  async getSystemPrompt(id: string): Promise<SystemPrompt | null> {
    const query = 'SELECT * FROM system_prompts WHERE id = $1';
    const result = await executeQuery(query, [id]);
    return result.length > 0 ? this.mapSystemPromptFromDB(result[0]) : null;
  }

  async getSystemPrompts(filters?: SystemPromptFilters, page: number = 1, limit: number = 10): Promise<PaginatedResponse<SystemPrompt>> {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.category) {
      whereClause += ` AND category = $${paramIndex++}`;
      params.push(filters.category);
    }
    if (filters?.isActive !== undefined) {
      whereClause += ` AND is_active = $${paramIndex++}`;
      params.push(filters.isActive);
    }
    if (filters?.version) {
      whereClause += ` AND version = $${paramIndex++}`;
      params.push(filters.version);
    }

    const countQuery = `SELECT COUNT(*) FROM system_prompts ${whereClause}`;
    const countResult = await executeQuery(countQuery, params);
    const total = parseInt(countResult[0].count);

    const offset = (page - 1) * limit;
    const query = `
      SELECT * FROM system_prompts 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(limit, offset);

    const result = await executeQuery(query, params);
    const data = result.map(this.mapSystemPromptFromDB);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getSystemSetting(key: string): Promise<SystemSetting | null> {
    const query = 'SELECT * FROM system_settings WHERE key = $1';
    const result = await executeQuery(query, [key]);
    return result.length > 0 ? this.mapSystemSettingFromDB(result[0]) : null;
  }

  async getSystemSettings(category?: string): Promise<SystemSetting[]> {
    let query = 'SELECT * FROM system_settings';
    const params: any[] = [];
    
    if (category) {
      query += ' WHERE category = $1';
      params.push(category);
    }
    
    query += ' ORDER BY key';
    const result = await executeQuery(query, params);
    return result.map(this.mapSystemSettingFromDB);
  }

  async getModel(id: string): Promise<Model | null> {
    const query = 'SELECT * FROM models WHERE id = $1';
    const result = await executeQuery(query, [id]);
    return result.length > 0 ? this.mapModelFromDB(result[0]) : null;
  }

  async getModels(filters?: ModelFilters, page: number = 1, limit: number = 10): Promise<PaginatedResponse<Model>> {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.provider) {
      whereClause += ` AND provider = $${paramIndex++}`;
      params.push(filters.provider);
    }
    if (filters?.type) {
      whereClause += ` AND type = $${paramIndex++}`;
      params.push(filters.type);
    }
    if (filters?.isActive !== undefined) {
      whereClause += ` AND is_active = $${paramIndex++}`;
      params.push(filters.isActive);
    }

    const countQuery = `SELECT COUNT(*) FROM models ${whereClause}`;
    const countResult = await executeQuery(countQuery, params);
    const total = parseInt(countResult[0].count);

    const offset = (page - 1) * limit;
    const query = `
      SELECT * FROM models 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(limit, offset);

    const result = await executeQuery(query, params);
    const data = result.map(this.mapModelFromDB);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getEvaluatorPrompt(id: string): Promise<EvaluatorPrompt | null> {
    const query = 'SELECT * FROM evaluator_prompts WHERE id = $1';
    const result = await executeQuery(query, [id]);
    return result.length > 0 ? this.mapEvaluatorPromptFromDB(result[0]) : null;
  }

  async getEvaluatorPrompts(filters?: EvaluatorPromptFilters, page: number = 1, limit: number = 10): Promise<PaginatedResponse<EvaluatorPrompt>> {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.evaluationType) {
      whereClause += ` AND evaluation_type = $${paramIndex++}`;
      params.push(filters.evaluationType);
    }
    if (filters?.isActive !== undefined) {
      whereClause += ` AND is_active = $${paramIndex++}`;
      params.push(filters.isActive);
    }
    if (filters?.version) {
      whereClause += ` AND version = $${paramIndex++}`;
      params.push(filters.version);
    }

    const countQuery = `SELECT COUNT(*) FROM evaluator_prompts ${whereClause}`;
    const countResult = await executeQuery(countQuery, params);
    const total = parseInt(countResult[0].count);

    const offset = (page - 1) * limit;
    const query = `
      SELECT * FROM evaluator_prompts 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(limit, offset);

    const result = await executeQuery(query, params);
    const data = result.map(this.mapEvaluatorPromptFromDB);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getEvaluatorModel(id: string): Promise<EvaluatorModel | null> {
    const query = 'SELECT * FROM evaluator_models WHERE id = $1';
    const result = await executeQuery(query, [id]);
    return result.length > 0 ? this.mapEvaluatorModelFromDB(result[0]) : null;
  }

  async getEvaluatorModels(filters?: EvaluatorModelFilters, page: number = 1, limit: number = 10): Promise<PaginatedResponse<EvaluatorModel>> {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters?.modelId) {
      whereClause += ` AND model_id = $${paramIndex++}`;
      params.push(filters.modelId);
    }
    if (filters?.evaluatorPromptId) {
      whereClause += ` AND evaluator_prompt_id = $${paramIndex++}`;
      params.push(filters.evaluatorPromptId);
    }
    if (filters?.isActive !== undefined) {
      whereClause += ` AND is_active = $${paramIndex++}`;
      params.push(filters.isActive);
    }

    const countQuery = `SELECT COUNT(*) FROM evaluator_models ${whereClause}`;
    const countResult = await executeQuery(countQuery, params);
    const total = parseInt(countResult[0].count);

    const offset = (page - 1) * limit;
    const query = `
      SELECT * FROM evaluator_models 
      ${whereClause}
      ORDER BY priority ASC, created_at DESC 
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(limit, offset);

    const result = await executeQuery(query, params);
    const data = result.map(this.mapEvaluatorModelFromDB);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // ==================== UPDATE OPERATIONS ====================
  
  async updateSystemPrompt(id: string, data: Partial<NewSystemPrompt>): Promise<SystemPrompt> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(data.description);
    }
    if (data.prompt !== undefined) {
      updates.push(`prompt = $${paramIndex++}`);
      params.push(data.prompt);
    }
    if (data.category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      params.push(data.category);
    }
    if (data.version !== undefined) {
      updates.push(`version = $${paramIndex++}`);
      params.push(data.version);
    }
    if (data.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      params.push(data.isActive);
    }
    if (data.metadata !== undefined) {
      updates.push(`metadata = $${paramIndex++}`);
      params.push(data.metadata ? JSON.stringify(data.metadata) : null);
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const query = `
      UPDATE system_prompts 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await executeQuery(query, params);
    return this.mapSystemPromptFromDB(result[0]);
  }

  async updateSystemSetting(key: string, data: Partial<NewSystemSetting>): Promise<SystemSetting> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.value !== undefined) {
      updates.push(`value = $${paramIndex++}`);
      params.push(data.value);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(data.description);
    }
    if (data.category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      params.push(data.category);
    }
    if (data.isEncrypted !== undefined) {
      updates.push(`is_encrypted = $${paramIndex++}`);
      params.push(data.isEncrypted);
    }
    if (data.metadata !== undefined) {
      updates.push(`metadata = $${paramIndex++}`);
      params.push(data.metadata ? JSON.stringify(data.metadata) : null);
    }

    updates.push(`updated_at = NOW()`);
    params.push(key);

    const query = `
      UPDATE system_settings 
      SET ${updates.join(', ')}
      WHERE key = $${paramIndex}
      RETURNING *
    `;

    const result = await executeQuery(query, params);
    return this.mapSystemSettingFromDB(result[0]);
  }

  async updateModel(id: string, data: Partial<NewModel>): Promise<Model> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(data.name);
    }
    if (data.provider !== undefined) {
      updates.push(`provider = $${paramIndex++}`);
      params.push(data.provider);
    }
    if (data.modelId !== undefined) {
      updates.push(`model_id = $${paramIndex++}`);
      params.push(data.modelId);
    }
    if (data.type !== undefined) {
      updates.push(`type = $${paramIndex++}`);
      params.push(data.type);
    }
    if (data.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      params.push(data.isActive);
    }
    if (data.maxTokens !== undefined) {
      updates.push(`max_tokens = $${paramIndex++}`);
      params.push(data.maxTokens);
    }
    if (data.temperature !== undefined) {
      updates.push(`temperature = $${paramIndex++}`);
      params.push(data.temperature);
    }
    if (data.costPerToken !== undefined) {
      updates.push(`cost_per_token = $${paramIndex++}`);
      params.push(data.costPerToken);
    }
    if (data.capabilities !== undefined) {
      updates.push(`capabilities = $${paramIndex++}`);
      params.push(data.capabilities ? JSON.stringify(data.capabilities) : null);
    }
    if (data.metadata !== undefined) {
      updates.push(`metadata = $${paramIndex++}`);
      params.push(data.metadata ? JSON.stringify(data.metadata) : null);
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const query = `
      UPDATE models 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await executeQuery(query, params);
    return this.mapModelFromDB(result[0]);
  }

  async updateEvaluatorPrompt(id: string, data: Partial<NewEvaluatorPrompt>): Promise<EvaluatorPrompt> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(data.description);
    }
    if (data.prompt !== undefined) {
      updates.push(`prompt = $${paramIndex++}`);
      params.push(data.prompt);
    }
    if (data.evaluationType !== undefined) {
      updates.push(`evaluation_type = $${paramIndex++}`);
      params.push(data.evaluationType);
    }
    if (data.criteria !== undefined) {
      updates.push(`criteria = $${paramIndex++}`);
      params.push(data.criteria ? JSON.stringify(data.criteria) : null);
    }
    if (data.scoringMethod !== undefined) {
      updates.push(`scoring_method = $${paramIndex++}`);
      params.push(data.scoringMethod);
    }
    if (data.maxScore !== undefined) {
      updates.push(`max_score = $${paramIndex++}`);
      params.push(data.maxScore);
    }
    if (data.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      params.push(data.isActive);
    }
    if (data.version !== undefined) {
      updates.push(`version = $${paramIndex++}`);
      params.push(data.version);
    }
    if (data.metadata !== undefined) {
      updates.push(`metadata = $${paramIndex++}`);
      params.push(data.metadata ? JSON.stringify(data.metadata) : null);
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const query = `
      UPDATE evaluator_prompts 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await executeQuery(query, params);
    return this.mapEvaluatorPromptFromDB(result[0]);
  }

  async updateEvaluatorModel(id: string, data: Partial<NewEvaluatorModel>): Promise<EvaluatorModel> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      params.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      params.push(data.description);
    }
    if (data.modelId !== undefined) {
      updates.push(`model_id = $${paramIndex++}`);
      params.push(data.modelId);
    }
    if (data.evaluatorPromptId !== undefined) {
      updates.push(`evaluator_prompt_id = $${paramIndex++}`);
      params.push(data.evaluatorPromptId);
    }
    if (data.evaluationConfig !== undefined) {
      updates.push(`evaluation_config = $${paramIndex++}`);
      params.push(data.evaluationConfig ? JSON.stringify(data.evaluationConfig) : null);
    }
    if (data.isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      params.push(data.isActive);
    }
    if (data.priority !== undefined) {
      updates.push(`priority = $${paramIndex++}`);
      params.push(data.priority);
    }
    if (data.metadata !== undefined) {
      updates.push(`metadata = $${paramIndex++}`);
      params.push(data.metadata ? JSON.stringify(data.metadata) : null);
    }

    updates.push(`updated_at = NOW()`);
    params.push(id);

    const query = `
      UPDATE evaluator_models 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await executeQuery(query, params);
    return this.mapEvaluatorModelFromDB(result[0]);
  }

  // ==================== DELETE OPERATIONS ====================
  
  async deleteSystemPrompt(id: string): Promise<boolean> {
    const query = 'DELETE FROM system_prompts WHERE id = $1 RETURNING id';
    const result = await executeQuery(query, [id]);
    return result.length > 0;
  }

  async deleteSystemSetting(key: string): Promise<boolean> {
    const query = 'DELETE FROM system_settings WHERE key = $1 RETURNING key';
    const result = await executeQuery(query, [key]);
    return result.length > 0;
  }

  async deleteModel(id: string): Promise<boolean> {
    const query = 'DELETE FROM models WHERE id = $1 RETURNING id';
    const result = await executeQuery(query, [id]);
    return result.length > 0;
  }

  async deleteEvaluatorPrompt(id: string): Promise<boolean> {
    const query = 'DELETE FROM evaluator_prompts WHERE id = $1 RETURNING id';
    const result = await executeQuery(query, [id]);
    return result.length > 0;
  }

  async deleteEvaluatorModel(id: string): Promise<boolean> {
    const query = 'DELETE FROM evaluator_models WHERE id = $1 RETURNING id';
    const result = await executeQuery(query, [id]);
    return result.length > 0;
  }

  // ==================== HELPER METHODS ====================
  
  private mapSystemPromptFromDB(row: any): SystemPrompt {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      prompt: row.prompt,
      category: row.category,
      version: row.version,
      isActive: row.is_active,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapSystemSettingFromDB(row: any): SystemSetting {
    return {
      id: row.id,
      key: row.key,
      value: row.value,
      description: row.description,
      category: row.category,
      isEncrypted: row.is_encrypted,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapModelFromDB(row: any): Model {
    return {
      id: row.id,
      name: row.name,
      provider: row.provider,
      modelId: row.model_id,
      type: row.type,
      isActive: row.is_active,
      maxTokens: row.max_tokens,
      temperature: row.temperature,
      costPerToken: row.cost_per_token,
      capabilities: row.capabilities,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapEvaluatorPromptFromDB(row: any): EvaluatorPrompt {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      prompt: row.prompt,
      evaluationType: row.evaluation_type,
      criteria: row.criteria,
      scoringMethod: row.scoring_method,
      maxScore: row.max_score,
      isActive: row.is_active,
      version: row.version,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapEvaluatorModelFromDB(row: any): EvaluatorModel {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      modelId: row.model_id,
      evaluatorPromptId: row.evaluator_prompt_id,
      evaluationConfig: row.evaluation_config,
      isActive: row.is_active,
      priority: row.priority,
      metadata: row.metadata,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}

// Export a default instance
export const db = new SQLDatabaseOperations();

// Export specific utility objects for different entities
export const systemPromptUtils = {
  getAll: (activeOnly: boolean = true) => db.getSystemPrompts({ isActive: activeOnly }),
  getByCategory: (category: string) => db.getSystemPrompts({ category }),
  get: (id: string) => db.getSystemPrompt(id),
  create: (data: NewSystemPrompt) => db.createSystemPrompt(data),
  update: (id: string, data: Partial<NewSystemPrompt>) => db.updateSystemPrompt(id, data),
  delete: (id: string) => db.deleteSystemPrompt(id)
};

export const systemSettingUtils = {
  getAll: () => db.getSystemSettings(),
  get: (key: string) => db.getSystemSetting(key),
  create: (data: NewSystemSetting) => db.createSystemSetting(data),
  update: (key: string, data: Partial<NewSystemSetting>) => db.updateSystemSetting(key, data),
  delete: (key: string) => db.deleteSystemSetting(key)
}; 