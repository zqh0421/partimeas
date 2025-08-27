import { NextRequest, NextResponse } from 'next/server';
import { evaluationRecordUtils } from '@/app/utils/database';
import { 
  NewEvaluationRecord,
  EvaluationRecordFilters 
} from '@/app/types/database';
import { 
  validateEvaluationRecord, 
  validateEvaluationRecordsBulk 
} from '@/app/utils/evaluationRecordValidation';

// GET endpoint to retrieve evaluation records
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    switch (action) {
      case 'byId':
        const id = searchParams.get('id');
        if (!id) {
          return NextResponse.json(
            { error: 'Record ID is required for byId action' },
            { status: 400 }
          );
        }
        
        const record = await evaluationRecordUtils.get(id);
        if (!record) {
          return NextResponse.json(
            { error: 'Evaluation record not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          record
        });
        
      case 'list':
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const groupId = searchParams.get('group_id') || undefined;
        const sessionId = searchParams.get('session_id') || undefined;
        
        const filters: EvaluationRecordFilters = {};
        if (groupId) filters.group_id = groupId;
        if (sessionId) filters.session_id = sessionId;
        
        const records = await evaluationRecordUtils.getAll(filters);
        
        return NextResponse.json({
          success: true,
          data: records.data,
          pagination: records.pagination
        });
        
      case 'byGroup':
        const targetGroupId = searchParams.get('group_id');
        if (!targetGroupId) {
          return NextResponse.json(
            { error: 'Group ID is required for byGroup action' },
            { status: 400 }
          );
        }
        
        const groupRecords = await evaluationRecordUtils.getByGroupId(targetGroupId);
        
        return NextResponse.json({
          success: true,
          data: groupRecords.data,
          total: groupRecords.data.length
        });
        
      case 'bySession':
        const targetSessionId = searchParams.get('session_id');
        if (!targetSessionId) {
          return NextResponse.json(
            { error: 'Session ID is required for bySession action' },
            { status: 400 }
          );
        }
        
        const sessionRecords = await evaluationRecordUtils.getBySessionId(targetSessionId);
        
        return NextResponse.json({
          success: true,
          data: sessionRecords.data,
          total: sessionRecords.data.length
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: byId, list, byGroup, or bySession' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Evaluation records API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve evaluation records',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST endpoint to create new evaluation records
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle both single record and bulk upload
    if (Array.isArray(body)) {
      // Bulk upload with validation
      const bulkValidation = validateEvaluationRecordsBulk(body);
      
      if (!bulkValidation.isValid) {
        const validationErrors = bulkValidation.recordValidations
          .filter(rv => !rv.validation.isValid)
          .map(rv => ({
            index: rv.index,
            errors: rv.validation.errors,
            warnings: rv.validation.warnings
          }));
        
        return NextResponse.json({
          error: 'Validation failed for bulk upload',
          validRecords: bulkValidation.validRecords,
          invalidRecords: bulkValidation.invalidRecords,
          totalRecords: bulkValidation.totalRecords,
          validationErrors
        }, { status: 400 });
      }
      
      const results = [];
      const errors = [];
      
      for (let i = 0; i < body.length; i++) {
        try {
          const recordData = body[i] as NewEvaluationRecord;
          const createdRecord = await evaluationRecordUtils.create(recordData);
          results.push(createdRecord);
        } catch (error) {
          errors.push({ 
            index: i, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }
      
      return NextResponse.json({
        success: true,
        created: results.length,
        total: body.length,
        results,
        errors: errors.length > 0 ? errors : undefined
      });
    } else {
      // Single record with validation
      const validation = validateEvaluationRecord(body);
      
      if (!validation.isValid) {
        return NextResponse.json({
          error: 'Validation failed',
          errors: validation.errors,
          warnings: validation.warnings
        }, { status: 400 });
      }
      
      const recordData = body as NewEvaluationRecord;
      const createdRecord = await evaluationRecordUtils.create(recordData);
      
      return NextResponse.json({
        success: true,
        record: createdRecord,
        warnings: validation.warnings.length > 0 ? validation.warnings : undefined
      });
    }
    
  } catch (error) {
    console.error('Create evaluation record error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create evaluation record',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT endpoint to update an evaluation record
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }
    
    const updatedRecord = await evaluationRecordUtils.update(id, updateData);
    
    return NextResponse.json({
      success: true,
      record: updatedRecord
    });
    
  } catch (error) {
    console.error('Update evaluation record error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update evaluation record',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove an evaluation record
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      );
    }
    
    const deleted = await evaluationRecordUtils.delete(id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Evaluation record not found or already deleted' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Evaluation record deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete evaluation record error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete evaluation record',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}