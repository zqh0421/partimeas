-- Migration: Add configuration fields to partimeas_models table
-- This migration adds the fields needed to replace admin-config.json functionality

-- Add new configuration columns with default values
ALTER TABLE partimeas_models 
ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_evaluation_model BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_output_generation_model BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create index on the new boolean fields for better query performance
CREATE INDEX IF NOT EXISTS idx_partimeas_models_enabled ON partimeas_models(is_enabled);
CREATE INDEX IF NOT EXISTS idx_partimeas_models_evaluation ON partimeas_models(is_evaluation_model);
CREATE INDEX IF NOT EXISTS idx_partimeas_models_output_generation ON partimeas_models(is_output_generation_model);

-- Update existing records to have the default values
UPDATE partimeas_models 
SET 
  is_enabled = true,
  is_evaluation_model = true,
  is_output_generation_model = true,
  updated_at = NOW()
WHERE is_enabled IS NULL 
   OR is_evaluation_model IS NULL 
   OR is_output_generation_model IS NULL;

-- Add comment to document the purpose of these fields
COMMENT ON COLUMN partimeas_models.is_enabled IS 'Whether this model is enabled for use';
COMMENT ON COLUMN partimeas_models.is_evaluation_model IS 'Whether this model can be used for evaluation tasks';
COMMENT ON COLUMN partimeas_models.is_output_generation_model IS 'Whether this model can be used for output generation tasks';
COMMENT ON COLUMN partimeas_models.updated_at IS 'Timestamp of last update to model configuration'; 