'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { USE_CASE_SHEETS } from '@/utils/useCaseSheets';
import { ChevronDownIcon, ChevronRightIcon, CheckIcon } from '@/components/icons';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { TestCase } from '@/types';


interface UseCaseInfo {
  id: string;
  name: string;
  description: string;
  index: string;
}

interface ScenarioCategory {
  name: string;
  testCases: TestCase[];
}

interface UseCaseData extends UseCaseInfo {
  scenarioCategories: Record<string, ScenarioCategory>;
}

interface Selection {
  useCaseId: string;
  scenarioCategoryIds: string[];
}

export default function MultiLevelSelector({
  onSelectionChange,
  onDataLoaded,
  onError,
}: {
  onSelectionChange: (selections: Selection[]) => void;
  onDataLoaded: (testCases: TestCase[]) => void;
  onError: (error: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [useCases, setUseCases] = useState<UseCaseInfo[]>([]);
  const [useCaseData, setUseCaseData] = useState<Record<string, UseCaseData>>({});
  const [selections, setSelections] = useState<Selection[]>([]);
  const [expandedUseCases, setExpandedUseCases] = useState<Set<string>>(new Set());
  const [isLoadingSpreadsheet, setIsLoadingSpreadsheet] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const onErrorRef = useRef(onError);
  
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isUseCaseSelected = (useCaseId: string): boolean => 
    selections.some(selection => selection.useCaseId === useCaseId);

  const isScenarioCategorySelected = (useCaseId: string, categoryId: string): boolean => {
    const selection = selections.find(s => s.useCaseId === useCaseId);
    return selection ? selection.scenarioCategoryIds.includes(categoryId) : false;
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
    onDataLoaded([]);
  };

  const organizeUseCaseData = (testCases: any[], useCaseInfo: UseCaseInfo): UseCaseData => {
    const scenarioCategories: Record<string, ScenarioCategory> = {};
    
    testCases.forEach((testCase) => {
      const categoryId = testCase.scenarioCategory || testCase.scenario_category || 'default';
      const categoryName = testCase.scenarioCategoryName || testCase.scenario_category_name || categoryId;

      if (!scenarioCategories[categoryId]) {
        scenarioCategories[categoryId] = {
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
        useCase: useCaseInfo.id,
        scenarioCategory: categoryId,
        use_case_title: testCase.use_case_title,
        use_case_index: testCase.use_case_index
      };

      scenarioCategories[categoryId].testCases.push(processedTestCase);
    });

    return {
      ...useCaseInfo,
      scenarioCategories
    };
  };


  const loadAllUseCaseData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoadingSpreadsheet(true);
    }
    
    try {
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
        const useCaseMap = new Map<string, UseCaseInfo>();
        const organizedData: Record<string, UseCaseData> = {};
        
        data.testCases.forEach((testCase: any) => {
          const { use_case_index: index, use_case_title: title, use_case_description: description } = testCase;
          
          if (index && title) {
            const useCaseId = `${index}-${title.replace(/\s+/g, '-').toLowerCase()}`;
            if (!useCaseMap.has(useCaseId)) {
              useCaseMap.set(useCaseId, {
                id: useCaseId,
                name: title,
                description: description || '',
                index
              });
            }
          }
        });

        const uniqueUseCases = Array.from(useCaseMap.values());
        setUseCases(uniqueUseCases);
        
        uniqueUseCases.forEach(useCase => {
          const useCaseTestCases = data.testCases.filter((testCase: any) => {
            const testCaseId = `${testCase.use_case_index}-${testCase.use_case_title?.replace(/\s+/g, '-').toLowerCase()}`;
            return testCaseId === useCase.id;
          });
          
          organizedData[useCase.id] = organizeUseCaseData(useCaseTestCases, useCase);
        });
        
        setUseCaseData(organizedData);
        setLastUpdateTime(new Date());
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
    setSelections([]);
    onSelectionChange([]);
    setExpandedUseCases(new Set());
    setUseCaseData({});
    onDataLoaded([]);
    loadAllUseCaseData(true);
  };

  const hashSelections = (inputSelections: Selection[]): string => {
    const deepCopy = inputSelections.map(sel => ({
      useCaseId: sel.useCaseId,
      scenarioCategoryIds: [...sel.scenarioCategoryIds].sort(),
    }));
    deepCopy.sort((a, b) => a.useCaseId.localeCompare(b.useCaseId));
    return JSON.stringify(deepCopy);
  };

  const toggleScenarioCategory = (useCaseId: string, categoryId: string) => {
    const oldHash = hashSelections(selections);
    
    const newSelections = [...selections];
    const existingSelectionIndex = newSelections.findIndex(s => s.useCaseId === useCaseId);

    if (existingSelectionIndex >= 0) {
      const existingSelection = newSelections[existingSelectionIndex];
      const categoryIndex = existingSelection.scenarioCategoryIds.indexOf(categoryId);
      
      if (categoryIndex >= 0) {
        existingSelection.scenarioCategoryIds.splice(categoryIndex, 1);
        if (existingSelection.scenarioCategoryIds.length === 0) {
          newSelections.splice(existingSelectionIndex, 1);
        }
      } else {
        existingSelection.scenarioCategoryIds.push(categoryId);
      }
    } else {
      newSelections.push({
        useCaseId,
        scenarioCategoryIds: [categoryId]
      });
    }

    const newHash = hashSelections(newSelections);
    
    if (oldHash !== newHash) {
      setSelections(newSelections);
      onSelectionChange(newSelections);
      
      const allSelectedTestCases: TestCase[] = [];
      newSelections.forEach(selection => {
        const useCase = useCaseData[selection.useCaseId];
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
    }
  };

  useEffect(() => {
    loadAllUseCaseData();
  }, [loadAllUseCaseData]);

  return (
    <div className="space-y-4">
        <div className="space-y-6">
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
                    <div className="w-4 h-4 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                  ) : (
                    <ArrowPathIcon className="w-4 h-4" />
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
                <ChevronDownIcon className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Content */}
              {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-y-auto">
                  {/* Use Cases List */}
                  <div className="p-2">
                    {isLoadingSpreadsheet ? (
                      <div className="flex items-center py-4 text-gray-500">
                        <div className="relative mr-2">
                          <div className="w-4 h-4 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                        </div>
                        Loading test cases...
                      </div>
                    ) : useCases.length === 0 ? (
                      <div className="py-4 text-gray-500 text-sm">
                        No use cases found
                      </div>
                    ) : (
                      useCases.map((useCase) => (
                        <UseCaseItem
                          key={useCase.id}
                          useCase={useCase}
                          useCaseData={useCaseData[useCase.id]}
                          isExpanded={expandedUseCases.has(useCase.id)}
                          isSelected={isUseCaseSelected(useCase.id)}
                          onToggleExpansion={() => toggleUseCaseExpansion(useCase.id)}
                          onToggleCategory={(categoryId) => toggleScenarioCategory(useCase.id, categoryId)}
                          isCategorySelected={(categoryId) => isScenarioCategorySelected(useCase.id, categoryId)}
                        />
                      ))
                    )}
                  </div>

                  {/* Clear Button */}
                  {selections.length > 0 && (
                    <div className="p-2 border-t border-gray-200">
                      <button
                        onClick={clearSelections}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Clear all selections
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}

function UseCaseItem({
  useCase,
  useCaseData,
  isExpanded,
  isSelected,
  onToggleExpansion,
  onToggleCategory,
  isCategorySelected,
}: {
  useCase: UseCaseInfo;
  useCaseData?: UseCaseData;
  isExpanded: boolean;
  isSelected: boolean;
  onToggleExpansion: () => void;
  onToggleCategory: (categoryId: string) => void;
  isCategorySelected: (categoryId: string) => boolean;
}) {
  return (
    <div className="mb-2">
      {/* Use Case Header */}
      <div
        className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
        onClick={onToggleExpansion}
      >
        {isExpanded ? (
          <ChevronDownIcon className="h-4 w-4 text-gray-400 mr-2" />
        ) : (
          <ChevronRightIcon className="h-4 w-4 text-gray-400 mr-2" />
        )}
        <span className="font-medium text-gray-900">
          {useCase.name || `Use Case ${useCase.id}`}
        </span>
        {isSelected && (
          <CheckIcon className="h-4 w-4 text-blue-600 ml-auto" />
        )}
      </div>

      {/* Scenario Categories */}
      {isExpanded && (
        <div className="ml-6 space-y-1">
          {useCaseData ? (
            Object.entries(useCaseData.scenarioCategories).map(([categoryId, category]) => (
              <CategoryItem
                key={categoryId}
                category={category}
                isSelected={isCategorySelected(categoryId)}
                onToggle={() => onToggleCategory(categoryId)}
              />
            ))
          ) : (
            <div className="py-2 text-gray-500 text-sm">
              No categories available
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CategoryItem({ category, isSelected, onToggle }: {
  category: ScenarioCategory;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
      onClick={onToggle}
    >
      <div className="flex items-center flex-1">
        <div className={`w-4 h-4 border border-gray-300 rounded mr-3 flex items-center justify-center ${
          isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white'
        }`}>
          {isSelected && (
            <CheckIcon className="h-3 w-3 text-white" strokeWidth={3} />
          )}
        </div>
        <span className="text-gray-700">
          {category.name} ({category.testCases.length} test case{category.testCases.length !== 1 ? 's' : ''})
        </span>
      </div>
    </div>
  );
}