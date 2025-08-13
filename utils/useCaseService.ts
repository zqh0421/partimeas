import { executeQuery, executeTransaction } from '@/config/database';

export interface UseCase {
  id: number;
  use_case_index: number;
  use_case_title: string;
  use_case_description: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUseCaseData {
  use_case_index: number;
  use_case_title: string;
  use_case_description: string;
}

export interface UpdateUseCaseData {
  use_case_title?: string;
  use_case_description?: string;
}

/**
 * Use Case Service
 * 
 * This service provides functions to manage use cases in the database.
 * It allows test case spreadsheets to only reference use_case_index
 * while storing the full use case information in the database.
 */

/**
 * Create a new use case
 */
export async function createUseCase(data: CreateUseCaseData): Promise<UseCase> {
  const query = `
    INSERT INTO partimeas_use_cases (use_case_index, use_case_title, use_case_description)
    VALUES ($1, $2, $3)
    RETURNING *
  `;
  
  const result = await executeQuery(query, [
    data.use_case_index,
    data.use_case_title,
    data.use_case_description
  ]);
  
  if (!result.rows || result.rows.length === 0) {
    throw new Error('Failed to create use case');
  }
  
  return result.rows[0];
}

/**
 * Get a use case by its index
 */
export async function getUseCaseByIndex(useCaseIndex: number): Promise<UseCase | null> {
    const query = `
    SELECT * FROM partimeas_use_cases
    WHERE use_case_index = $1
  `;
  
  const result = await executeQuery(query, [useCaseIndex]);
  
  if (!result.rows || result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0];
}

/**
 * Get a use case by its ID
 */
export async function getUseCaseById(id: number): Promise<UseCase | null> {
    const query = `
    SELECT * FROM partimeas_use_cases
    WHERE id = $1
  `;
  
  const result = await executeQuery(query, [id]);
  
  if (!result.rows || result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0];
}

/**
 * Get all use cases
 */
export async function getAllUseCases(): Promise<UseCase[]> {
  const query = `
    SELECT * FROM partimeas_use_cases 
    ORDER BY use_case_index
  `;
  
  const result = await executeQuery(query);
  
  if (!result.rows) {
    return [];
  }
  
  return result.rows;
}

/**
 * Update a use case by its index
 */
export async function updateUseCaseByIndex(
  useCaseIndex: number, 
  data: UpdateUseCaseData
): Promise<UseCase | null> {
  const setFields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  if (data.use_case_title !== undefined) {
    setFields.push(`use_case_title = $${paramIndex++}`);
    values.push(data.use_case_title);
  }
  
  if (data.use_case_description !== undefined) {
    setFields.push(`use_case_description = $${paramIndex++}`);
    values.push(data.use_case_description);
  }
  
  if (setFields.length === 0) {
    return getUseCaseByIndex(useCaseIndex);
  }
  
  setFields.push(`updated_at = NOW()`);
  values.push(useCaseIndex);
  
  const query = `
    UPDATE partimeas_use_cases 
    SET ${setFields.join(', ')}
    WHERE use_case_index = $${paramIndex}
    RETURNING *
  `;
  
  const result = await executeQuery(query, values);
  
  if (!result.rows || result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0];
}

/**
 * Delete a use case by its index
 */
export async function deleteUseCaseByIndex(useCaseIndex: number): Promise<boolean> {
  const query = `
    DELETE FROM partimeas_use_cases 
    WHERE use_case_index = $1
  `;
  
  const result = await executeQuery(query, [useCaseIndex]);
  
  return result.rowCount > 0;
}

/**
 * Bulk create or update use cases
 * Useful for importing data from spreadsheets
 */
export async function bulkUpsertUseCases(useCases: CreateUseCaseData[]): Promise<UseCase[]> {
  if (useCases.length === 0) {
    return [];
  }
  
  const queries = useCases.map((useCase, index) => ({
    query: `
      INSERT INTO partimeas_use_cases (use_case_index, use_case_title, use_case_description)
      VALUES ($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})
      ON CONFLICT (use_case_index) 
      DO UPDATE SET 
        use_case_title = EXCLUDED.use_case_title,
        use_case_description = EXCLUDED.use_case_description,
        updated_at = NOW()
      RETURNING *
    `,
    params: [useCase.use_case_index, useCase.use_case_title, useCase.use_case_description]
  }));
  
  const results = await executeTransaction(queries);
  const createdUseCases: UseCase[] = [];
  
  for (const result of results) {
    if (result.rows && result.rows.length > 0) {
      createdUseCases.push(result.rows[0]);
    }
  }
  
  return createdUseCases;
}

/**
 * Get use cases by multiple indices
 * Useful for bulk lookups when processing test case spreadsheets
 */
export async function getUseCasesByIndices(indices: number[]): Promise<UseCase[]> {
  if (indices.length === 0) {
    return [];
  }
  
  const placeholders = indices.map((_, index) => `$${index + 1}`).join(',');
  const query = `
    SELECT * FROM partimeas_use_cases 
    WHERE use_case_index IN (${placeholders})
    ORDER BY use_case_index
  `;
  
  const result = await executeQuery(query, indices);
  
  if (!result.rows) {
    return [];
  }
  
  return result.rows;
}

/**
 * Search use cases by title or description
 */
export async function searchUseCases(searchTerm: string): Promise<UseCase[]> {
  const query = `
    SELECT * FROM partimeas_use_cases 
    WHERE 
      use_case_title ILIKE $1 OR 
      use_case_description ILIKE $1
    ORDER BY use_case_index
  `;
  
  const result = await executeQuery(query, [`%${searchTerm}%`]);
  
  if (!result.rows) {
    return [];
  }
  
  return result.rows;
} 