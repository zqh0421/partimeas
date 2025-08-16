import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/app/config/database';

type Ctx = { params: { id: string } };

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const res = await sql`DELETE FROM partimeas_models WHERE id = ${params.id}`;
    // neon returns an object with rowCount
    if (!('rowCount' in res) || (res as any).rowCount === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Model deleted' });
  } catch (e) {
    console.error('DELETE /api/models/:id error:', e);
    return NextResponse.json({ error: 'Failed to delete model' }, { status: 500 });
  }
}