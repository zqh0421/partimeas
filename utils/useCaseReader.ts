/**
 * Use Case Reader
 * 
 * Simple utility for reading use case data from Google Sheets
 */
import { TestCase, UseCaseConfig, ValidationResult } from '@/types';

// Field mapping for test cases
const FIELD_MAP = {
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

// Find field value from headers and row
function findFieldValue(headers: string[], row: string[], fieldNames: string[]): string {
  const headerLower = headers.map(h => h.toLowerCase());
  for (const fieldName of fieldNames) {
    const index = headerLower.indexOf(fieldName.toLowerCase());
    if (index >= 0) {
      return row[index] || '';
    }
  }
  return '';
}

// Build Google Sheets API URL
function buildSheetsUrl(spreadsheetId: string, sheetName: string): string {
  const encodedSheetName = encodeURIComponent(sheetName);
  return `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedSheetName}`;
}

// Fetch data from Google Sheets
async function fetchSheetData(
  spreadsheetId: string, 
  sheetName: string, 
  accessToken: string
): Promise<{ headers: string[]; rows: string[][] }> {
  const url = buildSheetsUrl(spreadsheetId, sheetName);
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };
  
  console.log(`[UseCaseReader] Fetching: ${url}`);

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Sheets API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.values || data.values.length === 0) {
    throw new Error('No data found in spreadsheet');
  }

  return {
    headers: data.values[0],
    rows: data.values.slice(1)
  };
}

// Convert sheet data to test cases
function convertToTestCases(headers: string[], rows: string[][]): TestCase[] {
  return rows.map((row, index) => {
    const testCase: TestCase = {
      id: `tc-${index + 1}`,
      input: findFieldValue(headers, row, FIELD_MAP.input),
      context: findFieldValue(headers, row, FIELD_MAP.context)
    };

    // Add optional fields if they exist
    const modelName = findFieldValue(headers, row, FIELD_MAP.modelName);
    if (modelName) testCase.modelName = modelName;

    const timestamp = findFieldValue(headers, row, FIELD_MAP.timestamp);
    if (timestamp) testCase.timestamp = timestamp;

    const scenarioCategory = findFieldValue(headers, row, FIELD_MAP.scenarioCategory);
    if (scenarioCategory) testCase.scenarioCategory = scenarioCategory;

    const useCase = findFieldValue(headers, row, FIELD_MAP.useCase);
    if (useCase) testCase.useCase = useCase;

    const useCaseIndex = findFieldValue(headers, row, FIELD_MAP.useCaseIndex);
    if (useCaseIndex) testCase.use_case_index = useCaseIndex;

    const useCaseTitle = findFieldValue(headers, row, FIELD_MAP.useCaseTitle);
    if (useCaseTitle) testCase.use_case_title = useCaseTitle;

    return testCase;
  });
}

// Validate test cases
export function validateTestCases(testCases: TestCase[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (testCases.length === 0) {
    errors.push('No test cases found');
    return { isValid: false, errors, warnings };
  }

  testCases.forEach((testCase, index) => {
    const caseNumber = index + 1;
    
    if (!testCase.input?.trim()) {
      errors.push(`Test case ${caseNumber}: Empty input field`);
    }
    if (!testCase.context?.trim()) {
      errors.push(`Test case ${caseNumber}: Empty context field`);
    }
    
    const inputLength = testCase.input?.length || 0;
    const contextLength = testCase.context?.length || 0;
    
    if (inputLength > 1000) {
      warnings.push(`Test case ${caseNumber}: Input is very long (${inputLength} characters)`);
    }
    if (contextLength > 1000) {
      warnings.push(`Test case ${caseNumber}: Context is very long (${contextLength} characters)`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Main function to load test cases
export async function loadTestCases(
  useCaseConfigs: UseCaseConfig[], 
  useCaseId: string, 
  accessToken: string
): Promise<TestCase[]> {
  const useCase = useCaseConfigs.find(config => config.id === useCaseId);
  if (!useCase) {
    throw new Error(`Use case not found: ${useCaseId}`);
  }

  console.log(`[UseCaseReader] Loading test cases for: ${useCaseId}`);
  console.log(`[UseCaseReader] Spreadsheet: ${useCase.spreadsheetId}, Sheet: ${useCase.sheetName}`);

  try {
    const { headers, rows } = await fetchSheetData(
      useCase.spreadsheetId,
      useCase.sheetName,
      accessToken
    );

    const testCases = convertToTestCases(headers, rows);
    console.log(`[UseCaseReader] Loaded ${testCases.length} test cases`);
    
    return testCases;
  } catch (error) {
    console.error(`[UseCaseReader] Error loading test cases:`, error);
    throw new Error(`Failed to load test cases: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get use case configuration
export function getUseCaseConfig(useCaseConfigs: UseCaseConfig[], useCaseId: string): UseCaseConfig | undefined {
  return useCaseConfigs.find(config => config.id === useCaseId);
}

// Get all use cases
export function getAllUseCases(useCaseConfigs: UseCaseConfig[]): UseCaseConfig[] {
  return useCaseConfigs;
}