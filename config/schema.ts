// SQL Schema for the project - Table creation statements

// SQL to create all tables
export const CREATE_TABLES_SQL = `
-- System Prompts table
CREATE TABLE IF NOT EXISTS system_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  category TEXT,
  version TEXT DEFAULT '1.0.0',
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- System Settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_encrypted BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Models table
CREATE TABLE IF NOT EXISTS models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  model_id TEXT NOT NULL,
  type TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  max_tokens INTEGER,
  temperature TEXT,
  cost_per_token TEXT,
  capabilities JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Evaluator Prompts table
CREATE TABLE IF NOT EXISTS evaluator_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  prompt TEXT NOT NULL,
  evaluation_type TEXT NOT NULL,
  criteria JSONB,
  scoring_method TEXT,
  max_score INTEGER,
  is_active BOOLEAN DEFAULT true,
  version TEXT DEFAULT '1.0.0',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Evaluator Models table
CREATE TABLE IF NOT EXISTS evaluator_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  model_id UUID REFERENCES models(id),
  evaluator_prompt_id UUID REFERENCES evaluator_prompts(id),
  evaluation_config JSONB,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_prompts_category ON system_prompts(category);
CREATE INDEX IF NOT EXISTS idx_system_prompts_is_active ON system_prompts(is_active);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
CREATE INDEX IF NOT EXISTS idx_models_provider ON models(provider);
CREATE INDEX IF NOT EXISTS idx_models_type ON models(type);
CREATE INDEX IF NOT EXISTS idx_models_is_active ON models(is_active);
CREATE INDEX IF NOT EXISTS idx_evaluator_prompts_evaluation_type ON evaluator_prompts(evaluation_type);
CREATE INDEX IF NOT EXISTS idx_evaluator_prompts_is_active ON evaluator_prompts(is_active);
CREATE INDEX IF NOT EXISTS idx_evaluator_models_model_id ON evaluator_models(model_id);
CREATE INDEX IF NOT EXISTS idx_evaluator_models_evaluator_prompt_id ON evaluator_models(evaluator_prompt_id);
CREATE INDEX IF NOT EXISTS idx_evaluator_models_is_active ON evaluator_models(is_active);
`;

// SQL to drop all tables (for testing/cleanup)
export const DROP_TABLES_SQL = `
DROP TABLE IF EXISTS evaluator_models CASCADE;
DROP TABLE IF EXISTS evaluator_prompts CASCADE;
DROP TABLE IF EXISTS models CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS system_prompts CASCADE;
`;

// SQL to reset all tables (truncate data but keep structure)
export const RESET_TABLES_SQL = `
TRUNCATE TABLE evaluator_models CASCADE;
TRUNCATE TABLE evaluator_prompts CASCADE;
TRUNCATE TABLE models CASCADE;
TRUNCATE TABLE system_settings CASCADE;
TRUNCATE TABLE system_prompts CASCADE;
`;

// Helper function to create tables
export const createTables = async (executeQuery: (query: string, params?: any[]) => Promise<any>) => {
  try {
    await executeQuery(CREATE_TABLES_SQL);
    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

// Helper function to drop tables
export const dropTables = async (executeQuery: (query: string, params?: any[]) => Promise<any>) => {
  try {
    await executeQuery(DROP_TABLES_SQL);
    console.log('Tables dropped successfully');
  } catch (error) {
    console.error('Error dropping tables:', error);
    throw error;
  }
};

// Helper function to reset tables
export const resetTables = async (executeQuery: (query: string, params?: any[]) => Promise<any>) => {
  try {
    await executeQuery(RESET_TABLES_SQL);
    console.log('Tables reset successfully');
  } catch (error) {
    console.error('Error resetting tables:', error);
    throw error;
  }
}; 