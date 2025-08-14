import { NextRequest, NextResponse } from 'next/server';
import { 
  getSessionById, 
  getRecentSessions, 
  getSessionStats,
  searchSessionsByPrompt 
} from '@/utils/sessionManager';

// GET endpoint to retrieve session data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    switch (action) {
      case 'byId':
        const sessionId = searchParams.get('id');
        if (!sessionId) {
          return NextResponse.json(
            { error: 'Session ID is required for byId action' },
            { status: 400 }
          );
        }
        
        const session = await getSessionById(sessionId);
        if (!session) {
          return NextResponse.json(
            { error: 'Session not found' },
            { status: 404 }
          );
        }
        
        return NextResponse.json({
          success: true,
          session
        });
        
      case 'recent':
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = parseInt(searchParams.get('offset') || '0');
        const category = searchParams.get('category') || undefined;
        const algorithm = searchParams.get('algorithm') || undefined;
        
        const sessions = await getRecentSessions(limit, offset, category, algorithm);
        
        return NextResponse.json({
          success: true,
          sessions,
          pagination: {
            limit,
            offset,
            total: sessions.length
          }
        });
        
      case 'stats':
        const stats = await getSessionStats();
        
        return NextResponse.json({
          success: true,
          stats
        });
        
      case 'search':
        const searchTerm = searchParams.get('q');
        if (!searchTerm) {
          return NextResponse.json(
            { error: 'Search query is required for search action' },
            { status: 400 }
          );
        }
        
        const searchLimit = parseInt(searchParams.get('limit') || '10');
        const searchResults = await searchSessionsByPrompt(searchTerm, searchLimit);
        
        return NextResponse.json({
          success: true,
          results: searchResults,
          query: searchTerm,
          total: searchResults.length
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: byId, recent, stats, or search' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Sessions API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve session data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a session
export async function DELETE(request: NextRequest) {
  try {
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    const { deleteSession } = await import('@/utils/sessionManager');
    const deleted = await deleteSession(sessionId);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Session not found or already deleted' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully'
    });
    
  } catch (error) {
    console.error('Session deletion error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 