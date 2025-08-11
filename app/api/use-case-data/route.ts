import { NextRequest, NextResponse } from 'next/server';
import { loadTestCases, validateTestCases } from '@/utils/useCaseReader';
import { USE_CASE_CONFIGS } from '@/config/useCases';
import { getGoogleAccessToken } from '@/utils/googleAuth';

export async function GET(request: NextRequest) {
  try {
    console.log('[use-case-data] Loading all test cases...');
    console.log(`[use-case-data] Environment check - GCP_KEY_FILE: ${process.env.GCP_KEY_FILE || 'NOT SET'}`);
    console.log(`[use-case-data] Environment check - GCP_SERVICE_ACCOUNT_SECRET_JSON: ${process.env.GCP_SERVICE_ACCOUNT_SECRET_JSON ? 'SET (length: ' + process.env.GCP_SERVICE_ACCOUNT_SECRET_JSON.length + ')' : 'NOT SET'}`);
    console.log(`[use-case-data] Environment check - GOOGLE_SERVICE_ACCOUNT_EMAIL: ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'SET' : 'NOT SET'}`);
    console.log(`[use-case-data] Environment check - GOOGLE_PRIVATE_KEY: ${process.env.GOOGLE_PRIVATE_KEY ? 'SET (length: ' + process.env.GOOGLE_PRIVATE_KEY.length + ')' : 'NOT SET'}`);
    
    // Get authenticated access token
    console.log('[use-case-data] Getting Google access token...');
    const accessToken = await getGoogleAccessToken();
    console.log(`[use-case-data] Access token obtained, length: ${accessToken?.length || 0}`);
    
    if (!accessToken) {
      throw new Error('Failed to obtain Google access token');
    }
    
    let allTestCases = [];
    
    // Create a Set to track unique spreadsheet+sheet combinations to avoid loading the same data multiple times
    const loadedSources = new Set<string>();

    // Load all test cases from all configured sources (avoiding duplicates)
    console.log('[use-case-data] Loading test cases from all sources...');
    for (const config of USE_CASE_CONFIGS) {
      try {
        // Create a unique key for this data source
        const sourceKey = `${config.spreadsheetId}:${config.sheetName}`;
        
        if (loadedSources.has(sourceKey)) {
          console.log(`[use-case-data] Skipping ${config.name} - data source already loaded (${sourceKey})`);
          continue;
        }
        
        console.log(`[use-case-data] Loading from: ${config.name}`);
        const testCases = await loadTestCases(USE_CASE_CONFIGS, config.id, accessToken);
        
        // Add source information to each test case (optional metadata)
        const testCasesWithSource = testCases.map(tc => ({
          ...tc,
          source: config.name,
          sourceDescription: config.description,
          category: config.category
        }));
        
        allTestCases.push(...testCasesWithSource);
        loadedSources.add(sourceKey);
        console.log(`[use-case-data] Loaded ${testCases.length} test cases from ${config.name}`);
      } catch (error) {
        console.error(`[use-case-data] Failed to load from ${config.name}:`, error);
        // Continue with other sources even if one fails
      }
    }
    
    console.log(`[use-case-data] Total test cases loaded: ${allTestCases.length}`);
    
    // Validate test cases
    console.log('[use-case-data] Validating test cases...');
    const validation = validateTestCases(allTestCases);
    
    if (!validation.isValid) {
      console.log(`[use-case-data] Test cases validation failed:`, validation.errors);
      return NextResponse.json(
        { 
          error: 'Test cases validation failed',
          details: validation.errors
        },
        { status: 400 }
      );
    }
    
    const responseData = {
      success: true,
      testCases: allTestCases,
      validation,
      totalTestCases: allTestCases.length
    };

    console.log('[use-case-data] Request completed successfully');
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('[use-case-data] Error loading test cases:', error);
    
    // More detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[use-case-data] Error details:', { 
      errorMessage, 
      errorStack
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to load test cases',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
} 