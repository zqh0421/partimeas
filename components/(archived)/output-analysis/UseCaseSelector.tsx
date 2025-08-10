'use client';

import { useState, useEffect, useCallback } from 'react';
import { UseCaseSheet, USE_CASE_SHEETS } from '@/utils/useCaseSheets';

interface TestCase {
  id: string;
  input: string;
  context: string;
  modelName?: string;
  timestamp?: string;
  useCase?: string;
  scenarioCategory?: string;
}

interface UseCaseSelectorProps {
  onUseCaseSelected: (useCaseId: string) => void;
  onScenarioCategorySelected: (categoryId: string) => void;
  onDataLoaded: (testCases: TestCase[]) => void;
  onError: (error: string) => void;
  testCases: TestCase[];
}

interface HierarchicalData {
  useCases: {
    [useCaseId: string]: {
      name: string;
      description: string;
      sheetUseCaseId?: string;
      sheetUseCaseDescription?: string;
      scenarioCategories: {
        [categoryId: string]: {
          name: string;
          testCases: TestCase[];
        };
      };
    };
  };
}

export default function UseCaseSelector({
  onUseCaseSelected,
  onScenarioCategorySelected,
  onDataLoaded,
  onError,
  testCases
}: UseCaseSelectorProps) {
  const [selectedUseCase, setSelectedUseCase] = useState<string>('');
  const [selectedScenarioCategory, setSelectedScenarioCategory] = useState<string>('');
  const [selectedTestCases, setSelectedTestCases] = useState<TestCase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [useCases, setUseCases] = useState<UseCaseSheet[]>([]);
  const [hierarchicalData, setHierarchicalData] = useState<HierarchicalData>({ useCases: {} });
  const [isTestCasesSummaryOpen, setIsTestCasesSummaryOpen] = useState(false);

  const handleUseCaseSelect = useCallback(async (useCaseId: string) => {
    setSelectedUseCase(useCaseId);
    setSelectedScenarioCategory('');
    setSelectedTestCases([]);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/use-case-data?useCaseId=${useCaseId}&dataType=test-cases`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load use case data');
      }

      if (data.success && data.testCases) {
        // Organize data hierarchically
        const hierarchical = organizeDataHierarchically(data.testCases, useCaseId);
        setHierarchicalData(hierarchical);
        onUseCaseSelected(useCaseId);
      } else {
        throw new Error(data.error || 'Failed to load data');
      }
    } catch (error) {
      onError(`Failed to load use case data: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [onUseCaseSelected, onError]);

  const organizeDataHierarchically = (testCases: any[], useCaseId: string): HierarchicalData => {
    const useCase = USE_CASE_SHEETS.find(uc => uc.id === useCaseId);
    const useCaseName = useCase?.name || useCaseId;
    const useCaseDescription = useCase?.description || '';

    const scenarioCategories: { [categoryId: string]: { name: string; testCases: TestCase[] } } = {};

    testCases.forEach((testCase, index) => {
      // Extract scenario category from the data
      const scenarioCategory = testCase.scenarioCategory || testCase.useCase || 'General';
      
      if (!scenarioCategories[scenarioCategory]) {
        scenarioCategories[scenarioCategory] = {
          name: scenarioCategory,
          testCases: []
        };
      }

      const processedTestCase: TestCase = {
        id: testCase.id || `tc-${index + 1}`,
        input: testCase.input,
        context: testCase.context || testCase.expectedOutput,
        modelName: testCase.modelName,
        timestamp: testCase.timestamp,
        useCase: useCaseId,
        scenarioCategory: scenarioCategory
      };

      scenarioCategories[scenarioCategory].testCases.push(processedTestCase);
    });

    // Extract sheet-provided identifiers/descriptions if available
    const firstWithUseCase = testCases.find(tc => tc.useCase);
    const firstWithUseCaseDesc = testCases.find(tc => tc.useCaseDescription);
    const sheetUseCaseId = firstWithUseCase?.useCase || useCaseId;
    const sheetUseCaseDescription = firstWithUseCaseDesc?.useCaseDescription || useCaseDescription;

    return {
      useCases: {
        [useCaseId]: {
          name: useCaseName,
          description: useCaseDescription,
          sheetUseCaseId,
          sheetUseCaseDescription,
          scenarioCategories
        }
      }
    };
  };

  // Initialize use cases on component mount
  useEffect(() => {
    setUseCases(USE_CASE_SHEETS);
    
    // Auto-select the first use case if available
    if (USE_CASE_SHEETS.length > 0) {
      const firstUseCase = USE_CASE_SHEETS[0];
      console.log('Auto-selecting first use case:', firstUseCase.id);
      setSelectedUseCase(firstUseCase.id);
      handleUseCaseSelect(firstUseCase.id);
    }
  }, []);

  const handleScenarioCategorySelect = (categoryId: string) => {
    setSelectedScenarioCategory(categoryId);
    onScenarioCategorySelected(categoryId);
    
    const currentUseCase = hierarchicalData.useCases[selectedUseCase];
    if (currentUseCase && currentUseCase.scenarioCategories[categoryId]) {
      const testCases = currentUseCase.scenarioCategories[categoryId].testCases;
      setSelectedTestCases(testCases);
      onDataLoaded(testCases);
    }
  };

  const handleTestCasesSelect = (testCaseIds: string[]) => {
    const currentUseCase = hierarchicalData.useCases[selectedUseCase];
    if (currentUseCase && selectedScenarioCategory) {
      const allTestCases = currentUseCase.scenarioCategories[selectedScenarioCategory].testCases;
      const selectedCases = allTestCases.filter(tc => testCaseIds.includes(tc.id));
      setSelectedTestCases(selectedCases);
      onDataLoaded(selectedCases);
    }
  };

  const currentUseCase = hierarchicalData.useCases[selectedUseCase];
  const scenarioCategories = currentUseCase ? Object.keys(currentUseCase.scenarioCategories) : [];
  const currentScenarioCategory = currentUseCase && selectedScenarioCategory 
    ? currentUseCase.scenarioCategories[selectedScenarioCategory] 
    : null;

  return (
    <div className="space-y-4">
      {/* Combined Use Case + Scenario Category Selection */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Select Test Cases</h3>
          <p className="text-sm text-gray-600">Choose a set of test cases from a use case.</p>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {useCases.map((useCase) => (
              <div
                key={useCase.id}
                className={`rounded-lg border transition-colors ${
                  selectedUseCase === useCase.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <button
                  onClick={() => handleUseCaseSelect(useCase.id)}
                  className="w-full text-left p-4 flex items-start justify-between"
                >
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {selectedUseCase === useCase.id && currentUseCase
                        ? `Use Case #${currentUseCase.sheetUseCaseId || useCase.id}: ${currentUseCase.sheetUseCaseDescription || useCase.description}`
                        : `Use Case #${useCase.id}: ${useCase.description}`}
                    </h4>
                  </div>
                  <div className="ml-4 text-blue-600">
                    {selectedUseCase === useCase.id ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </div>
                </button>

                {selectedUseCase === useCase.id && (
                  <div className="px-4 pb-4">
                    {isLoading && !currentUseCase ? (
                      <div className="flex items-center py-4 text-gray-600">
                        <div className="relative mr-2">
                          <div className="w-5 h-5 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                        </div>
                        <span className="text-sm">Loading data...</span>
                      </div>
                    ) : scenarioCategories.length > 0 ? (
                      <div className="space-y-2">
                        {scenarioCategories.map((categoryId) => {
                          const category = currentUseCase!.scenarioCategories[categoryId];
                          return (
                            <button
                              key={categoryId}
                              onClick={() => handleScenarioCategorySelect(categoryId)}
                              className={`w-full text-left p-3 rounded-md border transition-colors ${
                                selectedScenarioCategory === categoryId
                                  ? 'border-blue-500 bg-white'
                                  : 'border-gray-200 bg-white hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-medium text-gray-900">{category.name}</h5>
                                  <p className="text-xs text-gray-600 mt-0.5">
                                    {category.testCases.length} test case{category.testCases.length !== 1 ? 's' : ''}
                                  </p>
                                </div>
                                {selectedScenarioCategory === categoryId && (
                                  <div className="text-blue-600">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}

                        {currentScenarioCategory && selectedTestCases.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <button
                              onClick={() => setIsTestCasesSummaryOpen(!isTestCasesSummaryOpen)}
                              className="w-full px-3 py-2 flex justify-between items-center bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                            >
                              <span className="text-sm font-semibold text-gray-900">
                                Test Cases Summary ({selectedTestCases.length} cases)
                              </span>
                              <svg
                                className={`w-4 h-4 transform transition-transform ${isTestCasesSummaryOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>

                            {isTestCasesSummaryOpen && (
                              <div className="mt-3 space-y-2">
                                {selectedTestCases.map((testCase, index) => (
                                  <div key={testCase.id} className="bg-white border border-gray-200 rounded-md p-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <h6 className="font-medium text-gray-900 text-sm">Test Case {index + 1}</h6>
                                    </div>
                                    <div className="space-y-2">
                                      <div>
                                        <p className="text-xs font-medium text-gray-700">Use Context:</p>
                                        <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-1">
                                          {testCase.context.length > 200
                                            ? `${testCase.context.substring(0, 200)}...`
                                            : testCase.context}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-medium text-gray-700">Input:</p>
                                        <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-1">
                                          {testCase.input.length > 200
                                            ? `${testCase.input.substring(0, 200)}...`
                                            : testCase.input}
                                        </p>
                                      </div>
                                      
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No scenario categories found for this use case.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 