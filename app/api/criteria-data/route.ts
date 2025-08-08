import { NextRequest, NextResponse } from 'next/server';
import { UseCaseSheetManager } from '@/utils/useCaseSheets';
import { GoogleAuth } from 'google-auth-library';

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
    // Initialize Google Auth with service account
    const auth = new GoogleAuth({
      keyFile: `./${process.env.GCP_KEY_FILE}`,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    if (!accessToken.token) {
      return NextResponse.json(
        { error: 'Failed to get access token from service account' },
        { status: 500 }
      );
    }

    const manager = new UseCaseSheetManager(accessToken.token);
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