import { NextRequest, NextResponse } from 'next/server';
import { UseCaseSheetManager } from '@/utils/useCaseSheets';
import { getGoogleAccessToken } from '@/utils/googleAuth';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const criteriaId = searchParams.get('criteriaId');

  if (!criteriaId) {
    return NextResponse.json(
      { error: 'Criteria ID is required' },
      { status: 400 }
    );
  }

  try {
    // Get authenticated access token
    const accessToken = await getGoogleAccessToken();
    const manager = new UseCaseSheetManager(accessToken);
    const criteria = await manager.loadCriteria(criteriaId);

    return NextResponse.json({
      success: true,
      criteriaId,
      criteria
    });

  } catch (error) {
    console.error('Error loading criteria data:', error);
    return NextResponse.json(
      {
        error: 'Failed to load criteria data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 