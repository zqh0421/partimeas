import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/app/config/database';

// Get all system prompts
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (category) {
      whereClause += ` AND type = $${paramIndex++}`;
      params.push(category);
    }

    // First get total count
    const countQuery = `SELECT COUNT(*) FROM partimeas_system_prompts ${whereClause}`;
    const countResult = await sql.query(countQuery, params);
    const total = parseInt(countResult[0].count);

    // Then get paginated results
    const offset = (page - 1) * limit;
    const query = `
      SELECT * FROM partimeas_system_prompts 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    params.push(limit, offset);

    const result = await sql.query(query, params);

    // Transform database rows to match PromptConfig interface
    const transformedPrompts = result.map((prompt: any) => ({
      id: prompt.id,
      name: prompt.name,
      content: prompt.prompt,
      type: prompt.type === 'evaluation' ? 'evaluation' : 'system'
    }));

    return NextResponse.json({
      success: true,
      prompts: transformedPrompts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching system prompts:', error);
    
    // Fallback with mock data when database is not available
    const mockPrompts = [
      {
        id: 'general-mock',
        name: 'General Assistant (Mock)',
        content: 'You are a helpful AI assistant. Answer questions clearly and concisely.',
        type: 'system' as const
      },
      {
        id: 'evaluation-mock',
        name: 'Evaluation Assistant (Mock)',
        content: 'You are an evaluation expert. Assess responses objectively and provide constructive feedback.',
        type: 'evaluation' as const
      }
    ];

    return NextResponse.json({
      success: true,
      prompts: mockPrompts,
      pagination: { page: 1, limit: 50, total: mockPrompts.length, totalPages: 1 }
    });
  }
}

// Create a new system prompt
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.prompt) {
      return NextResponse.json(
        { error: 'Name and prompt are required fields' },
        { status: 400 }
      );
    }

    const promptData = {
      name: body.name,
      prompt: body.prompt,
      type: body.category || body.type || 'system'
    };

    const [newPrompt] = await sql`
      INSERT INTO partimeas_system_prompts (name, prompt, type)
      VALUES (${promptData.name}, ${promptData.prompt}, ${promptData.type})
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      data: newPrompt,
      message: 'System prompt created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating system prompt:', error);
    return NextResponse.json(
      { error: 'Failed to create system prompt' },
      { status: 500 }
    );
  }
}

