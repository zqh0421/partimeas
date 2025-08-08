import { RubricOutcome } from '../types';

export const getEffectivenessColor = (effectiveness: string) => {
  switch (effectiveness) {
    case 'high': return 'text-green-600 bg-green-50';
    case 'medium': return 'text-yellow-600 bg-yellow-50';
    case 'low': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

export const getEffectivenessLabel = (effectiveness: string) => {
  switch (effectiveness) {
    case 'high': return 'High Effectiveness';
    case 'medium': return 'Medium Effectiveness';
    case 'low': return 'Low Effectiveness';
    default: return 'Unknown';
  }
};

export const validateSelections = (
  selectedUseCaseId: string,
  selectedScenarioCategory: string,
  selectedCriteriaId: string,
  testCases: any[],
  criteria: any[]
): string | null => {
  if (!selectedUseCaseId) {
    return 'Please select a use case';
  }
  
  if (!selectedScenarioCategory) {
    return 'Please select a scenario category';
  }
  
  if (!selectedCriteriaId) {
    return 'Please select rubric criteria';
  }
  
  if (testCases.length === 0) {
    return 'No test cases loaded. Please try selecting a different use case.';
  }
  
  if (criteria.length === 0) {
    return 'No criteria loaded. Please try selecting different criteria.';
  }
  
  return null;
}; 