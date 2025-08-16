import { NextRequest, NextResponse } from 'next/server';
import { loadTestCases, validateTestCases } from '@/utils/useCaseReader';
import { enrichTestCases } from '@/utils/testCaseEnricher';
import { USE_CASE_CONFIGS } from '@/config/useCases';
import { getGoogleAccessToken } from '@/utils/googleAuth';

// Helper function to fetch spreadsheet data for validation debugging
async function fetchSheetDataForValidation(
  spreadsheetId: string, 
  sheetName: string, 
  accessToken: string
): Promise<{ headers: string[]; rows: string[][] }> {
  const encodedSheetName = encodeURIComponent(sheetName);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedSheetName}`;
  
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };
  
  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    console.warn(`[use-case-data] Google Sheets API returned status ${response.status} for validation debugging`);
    return { headers: [], rows: [] };
  }
  
  const data = await response.json();
  
  // Updated to match user's modification: First row contains headers, second row onwards contains data
  if (!data.values || data.values.length < 2) {
    throw new Error('Insufficient data in spreadsheet');
  }
  
  return {
    headers: data.values[0], // First row (index 0) contains the column headers
    rows: data.values.slice(1) // Second row (index 1) onwards contains the data
  };
}

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
    
    // Test Google Sheets API connectivity first
    console.log('[use-case-data] Testing Google Sheets API connectivity...');
    if (USE_CASE_CONFIGS.length > 0) {
      const firstConfig = USE_CASE_CONFIGS[0];
      console.log(`[use-case-data] Testing with config: ${firstConfig.name}`);
      console.log(`[use-case-data] Spreadsheet ID: ${firstConfig.spreadsheetId}`);
      console.log(`[use-case-data] Sheet Name: ${firstConfig.sheetName}`);
      
      // Test direct API call
      const testUrl = `https://sheets.googleapis.com/v4/spreadsheets/${firstConfig.spreadsheetId}/values/${encodeURIComponent(firstConfig.sheetName)}`;
      console.log(`[use-case-data] Test URL: ${testUrl}`);
      
      try {
        const testResponse = await fetch(testUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`[use-case-data] Test API response status: ${testResponse.status}`);
        
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log(`[use-case-data] Test API response data:`, JSON.stringify(testData, null, 2));
        } else {
          const errorText = await testResponse.text();
          console.error(`[use-case-data] Test API error: ${errorText}`);
        }
      } catch (testError) {
        console.error(`[use-case-data] Test API call failed:`, testError);
      }
    }
    
    let allTestCases = [];
    let allTitles = [];
    
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
        const result = await loadTestCases(USE_CASE_CONFIGS, config.id, accessToken);
        
        // Add source information to each test case (optional metadata)
        const testCasesWithSource = result.testCases.map(tc => ({
          ...tc,
          source: config.name,
          sourceDescription: config.description,
          category: config.category
        }));
        
        allTestCases.push(...testCasesWithSource);
        if (result.title) {
          allTitles.push(result.title);
        }
        loadedSources.add(sourceKey);
        console.log(`[use-case-data] Loaded ${result.testCases.length} test cases from ${config.name} with title: "${result.title}"`);
      } catch (error) {
        console.error(`[use-case-data] Failed to load from ${config.name}:`, error);
        // Continue with other sources even if one fails
      }
    }
    
    console.log(`[use-case-data] Total test cases loaded: ${allTestCases.length}`);
    console.log(`[use-case-data] Titles found: ${allTitles.join(', ')}`);
    
    // Enrich test cases with use case information from database
    console.log('[use-case-data] Enriching test cases with database use case information...');
    console.log(`[use-case-data] Test cases before enrichment: ${allTestCases.length}`);
    
    // Log sample test case structure before enrichment
    if (allTestCases.length > 0) {
      const sampleTestCase = allTestCases[0];
      console.log('[use-case-data] Sample test case before enrichment:', {
        id: sampleTestCase.id,
        input: sampleTestCase.input,
        context: sampleTestCase.context,
        use_case_index: sampleTestCase.use_case_index,
        hasUseCase: !!sampleTestCase.useCase
      });
    }
    
    // Check if we have use_case_index values to enrich
    const testCasesWithIndex = allTestCases.filter(tc => tc.use_case_index);
    console.log(`[use-case-data] Test cases with use_case_index: ${testCasesWithIndex.length}/${allTestCases.length}`);
    if (testCasesWithIndex.length > 0) {
      console.log('[use-case-data] Sample use_case_index values:', testCasesWithIndex.slice(0, 3).map(tc => tc.use_case_index));
    }
    
    // Test database connection before enrichment
    console.log('[use-case-data] Testing database connection...');
    try {
      const { executeQuery } = await import('@/config/database');
      const testResult = await executeQuery('SELECT COUNT(*) as count FROM partimeas_use_cases');
      console.log(`[use-case-data] Database connection test successful. Found ${testResult.rows?.[0]?.count || 0} use cases in database.`);
      
      // Also check for specific use case index 4
      const useCase4Result = await executeQuery('SELECT * FROM partimeas_use_cases WHERE use_case_index = $1', [4]);
      console.log(`[use-case-data] Use case index 4 lookup: ${useCase4Result.rows?.length || 0} results found`);
      if (useCase4Result.rows?.length > 0) {
        console.log(`[use-case-data] Use case 4 details:`, {
          index: useCase4Result.rows[0].use_case_index,
          title: useCase4Result.rows[0].use_case_title,
          description: useCase4Result.rows[0].use_case_description?.substring(0, 50) + '...'
        });
      }
    } catch (dbError) {
      console.error('[use-case-data] Database connection test failed:', dbError);
      console.error('[use-case-data] This explains why enrichment is not working');
    }
    
    try {
      console.log('[use-case-data] Calling enrichTestCases function...');
      const enrichedTestCases = await enrichTestCases(allTestCases);
      console.log(`[use-case-data] Enrichment completed. ${enrichedTestCases.filter(tc => tc.useCase).length}/${enrichedTestCases.length} test cases enriched`);
      
      // Log sample test case structure after enrichment
      if (enrichedTestCases.length > 0) {
        const sampleEnriched = enrichedTestCases[0];
        console.log('[use-case-data] Sample test case after enrichment:', {
          id: sampleEnriched.id,
          input: sampleEnriched.input,
          context: sampleEnriched.context,
          use_case_index: sampleEnriched.use_case_index,
          hasUseCase: !!sampleEnriched.useCase,
          useCaseTitle: sampleEnriched.useCase?.use_case_title || 'N/A',
          useCaseDescription: sampleEnriched.useCase?.use_case_description?.substring(0, 50) + '...' || 'N/A'
        });
      }
      
      allTestCases = enrichedTestCases as any[]; // Type assertion for compatibility
    } catch (enrichmentError) {
      console.error('[use-case-data] Use case enrichment failed with error:', enrichmentError);
      console.error('[use-case-data] Enrichment error stack:', enrichmentError instanceof Error ? enrichmentError.stack : 'No stack trace');
      console.error('[use-case-data] Enrichment error details:', {
        name: enrichmentError instanceof Error ? enrichmentError.name : 'Unknown',
        message: enrichmentError instanceof Error ? enrichmentError.message : String(enrichmentError),
        cause: enrichmentError instanceof Error ? enrichmentError.cause : 'No cause'
      });
      // Continue without enrichment if database is not available
    }
    
    // Validate test cases
    console.log('[use-case-data] Validating test cases...');
    
    // Get headers and rows from the first successful load for validation debugging
    let validationHeaders: string[] = [];
    let validationRows: string[][] = [];
    
    if (USE_CASE_CONFIGS.length > 0) {
      try {
        const firstConfig = USE_CASE_CONFIGS[0];
        const { headers, rows } = await fetchSheetDataForValidation(
          firstConfig.spreadsheetId,
          firstConfig.sheetName,
          accessToken
        );
        validationHeaders = headers;
        validationRows = rows;
      } catch (error) {
        console.warn('[use-case-data] Could not load sample data for validation debugging:', error);
      }
    }
    
    const validation = validateTestCases(allTestCases, validationHeaders, validationRows);
    
    if (!validation.isValid) {
      console.log(`[use-case-data] Test cases validation failed:`, validation.errors);
      console.log(`[use-case-data] Validation warnings:`, validation.warnings);
      
      // If the only error is "No test cases found", return a more helpful response
      if (validation.errors.length === 1 && validation.errors[0] === 'No test cases found') {
        return NextResponse.json(
          { 
            success: true,
            testCases: [],
            validation,
            totalTestCases: 0,
            titles: [],
            enrichmentStatus: 'completed',
            message: 'No test cases found in the spreadsheet. This may be due to empty prompt fields or the spreadsheet being empty.'
          },
          { status: 200 }
        );
      }
      
      // Provide more helpful error messages for other validation failures
      const errorMessage = validation.errors.length > 0 
        ? `Test cases validation failed: ${validation.errors.join('; ')}`
        : 'Test cases validation failed';
        
      return NextResponse.json(
        { 
          error: errorMessage,
          details: validation.errors,
          warnings: validation.warnings,
          spreadsheetAnalysis: validationHeaders.length > 0 ? {
            headers: validationHeaders,
            sampleRow: validationRows[0] || []
          } : null
        },
        { status: 400 }
      );
    }
    
    const responseData = {
      success: true,
      testCases: allTestCases,
      validation,
      totalTestCases: allTestCases.length,
      titles: allTitles,
      enrichmentStatus: 'completed'
    };

    console.log('[use-case-data] Request completed successfully');
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('[use-case-data] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to load use case data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 