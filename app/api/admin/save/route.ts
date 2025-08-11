import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { sql } from '@/config/database';
import { db } from '@/utils/database';

interface ModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google';
  model: string;
  isEnabled: boolean;
  isEvaluationModel: boolean;
  isOutputGenerationModel: boolean;
}

interface PromptConfig {
  id: string;
  name: string;
  content: string;
  type: 'system' | 'evaluation';
}

interface SaveRequest {
  models: ModelConfig[];
  prompts: PromptConfig[];
  deletedPrompts?: { id: string; type: 'system' | 'evaluation' }[];
}

// Save configuration changes
export async function POST(request: NextRequest) {
  try {
    const { models, prompts, deletedPrompts = [] }: SaveRequest = await request.json();
    
    // Debug logging
    console.log('🔍 Save request received:');
    console.log('Models:', JSON.stringify(models, null, 2));
    console.log('Prompts:', JSON.stringify(prompts, null, 2));
    console.log('Deleted prompts:', JSON.stringify(deletedPrompts, null, 2));

    // Validate the request
    if (!models || !prompts) {
      console.log('❌ Validation failed: Missing models or prompts');
      return NextResponse.json(
        { error: 'Missing required fields: models and prompts' },
        { status: 400 }
      );
    }

    // Process deleted prompts first
    if (deletedPrompts.length > 0) {
      console.log(`🗑️ Processing ${deletedPrompts.length} deleted prompts...`);
      try {
        for (const deletedPrompt of deletedPrompts) {
          // Delete the prompt from the database directly
          const deleted = await db.deleteSystemPrompt(deletedPrompt.id);
          
          if (deleted) {
            console.log(`✅ Deleted prompt ${deletedPrompt.id} (${deletedPrompt.type})`);
          } else {
            console.warn(`⚠️ Failed to delete prompt ${deletedPrompt.id}: Prompt not found`);
          }
        }
      } catch (deleteError) {
        console.error('Error deleting prompts:', deleteError);
        // Continue with save even if some deletions fail
      }
    }

    // Validate that we have at least one system prompt and one evaluation prompt
    const systemPrompts = prompts.filter(p => p.type === 'system');
    const evaluationPrompts = prompts.filter(p => p.type === 'evaluation');
    
    console.log(`📝 Found ${systemPrompts.length} system prompts and ${evaluationPrompts.length} evaluation prompts`);

    if (systemPrompts.length === 0) {
      console.log('❌ Validation failed: No system prompts');
      return NextResponse.json(
        { error: 'At least one system prompt is required' },
        { status: 400 }
      );
    }

    if (evaluationPrompts.length === 0) {
      console.log('❌ Validation failed: No evaluation prompts');
      return NextResponse.json(
        { error: 'At least one evaluation prompt is required' },
        { status: 400 }
      );
    }

    // Only validate models if we're actually saving models (not just prompts)
    if (models.length > 0) {
      // Validate that we have at least one evaluation model and one output generation model
      const enabledEvaluationModels = models.filter(m => m.isEnabled && m.isEvaluationModel);
      const enabledOutputModels = models.filter(m => m.isEnabled && m.isOutputGenerationModel);
      
      console.log(`🤖 Found ${enabledEvaluationModels.length} enabled evaluation models and ${enabledOutputModels.length} enabled output models`);

      if (enabledEvaluationModels.length === 0) {
        console.log('❌ Validation failed: No enabled evaluation models');
        return NextResponse.json(
          { error: 'At least one evaluation model must be enabled' },
          { status: 400 }
        );
      }

      if (enabledOutputModels.length === 0) {
        console.log('❌ Validation failed: No enabled output models');
        return NextResponse.json(
          { error: 'At least one output generation model must be enabled' },
          { status: 400 }
        );
      }
    } else {
      console.log('📝 No models to validate, skipping model validation');
    }

    console.log('✅ All validations passed, proceeding with save...');

    // Create the configuration file path
    const configDir = path.join(process.cwd(), 'config');
    const configFile = path.join(configDir, 'admin-config.json');

    // Ensure config directory exists
    try {
      await fs.access(configDir);
    } catch {
      await fs.mkdir(configDir, { recursive: true });
    }

    // Save prompts to database
    try {
      // Validate prompts before saving
      for (const prompt of prompts) {
        if (!prompt.name || !prompt.name.trim()) {
          return NextResponse.json(
            { error: `Prompt "${prompt.id}" has an empty name` },
            { status: 400 }
          );
        }
        if (!prompt.content || !prompt.content.trim()) {
          return NextResponse.json(
            { error: `Prompt "${prompt.name}" has empty content` },
            { status: 400 }
          );
        }
      }

      for (const prompt of prompts) {
        if (prompt.id.startsWith('prompt-')) {
          // This is a new prompt, create it
          await sql`
            INSERT INTO partimeas_system_prompts (name, prompt, type)
            VALUES (${prompt.name}, ${prompt.content}, ${prompt.type})
          `;
        } else {
          // This is an existing prompt, update it
          await sql`
            UPDATE partimeas_system_prompts 
            SET name = ${prompt.name}, prompt = ${prompt.content}, type = ${prompt.type}, updated_at = NOW()
            WHERE id = ${prompt.id}
          `;
        }
      }
    } catch (dbError) {
      console.error('Error saving prompts to database:', dbError);
      // Continue with file-based save as fallback
    }

    // Save the configuration to file as backup
    const configData = {
      models,
      prompts,
      lastUpdated: new Date().toISOString(),
      version: '1.0'
    };

    await fs.writeFile(configFile, JSON.stringify(configData, null, 2));

    return NextResponse.json({
      success: true,
      message: 'Configuration saved successfully',
      timestamp: new Date().toISOString(),
      summary: {
        totalModels: models.length,
        enabledModels: models.filter(m => m.isEnabled).length,
        evaluationModels: models.filter(m => m.isEnabled && m.isEvaluationModel).length,
        outputModels: models.filter(m => m.isEnabled && m.isOutputGenerationModel).length,
        totalPrompts: prompts.length,
        systemPrompts: prompts.filter(p => p.type === 'system').length,
        evaluationPrompts: prompts.filter(p => p.type === 'evaluation').length
      }
    });

  } catch (error) {
    console.error('Error saving configuration:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
} 