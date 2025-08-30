import { NextRequest, NextResponse } from 'next/server';
import { loadCriteria, validateCriteria } from '@/app/utils/criteriaReader';
import { CRITERIA_CONFIGS } from '@/app/config/criteria';
import { getGoogleAccessToken } from '@/app/utils/googleAuth';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated access token
    const accessToken = await getGoogleAccessToken();
    
    if (!accessToken) {
      throw new Error('Failed to obtain Google access token');
    }
    
    let allCriteria = [];

    // Load all criteria from all configured sources
    for (const config of CRITERIA_CONFIGS) {
      try {
        const criteria = await loadCriteria(CRITERIA_CONFIGS, config.id, accessToken);
        
        // Add criteria directly without extra metadata
        allCriteria.push(...criteria);
      } catch (error) {
        console.error(`[criteria-data] Failed to load from ${config.name}:`, error);
        // Continue with other sources even if one fails
      }
    }
    
    // Validate criteria
    const validation = validateCriteria(allCriteria);
    
    // Special handling for "No criterion versions found" - this is OK for initial setup
    if (!validation.isValid) {
      // Check if the only error is "No criterion versions found"
      if (validation.errors.length === 1 && validation.errors[0] === 'No criterion versions found') {
        console.warn('[criteria-data] No criterion versions found - this is normal for initial setup');
        // Return success with empty criteria
        return NextResponse.json({
          success: true,
          criteria: [],
          validation: { isValid: true, errors: [], warnings: ['No criterion versions found yet'] },
          totalCriteria: 0
        });
      }
      
      // Other validation errors are real problems
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

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('[criteria-data] Error loading criteria:', error);
    
    // More detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
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