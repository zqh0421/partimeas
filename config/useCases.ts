import { UseCaseConfig } from '@/types';

/**
 * Use Case Configuration
 * 
 * This file contains the configuration for all use cases in the system.
 * Each use case defines a spreadsheet ID, sheet name, and other metadata
 * needed to load test cases and criteria data.
 */

export const USE_CASE_CONFIGS: UseCaseConfig[] = [
  {
    id: 'test_case_1',
    name: 'Provide Reflective Questions',
    description: 'Generate reflective questions based on educational scenarios and theories',
    spreadsheetId: '1GAKpJzbIWEIi2RxwrKcJVe0fLj2glpuDu1rDC_UkSAs',
    sheetName: 'synthetic test cases',
    category: 'Education',
    tags: ['reflection', 'questions', 'education'],
    dataType: 'test-cases'
  }
];

/**
 * Default use case configuration
 * Used when no specific use case is selected
 */
export const DEFAULT_USE_CASE: UseCaseConfig = USE_CASE_CONFIGS[0];

/**
 * Get use case by ID
 */
export const getUseCaseById = (id: string): UseCaseConfig | undefined => {
  return USE_CASE_CONFIGS.find(useCase => useCase.id === id);
};

/**
 * Get all use cases by category
 */
export const getUseCasesByCategory = (category: string): UseCaseConfig[] => {
  return USE_CASE_CONFIGS.filter(useCase => useCase.category === category);
};

/**
 * Validate use case configuration
 */
export const validateUseCaseConfig = (config: UseCaseConfig): boolean => {
  return !!(
    config.id &&
    config.name &&
    config.spreadsheetId &&
    config.sheetName &&
    config.spreadsheetId !== '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms' // Check if it's not the placeholder
  );
};

/**
 * Check if all use case configurations are valid
 */
export const areUseCaseConfigsValid = (): boolean => {
  return USE_CASE_CONFIGS.every(validateUseCaseConfig);
}; 