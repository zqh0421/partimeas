import { neon } from '@neondatabase/serverless';

// Database connection using Neon serverless driver
const sql = neon(process.env.POSTGRES_URL_NON_POOLING!);

// Simple SQL query executor
export const executeQuery = async (query: string, params: any[] = []): Promise<any> => {
  try {
    const result = await sql(query, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Transaction support
export const executeTransaction = async (queries: { query: string; params?: any[] }[]): Promise<any[]> => {
  try {
    const results = [];
    for (const { query, params = [] } of queries) {
      const result = await sql(query, params);
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