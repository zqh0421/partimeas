import { mockUseCaseConfig, mockCriteriaConfig } from '@/data/mockData';
import { 
  TestCase, 
  CriteriaData, 
  UseCaseConfig,
  CriteriaConfig,
  ValidationResult
} from '@/types';
import { googleSheetsLogger, cacheLogger } from './logger';

export interface UseCaseSheet extends UseCaseConfig {
  apiKey: string;
}

// Convert config to internal format
export const USE_CASE_SHEETS: UseCaseSheet[] = mockUseCaseConfig.map(config => ({
  ...config,
  apiKey: process.env.GOOGLE_SHEETS_API_KEY || ''
}));

// Export types from central location
export type { TestCase as TestCaseData, CriteriaData, ValidationResult } from '@/types';

// Field mapping configurations
const TEST_CASE_FIELD_MAP = {
  input: ['input'],
  context: ['context', 'expected_output'],
  scenarioCategory: ['scenario_category'],
  useCase: ['use_case'],
  useCaseDescription: ['use_case_description'],
  useCaseIndex: ['use_case_index'],
  useCaseTitle: ['use_case_title'],
  modelName: ['model_name'],
  timestamp: ['timestamp']
};

const CRITERIA_FIELD_MAP = {
  category: ['category'],
  criteria: ['criteria'],
  description: ['description'],
  weight: ['weight'],
  score1: ['score1'],
  score2: ['score2'],
  score3: ['score3'],
  score4: ['score4'],
  score5: ['score5']
};

// Constants
const DEFAULT_CRITERIA_CONFIG: CriteriaConfig = {
  id: 'default-criteria',
  name: 'Default Criteria',
  description: 'Default criteria configuration',
  spreadsheetId: '1xvWtZMe9kWyuKZEsZCUNZkxUxK8nCz20eswaNa_WJws',
  sheetName: 'Sheet1',
  category: 'default'
};

const VALIDATION_LIMITS = {
  maxTextLength: 1000,
  maxRetries: 3,
  requestTimeout: 30000
} as const;

// Helper functions for use case management
export const getUseCases = (): UseCaseSheet[] => USE_CASE_SHEETS;

export const getUseCase = (useCaseId: string): UseCaseSheet | undefined =>
  USE_CASE_SHEETS.find(useCase => useCase.id === useCaseId);

export const getCriteriaConfig = (criteriaId: string): CriteriaConfig => {
  const criteria = mockCriteriaConfig.find(c => c.id === criteriaId);
  return criteria || DEFAULT_CRITERIA_CONFIG;
};

// Optimized validation function
export const validateTestCases = (testCases: TestCase[]): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (testCases.length === 0) {
    errors.push('No test cases found');
    return { isValid: false, errors, warnings };
  }

  testCases.forEach((testCase, index) => {
    const caseNumber = index + 1;
    
    // Required field validation
    if (!testCase.input?.trim()) {
      errors.push(`Test case ${caseNumber}: Empty input field`);
    }
    if (!testCase.context?.trim()) {
      errors.push(`Test case ${caseNumber}: Empty context field`);
    }
    
    // Length validation and warnings
    const inputLength = testCase.input?.length || 0;
    const contextLength = testCase.context?.length || 0;
    
    if (inputLength > VALIDATION_LIMITS.maxTextLength) {
      warnings.push(`Test case ${caseNumber}: Input is very long (${inputLength} characters)`);
    }
    if (contextLength > VALIDATION_LIMITS.maxTextLength) {
      warnings.push(`Test case ${caseNumber}: Context is very long (${contextLength} characters)`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Utility functions for field mapping
const findFieldValue = (headers: string[], row: string[], fieldMap: string[]): string => {
  const headerLower = headers.map(h => h.toLowerCase());
  for (const field of fieldMap) {
    const index = headerLower.indexOf(field.toLowerCase());
    if (index >= 0) {
      return row[index] || '';
    }
  }
  return '';
};

const createRequestHeaders = (apiKey: string) => ({
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
});

const buildSheetsUrl = (spreadsheetId: string, sheetName: string): string =>
  `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}`;

export class UseCaseSheetManager {
  private apiKey: string;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Get all available use cases
  getUseCases(): UseCaseSheet[] {
    return getUseCases();
  }

  // Get specific use case by ID
  getUseCase(useCaseId: string): UseCaseSheet | undefined {
    return getUseCase(useCaseId);
  }

  // Get criteria configuration by ID
  getCriteria(criteriaId: string): CriteriaConfig {
    return getCriteriaConfig(criteriaId);
  }

  // Load criteria automatically (called when dataType is 'both')
  async loadCriteriaAuto(): Promise<CriteriaData[]> {
    return this.loadCriteria('default-criteria');
  }

  // Check if cached data is still valid
  private isCacheValid(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.cacheTimeout;
  }

  // Generic method to fetch spreadsheet data with caching
  private async fetchSpreadsheetData(
    spreadsheetId: string, 
    sheetName: string,
    cacheKey?: string
  ): Promise<{ headers: string[]; rows: string[][] }> {
    // Check cache first
    if (cacheKey && this.isCacheValid(cacheKey)) {
      cacheLogger.hit(cacheKey);
      return this.cache.get(cacheKey)!.data;
    }

    if (cacheKey) {
      cacheLogger.miss(cacheKey);
    }

    googleSheetsLogger.request('fetch', spreadsheetId, sheetName);

    const url = buildSheetsUrl(spreadsheetId, sheetName);
    const headers = createRequestHeaders(this.apiKey);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), VALIDATION_LIMITS.requestTimeout);

    try {
      const response = await fetch(url, { 
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`Failed to fetch spreadsheet: ${response.status} ${response.statusText} - ${errorText}`);
        googleSheetsLogger.error('fetch', spreadsheetId, error);
        throw error;
      }

      const data = await response.json();
      
      if (!data.values || data.values.length === 0) {
        const error = new Error('No data found in spreadsheet');
        googleSheetsLogger.error('fetch', spreadsheetId, error);
        throw error;
      }

      const result = {
        headers: data.values[0],
        rows: data.values.slice(1)
      };

      googleSheetsLogger.success('fetch', spreadsheetId, result.rows.length);

      // Cache the result
      if (cacheKey) {
        this.cache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });
      }

      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout: Google Sheets API call took too long');
        googleSheetsLogger.error('fetch', spreadsheetId, timeoutError);
        throw timeoutError;
      }
      if (error instanceof Error) {
        googleSheetsLogger.error('fetch', spreadsheetId, error);
      }
      throw error;
    }
  }

  // Load test cases from a specific use case spreadsheet
  async loadTestCases(useCaseId: string): Promise<TestCase[]> {
    const useCase = this.getUseCase(useCaseId);
    if (!useCase) {
      throw new Error(`Use case not found: ${useCaseId}`);
    }

    try {
      const cacheKey = `testcases_${useCaseId}`;
      const { headers, rows } = await this.fetchSpreadsheetData(
        useCase.spreadsheetId,
        useCase.sheetName,
        cacheKey
      );

      // Convert to test cases format
      const testCases = this.convertToTestCases(headers, rows);
      return testCases;
    } catch (error) {
      throw new Error(`Failed to load test cases: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Load criteria from a specific spreadsheet
  async loadCriteria(criteriaId: string): Promise<CriteriaData[]> {
    const criteria = this.getCriteria(criteriaId);

    try {
      const cacheKey = `criteria_${criteriaId}`;
      const { headers, rows } = await this.fetchSpreadsheetData(
        criteria.spreadsheetId,
        criteria.sheetName,
        cacheKey
      );

      // Convert to criteria format
      return this.convertToCriteria(headers, rows);
    } catch (error) {
      throw new Error(`Failed to load criteria: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Convert spreadsheet data to test cases format
  private convertToTestCases(headers: string[], rows: string[][]): TestCase[] {
    return rows.map((row, index) => {
      const testCase: TestCase = {
        id: `tc-${index + 1}`,
        input: findFieldValue(headers, row, TEST_CASE_FIELD_MAP.input),
        context: findFieldValue(headers, row, TEST_CASE_FIELD_MAP.context)
      };

      // Add optional fields if they exist
      const modelName = findFieldValue(headers, row, TEST_CASE_FIELD_MAP.modelName);
      if (modelName) testCase.modelName = modelName;

      const timestamp = findFieldValue(headers, row, TEST_CASE_FIELD_MAP.timestamp);
      if (timestamp) testCase.timestamp = timestamp;

      // Add hierarchical data
      const scenarioCategory = findFieldValue(headers, row, TEST_CASE_FIELD_MAP.scenarioCategory);
      if (scenarioCategory) testCase.scenarioCategory = scenarioCategory;

      const useCase = findFieldValue(headers, row, TEST_CASE_FIELD_MAP.useCase);
      if (useCase) testCase.useCase = useCase;

      const useCaseIndex = findFieldValue(headers, row, TEST_CASE_FIELD_MAP.useCaseIndex);
      if (useCaseIndex) testCase.use_case_index = useCaseIndex;

      const useCaseTitle = findFieldValue(headers, row, TEST_CASE_FIELD_MAP.useCaseTitle);
      if (useCaseTitle) testCase.use_case_title = useCaseTitle;

      return testCase;
    });
  }

  // Convert spreadsheet data to criteria format
  private convertToCriteria(headers: string[], rows: string[][]): CriteriaData[] {
    return rows.map((row, index) => ({
      id: `criteria-${index + 1}`,
      category: findFieldValue(headers, row, CRITERIA_FIELD_MAP.category),
      criteria: findFieldValue(headers, row, CRITERIA_FIELD_MAP.criteria),
      description: findFieldValue(headers, row, CRITERIA_FIELD_MAP.description),
      weight: parseFloat(findFieldValue(headers, row, CRITERIA_FIELD_MAP.weight) || '1'),
      score1: findFieldValue(headers, row, CRITERIA_FIELD_MAP.score1),
      score2: findFieldValue(headers, row, CRITERIA_FIELD_MAP.score2),
      score3: findFieldValue(headers, row, CRITERIA_FIELD_MAP.score3),
      score4: findFieldValue(headers, row, CRITERIA_FIELD_MAP.score4),
      score5: findFieldValue(headers, row, CRITERIA_FIELD_MAP.score5)
    }));
  }

  // Validate test cases data
  validateTestCases(testCases: TestCase[]): ValidationResult {
    return validateTestCases(testCases);
  }

  // Clear cache (useful for development or when data needs to be refreshed)
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache status for debugging
  getCacheStatus(): { keys: string[]; count: number } {
    return {
      keys: Array.from(this.cache.keys()),
      count: this.cache.size
    };
  }
} 