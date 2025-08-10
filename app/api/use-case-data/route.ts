import { NextRequest, NextResponse } from 'next/server';
import { UseCaseSheetManager } from '@/utils/useCaseSheets';
import { getGoogleAccessToken } from '@/utils/googleAuth';

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
    // Get authenticated access token
    const accessToken = await getGoogleAccessToken();
    const manager = new UseCaseSheetManager(accessToken);
    
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