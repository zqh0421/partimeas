import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/use-cases/[index]
 * Get a use case by its index
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ index: string }> }
) {
  try {
    const { index } = await params;
    
    // Construct URL using request.url to call our own API
    const url = new URL(`/api/use-cases/${index}`, request.url);
    const res = await fetch(url);
    
    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Use case not found' },
          { status: 404 }
        );
      }
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    return NextResponse.json({ success: true, data: data });
  } catch (e) {
    console.error('GET /api/use-cases/[index] error:', e);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch use case' },
      { status: 500 }
    );
  }
}