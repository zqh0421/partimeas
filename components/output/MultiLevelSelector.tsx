'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
// Using inline SVG icons to avoid external dependencies
import { UseCaseSheet, USE_CASE_SHEETS } from '@/utils/useCaseSheets';

interface TestCase {
  id: string;
  input: string;
  context: string;
  modelName?: string;
  timestamp?: string;
  useCase?: string;
  scenarioCategory?: string;
  use_case_title?: string;
  use_case_index?: string;
}

interface HierarchicalData {
  useCases: {
    [useCaseId: string]: {
      name: string;
      scenarioCategories: {
        [categoryId: string]: {
          name: string;
          testCases: TestCase[];
        };
      };
    };
  };
}

interface Selection {
  useCaseId: string;
  scenarioCategoryIds: string[];
}

interface MultiLevelSelectorProps {
  onSelectionChange: (selections: Selection[]) => void;
  onDataLoaded: (testCases: TestCase[]) => void;
  onError: (error: string) => void;
  testCases: TestCase[];
}

export default function MultiLevelSelector({
  onSelectionChange,
  onDataLoaded,
  onError,
  testCases
}: MultiLevelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [useCases, setUseCases] = useState<UseCaseSheet[]>([]);
  const [hierarchicalData, setHierarchicalData] = useState<HierarchicalData>({ useCases: {} });
  const [selections, setSelections] = useState<Selection[]>([]);
  const [expandedUseCases, setExpandedUseCases] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const organizeDataHierarchically = (testCases: any[], useCaseId: string): HierarchicalData => {
    const hierarchical: HierarchicalData = { useCases: {} };
    
    if (!testCases?.length) return hierarchical;

    const useCase = useCases.find(uc => uc.id === useCaseId);
    if (!useCase) return hierarchical;

    hierarchical.useCases[useCaseId] = {
      name: useCase.name || `Use Case ${useCaseId}`,
      scenarioCategories: {}
    };

    testCases.forEach((testCase) => {
      const categoryId = testCase.scenarioCategory || testCase.scenario_category || 'default';
      const categoryName = testCase.scenarioCategoryName || testCase.scenario_category_name || categoryId;

      if (!hierarchical.useCases[useCaseId].scenarioCategories[categoryId]) {
        hierarchical.useCases[useCaseId].scenarioCategories[categoryId] = {
          name: categoryName,
          testCases: []
        };
      }

      const processedTestCase: TestCase = {
        id: testCase.id || `tc-${Math.random()}`,
        input: testCase.input || '',
        context: testCase.context || testCase.expectedOutput || '',
        modelName: testCase.modelName,
        timestamp: testCase.timestamp,
        useCase: useCaseId,
        scenarioCategory: categoryId,
        use_case_title: testCase.use_case_title,
        use_case_index: testCase.use_case_index
      };

      hierarchical.useCases[useCaseId].scenarioCategories[categoryId].testCases.push(processedTestCase);
    });

    return hierarchical;
  };

  const loadUseCaseData = useCallback(async (useCaseId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/use-case-data?useCaseId=${useCaseId}&dataType=test-cases`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load use case data');
      }

      if (data.success && data.testCases) {
        const hierarchical = organizeDataHierarchically(data.testCases, useCaseId);
        setHierarchicalData(prev => ({
          useCases: { ...prev.useCases, ...hierarchical.useCases }
        }));
      } else {
        throw new Error(data.error || 'Failed to load data');
      }
    } catch (error) {
      onError(`Failed to load use case data: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  const toggleUseCaseExpansion = (useCaseId: string) => {
    const newExpanded = new Set(expandedUseCases);
    if (newExpanded.has(useCaseId)) {
      newExpanded.delete(useCaseId);
    } else {
      newExpanded.add(useCaseId);
      // Load data if not already loaded
      if (!hierarchicalData.useCases[useCaseId]) {
        loadUseCaseData(useCaseId);
      }
    }
    setExpandedUseCases(newExpanded);
  };

  const isUseCaseSelected = (useCaseId: string): boolean => {
    return selections.some(selection => selection.useCaseId === useCaseId);
  };

  const isScenarioCategorySelected = (useCaseId: string, categoryId: string): boolean => {
    const selection = selections.find(s => s.useCaseId === useCaseId);
    return selection ? selection.scenarioCategoryIds.includes(categoryId) : false;
  };

  const toggleScenarioCategory = (useCaseId: string, categoryId: string) => {
    const newSelections = [...selections];
    const existingSelectionIndex = newSelections.findIndex(s => s.useCaseId === useCaseId);

    if (existingSelectionIndex >= 0) {
      const existingSelection = newSelections[existingSelectionIndex];
      const categoryIndex = existingSelection.scenarioCategoryIds.indexOf(categoryId);
      
      if (categoryIndex >= 0) {
        // Remove category
        existingSelection.scenarioCategoryIds.splice(categoryIndex, 1);
        // Remove use case selection if no categories left
        if (existingSelection.scenarioCategoryIds.length === 0) {
          newSelections.splice(existingSelectionIndex, 1);
        }
      } else {
        // Add category
        existingSelection.scenarioCategoryIds.push(categoryId);
      }
    } else {
      // Create new use case selection
      newSelections.push({
        useCaseId,
        scenarioCategoryIds: [categoryId]
      });
    }

    setSelections(newSelections);
    onSelectionChange(newSelections);

    // Collect all selected test cases
    const allSelectedTestCases: TestCase[] = [];
    newSelections.forEach(selection => {
      const useCase = hierarchicalData.useCases[selection.useCaseId];
      if (useCase) {
        selection.scenarioCategoryIds.forEach(categoryId => {
          const category = useCase.scenarioCategories[categoryId];
          if (category) {
            allSelectedTestCases.push(...category.testCases);
          }
        });
      }
    });

    onDataLoaded(allSelectedTestCases);
  };

  const getSelectionSummary = (): string => {
    if (selections.length === 0) return "Select test cases to analyze...";
    
    const totalCategories = selections.reduce((sum, s) => sum + s.scenarioCategoryIds.length, 0);
    return `${selections.length} use case${selections.length !== 1 ? 's' : ''}, ${totalCategories} categor${totalCategories !== 1 ? 'ies' : 'y'}`;
  };

  const clearSelections = () => {
    setSelections([]);
    onSelectionChange([]);
    onDataLoaded([]);
  };

  // Initialize use cases
  useEffect(() => {
    setUseCases(USE_CASE_SHEETS);
  }, []);

  return (
    <div className="space-y-4">
        <div className="p-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Test Cases Selection
            </label>
            
            <div className="relative" ref={dropdownRef}>
              {/* Dropdown Button */}
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
              >
                <span className="text-gray-700">
                  {getSelectionSummary()}
                </span>
                <svg className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Content */}
              {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-y-auto">
                  {/* Clear Button */}
                  {selections.length > 0 && (
                    <div className="p-2 border-b border-gray-200">
                      <button
                        onClick={clearSelections}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Clear all selections
                      </button>
                    </div>
                  )}

                  {/* Use Cases List */}
                  <div className="p-2">
                    {useCases.map((useCase) => (
                      <div key={useCase.id} className="mb-2">
                        {/* Use Case Header */}
                        <div
                          className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                          onClick={() => toggleUseCaseExpansion(useCase.id)}
                        >
                          {expandedUseCases.has(useCase.id) ? (
                            <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                          <span className="font-medium text-gray-900">
                            {useCase.name || `Use Case ${useCase.id}`}
                          </span>
                          {isUseCaseSelected(useCase.id) && (
                            <svg className="h-4 w-4 text-blue-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>

                        {/* Scenario Categories */}
                        {expandedUseCases.has(useCase.id) && (
                          <div className="ml-6 space-y-1">
                            {isLoading && !hierarchicalData.useCases[useCase.id] ? (
                              <div className="flex items-center py-2 text-gray-500">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                Loading categories...
                              </div>
                            ) : hierarchicalData.useCases[useCase.id] ? (
                              Object.entries(hierarchicalData.useCases[useCase.id].scenarioCategories).map(([categoryId, category]) => (
                                <div
                                  key={categoryId}
                                  className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                                  onClick={() => toggleScenarioCategory(useCase.id, categoryId)}
                                >
                                  <div className="flex items-center flex-1">
                                    <div className={`w-4 h-4 border border-gray-300 rounded mr-3 flex items-center justify-center ${
                                      isScenarioCategorySelected(useCase.id, categoryId) 
                                        ? 'bg-blue-600 border-blue-600' 
                                        : 'bg-white'
                                    }`}>
                                      {isScenarioCategorySelected(useCase.id, categoryId) && (
                                        <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </div>
                                    <span className="text-gray-700">
                                      {category.name} ({category.testCases.length} test case{category.testCases.length !== 1 ? 's' : ''})
                                    </span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="py-2 text-gray-500 text-sm">
                                No categories available
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}