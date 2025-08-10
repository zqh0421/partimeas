import { NextRequest, NextResponse } from 'next/server';
import { systemPromptUtils } from '../../../utils/database';
import { ApiResponse } from '../../../types/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    let prompts;
    if (category) {
      prompts = await systemPromptUtils.getByCategory(category);
    } else {
      prompts = await systemPromptUtils.getAll(activeOnly);
    }

    const response: ApiResponse<typeof prompts> = {
      success: true,
      data: prompts,
      message: 'System prompts retrieved successfully'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching system prompts:', error);
    
    const errorResponse: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch system prompts',
      message: error instanceof Error ? error.message : 'Unknown error'
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.prompt) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: 'Name and prompt are required',
        message: 'Please provide both name and prompt fields'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const newPrompt = await systemPromptUtils.create({
      name: body.name,
      description: body.description,
      prompt: body.prompt,
      category: body.category,
      version: body.version || '1.0.0',
      metadata: body.metadata
    });

    const response: ApiResponse<typeof newPrompt> = {
      success: true,
      data: newPrompt,
      message: 'System prompt created successfully'
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating system prompt:', error);
    
    const errorResponse: ApiResponse<null> = {
      success: false,
      error: 'Failed to create system prompt',
      message: error instanceof Error ? error.message : 'Unknown error'
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.id) {
      const errorResponse: ApiResponse<null> = {
        success: false,
        error: 'ID is required for updating a system prompt',
        message: 'Please provide the prompt ID'
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const updatedPrompt = await systemPromptUtils.update(body.id, {
      name: body.name,
      description: body.description,
      prompt: body.prompt,
      category: body.category,
      version: body.version,
      isActive: body.isActive,
      metadata: body.metadata
    });

    const response: ApiResponse<typeof updatedPrompt> = {
      success: true,
      data: updatedPrompt,
      message: 'System prompt updated successfully'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating system prompt:', error);
    
    const errorResponse: ApiResponse<null> = {
      success: false,
      error: 'Failed to update system prompt',
      message: error instanceof Error ? error.message : 'Unknown error'
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
} 