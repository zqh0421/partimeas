export interface UseCaseConfig {
  id: string;
  name: string;
  description: string;
  spreadsheetId: string;
  sheetName: string;
  category: string;
  tags: string[];
  dataType: 'test-cases' | 'criteria' | 'both';
}

export interface CriteriaConfig {
  id: string;
  name: string;
  description: string;
  spreadsheetId: string;
  sheetName: string;
  category: string;
}

// Configuration for all use cases and their corresponding Google Sheets
export const USE_CASE_CONFIG: UseCaseConfig[] = [
  {
    id: 'test-cases',
    name: 'Test Cases',
    description: 'Test cases for rubric evaluation and analysis',
    spreadsheetId: '1GAKpJzbIWEIi2RxwrKcJVe0fLj2glpuDu1rDC_UkSAs',
    sheetName: 'Sheet1',
    category: 'Testing',
    tags: ['evaluation', 'analysis', 'rubric'],
    dataType: 'test-cases'
  }
];

// Configuration for criteria data sources
export const CRITERIA_CONFIG: CriteriaConfig[] = [
  {
    id: 'rubric-criteria',
    name: 'Rubric Criteria (Test Version)',
    description: '',
    spreadsheetId: '1xvWtZMe9kWyuKZEsZCUNZkxUxK8nCz20eswaNa_WJws',
    sheetName: 'Sheet1',
    category: ''
  }
];

// Helper functions for managing use case configurations
export const getUseCaseById = (id: string): UseCaseConfig | undefined => {
  return USE_CASE_CONFIG.find(useCase => useCase.id === id);
};

export const getUseCasesByCategory = (category: string): UseCaseConfig[] => {
  return USE_CASE_CONFIG.filter(useCase => useCase.category === category);
};

export const getUseCasesByTag = (tag: string): UseCaseConfig[] => {
  return USE_CASE_CONFIG.filter(useCase => useCase.tags.includes(tag));
};

export const getAllCategories = (): string[] => {
  return [...new Set(USE_CASE_CONFIG.map(useCase => useCase.category))];
};

export const getAllTags = (): string[] => {
  const allTags = USE_CASE_CONFIG.flatMap(useCase => useCase.tags);
  return [...new Set(allTags)];
}; 