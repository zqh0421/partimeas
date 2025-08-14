import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/config/database';

// Get configuration values by name
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const names = url.searchParams.getAll('name');
    
    if (names.length === 0) {
      return NextResponse.json({ 
        error: 'No configuration names provided. Use ?name=configName1&name=configName2' 
      }, { status: 400 });
    }

    // Build the query with parameterized placeholders
    const placeholders = names.map((_, index) => `$${index + 1}`).join(',');
    const query = `
      SELECT name, value, scope, created_at, updated_at 
      FROM partimeas_configs 
      WHERE name IN (${placeholders})
      ORDER BY name
    `;

    const result = await sql.query(query, names);
    
    // Transform the result into a key-value object for easier consumption
    const configValues: { [key: string]: any } = {};
    result.forEach((row: any) => {
      configValues[row.name] = {
        value: row.value,
        scope: row.scope,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
    });

    return NextResponse.json({
      success: true,
      config: configValues,
      requestedNames: names,
      foundNames: Object.keys(configValues)
    });

  } catch (error) {
    console.error('Error fetching configuration:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch configuration values',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Set configuration values
export async function POST(request: NextRequest) {
  try {
    const { name, value, scope = 'global' } = await request.json();
    
    if (!name || value === undefined) {
      return NextResponse.json({ 
        error: 'Both name and value are required' 
      }, { status: 400 });
    }

    // Use UPSERT (INSERT ... ON CONFLICT DO UPDATE) to handle both insert and update
    const query = `
      INSERT INTO partimeas_configs (name, value, scope, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (name) 
      DO UPDATE SET 
        value = EXCLUDED.value,
        scope = EXCLUDED.scope,
        updated_at = NOW()
      RETURNING name, value, scope, created_at, updated_at
    `;

    const result = await sql.query(query, [name, value, scope]);
    
    // If this is the first time setting enableGroupIdCollection, ensure it has a default value
    if (name === 'enableGroupIdCollection' && value === undefined) {
      const defaultQuery = `
        INSERT INTO partimeas_configs (name, value, scope, created_at, updated_at)
        VALUES ('enableGroupIdCollection', 'false', 'global', NOW(), NOW())
        ON CONFLICT (name) DO NOTHING
      `;
      await sql.query(defaultQuery);
    }
    
    return NextResponse.json({
      success: true,
      config: result[0],
      message: 'Configuration updated successfully'
    });

  } catch (error) {
    console.error('Error setting configuration:', error);
    return NextResponse.json({ 
      error: 'Failed to set configuration value',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 