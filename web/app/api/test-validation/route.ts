import { NextRequest, NextResponse } from 'next/server';
import { validateEvaluationRecord } from '@/app/utils/evaluationRecordValidation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('[TestValidation] Received data:', JSON.stringify(body, null, 2));
    
    const validation = validateEvaluationRecord(body);
    
    console.log('[TestValidation] Validation result:', validation);
    
    return NextResponse.json({
      success: true,
      validation: validation,
      receivedKeys: Object.keys(body),
      receivedData: body
    });
    
  } catch (error) {
    console.error('[TestValidation] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}