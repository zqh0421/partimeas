import { NextRequest, NextResponse } from 'next/server';
import { loadCriteria, validateCriteria } from '@/utils/criteriaReader';
import { CRITERIA_CONFIGS } from '@/config/criteria';
import { getGoogleAccessToken } from '@/utils/googleAuth';

export async function GET(request: NextRequest) {
  try {
    console.log('[criteria-data] Loading all criteria...');
    console.log(`[criteria-data] Environment check - GCP_KEY_FILE: ${process.env.GCP_KEY_FILE || 'NOT SET'}`);
    
    // Get authenticated access token
    console.log('[criteria-data] Getting Google access token...');
    const accessToken = await getGoogleAccessToken();
    console.log(`[criteria-data] Access token obtained, length: ${accessToken?.length || 0}`);
    
    if (!accessToken) {
      throw new Error('Failed to obtain Google access token');
    }
    
    let allCriteria = [];

    // Load all criteria from all configured sources
    console.log('[criteria-data] Loading criteria from all sources...');
    for (const config of CRITERIA_CONFIGS) {
      try {
        console.log(`[criteria-data] Loading from: ${config.name}`);
        const criteria = await loadCriteria(CRITERIA_CONFIGS, config.id, accessToken);
        
        // Add criteria directly without extra metadata
        allCriteria.push(...criteria);
        console.log(`[criteria-data] Loaded ${criteria.length} criteria from ${config.name}`);
      } catch (error) {
        console.error(`[criteria-data] Failed to load from ${config.name}:`, error);
        // Continue with other sources even if one fails
      }
    }
    
    console.log(`[criteria-data] Total criteria loaded: ${allCriteria.length}`);
    
    // Validate criteria
    console.log('[criteria-data] Validating criteria...');
    const validation = validateCriteria(allCriteria);
    
    if (!validation.isValid) {
      console.log(`[criteria-data] Criteria validation failed:`, validation.errors);
      return NextResponse.json(
        { 
          error: 'Criteria validation failed',
          details: validation.errors
        },
        { status: 400 }
      );
    }
    
    const responseData = {
      success: true,
      criteria: allCriteria,
      validation,
      totalCriteria: allCriteria.length
    };

    console.log('[criteria-data] Request completed successfully');
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('[criteria-data] Error loading criteria:', error);
    
    // More detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[criteria-data] Error details:', { 
      errorMessage, 
      errorStack
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to load criteria',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
} 