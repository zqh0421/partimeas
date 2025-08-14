/**
 * Use Case Reader
 * 
 * Simple utility for reading use case data from Google Sheets
 * Updated to work with the new use case database system
 */
import { TestCase, UseCaseConfig, ValidationResult } from '@/types';

// Field mapping for test cases - updated for new structure with more variations
const FIELD_MAP = {
  input: [
    'Prompt', 'prompt', 'Input', 'input', 
    'Question', 'question', 'Task', 'task',
    'Instruction', 'instruction', 'Request', 'request'
  ],
  context: [
    'Test Case Name', 'test case name', 'Context', 'context', 
    'Name', 'name', 'Scenario', 'scenario',
    'Description', 'description', 'Case Name', 'case name',
    'Test Case Description', 'test case description'
  ],
  // New explicit mappings for title and description in spreadsheet
  title: [
    'Category', 'category', 'Use Case Title', 'use case title',
    'Title', 'title'
  ],
  description: [
    'Use Case Description', 'use case description', 'Case Description', 'case description'
  ],
  useCaseIndex: [
    'Use Case #', 'use case #', 'use_case_index'
  ]
};

// Find field value from headers and row
function findFieldValue(headers: string[], row: string[], fieldNames: string[]): string {
  const headerLower = headers.map(h => h.toLowerCase().trim());
  
  // First try exact match
  for (const fieldName of fieldNames) {
    const index = headerLower.indexOf(fieldName.toLowerCase().trim());
    if (index >= 0) {
      const value = row[index] || '';
      return value;
    }
  }
  
  // If no exact match, try partial matching
  for (const fieldName of fieldNames) {
    const fieldNameLower = fieldName.toLowerCase().trim();
    const index = headerLower.findIndex(header => 
      header.includes(fieldNameLower) || fieldNameLower.includes(header)
    );
    
    if (index >= 0) {
      const value = row[index] || '';
      return value;
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
): Promise<{ headers: string[]; rows: string[][]; title: string }> {
  const url = buildSheetsUrl(spreadsheetId, sheetName);
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };
  
  // console.log(`[UseCaseReader] Fetching: ${url}`);

  const response = await fetch(url, { headers });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Sheets API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  // User's modified logic: First row contains headers, second row onwards contains data
  if (!data.values || data.values.length < 2) {
    throw new Error('Insufficient data in spreadsheet - need at least 2 rows (headers in row 1, data starting from row 2)');
  }

  return {
    title: 'Test Cases', // No separate title row in this format
    headers: data.values[0], // First row (index 0) contains the column headers
    rows: data.values.slice(1) // Second row (index 1) onwards contains the data
  };
}

// Convert sheet data to test cases
function convertToTestCases(headers: string[], rows: string[][]): TestCase[] {
  // console.log('[UseCaseReader] Available headers:', headers);
  // console.log('[UseCaseReader] Converting rows to test cases...');
  
  const testCases: TestCase[] = [];
  let skippedCount = 0;
  
  rows.forEach((row, index) => {
    // console.log(`[UseCaseReader] Processing row ${index + 1}:`, row);
    
    // Check if the prompt (input) field is empty or missing
    const input = findFieldValue(headers, row, FIELD_MAP.input);
    if (!input || !input.trim()) {
      // console.log(`[UseCaseReader] Row ${index + 1} - Skipping row with empty prompt`);
      skippedCount++;
      return; // Skip this row
    }
    
    const testCase: TestCase = {
      id: `tc-${testCases.length + 1}`, // Use sequential numbering for valid test cases
      input: input.trim(),
      context: '', // Initialize with empty string, will be populated below if found
    };

    // console.log(`[UseCaseReader] Row ${index + 1} - input set to: "${input}"`);

    // Map context from Test Case Name or Context column
    const context = findFieldValue(headers, row, FIELD_MAP.context);
    if (context) {
      testCase.context = context;
      testCase.scenarioCategory = context; // For backward compatibility
      // console.log(`[UseCaseReader] Row ${index + 1} - context set to: "${context}"`);
    } else {
      // console.log(`[UseCaseReader] Row ${index + 1} - No context found. Available headers:`, headers);
      // console.log(`[UseCaseReader] Row ${index + 1} - Field mapping for context:`, FIELD_MAP.context);
    }

    // Map use case title from Category column
    const title = findFieldValue(headers, row, FIELD_MAP.title);
    if (title) {
      (testCase as any).use_case_title = title;
      // console.log(`[UseCaseReader] Row ${index + 1} - use_case_title set to: "${title}"`);
    }

    // Map use case description from Use Case Description column
    const caseDescription = findFieldValue(headers, row, FIELD_MAP.description);
    if (caseDescription) {
      (testCase as any).use_case_description = caseDescription;
      // console.log(`[UseCaseReader] Row ${index + 1} - use_case_description set to: "${caseDescription.substring(0, 60)}${caseDescription.length > 60 ? '...' : ''}"`);
    }

    // Map use case index - this will be used to enrich with database data
    const useCaseIndex = findFieldValue(headers, row, FIELD_MAP.useCaseIndex);
    if (useCaseIndex) {
      testCase.use_case_index = useCaseIndex;
      // console.log(`[UseCaseReader] Row ${index + 1} - use_case_index set to: ${useCaseIndex}`);
    } else {
      // console.log(`[UseCaseReader] Row ${index + 1} - No use_case_index found. Available headers:`, headers);
      // console.log(`[UseCaseReader] Row ${index + 1} - Field mapping for useCaseIndex:`, FIELD_MAP.useCaseIndex);
    }

    // console.log(`[UseCaseReader] Row ${index + 1} - Final test case:`, {
    //   id: testCase.id,
    //   input: testCase.input || 'NOT FOUND',
    //   context: testCase.context || 'NOT FOUND',
    //   use_case_index: testCase.use_case_index || 'NOT FOUND'
    // });

    testCases.push(testCase);
  });
  
  // console.log(`[UseCaseReader] Converted ${testCases.length} valid test cases, skipped ${skippedCount} rows with empty prompts`);
  return testCases;
}

// Validate test cases
export function validateTestCases(testCases: TestCase[], headers?: string[], rows?: string[][]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (testCases.length === 0) {
    errors.push('No test cases found');
    return { isValid: false, errors, warnings };
  }

  testCases.forEach((testCase, index) => {
    const caseNumber = index + 1;
    
    // Since we're already filtering out empty prompts in convertToTestCases,
    // we don't need to check for empty input here - it should always have content
    if (!testCase.input?.trim()) {
      console.warn(`[UseCaseReader] Test case ${caseNumber} has empty input despite filtering - this shouldn't happen`);
    }
    
    // Context is optional but recommended
    if (!testCase.context?.trim()) {
      warnings.push(`Test case ${caseNumber}: Missing or empty context field. Expected column: "Test Case Name" or "Context"`);
    }
    
    // Check for use case index (required for enrichment)
    if (!testCase.use_case_index) {
      warnings.push(`Test case ${caseNumber}: Missing use_case_index. Expected column: "Test Case #". This may affect use case enrichment.`);
    }
    
    // Length warnings
    const inputLength = testCase.input?.length || 0;
    const contextLength = testCase.context?.length || 0;
    
    if (inputLength > 1000) {
      warnings.push(`Test case ${caseNumber}: Input is very long (${inputLength} characters)`);
    }
    if (contextLength > 1000) {
      warnings.push(`Test case ${caseNumber}: Context is very long (${contextLength} characters)`);
    }
  });

  // Since we're filtering out empty prompts, validation should always pass
  // Only fail if there are no test cases at all
  const hasCriticalErrors = false;
  
  return {
    isValid: !hasCriticalErrors,
    errors,
    warnings
  };
}

// Main function to load test cases
export async function loadTestCases(
  useCaseConfigs: UseCaseConfig[], 
  useCaseId: string, 
  accessToken: string
): Promise<{ testCases: TestCase[]; title: string }> {
  const useCase = useCaseConfigs.find(config => config.id === useCaseId);
  if (!useCase) {
    throw new Error(`Use case not found: ${useCaseId}`);
  }

  // console.log(`[UseCaseReader] Loading test cases for: ${useCaseId}`);
  // console.log(`[UseCaseReader] Spreadsheet: ${useCase.spreadsheetId}, Sheet: ${useCase.sheetName}`);

  try {
    const { headers, rows, title } = await fetchSheetData(
      useCase.spreadsheetId,
      useCase.sheetName,
      accessToken
    );

    const testCases = convertToTestCases(headers, rows);
    // console.log(`[UseCaseReader] Loaded ${testCases.length} test cases with title: "${title}"`);
    
    return { testCases, title };
  } catch (error) {
    // console.error(`[UseCaseReader] Error loading test cases:`, error);
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