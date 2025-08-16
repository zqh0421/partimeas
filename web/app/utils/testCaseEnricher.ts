import { TestCase } from '@/app/types';
import { UseCase } from './useCaseService';

export interface EnrichedTestCase extends Omit<TestCase, 'useCase'> {
  useCase?: UseCase;
}

/**
 * Test Case Enricher
 * 
 * This utility enriches test cases with use case information from the database.
 * When test case spreadsheets only contain use_case_index, this utility
 * fetches the corresponding use case details via the API endpoint and enriches the test case.
 */

/**
 * Fetch use case data from the API endpoint
 */
async function fetchUseCaseFromAPI(useCaseIndex: number): Promise<UseCase | null> {
  try {
    const response = await fetch(`/api/use-cases/${useCaseIndex}`);
    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Use case with index ${useCaseIndex} not found`);
        return null;
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    if (result.success && result.data) {
      return result.data;
    } else {
      console.error(`API returned error for use case ${useCaseIndex}:`, result.error);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching use case ${useCaseIndex} from API:`, error);
    return null;
  }
}

/**
 * Enrich a single test case with use case information
 */
export async function enrichTestCase(testCase: TestCase): Promise<EnrichedTestCase> {
  if (!testCase.use_case_index) {
    return { ...testCase, useCase: undefined };
  }
  
  try {
    const useCaseIndex = parseInt(testCase.use_case_index.toString(), 10);
    if (isNaN(useCaseIndex)) {
      console.warn(`Invalid use_case_index: ${testCase.use_case_index}`);
      return { ...testCase, useCase: undefined };
    }
    
    const useCase = await fetchUseCaseFromAPI(useCaseIndex);
    console.log(`[testCaseEnricher] Use case: ${useCase}`);
    if (useCase) {
      return {
        ...testCase,
        useCase: useCase,
        // Complement spreadsheet fields with API data if missing
        use_case_title: testCase.use_case_title ?? useCase.use_case_title,
        use_case_description: testCase.use_case_description ?? useCase.use_case_description
      };
    }
    
    return { ...testCase, useCase: undefined };
  } catch (error) {
    console.error('Error enriching test case:', error);
    return { ...testCase, useCase: undefined };
  }
}

/**
 * Enrich multiple test cases with use case information
 * This is more efficient than enriching one by one as it batches API calls
 */
export async function enrichTestCases(testCases: TestCase[]): Promise<EnrichedTestCase[]> {
  if (!testCases.length) {
    console.log('[testCaseEnricher] No test cases to enrich');
    return [];
  }
  
  console.log(`[testCaseEnricher] Starting enrichment of ${testCases.length} test cases`);
  
  // Extract unique use case indices
  const useCaseIndices = new Set<number>();
  testCases.forEach(testCase => {
    if (testCase.use_case_index) {
      const index = parseInt(testCase.use_case_index.toString(), 10);
      if (!isNaN(index)) {
        useCaseIndices.add(index);
      }
    }
  });
  
  console.log(`[testCaseEnricher] Found ${useCaseIndices.size} unique use case indices:`, Array.from(useCaseIndices));
  
  if (useCaseIndices.size === 0) {
    console.log('[testCaseEnricher] No use case indices found, returning unenriched test cases');
    return testCases.map(testCase => ({ ...testCase, useCase: undefined }));
  }
  
  try {
    console.log('[testCaseEnricher] Fetching use cases from API...');
    
    // Fetch all needed use cases in parallel for better performance
    const useCasePromises = Array.from(useCaseIndices).map(index => 
      fetchUseCaseFromAPI(index)
    );
    
    const useCaseResults = await Promise.allSettled(useCasePromises);
    
    // Process results and create a map for fast lookup
    const useCaseMap = new Map<number, UseCase>();
    let successCount = 0;
    let errorCount = 0;
    
    useCaseResults.forEach((result, index) => {
      const useCaseIndex = Array.from(useCaseIndices)[index];
      if (result.status === 'fulfilled' && result.value) {
        useCaseMap.set(useCaseIndex, result.value);
        successCount++;
      } else {
        console.warn(`Failed to fetch use case ${useCaseIndex}:`, result.status === 'rejected' ? result.reason : 'No data');
        errorCount++;
      }
    });
    
    console.log(`[testCaseEnricher] Retrieved ${successCount} use cases from API, ${errorCount} failed`);
    console.log(`[testCaseEnricher] Use cases retrieved:`, Array.from(useCaseMap.values()).map(uc => ({ index: uc.use_case_index, title: uc.use_case_title })));
    
    // Enrich each test case
    const enrichedTestCases = testCases.map(testCase => {
      if (!testCase.use_case_index) {
        return { ...testCase, useCase: undefined };
      }
      
      const index = parseInt(testCase.use_case_index.toString(), 10);
      if (isNaN(index) || !useCaseMap.has(index)) {
        console.log(`[testCaseEnricher] Test case ${testCase.id} (index: ${testCase.use_case_index}) not enriched - index not found in API`);
        return { ...testCase, useCase: undefined };
      }
      
      const apiUseCase = useCaseMap.get(index)!;
      const enrichedTestCase = {
        ...testCase,
        useCase: apiUseCase,
        // Complement spreadsheet fields with API data if missing
        use_case_title: testCase.use_case_title ?? apiUseCase.use_case_title,
        use_case_description: testCase.use_case_description ?? apiUseCase.use_case_description
      };
      
      console.log(`[testCaseEnricher] Test case ${testCase.id} enriched with use case: ${enrichedTestCase.useCase?.use_case_title}`);
      return enrichedTestCase;
    });
    
    const enrichedCount = enrichedTestCases.filter(tc => tc.useCase).length;
    console.log(`[testCaseEnricher] Enrichment completed: ${enrichedCount}/${enrichedTestCases.length} test cases enriched`);
    
    return enrichedTestCases;
  } catch (error) {
    console.error('[testCaseEnricher] Error enriching test cases:', error);
    console.error('[testCaseEnricher] Error details:', error);
    return testCases.map(testCase => ({ ...testCase, useCase: undefined }));
  }
}

/**
 * Get use case information for a specific index via API
 * Useful for standalone lookups
 */
export async function getUseCaseByIndex(useCaseIndex: number): Promise<UseCase | null> {
  return fetchUseCaseFromAPI(useCaseIndex);
}

/**
 * Get multiple use cases by indices via API
 * Useful for bulk lookups
 */
export async function getUseCasesByIndices(indices: number[]): Promise<UseCase[]> {
  if (indices.length === 0) {
    return [];
  }
  
  try {
    const useCasePromises = indices.map(index => fetchUseCaseFromAPI(index));
    const results = await Promise.allSettled(useCasePromises);
    
    const useCases: UseCase[] = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        useCases.push(result.value);
      } else {
        console.warn(`Failed to fetch use case ${indices[index]}:`, result.status === 'rejected' ? result.reason : 'No data');
      }
    });
    
    return useCases;
  } catch (error) {
    console.error('Error fetching multiple use cases:', error);
    return [];
  }
}

/**
 * Validate that all use case indices in test cases exist in the database
 */
export async function validateUseCaseIndices(testCases: TestCase[]): Promise<{
  valid: boolean;
  missingIndices: number[];
  errors: string[];
}> {
  const missingIndices: number[] = [];
  const errors: string[] = [];
  
  // Extract unique use case indices
  const useCaseIndices = new Set<number>();
  testCases.forEach((testCase, index) => {
    if (testCase.use_case_index) {
      const parsedIndex = parseInt(testCase.use_case_index.toString(), 10);
      if (isNaN(parsedIndex)) {
        errors.push(`Test case ${index}: Invalid use_case_index format: ${testCase.use_case_index}`);
      } else {
        useCaseIndices.add(parsedIndex);
      }
    }
  });
  
  if (useCaseIndices.size === 0) {
    return { valid: true, missingIndices: [], errors };
  }
  
  try {
    const existingUseCases = await getUseCasesByIndices(Array.from(useCaseIndices));
    const existingIndices = new Set(existingUseCases.map(uc => uc.use_case_index));
    
    for (const index of useCaseIndices) {
      if (!existingIndices.has(index)) {
        missingIndices.push(index);
      }
    }
    
    if (missingIndices.length > 0) {
      errors.push(`Missing use cases for indices: ${missingIndices.join(', ')}`);
    }
    
    return {
      valid: missingIndices.length === 0 && errors.length === 0,
      missingIndices,
      errors
    };
  } catch (error) {
    errors.push(`Database error during validation: ${error}`);
    return { valid: false, missingIndices, errors };
  }
} 

/**
 * Manual enrichment utility for when you need to enrich test cases outside of the main flow
 * This is useful for components that need to fetch use case data on-demand
 */
export async function enrichTestCaseManually(testCase: TestCase): Promise<EnrichedTestCase> {
  if (!testCase.use_case_index) {
    return { ...testCase, useCase: undefined };
  }
  
  try {
    const useCaseIndex = parseInt(testCase.use_case_index.toString(), 10);
    if (isNaN(useCaseIndex)) {
      console.warn(`Invalid use_case_index: ${testCase.use_case_index}`);
      return { ...testCase, useCase: undefined };
    }
    
    console.log(`[testCaseEnricher] Manually enriching test case ${testCase.id} with use case index ${useCaseIndex}`);
    const useCase = await fetchUseCaseFromAPI(useCaseIndex);
    
    if (useCase) {
      console.log(`[testCaseEnricher] Successfully enriched test case ${testCase.id} with use case: ${useCase.use_case_title}`);
      return {
        ...testCase,
        useCase: useCase
      };
    } else {
      console.warn(`[testCaseEnricher] No use case found for index ${useCaseIndex}, test case ${testCase.id} not enriched`);
      return { ...testCase, useCase: undefined };
    }
  } catch (error) {
    console.error(`[testCaseEnricher] Error manually enriching test case ${testCase.id}:`, error);
    return { ...testCase, useCase: undefined };
  }
}

/**
 * Batch enrich test cases with progress callback
 * Useful for UI components that want to show enrichment progress
 */
export async function enrichTestCasesWithProgress(
  testCases: TestCase[], 
  onProgress?: (current: number, total: number, successCount: number, errorCount: number) => void
): Promise<EnrichedTestCase[]> {
  if (!testCases.length) {
    return [];
  }
  
  console.log(`[testCaseEnricher] Starting progressive enrichment of ${testCases.length} test cases`);
  
  const enrichedTestCases: EnrichedTestCase[] = [];
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const enriched = await enrichTestCase(testCase);
    
    if (enriched.useCase) {
      successCount++;
    } else {
      errorCount++;
    }
    
    enrichedTestCases.push(enriched);
    
    // Report progress if callback provided
    if (onProgress) {
      onProgress(i + 1, testCases.length, successCount, errorCount);
    }
  }
  
  console.log(`[testCaseEnricher] Progressive enrichment completed: ${successCount}/${testCases.length} test cases enriched`);
  return enrichedTestCases;
} 