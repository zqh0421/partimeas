import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { systemPromptUtils } from '../../../../utils/database';

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
  isDefault: boolean;
}

interface SaveRequest {
  models: ModelConfig[];
  prompts: PromptConfig[];
}

// Save configuration changes
export async function POST(request: NextRequest) {
  try {
    const { models, prompts }: SaveRequest = await request.json();

    // Validate the request
    if (!models || !prompts) {
      return NextResponse.json(
        { error: 'Missing required fields: models and prompts' },
        { status: 400 }
      );
    }

    // Validate that we have at least one evaluation model and one output generation model
    const enabledEvaluationModels = models.filter(m => m.isEnabled && m.isEvaluationModel);
    const enabledOutputModels = models.filter(m => m.isEnabled && m.isOutputGenerationModel);

    if (enabledEvaluationModels.length === 0) {
      return NextResponse.json(
        { error: 'At least one evaluation model must be enabled' },
        { status: 400 }
      );
    }

    if (enabledOutputModels.length === 0) {
      return NextResponse.json(
        { error: 'At least one output generation model must be enabled' },
        { status: 400 }
      );
    }

    // Validate that we have default prompts
    const defaultSystemPrompts = prompts.filter(p => p.type === 'system' && p.isDefault);
    const defaultEvaluationPrompts = prompts.filter(p => p.type === 'evaluation' && p.isDefault);

    if (defaultSystemPrompts.length === 0) {
      return NextResponse.json(
        { error: 'At least one system prompt must be set as default' },
        { status: 400 }
      );
    }

    if (defaultEvaluationPrompts.length === 0) {
      return NextResponse.json(
        { error: 'At least one evaluation prompt must be set as default' },
        { status: 400 }
      );
    }

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
      for (const prompt of prompts) {
        if (prompt.id.startsWith('prompt-')) {
          // This is a new prompt, create it
          await systemPromptUtils.create({
            name: prompt.name,
            prompt: prompt.content,
            category: prompt.type,
            version: '1.0.0',
            isActive: true,
            metadata: { isDefault: prompt.isDefault }
          });
        } else {
          // This is an existing prompt, update it
          await systemPromptUtils.update(prompt.id, {
            name: prompt.name,
            prompt: prompt.content,
            category: prompt.type,
            metadata: { isDefault: prompt.isDefault }
          });
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
        evaluationModels: enabledEvaluationModels.length,
        outputModels: enabledOutputModels.length,
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