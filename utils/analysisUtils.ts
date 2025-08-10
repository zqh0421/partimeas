
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