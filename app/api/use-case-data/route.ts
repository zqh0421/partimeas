import { NextRequest, NextResponse } from 'next/server';
import { UseCaseSheetManager } from '@/utils/useCaseSheets';
import { GoogleAuth } from 'google-auth-library';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const useCaseId = searchParams.get('useCaseId');
  const dataType = searchParams.get('dataType') || 'test-cases';

  if (!useCaseId) {
    return NextResponse.json(
      { error: 'Use case ID is required' },
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
    
    let responseData: any = {
      success: true,
      useCaseId,
      dataType
    };

    if (dataType === 'test-cases' || dataType === 'both') {
      const testCases = await manager.loadTestCases(useCaseId);
      const validation = manager.validateTestCases(testCases);
      
      if (!validation.isValid) {
        return NextResponse.json(
          { 
            error: 'Test cases validation failed',
            details: validation.errors
          },
          { status: 400 }
        );
      }
      
      responseData.testCases = testCases;
      responseData.testCasesValidation = validation;
    }

    if (dataType === 'criteria' || dataType === 'both') {
      const criteria = await manager.loadCriteriaAuto();
      responseData.criteria = criteria;
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error loading data:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to load data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 