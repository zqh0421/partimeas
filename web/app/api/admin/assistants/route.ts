import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/app/config/database';
import { Assistant, AssistantModel } from '@/app/types/admin';

function isValidUuid(value: string | undefined | null): boolean {
  if (!value || typeof value !== 'string') return false;
  // UUID v4 regex (accept any valid UUID variant)
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
  return uuidRegex.test(value);
}

// GET /api/admin/assistants
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');

    // First get all assistants
    let query = sql`
      SELECT 
        a.id,
        a.name,
        a.system_prompt_id,
        a.required_to_show,
        a.type,
        a.created_at,
        a.updated_at
      FROM partimeas_assistants a
      WHERE 1=1
    `;

    if (type) {
      query = sql`${query} AND a.type = ${type}`;
    }

    query = sql`${query} ORDER BY a.created_at DESC`;

    const assistantRows = await query;
    
    // For each assistant, get their associated models
    const assistants: Assistant[] = [];
    
    for (const row of assistantRows) {
      // Get models for this assistant
      const modelRows = await sql`
        SELECT am.model_id
        FROM partimeas_assistant_models am
        WHERE am.assistant_id = ${row.id}
      `;
      
      const model_ids = modelRows.map(mr => mr.model_id);
      
      assistants.push({
        id: row.id,
        name: row.name,
        model_ids: model_ids, // Return all model_ids for multi-model support
        system_prompt_id: row.system_prompt_id,
        required_to_show: row.required_to_show,
        type: row.type,
        created_at: row.created_at,
        updated_at: row.updated_at
      });
    }

    return NextResponse.json({ 
      success: true, 
      assistants,
      pagination: { 
        page: 1, 
        limit: 50, 
        total: assistants.length, 
        totalPages: 1 
      }
    });
  } catch (error) {
    console.error('GET /api/admin/assistants error:', error);
    
    // Fallback with mock data when database is not available
    const mockAssistants: Assistant[] = [
      {
        id: 1,
        name: 'Output Generation Assistant (Mock)',
        model_ids: ['mock-model-id'],
        system_prompt_id: 'mock-prompt-id',
        required_to_show: true,
        type: 'output_generation'
      },
      {
        id: 2,
        name: 'Evaluation Assistant (Mock)',
        model_ids: ['mock-model-id'],
        system_prompt_id: 'mock-prompt-id',
        required_to_show: false,
        type: 'evaluation'
      }
    ];

    return NextResponse.json({
      success: true,
      assistants: mockAssistants,
      pagination: { page: 1, limit: 50, total: mockAssistants.length, totalPages: 1 }
    });
  }
}

// POST /api/admin/assistants
export async function POST(request: NextRequest) {
  try {
    const { name, model_ids, system_prompt_id, required_to_show, type }: any = await request.json();

    if (!name || !model_ids || !system_prompt_id || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, model_ids, system_prompt_id, type' },
        { status: 400 }
      );
    }

    if (!Array.isArray(model_ids) || model_ids.length === 0) {
      return NextResponse.json(
        { error: 'model_ids must be a non-empty array' },
        { status: 400 }
      );
    }

    if (!['output_generation', 'evaluation'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "output_generation" or "evaluation"' },
        { status: 400 }
      );
    }

    // Validate that referenced IDs are UUIDs (avoid sending temp IDs like "temp-...")
    if (!isValidUuid(system_prompt_id)) {
      return NextResponse.json(
        { error: 'system_prompt_id must be a valid UUID saved in the database' },
        { status: 400 }
      );
    }

    for (const model_id of model_ids) {
      if (!isValidUuid(model_id)) {
        return NextResponse.json(
          { error: 'All model_ids must be valid UUIDs saved in the database' },
          { status: 400 }
        );
      }
    }

    // Ensure referenced records actually exist
    const [promptExists] = await sql`
      SELECT id FROM partimeas_system_prompts WHERE id = ${system_prompt_id}
    `;
    if (!promptExists) {
      return NextResponse.json(
        { error: 'Referenced system_prompt_id does not exist' },
        { status: 400 }
      );
    }

    for (const model_id of model_ids) {
      const [modelExists] = await sql`
        SELECT id FROM partimeas_models WHERE id = ${model_id}
      `;
      if (!modelExists) {
        return NextResponse.json(
          { error: `Referenced model_id ${model_id} does not exist` },
          { status: 400 }
        );
      }
    }

    // If creating an evaluation assistant marked active, deactivate others first
    if (type === 'evaluation' && required_to_show === true) {
      await sql`
        UPDATE partimeas_assistants
        SET required_to_show = false, updated_at = NOW()
        WHERE type = 'evaluation' AND required_to_show = true
      `;
    }

    // Create the assistant first
    const result = await sql`
      INSERT INTO partimeas_assistants (name, system_prompt_id, required_to_show, type)
      VALUES (${name}, ${system_prompt_id}, ${required_to_show || false}, ${type})
      RETURNING id, name, system_prompt_id, required_to_show, type, created_at, updated_at
    `;

    const newAssistantId = result[0].id;

    // Create the assistant-model relationships
    for (const model_id of model_ids) {
      await sql`
        INSERT INTO partimeas_assistant_models (assistant_id, model_id)
        VALUES (${newAssistantId}, ${model_id})
      `;
    }

    // Get the created assistant with models
    const modelRows = await sql`
      SELECT am.model_id
      FROM partimeas_assistant_models am
      WHERE am.assistant_id = ${newAssistantId}
    `;
    
    const createdModelIds = modelRows.map(mr => mr.model_id);

    const newAssistant: Assistant = {
      id: newAssistantId,
      name: result[0].name,
      model_ids: createdModelIds, // Return all model_ids for frontend compatibility
      system_prompt_id: result[0].system_prompt_id,
      required_to_show: result[0].required_to_show,
      type: result[0].type,
      created_at: result[0].created_at,
      updated_at: result[0].updated_at
    };

    return NextResponse.json({ 
      success: true, 
      assistant: newAssistant,
      message: 'Assistant created successfully' 
    });
  } catch (error) {
    console.error('POST /api/admin/assistants error:', error);
    return NextResponse.json(
      { error: 'Failed to create assistant' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/assistants/[id]
export async function PUT(request: NextRequest) {
  try {
    const { id, name, model_ids, system_prompt_id, required_to_show, type }: any = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required field: id' },
        { status: 400 }
      );
    }

    const updateFields: any = {};
    if (name !== undefined) updateFields.name = name;
    if (system_prompt_id !== undefined) {
      if (!isValidUuid(system_prompt_id)) {
        return NextResponse.json(
          { error: 'system_prompt_id must be a valid UUID' },
          { status: 400 }
        );
      }
      const [promptExists] = await sql`SELECT id FROM partimeas_system_prompts WHERE id = ${system_prompt_id}`;
      if (!promptExists) {
        return NextResponse.json(
          { error: 'Referenced system_prompt_id does not exist' },
          { status: 400 }
        );
      }
      updateFields.system_prompt_id = system_prompt_id;
    }
    if (required_to_show !== undefined) updateFields.required_to_show = required_to_show;
    if (type !== undefined) {
      if (!['output_generation', 'evaluation'].includes(type)) {
        return NextResponse.json(
          { error: 'Invalid type. Must be "output_generation" or "evaluation"' },
          { status: 400 }
        );
      }
      updateFields.type = type;
    }

    // Handle model_ids update separately
    if (model_ids !== undefined) {
      if (!Array.isArray(model_ids)) {
        return NextResponse.json(
          { error: 'model_ids must be an array' },
          { status: 400 }
        );
      }

      // Validate all model_ids
      for (const model_id of model_ids) {
        if (!isValidUuid(model_id)) {
          return NextResponse.json(
            { error: 'All model_ids must be valid UUIDs' },
            { status: 400 }
          );
        }
        const [modelExists] = await sql`SELECT id FROM partimeas_models WHERE id = ${model_id}`;
        if (!modelExists) {
          return NextResponse.json(
            { error: `Referenced model_id ${model_id} does not exist` },
            { status: 400 }
          );
        }
      }

      // Delete existing assistant-model relationships
      await sql`
        DELETE FROM partimeas_assistant_models
        WHERE assistant_id = ${id}
      `;

      // Create new assistant-model relationships
      for (const model_id of model_ids) {
        await sql`
          INSERT INTO partimeas_assistant_models (assistant_id, model_id)
          VALUES (${id}, ${model_id})
        `;
      }
    }

    if (Object.keys(updateFields).length === 0 && model_ids === undefined) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // If making an evaluation assistant active, deactivate all others first
    if (updateFields.required_to_show === true) {
      let targetType = type;
      if (!targetType) {
        const [existing] = await sql`SELECT type FROM partimeas_assistants WHERE id = ${id}`;
        targetType = existing?.type;
      }
      if (targetType === 'evaluation') {
        await sql`
          UPDATE partimeas_assistants
          SET required_to_show = false, updated_at = NOW()
          WHERE type = 'evaluation' AND id <> ${id}
        `;
      }
    }

    // Update assistant fields if any
    if (Object.keys(updateFields).length > 0) {
      const setClause = Object.keys(updateFields)
        .map((key, index) => sql`${sql.unsafe(key)} = ${Object.values(updateFields)[index]}`)
        .reduce((acc, clause) => sql`${acc}, ${clause}`);
      
      await sql`
        UPDATE partimeas_assistants 
        SET ${setClause}, updated_at = NOW()
        WHERE id = ${id}
      `;
    }

    // Get the updated assistant with models
    const [assistantRow] = await sql`
      SELECT id, name, system_prompt_id, required_to_show, type, created_at, updated_at
      FROM partimeas_assistants
      WHERE id = ${id}
    `;

    if (!assistantRow) {
      return NextResponse.json(
        { error: 'Assistant not found' },
        { status: 404 }
      );
    }

    // Get current model_ids
    const modelRows = await sql`
      SELECT am.model_id
      FROM partimeas_assistant_models am
      WHERE am.assistant_id = ${id}
    `;
    
    const currentModelIds = modelRows.map(mr => mr.model_id);

    const updatedAssistant: Assistant = {
      id: assistantRow.id,
      name: assistantRow.name,
      model_ids: currentModelIds, // Return all model_ids for frontend compatibility
      system_prompt_id: assistantRow.system_prompt_id,
      required_to_show: assistantRow.required_to_show,
      type: assistantRow.type,
      created_at: assistantRow.created_at,
      updated_at: assistantRow.updated_at
    };

    return NextResponse.json({ 
      success: true, 
      assistant: updatedAssistant,
      message: 'Assistant updated successfully' 
    });
  } catch (error) {
    console.error('PUT /api/admin/assistants error:', error);
    return NextResponse.json(
      { error: 'Failed to update assistant' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/assistants/[id]
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    // Delete assistant-model relationships first
    await sql`
      DELETE FROM partimeas_assistant_models
      WHERE assistant_id = ${parseInt(id)}
    `;

    // Then delete the assistant
    const result = await sql`
      DELETE FROM partimeas_assistants 
      WHERE id = ${parseInt(id)}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Assistant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Assistant deleted successfully' 
    });
  } catch (error) {
    console.error('DELETE /api/admin/assistants error:', error);
    return NextResponse.json(
      { error: 'Failed to delete assistant' },
      { status: 500 }
    );
  }
} 