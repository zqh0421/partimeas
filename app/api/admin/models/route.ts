import { NextRequest, NextResponse } from 'next/server';
import { MODEL_CONFIGS, OUTPUT_GENERATION_MODELS } from '@/app/api/shared/constants';

// Get current model configurations
export async function GET() {
  try {
    // Convert the current configuration to the admin format
    const modelConfigs = Object.entries(MODEL_CONFIGS).map(([modelId, config]) => ({
      id: modelId,
      name: modelId,
      provider: config.provider as 'openai' | 'anthropic' | 'google',
      model: config.model,
      isEnabled: true,
      isEvaluationModel: modelId === 'gpt-4o-mini', // Current evaluation model
      isOutputGenerationModel: OUTPUT_GENERATION_MODELS.includes(modelId)
    }));

    return NextResponse.json({
      success: true,
      models: modelConfigs
    });
  } catch (error) {
    console.error('Error loading model configurations:', error);
    return NextResponse.json(
      { error: 'Failed to load model configurations' },
      { status: 500 }
    );
  }
} 