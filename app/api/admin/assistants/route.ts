import { NextRequest, NextResponse } from 'next/server';
import { AssistantConfig } from '@/types/admin';

// Get current assistant configurations
export async function GET() {
  try {
    // Default assistant configurations
    const assistantConfigs: AssistantConfig[] = [
      {
        id: 'output-generation-default',
        name: 'Default Output Generation Assistant',
        description: 'Default assistant for generating workshop outputs and responses',
        systemPromptId: 'system-provide_reflective_questions',
        modelIds: ['gpt-4o-mini', 'gpt-3.5-turbo'],
        isEnabled: true,
        type: 'output-generation',
        responseCount: 1
      },
      {
        id: 'evaluation-default',
        name: 'Default Evaluation Assistant',
        description: 'Default assistant for evaluating workshop outputs and responses',
        systemPromptId: 'evaluation-default',
        modelIds: ['gpt-4o-mini'],
        isEnabled: true,
        type: 'evaluation',
        responseCount: 1
      }
    ];

    return NextResponse.json({
      success: true,
      assistants: assistantConfigs
    });
  } catch (error) {
    console.error('Error loading assistant configurations:', error);
    return NextResponse.json(
      { error: 'Failed to load assistant configurations' },
      { status: 500 }
    );
  }
}

// Save assistant configurations
export async function POST(request: NextRequest) {
  try {
    const { assistants } = await request.json();
    
    // Validate the input
    if (!Array.isArray(assistants)) {
      return NextResponse.json(
        { error: 'Invalid assistants data format' },
        { status: 400 }
      );
    }

    // Here you would typically save to a database or configuration file
    // For now, we'll just return success
    // TODO: Implement actual persistence logic
    
    console.log('Saving assistant configurations:', assistants);

    return NextResponse.json({
      success: true,
      message: 'Assistant configurations saved successfully'
    });
  } catch (error) {
    console.error('Error saving assistant configurations:', error);
    return NextResponse.json(
      { error: 'Failed to save assistant configurations' },
      { status: 500 }
    );
  }
} 