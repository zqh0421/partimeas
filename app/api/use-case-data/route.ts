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
    
    // Fallback: Return mock test cases when Google Sheets API fails
    if (useCaseId === 'test-cases' && dataType === 'test-cases') {
      console.log('Falling back to mock test cases due to Google Sheets API error');
      
      const mockTestCases = [
        {
          id: 'mock-test-1',
          input: 'Marcus, a 5-year-old child, is sitting in circle time. The teacher asks the class to raise their hand if they have something to share about their weekend. Marcus immediately starts talking without raising his hand, disrupting the flow of the discussion.',
          expectedOutput: 'Analysis should consider the child\'s developmental stage, classroom dynamics, and appropriate interventions.',
          actualOutput: '',
          modelName: 'Mock Model',
          timestamp: new Date().toISOString(),
          useCase: 'General Analysis',
          scenarioCategory: 'Classroom Behavior'
        },
        {
          id: 'mock-test-2',
          input: 'Sarah, a 4-year-old, has been having difficulty transitioning from free play to cleanup time. She often cries and refuses to put away toys, requiring individual attention from teachers.',
          expectedOutput: 'Response should address transition strategies and emotional regulation support.',
          actualOutput: '',
          modelName: 'Mock Model',
          timestamp: new Date().toISOString(),
          useCase: 'General Analysis',
          scenarioCategory: 'Transitions'
        },
        {
          id: 'mock-test-3',
          input: 'During snack time, 3-year-old Jake consistently takes food from other children\'s plates. When redirected, he becomes upset and sometimes hits the table.',
          expectedOutput: 'Analysis should consider developmental appropriateness and guidance strategies.',
          actualOutput: '',
          modelName: 'Mock Model',
          timestamp: new Date().toISOString(),
          useCase: 'General Analysis',
          scenarioCategory: 'Social Skills'
        }
      ];
      
      return NextResponse.json({
        success: true,
        useCaseId,
        dataType,
        testCases: mockTestCases,
        testCasesValidation: { isValid: true, errors: [] },
        isMockData: true
      });
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to load data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 