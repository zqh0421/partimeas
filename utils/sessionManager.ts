import { sql } from '@/config/database';

export interface SessionData {
  id: string;
  created_at: string;
  response_count: number;
  test_case_scenario_category: string | null;
  test_case_prompt: string | null;
  random_algorithm_used: string;
}

export interface ResponseData {
  id: string;
  session_id: string;
  display_order: number;
  provider: string;
  model: string;
  system_prompt: string | null;
  response_content: string;
  created_at: string;
}

export interface SessionWithResponses extends SessionData {
  responses: ResponseData[];
}

/**
 * Get a session by ID with all its responses
 */
export async function getSessionById(sessionId: string): Promise<SessionWithResponses | null> {
  try {
    // Get session data
    const sessionQuery = `
      SELECT * FROM partimeas_sessions 
      WHERE id = $1
    `;
    const sessionResult = await sql.query(sessionQuery, [sessionId]);
    
    if (sessionResult.length === 0) {
      return null;
    }
    
    const session = sessionResult[0] as SessionData;
    
    // Get responses for this session
    const responsesQuery = `
      SELECT * FROM partimeas_responses 
      WHERE session_id = $1 
      ORDER BY display_order
    `;
    const responsesResult = await sql.query(responsesQuery, [sessionId]);
    
    const responses = responsesResult as ResponseData[];
    
    return {
      ...session,
      responses
    };
  } catch (error) {
    console.error('Error retrieving session:', error);
    throw error;
  }
}

/**
 * Get recent sessions with optional filtering
 */
export async function getRecentSessions(
  limit: number = 10,
  offset: number = 0,
  category?: string,
  algorithm?: string
): Promise<SessionData[]> {
  try {
    let query = `
      SELECT * FROM partimeas_sessions 
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;
    
    if (category) {
      query += ` AND test_case_scenario_category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    if (algorithm) {
      query += ` AND random_algorithm_used = $${paramIndex}`;
      params.push(algorithm);
      paramIndex++;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);
    
    const result = await sql.query(query, params);
    return result as SessionData[];
  } catch (error) {
    console.error('Error retrieving recent sessions:', error);
    throw error;
  }
}

/**
 * Get session statistics
 */
export async function getSessionStats(): Promise<{
  totalSessions: number;
  totalResponses: number;
  averageResponsesPerSession: number;
  topCategories: Array<{ category: string; count: number }>;
  topAlgorithms: Array<{ algorithm: string; count: number }>;
}> {
  try {
    // Get basic counts
    const sessionCountQuery = 'SELECT COUNT(*) as count FROM partimeas_sessions';
    const responseCountQuery = 'SELECT COUNT(*) as count FROM partimeas_responses';
    const avgResponsesQuery = `
      SELECT AVG(response_count) as avg_count 
      FROM partimeas_sessions
    `;
    
    // Get top categories
    const topCategoriesQuery = `
      SELECT test_case_scenario_category as category, COUNT(*) as count
      FROM partimeas_sessions 
      WHERE test_case_scenario_category IS NOT NULL
      GROUP BY test_case_scenario_category 
      ORDER BY count DESC 
      LIMIT 5
    `;
    
    // Get top algorithms
    const topAlgorithmsQuery = `
      SELECT random_algorithm_used as algorithm, COUNT(*) as count
      FROM partimeas_sessions 
      GROUP BY random_algorithm_used 
      ORDER BY count DESC 
      LIMIT 5
    `;
    
    const [
      sessionCountResult,
      responseCountResult,
      avgResponsesResult,
      topCategoriesResult,
      topAlgorithmsResult
    ] = await Promise.all([
      sql.query(sessionCountQuery),
      sql.query(responseCountQuery),
      sql.query(avgResponsesQuery),
      sql.query(topCategoriesQuery),
      sql.query(topAlgorithmsQuery)
    ]);
    
    return {
      totalSessions: parseInt(sessionCountResult[0]?.count || '0'),
      totalResponses: parseInt(responseCountResult[0]?.count || '0'),
      averageResponsesPerSession: parseFloat(avgResponsesResult[0]?.avg_count || '0'),
      topCategories: topCategoriesResult.map((row: any) => ({
        category: row.category,
        count: parseInt(row.count)
      })),
      topAlgorithms: topAlgorithmsResult.map((row: any) => ({
        algorithm: row.algorithm,
        count: parseInt(row.count)
      }))
    };
  } catch (error) {
    console.error('Error retrieving session statistics:', error);
    throw error;
  }
}

/**
 * Delete a session and all its responses
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    const deleteQuery = `
      DELETE FROM partimeas_sessions 
      WHERE id = $1
    `;
    
    const result = await sql.query(deleteQuery, [sessionId]);
    return result.length > 0;
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
}

/**
 * Search sessions by prompt content
 */
export async function searchSessionsByPrompt(
  searchTerm: string,
  limit: number = 10
): Promise<SessionData[]> {
  try {
    const query = `
      SELECT * FROM partimeas_sessions 
      WHERE test_case_prompt ILIKE $1
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    
    const result = await sql.query(query, [`%${searchTerm}%`, limit]);
    return result as SessionData[];
  } catch (error) {
    console.error('Error searching sessions:', error);
    throw error;
  }
} 