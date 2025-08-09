import { UseCaseConfig, USE_CASE_CONFIG, CRITERIA_CONFIG } from '@/config/useCaseConfig';

export interface UseCaseSheet {
  id: string;
  name: string;
  description: string;
  spreadsheetId: string;
  sheetName: string;
  apiKey: string; // Service account API key for server-side access
}

// Convert config to internal format
export const USE_CASE_SHEETS: UseCaseSheet[] = USE_CASE_CONFIG.map(config => ({
  id: config.id,
  name: config.name,
  description: config.description,
  spreadsheetId: config.spreadsheetId,
  sheetName: config.sheetName,
  apiKey: process.env.GOOGLE_SHEETS_API_KEY || ''
}));

export interface TestCaseData {
  id: string;
  input: string;
  context: string;
  modelName?: string;
  timestamp?: string;
  scenarioCategory?: string;
  useCase?: string;
}

export interface CriteriaData {
  id: string;
  category: string;
  criteria: string;
  description: string;
  weight: number;
  score1: string;
  score2: string;
  score3: string;
  score4: string;
  score5: string;
}

export class UseCaseSheetManager {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Get all available use cases
  getUseCases(): UseCaseSheet[] {
    return USE_CASE_SHEETS;
  }

  // Get specific use case by ID
  getUseCase(useCaseId: string): UseCaseSheet | undefined {
    return USE_CASE_SHEETS.find(useCase => useCase.id === useCaseId);
  }

  // Get criteria by ID
  getCriteria(criteriaId: string): any {
    const criteria = CRITERIA_CONFIG.find(c => c.id === criteriaId);
    if (!criteria) {
      // Return default criteria if not found
      return {
        spreadsheetId: '1xvWtZMe9kWyuKZEsZCUNZkxUxK8nCz20eswaNa_WJws',
        sheetName: 'Sheet1'
      };
    }
    return {
      spreadsheetId: criteria.spreadsheetId,
      sheetName: criteria.sheetName
    };
  }

  // Load criteria automatically (called when dataType is 'both')
  async loadCriteriaAuto(): Promise<CriteriaData[]> {
    return this.loadCriteria('default-criteria');
  }

  // Load test cases from a specific use case spreadsheet
  async loadTestCases(useCaseId: string): Promise<TestCaseData[]> {
    const useCase = this.getUseCase(useCaseId);
    if (!useCase) {
      throw new Error(`Use case not found: ${useCaseId}`);
    }

    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${useCase.spreadsheetId}/values/${useCase.sheetName}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Sheets API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`Failed to fetch spreadsheet: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.values || data.values.length === 0) {
        throw new Error('No data found in spreadsheet');
      }

      const headers = data.values[0];
      const rows = data.values.slice(1);

      console.log('Loaded spreadsheet data:', {
        spreadsheetId: useCase.spreadsheetId,
        sheetName: useCase.sheetName,
        headers,
        rowCount: rows.length,
        headerLower: headers.map((h: string) => h.toLowerCase())
      });

      // Convert to test cases format
      const testCases = this.convertToTestCases(headers, rows);
      
      console.log('Converted test cases:', testCases.map(tc => ({
        id: tc.id,
        inputLength: tc.input.length,
        contextLength: tc.context.length
      })));

      return testCases;
    } catch (error) {
      console.error('Error loading test cases:', error);
      throw new Error(`Failed to load test cases: ${error}`);
    }
  }

  // Load criteria from a specific spreadsheet
  async loadCriteria(criteriaId: string): Promise<CriteriaData[]> {
    const criteria = this.getCriteria(criteriaId);
    if (!criteria) {
      throw new Error(`Criteria not found: ${criteriaId}`);
    }

    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${criteria.spreadsheetId}/values/${criteria.sheetName}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Sheets API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`Failed to fetch criteria spreadsheet: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.values || data.values.length === 0) {
        throw new Error('No criteria data found in spreadsheet');
      }

      const headers = data.values[0];
      const rows = data.values.slice(1);

      console.log('Loaded criteria data:', {
        spreadsheetId: criteria.spreadsheetId,
        sheetName: criteria.sheetName,
        headers,
        rowCount: rows.length
      });

      // Convert to criteria format
      return this.convertToCriteria(headers, rows);
    } catch (error) {
      console.error('Error loading criteria:', error);
      throw new Error(`Failed to load criteria: ${error}`);
    }
  }

  // Convert spreadsheet data to test cases format
  private convertToTestCases(headers: string[], rows: string[][]): TestCaseData[] {
    const headerLower = headers.map(h => h.toLowerCase());
    
    return rows.map((row, index) => {
      // Handle new table format with columns: use_case_index, use_case_title, use_case_description, scenario_category, context, input
      let input = '';
      let context = '';
      let scenarioCategory = '';
      let useCase = '';
      let useCaseDescription = '';
      let useCaseIndex = '';
      let useCaseTitle = '';
      
      // Find input field
      const inputIndex = headerLower.indexOf('input');
      if (inputIndex >= 0) {
        input = row[inputIndex] || '';
      }
      
      // Find context field
      const contextIndex = headerLower.indexOf('context');
      if (contextIndex >= 0) {
        context = row[contextIndex] || '';
      }
      
      // Find scenario_category field
      const scenarioCategoryIndex = headerLower.indexOf('scenario_category');
      if (scenarioCategoryIndex >= 0) {
        scenarioCategory = row[scenarioCategoryIndex] || '';
      }
      
      // Find use_case field (for backward compatibility)
      const useCaseFieldIndex = headerLower.indexOf('use_case');
      if (useCaseFieldIndex >= 0) {
        useCase = row[useCaseFieldIndex] || '';
      }

      // Find use_case_description field
      const useCaseDescriptionIndex = headerLower.indexOf('use_case_description');
      if (useCaseDescriptionIndex >= 0) {
        useCaseDescription = row[useCaseDescriptionIndex] || '';
      }

      // Find use_case_index field
      const useCaseIndexIndex = headerLower.indexOf('use_case_index');
      if (useCaseIndexIndex >= 0) {
        useCaseIndex = row[useCaseIndexIndex] || '';
      }

      // Find use_case_title field
      const useCaseTitleIndex = headerLower.indexOf('use_case_title');
      if (useCaseTitleIndex >= 0) {
        useCaseTitle = row[useCaseTitleIndex] || '';
      }
      
      // Fallback to old format if needed - map expected_output to context
      if (headerLower.indexOf('expected_output') >= 0) {
        context = row[headerLower.indexOf('expected_output')] || '';
      }
      
      const testCase: TestCaseData = {
        id: `tc-${index + 1}`,
        input: input,
        context: context
      };

      // Add optional fields if they exist
      const modelNameIndex = headerLower.indexOf('model_name');
      if (modelNameIndex >= 0 && row[modelNameIndex]) {
        testCase.modelName = row[modelNameIndex];
      }

      const timestampIndex = headerLower.indexOf('timestamp');
      if (timestampIndex >= 0 && row[timestampIndex]) {
        testCase.timestamp = row[timestampIndex];
      }

      // Add hierarchical data
      if (scenarioCategory) {
        (testCase as any).scenarioCategory = scenarioCategory;
      }
      if (useCase) {
        (testCase as any).useCase = useCase;
      }
      if (useCaseDescription) {
        (testCase as any).useCaseDescription = useCaseDescription;
      }
      if (useCaseIndex) {
        (testCase as any).use_case_index = useCaseIndex;
      }
      if (useCaseTitle) {
        (testCase as any).use_case_title = useCaseTitle;
      }

      return testCase;
    });
  }

  // Convert spreadsheet data to criteria format
  private convertToCriteria(headers: string[], rows: string[][]): CriteriaData[] {
    const headerLower = headers.map(h => h.toLowerCase());
    
    return rows.map((row, index) => {
      const criteria: CriteriaData = {
        id: `criteria-${index + 1}`,
        category: row[headerLower.indexOf('category')] || '',
        criteria: row[headerLower.indexOf('criteria')] || '',
        description: row[headerLower.indexOf('description')] || '',
        weight: parseFloat(row[headerLower.indexOf('weight')] || '1'),
        score1: row[headerLower.indexOf('score1')] || '',
        score2: row[headerLower.indexOf('score2')] || '',
        score3: row[headerLower.indexOf('score3')] || '',
        score4: row[headerLower.indexOf('score4')] || '',
        score5: row[headerLower.indexOf('score5')] || ''
      };

      return criteria;
    });
  }

  // Validate test cases data
  validateTestCases(testCases: TestCaseData[]): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (testCases.length === 0) {
      errors.push('No test cases found');
    }

    testCases.forEach((testCase, index) => {
      if (!testCase.input.trim()) {
        errors.push(`Test case ${index + 1}: Empty input field`);
      }
      if (!testCase.context.trim()) {
        errors.push(`Test case ${index + 1}: Empty context field`);
      }
      
      // Add warnings for potentially problematic data
      if (testCase.input.length > 1000) {
        warnings.push(`Test case ${index + 1}: Input is very long (${testCase.input.length} characters)`);
      }
      if (testCase.context.length > 1000) {
        warnings.push(`Test case ${index + 1}: Context is very long (${testCase.context.length} characters)`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
} 