import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/utils/database';

// Get a specific system prompt by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const prompt = await db.getSystemPrompt(params.id);
    
    return NextResponse.json({
      success: true,
      data: prompt
    });
  } catch (error) {
    console.error('Error fetching system prompt:', error);
    return NextResponse.json(
      { error: 'System prompt not found' },
      { status: 404 }
    );
  }
}

// Update a specific system prompt
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Remove fields that shouldn't be updated directly
    const { id, createdAt, updatedAt, ...updateData } = body;
    
    const updatedPrompt = await db.updateSystemPrompt(params.id, updateData);
    
    return NextResponse.json({
      success: true,
      data: updatedPrompt,
      message: 'System prompt updated successfully'
    });
  } catch (error) {
    console.error('Error updating system prompt:', error);
    return NextResponse.json(
      { error: 'Failed to update system prompt' },
      { status: 500 }
    );
  }
}

// Delete a specific system prompt
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await db.deleteSystemPrompt(params.id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'System prompt not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'System prompt deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting system prompt:', error);
    return NextResponse.json(
      { error: 'Failed to delete system prompt' },
      { status: 500 }
    );
  }
}