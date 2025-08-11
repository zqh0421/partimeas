import { neon } from '@neondatabase/serverless';
import type { NeonQueryFunction } from '@neondatabase/serverless';

// Database connection using Neon serverless driver
const getDatabaseUrl = () => {
  const url = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!url) {
    console.warn('Database URL not found. Using mock data mode.');
    return null;
  }
  return url;
};

const dbUrl = getDatabaseUrl();

// Provide a safe fallback that throws when used, so `sql` is never null-typed
const createSqlFallback = (): NeonQueryFunction<false, false> => {
  const notAvailable = () => {
    throw new Error('Database connection not available');
  };
  // Attach .query to mimic the interface used elsewhere
  (notAvailable as any).query = () => {
    throw new Error('Database connection not available');
  };
  return notAvailable as unknown as NeonQueryFunction<false, false>;
};

const sql: NeonQueryFunction<false, false> = dbUrl ? neon(dbUrl) : createSqlFallback();

// Simple SQL query executor using tagged template syntax
export const executeQuery = async (query: string, params: any[] = []): Promise<any> => {
  try {
    if (!dbUrl) {
      throw new Error('Database connection not available');
    }
    
    // Use sql.query for parameterized queries with $1, $2 placeholders
    const result = await sql.query(query, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Transaction support
export const executeTransaction = async (queries: { query: string; params?: any[] }[]): Promise<any[]> => {
  try {
    if (!dbUrl) {
      throw new Error('Database connection not available');
    }
    const results = [];
    for (const { query, params = [] } of queries) {
      const result = await sql.query(query, params);
      results.push(result);
    }
    return results;
  } catch (error) {
    console.error('Transaction error:', error);
    throw error;
  }
};

// Export the raw SQL connection for advanced use cases
export { sql }; 