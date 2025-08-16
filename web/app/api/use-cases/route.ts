import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllUseCases, 
  createUseCase, 
  bulkUpsertUseCases,
  CreateUseCaseData 
} from '@/utils/useCaseService';

/**
 * GET /api/use-cases
 * Get all use cases
 */
export async function GET() {
  try {
    const useCases = await getAllUseCases();
    return NextResponse.json({ success: true, data: useCases });
  } catch (error) {
    console.error('Error fetching use cases:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch use cases' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/use-cases
 * Create a new use case or bulk create/update use cases
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if this is a bulk operation
    if (Array.isArray(body)) {
      const useCases = body as CreateUseCaseData[];
      const createdUseCases = await bulkUpsertUseCases(useCases);
      return NextResponse.json({ 
        success: true, 
        message: `Successfully processed ${createdUseCases.length} use cases`,
        data: createdUseCases 
      });
    }
    
    // Single use case creation
    if (body.use_case_index && body.use_case_title && body.use_case_description) {
      const useCase = await createUseCase(body as CreateUseCaseData);
      return NextResponse.json({ 
        success: true, 
        message: 'Use case created successfully',
        data: useCase 
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error creating use case:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create use case' },
      { status: 500 }
    );
  }
} 