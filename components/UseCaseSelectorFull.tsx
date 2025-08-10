'use client';

import { useState, useEffect, useCallback } from 'react';
import { UseCaseSheet, USE_CASE_SHEETS } from '@/utils/useCaseSheets';
import { TestCase } from '@/types';

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
      sheetUseCaseTitle?: string;
      sheetUseCaseIndex?: string;
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
  onError
}: UseCaseSelectorProps) {
  const [selectedUseCase, setSelectedUseCase] = useState<string>('');
  const [selectedScenarioCategory, setSelectedScenarioCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [useCases, setUseCases] = useState<UseCaseSheet[]>([]);
  const [hierarchicalData, setHierarchicalData] = useState<HierarchicalData>({ useCases: {} });

  const handleUseCaseSelect = useCallback(async (useCaseId: string) => {
    setSelectedUseCase(useCaseId);
    setSelectedScenarioCategory('');
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

    // Debug logging
    console.log('Organizing data hierarchically:', {
      useCaseId,
      testCasesCount: testCases.length,
      sampleTestCase: testCases[0],
      testCaseKeys: testCases[0] ? Object.keys(testCases[0]) : []
    });

    const scenarioCategories: { [categoryId: string]: { name: string; testCases: TestCase[] } } = {};

    testCases.forEach((testCase, index) => {
      // Extract scenario category from the data - prioritize scenario_category field
      const scenarioCategory = testCase.scenarioCategory || testCase.scenario_category || 'General';
      
      if (!scenarioCategories[scenarioCategory]) {
        scenarioCategories[scenarioCategory] = {
          name: scenarioCategory,
          testCases: []
        };
      }

      const processedTestCase: TestCase = {
        id: testCase.id || `tc-${index + 1}`,
        input: testCase.input || '',
        context: testCase.context || testCase.expectedOutput || '',
        modelName: testCase.modelName,
        timestamp: testCase.timestamp,
        useCase: useCaseId,
        scenarioCategory: scenarioCategory,
        use_case_title: testCase.use_case_title,
        use_case_index: testCase.use_case_index
      };

      scenarioCategories[scenarioCategory].testCases.push(processedTestCase);
    });

    // Extract sheet-provided identifiers/descriptions if available
    const firstTestCase = testCases[0] || {};
    const sheetUseCaseId = firstTestCase.useCase || useCaseId;
    const sheetUseCaseDescription = firstTestCase.useCaseDescription || firstTestCase.use_case_description || useCaseDescription;
    const sheetUseCaseTitle = firstTestCase.use_case_title || '';
    const sheetUseCaseIndex = firstTestCase.use_case_index || '';

    // Debug logging for extracted data
    console.log('Extracted sheet data:', {
      sheetUseCaseId,
      sheetUseCaseDescription,
      sheetUseCaseTitle,
      sheetUseCaseIndex,
      scenarioCategoriesKeys: Object.keys(scenarioCategories)
    });

    return {
      useCases: {
        [useCaseId]: {
          name: useCaseName,
          description: useCaseDescription,
          sheetUseCaseId,
          sheetUseCaseDescription,
          sheetUseCaseTitle,
          sheetUseCaseIndex,
          scenarioCategories
        }
      }
    };
  };

  // Initialize use cases on component mount
  useEffect(() => {
    setUseCases(USE_CASE_SHEETS);
  }, []);

  // Auto-select first use case when use cases are loaded
  useEffect(() => {
    if (useCases.length > 0 && !selectedUseCase) {
      const firstUseCase = useCases[0];
      console.log('Auto-selecting first use case:', firstUseCase.id);
      setSelectedUseCase(firstUseCase.id);
      handleUseCaseSelect(firstUseCase.id);
    }
  }, [useCases, selectedUseCase, handleUseCaseSelect]);

  const handleScenarioCategorySelect = useCallback((categoryId: string) => {
    setSelectedScenarioCategory(categoryId);
    onScenarioCategorySelected(categoryId);
    
    const currentUseCase = hierarchicalData.useCases[selectedUseCase];
    if (currentUseCase && currentUseCase.scenarioCategories[categoryId]) {
      const testCases = currentUseCase.scenarioCategories[categoryId].testCases;
      onDataLoaded(testCases);
    }
  }, [onScenarioCategorySelected, onDataLoaded, hierarchicalData, selectedUseCase]);

  const currentUseCase = hierarchicalData.useCases[selectedUseCase];
  const scenarioCategories = currentUseCase ? Object.keys(currentUseCase.scenarioCategories) : [];

  // Helper function to get display text for use case
  const getUseCaseDisplayText = (useCase: any, useCaseId: string) => {
    const dynamicData = hierarchicalData.useCases[useCaseId];
    
    // Priority 1: Use sheet data if available (use_case_index + use_case_title)
    if (dynamicData?.sheetUseCaseTitle && dynamicData?.sheetUseCaseIndex) {
      return `Use Case #${dynamicData.sheetUseCaseIndex}: ${dynamicData.sheetUseCaseTitle}`;
    }
    
    // Priority 2: Use sheet description if available
    if (dynamicData?.sheetUseCaseDescription) {
      const description = dynamicData.sheetUseCaseDescription.length > 60 
        ? `${dynamicData.sheetUseCaseDescription.substring(0, 60)}...` 
        : dynamicData.sheetUseCaseDescription;
      return `Use Case #${dynamicData.sheetUseCaseIndex || useCaseId}: ${description}`;
    }
    
    // Priority 3: Fallback to static data
    const description = useCase.description.length > 60 
      ? `${useCase.description.substring(0, 60)}...` 
      : useCase.description;
    return `Use Case #${useCase.id}: ${description}`;
  };

  return (
    <div className="space-y-4">
      {/* Compact Test Case Selection */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-6">
          {/* Single Row Layout with Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            
            {/* Use Case Dropdown */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Use Case
              </label>
              <select
                value={selectedUseCase}
                onChange={(e) => handleUseCaseSelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                disabled={isLoading}
              >
                <option value="">Select a use case...</option>
                {useCases.map((useCase) => (
                  <option key={useCase.id} value={useCase.id}>
                    {getUseCaseDisplayText(useCase, useCase.id)}
                  </option>
                ))}
              </select>
            </div>

            {/* Scenario Category Dropdown */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Scenario Category
              </label>
              <select
                value={selectedScenarioCategory}
                onChange={(e) => handleScenarioCategorySelect(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                disabled={!selectedUseCase || isLoading || scenarioCategories.length === 0}
              >
                <option value="">Select scenario category...</option>
                {scenarioCategories.map((categoryId) => {
                  const category = currentUseCase!.scenarioCategories[categoryId];
                  return (
                    <option key={categoryId} value={categoryId}>
                      {category.name} ({category.testCases.length} test case{category.testCases.length !== 1 ? 's' : ''})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-4 text-gray-600 mt-4">
              <div className="relative mr-2">
                <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
              </div>
              <span className="text-sm">Loading data...</span>
            </div>
          )}

          {/* No Data Available */}
          {selectedUseCase && !isLoading && scenarioCategories.length === 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">No scenario categories found for this use case.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 