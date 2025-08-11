import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/config/database';
import { executeQuery } from '@/config/database';
import { MODEL_CONFIGS } from '@/app/api/shared/constants';

// GET /api/models?provider=
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const provider = url.searchParams.get('provider');
    const type = url.searchParams.get('type'); // optional: 'output_generation' | 'evaluation'

    // Helper to resolve a model key recognizable by MODEL_CONFIGS
    const resolveModelKey = (modelName: string): string | null => {
      if (MODEL_CONFIGS[modelName as keyof typeof MODEL_CONFIGS]) return modelName;
      const entry = Object.entries(MODEL_CONFIGS).find(([, cfg]) => cfg.model === modelName);
      return entry ? entry[0] : null;
    };

    // Get models from database with configuration flags
    const rows = await sql`
      SELECT 
        id, 
        provider, 
        model_id, 
        temperature, 
        created_at,
        COALESCE(is_enabled, true) as is_enabled,
        COALESCE(is_evaluation_model, true) as is_evaluation_model,
        COALESCE(is_output_generation_model, true) as is_output_generation_model
      FROM partimeas_models
      WHERE 1=1
        ${provider ? sql`AND provider = ${provider}` : sql``}
      ORDER BY provider, model_id, created_at DESC
    `;

    // If a type filter is provided, return a minimal shape tailored for dynamic model
    // selection in generation/evaluation flows.
    if (type === 'output_generation' || type === 'evaluation') {
      const filtered = rows.filter(row => 
        row.is_enabled && 
        (type === 'evaluation' ? row.is_evaluation_model : row.is_output_generation_model)
      );
      
      // Map to recognized model keys
      const minimal = filtered
        .map(row => {
          const key = resolveModelKey(row.model_id);
          if (!key) return null;
          return {
            id: `${type}-${key}`,
            provider: row.provider,
            model_id: key
          };
        })
        .filter(Boolean);
      
      return NextResponse.json({ success: true, models: minimal });
    }

    // Otherwise, return the full admin shape used by the settings UI
    const transformedModels = rows.map(row => ({
      id: row.id,
      name: row.model_id, // Use model_id as name
      provider: row.provider,
      model: row.model_id,
      isEnabled: row.is_enabled,
      isEvaluationModel: row.is_evaluation_model,
      isOutputGenerationModel: row.is_output_generation_model
    }));

    return NextResponse.json({ success: true, models: transformedModels });
  } catch (e) {
    console.error('GET /api/models error:', e);
    return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
  }
}

// POST /api/models
// body: { provider, modelId, temperature?, isEnabled?, isEvaluationModel?, isOutputGenerationModel? }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      provider, 
      modelId, 
      temperature, 
      isEnabled = true, 
      isEvaluationModel = true, 
      isOutputGenerationModel = true 
    } = body ?? {};

    if (!provider || !modelId) {
      return NextResponse.json(
        { error: 'provider and modelId are required' },
        { status: 400 }
      );
    }

    // Check if model already exists
    const [existing] = await sql`
      SELECT id, provider, model_id, temperature, created_at
      FROM partimeas_models
      WHERE provider = ${provider} AND model_id = ${modelId}
    `;

    if (existing) {
      return NextResponse.json({
        success: true,
        data: existing,
        message: `Model ${provider}/${modelId} already exists`,
        skipped: true,
        inserted: 0
      }, { status: 200 });
    }

    const [created] = await sql`
      INSERT INTO partimeas_models (
        provider, 
        model_id, 
        temperature, 
        is_enabled, 
        is_evaluation_model, 
        is_output_generation_model
      )
      VALUES (
        ${provider}, 
        ${modelId}, 
        ${temperature ?? null}, 
        ${isEnabled}, 
        ${isEvaluationModel}, 
        ${isOutputGenerationModel}
      )
      RETURNING id, provider, model_id, temperature, created_at
    `;

    return NextResponse.json(
      { success: true, data: created, message: 'Model created', inserted: 1 },
      { status: 201 }
    );
  } catch (e: any) {
    console.error('POST /api/models error:', e);
    return NextResponse.json({ error: 'Failed to create model' }, { status: 500 });
  }
}

// PATCH /api/models
// body: { id, isEnabled?, isEvaluationModel?, isOutputGenerationModel?, temperature? }
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id, 
      isEnabled, 
      isEvaluationModel, 
      isOutputGenerationModel, 
      temperature 
    } = body ?? {};

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (isEnabled !== undefined) {
      updates.push(`is_enabled = $${paramIndex++}`);
      params.push(isEnabled);
    }
    if (isEvaluationModel !== undefined) {
      updates.push(`is_evaluation_model = $${paramIndex++}`);
      params.push(isEvaluationModel);
    }
    if (isOutputGenerationModel !== undefined) {
      updates.push(`is_output_generation_model = $${paramIndex++}`);
      params.push(isOutputGenerationModel);
    }
    if (temperature !== undefined) {
      updates.push(`temperature = $${paramIndex++}`);
      params.push(temperature);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    // Add updated_at timestamp
    updates.push(`updated_at = NOW()`);
    params.push(id);

    // Execute the update query
    const result = await sql`
      UPDATE partimeas_models 
      SET ${sql.unsafe(updates.join(', '))}
      WHERE id = ${id}
      RETURNING id, provider, model_id, temperature, created_at, is_enabled, is_evaluation_model, is_output_generation_model
    `;
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Model not found' },
        { status: 404 }
      );
    }

    const updated = result[0];
    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Model updated successfully'
    });
  } catch (e: any) {
    console.error('PATCH /api/models error:', e);
    return NextResponse.json({ error: 'Failed to update model' }, { status: 500 });
  }
}

// PUT /api/models
// body: { models: [{ provider, modelId, temperature?, isEnabled?, isEvaluationModel?, isOutputGenerationModel? }] }
// Save multiple models at once (for session-based saving)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { models } = body ?? {};

    if (!models || !Array.isArray(models)) {
      return NextResponse.json(
        { error: 'models array is required' },
        { status: 400 }
      );
    }

    if (models.length === 0) {
      return NextResponse.json(
        { error: 'models array cannot be empty' },
        { status: 400 }
      );
    }

    // Validate each model
    for (const model of models) {
      if (!model.provider || !model.modelId) {
        return NextResponse.json(
          { error: 'Each model must have provider and modelId' },
          { status: 400 }
        );
      }
    }

    // Check for existing models and filter them out
    const modelsToInsert = [];
    const skippedModels = [];
    
    for (const model of models) {
      const [existing] = await sql`
        SELECT provider, model_id FROM partimeas_models
        WHERE provider = ${model.provider} AND model_id = ${model.modelId}
      `;
      if (existing) {
        skippedModels.push(existing);
      } else {
        modelsToInsert.push(model);
      }
    }
    
    // If no new models to insert, return success with skipped info
    if (modelsToInsert.length === 0) {
      const skipped = skippedModels.map(m => `${m.provider}/${m.model_id}`).join(', ');
      return NextResponse.json({
        success: true,
        data: [],
        message: `All models already exist: ${skipped}`,
        skipped: skippedModels,
        inserted: 0
      }, { status: 200 });
    }
    
    // Insert only new models
    const result = [];
    for (const model of modelsToInsert) {
      const [created] = await sql`
        INSERT INTO partimeas_models (
          provider, 
          model_id, 
          temperature, 
          is_enabled, 
          is_evaluation_model, 
          is_output_generation_model
        )
        VALUES (
          ${model.provider}, 
          ${model.modelId}, 
          ${model.temperature ?? null}, 
          ${model.isEnabled ?? true}, 
          ${model.isEvaluationModel ?? true}, 
          ${model.isOutputGenerationModel ?? true}
        )
        RETURNING id, provider, model_id, temperature, created_at
      `;
      result.push(created);
    }

    const skipped = skippedModels.map(m => `${m.provider}/${m.model_id}`).join(', ');
    const message = skippedModels.length > 0 
      ? `Models created successfully. Skipped existing models: ${skipped}`
      : 'Models created successfully';
      
    return NextResponse.json(
      { 
        success: true, 
        data: result, 
        message,
        skipped: skippedModels,
        inserted: result.length
      },
      { status: 201 }
    );
  } catch (e) {
    console.error('PUT /api/models error:', e);
    return NextResponse.json({ error: 'Failed to create models' }, { status: 500 });
  }
}