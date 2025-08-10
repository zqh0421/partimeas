'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
// Using inline SVG icons to avoid external dependencies
import { USE_CASE_SHEETS } from '@/utils/useCaseSheets';

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

interface UseCaseInfo {
  id: string;
  name: string;
  description: string;
  index: string;
}

interface HierarchicalData {
  useCases: {
    [useCaseId: string]: {
      name: string;
      description: string;
      index: string;
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
  const [useCases, setUseCases] = useState<UseCaseInfo[]>([]);
  const [hierarchicalData, setHierarchicalData] = useState<HierarchicalData>({ useCases: {} });
  const [selections, setSelections] = useState<Selection[]>([]);
  const [expandedUseCases, setExpandedUseCases] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [lastDataLoadedHash, setLastDataLoadedHash] = useState<string>('');
  const [isLoadingSpreadsheet, setIsLoadingSpreadsheet] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Keep a stable reference to the latest onError to avoid re-running effects
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

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

  const organizeDataHierarchically = (testCases: any[], useCaseId: string, useCaseInfo?: UseCaseInfo): HierarchicalData => {
    const hierarchical: HierarchicalData = { useCases: {} };
    
    if (!testCases?.length) return hierarchical;

    // Get use case info from first test case with this use case
    const firstTestCase = testCases.find(tc => 
      tc.use_case_index === useCaseId || 
      `${tc.use_case_index}-${tc.use_case_title?.replace(/\s+/g, '-').toLowerCase()}` === useCaseId
    ) || testCases[0];

    hierarchical.useCases[useCaseId] = {
      name: useCaseInfo?.name || firstTestCase?.use_case_title || `Use Case ${useCaseId}`,
      description: useCaseInfo?.description || firstTestCase?.use_case_description || '',
      index: useCaseInfo?.index || firstTestCase?.use_case_index || '',
      scenarioCategories: {}
    };

    testCases.forEach((testCase) => {
      const categoryId = testCase.scenarioCategory || testCase.scenario_category || 'default';
      const categoryName = testCase.scenarioCategoryName || testCase.scenario_category_name || categoryId;

      console.log(`Test case for ${useCaseId}: categoryId=${categoryId}, categoryName=${categoryName}`, testCase);

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

  // Load all use case data at once during initialization
  const loadAllUseCaseData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoadingSpreadsheet(true);
    }
    
    try {
      // Use the first available use case config to get spreadsheet info
      const firstConfig = USE_CASE_SHEETS[0];
      if (!firstConfig) {
        throw new Error('No use case configuration found');
      }

      const response = await fetch(`/api/use-case-data?useCaseId=${firstConfig.id}&dataType=test-cases`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load use case data');
      }

      if (data.success && data.testCases) {
        // Extract unique use cases from the data
        const useCaseMap = new Map<string, UseCaseInfo>();
        const hierarchicalData: HierarchicalData = { useCases: {} };
        
        data.testCases.forEach((testCase: any) => {
          const index = testCase.use_case_index;
          const title = testCase.use_case_title;
          const description = testCase.use_case_description;
          
          if (index && title) {
            const useCaseId = `${index}-${title.replace(/\s+/g, '-').toLowerCase()}`;
            if (!useCaseMap.has(useCaseId)) {
              useCaseMap.set(useCaseId, {
                id: useCaseId,
                name: title,
                description: description || '',
                index: index
              });
            }
          }
        });

        const uniqueUseCases = Array.from(useCaseMap.values());
        setUseCases(uniqueUseCases);
        
        // Load hierarchical data for all use cases at once
        uniqueUseCases.forEach(useCase => {
          const filteredTestCases = data.testCases.filter((testCase: any) => {
            const testCaseIndex = testCase.use_case_index;
            const testCaseTitle = testCase.use_case_title;
            const expectedUseCaseId = `${testCaseIndex}-${testCaseTitle?.replace(/\s+/g, '-').toLowerCase()}`;
            return expectedUseCaseId === useCase.id;
          });
          
          console.log(`Processing use case ${useCase.id}: found ${filteredTestCases.length} test cases`);
          const useCaseHierarchical = organizeDataHierarchically(filteredTestCases, useCase.id, useCase);
          Object.assign(hierarchicalData.useCases, useCaseHierarchical.useCases);
        });
        
        setHierarchicalData(hierarchicalData);
        setLastUpdateTime(new Date());
        console.log('Loaded all use case data:', uniqueUseCases.length, 'use cases');
        console.log('Hierarchical data:', hierarchicalData);
        console.log('Sample test case structure:', data.testCases[0]);
      } else {
        throw new Error(data.error || 'Failed to load data');
      }
    } catch (error) {
      onErrorRef.current?.(`Failed to load use case data: ${error}`);
    } finally {
      setIsLoadingSpreadsheet(false);
      setIsRefreshing(false);
    }
  }, []);



  const toggleUseCaseExpansion = (useCaseId: string) => {
    const newExpanded = new Set(expandedUseCases);
    if (newExpanded.has(useCaseId)) {
      newExpanded.delete(useCaseId);
    } else {
      newExpanded.add(useCaseId);
    }
    setExpandedUseCases(newExpanded);
  };

  const handleRefresh = () => {
    // Reset all selections and UI state
    setSelections([]);
    onSelectionChange([]);
    setLastDataLoadedHash('');
    setExpandedUseCases(new Set());
    setHierarchicalData({ useCases: {} });
    // Clear test cases immediately
    onDataLoaded([]);
    // Reload data from spreadsheet
    loadAllUseCaseData(true);
  };

  const isUseCaseSelected = (useCaseId: string): boolean => {
    return selections.some(selection => selection.useCaseId === useCaseId);
  };

  const isScenarioCategorySelected = (useCaseId: string, categoryId: string): boolean => {
    const selection = selections.find(s => s.useCaseId === useCaseId);
    return selection ? selection.scenarioCategoryIds.includes(categoryId) : false;
  };

  // Create a stable, normalized string representation of selections
  // - Sorts scenarioCategoryIds within each selection
  // - Sorts selections by useCaseId
  // - Does NOT mutate React state objects
  const hashSelections = (inputSelections: Selection[]): string => {
    const deepCopy = inputSelections.map(sel => ({
      useCaseId: sel.useCaseId,
      scenarioCategoryIds: [...sel.scenarioCategoryIds].sort(),
    }));
    deepCopy.sort((a, b) => a.useCaseId.localeCompare(b.useCaseId));
    return JSON.stringify(deepCopy);
  };

  const toggleScenarioCategory = (useCaseId: string, categoryId: string) => {
    // Create hash of current selection before changes (stable, non-mutating)
    const oldHash = hashSelections(selections);
    
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

    // Create hash of new selection after changes (stable, non-mutating)
    const newHash = hashSelections(newSelections);
    
    // Only update state if selection actually changed
    if (oldHash !== newHash) {
      setSelections(newSelections);
      onSelectionChange(newSelections);
      setLastDataLoadedHash(newHash);
      
      // Collect and pass test cases immediately (no loading needed - data is in memory)
      const allSelectedTestCases: TestCase[] = [];
      if (newSelections.length > 0) {
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
      }
      
      // Pass selected test cases (empty array if no selections)
      onDataLoaded(allSelectedTestCases);
    }
  };

  const getSelectionSummary = (): string => {
    if (selections.length === 0) return "Select test cases to proceed...";
    
    const totalCategories = selections.reduce((sum, s) => sum + s.scenarioCategoryIds.length, 0);
    const useCaseText = selections.length === 1 ? 'use case' : 'use cases';
    const categoryText = totalCategories === 1 ? 'set' : 'sets';
    return `Selected ${totalCategories} ${categoryText} from ${selections.length} ${useCaseText}`;
  };

  const clearSelections = () => {
    setSelections([]);
    onSelectionChange([]);
    setLastDataLoadedHash('');
    // Clear test cases immediately (no loading needed - data operation in memory)
    onDataLoaded([]);
  };

  // Initialize by loading all use case data (only once on mount)
  useEffect(() => {
    loadAllUseCaseData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
        <div className="6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <label className="block text-sm font-medium text-gray-700">
                  Test Cases Selection
                </label>
                
              </div>
              <div className="flex items-center space-x-2">
                {lastUpdateTime && (
                  <span className="text-xs text-gray-500">
                    Updated: {lastUpdateTime.toLocaleTimeString()}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleRefresh}
                disabled={isLoadingSpreadsheet || isRefreshing}
                  className="inline-flex items-center p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Refresh test cases data"
                >
                  {(isRefreshing || isLoadingSpreadsheet) ? (
                    <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                      <path d="M4 12a8 8 0 018-8c2.2 0 4.2.9 5.7 2.3" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M20 4v6h-6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M20 12a8 8 0 01-8 8c-2.2 0-4.2-.9-5.7-2.3" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M4 20v-6h6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
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
                    {isLoadingSpreadsheet ? (
                      <div className="flex items-center py-4 text-gray-500">
                        <div className="relative mr-2">
                          <div className="w-4 h-4 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
                        </div>
                        Loading test cases...
                      </div>
                    ) : useCases.length === 0 ? (
                      <div className="py-4 text-gray-500 text-sm">
                        No use cases found
                      </div>
                    ) : (
                      useCases.map((useCase) => (
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
                            {hierarchicalData.useCases[useCase.id] ? (
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
                    ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}