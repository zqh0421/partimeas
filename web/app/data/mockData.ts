/**
 * Configuration Template
 * 
 * This file no longer contains mock data. Instead, it provides:
 * 1. Type definitions for configuration structures
 * 2. Template examples for configuration
 * 3. Instructions for setting up real data sources
 * 
 * To use this system, you must:
 * 1. Configure real Google Sheets IDs in your environment
 * 2. Set up proper API keys and authentication
 * 3. Pass configuration objects to the SheetManager
 */

import { 
  HistoryEntry, 
  RubricVersion, 
  CriteriaConfig, 
  UseCaseConfig, 
  CaseData,
  TestCase,
  EvaluationResult
} from '@/app/types';

// Configuration template - replace with real values
export const configTemplate = {
  // Google Sheets configuration
  sheets: {
    // Replace these with your actual Google Sheets IDs
    testCases: 'YOUR_TEST_CASES_SHEET_ID',
    criteria: 'YOUR_CRITERIA_SHEET_ID',
    useCases: 'YOUR_USE_CASES_SHEET_ID'
  },
  
  // API configuration
  api: {
    // Set your API keys in environment variables
    googleApiKey: process.env.GOOGLE_API_KEY || 'YOUR_GOOGLE_API_KEY',
    openaiApiKey: process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY'
  }
};

// Example configuration structure (for reference only)
export const exampleConfig: {
  useCaseConfig: UseCaseConfig[];
  criteriaConfig: CriteriaConfig[];
} = {
  useCaseConfig: [
    {
      id: 'example-use-case',
      name: 'Example Use Case',
      description: 'Replace with your actual use case description',
      spreadsheetId: configTemplate.sheets.useCases,
      sheetName: 'Sheet1',
      category: 'Example',
      tags: ['example'],
      dataType: 'test-cases'
    }
  ],
  criteriaConfig: [
    {
      id: 'example-criteria',
      name: 'Example Criteria',
      description: 'Replace with your actual criteria description',
      spreadsheetId: configTemplate.sheets.criteria,
      sheetName: 'Sheet1',
      category: 'Example'
    }
  ]
};

// Export types for use in other parts of the application
export type { 
  TestCase, 
  EvaluationResult, 
  HistoryEntry, 
  RubricVersion, 
  CriteriaConfig, 
  UseCaseConfig, 
  CaseData
} from '@/app/types';

// Configuration validation helper
export const validateConfig = (config: typeof configTemplate): boolean => {
  const hasValidSheets = Object.values(config.sheets).every(id => 
    id && id !== 'YOUR_TEST_CASES_SHEET_ID' && id !== 'YOUR_CRITERIA_SHEET_ID' && id !== 'YOUR_USE_CASES_SHEET_ID'
  );
  
  const hasValidApiKeys = Boolean(config.api.googleApiKey && config.api.googleApiKey !== 'YOUR_GOOGLE_API_KEY');
  
  return hasValidSheets && hasValidApiKeys;
};

// Mock case data for development/testing
export const mockCaseData = {
  case1: {
    useCaseId: 'case-1',
    name: 'Case 1: Student Behavior Management',
    description: 'Managing challenging student behaviors in the classroom setting',
    testCasesCount: 9
  },
  case2: {
    useCaseId: 'case-2',
    name: 'Case 2: Lesson Planning',
    description: 'Creating effective lesson plans for diverse learners',
    testCasesCount: 7
  }
};

// Default export for backward compatibility
export default {
  configTemplate,
  exampleConfig,
  validateConfig,
  mockCaseData
};