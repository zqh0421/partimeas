'use client';

import { ModelOutput, TestCase } from '@/types';
import { createPrettifiedMarkdown } from '@/utils/markdownUtils';
import { useStepLoading } from '@/components/steps/VerticalStepper';
import TestCaseNavigation from '@/components/TestCaseNavigation';
import TestCaseContext from '@/components/TestCaseContext';

interface ModelOutputsGridProps {
  modelOutputs?: ModelOutput[];
  isLoading?: boolean;
  loadingModelList?: string[];
  testCases?: TestCase[];
  selectedTestCaseIndex?: number;
  onTestCaseSelect?: (index: number) => void;
  stepId?: string;
  className?: string;
}

// Helper function to determine grid columns based on model count
const getGridCols = (count: number) => {
  switch (count) {
    case 1: return 'grid-cols-1';
    case 2: return 'grid-cols-1 md:grid-cols-2';
    case 3: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    case 4: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';
    default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  }
};

export default function ModelOutputsGrid({ 
  modelOutputs,
  isLoading = false,
  loadingModelList = [],
  testCases,
  selectedTestCaseIndex,
  onTestCaseSelect,
  stepId,
  className = ""
}: ModelOutputsGridProps) {
  // Register loading state if stepId is provided
  if (stepId && isLoading) {
    useStepLoading(stepId, true);
  }

  // Loading state: show loading cards
  if (isLoading && loadingModelList.length > 0) {
    return (
      <div className={className}>
        {/* Test Case Navigation */}
        {testCases && selectedTestCaseIndex !== undefined && onTestCaseSelect && (
          <TestCaseNavigation
            testCasesCount={testCases.length}
            selectedTestCaseIndex={selectedTestCaseIndex}
            onTestCaseSelect={onTestCaseSelect}
            className="mb-6"
          />
        )}

        {/* Test Case Context */}
        {testCases && selectedTestCaseIndex !== undefined && testCases[selectedTestCaseIndex] && (
          <TestCaseContext
            testCase={testCases[selectedTestCaseIndex]}
            testCaseIndex={selectedTestCaseIndex}
            className="mb-6"
          />
        )}

        {/* Loading Cards */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Possible Responses</h3>
          <div className={`grid ${getGridCols(loadingModelList.length)} gap-4`}>
            {loadingModelList.map((modelId: string, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden h-fit">
                {/* Model Header */}
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <div className="flex flex-col space-y-1">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{modelId}</h4>
                  </div>
                </div>
                
                {/* Loading Content */}
                <div className="p-3 bg-white">
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <div className="w-6 h-6 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
                      <p className="text-sm text-gray-600">Creating response...</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!modelOutputs || modelOutputs.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        No model outputs available yet. Please try running the evaluation again.
      </div>
    );
  }

  // Normal state: show actual model outputs
  return (
    <div className={className}>
      {/* Test Case Navigation */}
      {testCases && selectedTestCaseIndex !== undefined && onTestCaseSelect && (
        <TestCaseNavigation
          testCasesCount={testCases.length}
          selectedTestCaseIndex={selectedTestCaseIndex}
          onTestCaseSelect={onTestCaseSelect}
          className="mb-6"
        />
      )}

      {/* Test Case Context */}
      {testCases && selectedTestCaseIndex !== undefined && testCases[selectedTestCaseIndex] && (
        <TestCaseContext
          testCase={testCases[selectedTestCaseIndex]}
          testCaseIndex={selectedTestCaseIndex}
          className="mb-6"
        />
      )}

      {/* Model Outputs */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Possible Responses</h3>
        <div className={`grid ${getGridCols(modelOutputs.length)} gap-4`}>
          {modelOutputs.map((output, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden h-fit">
              {/* Model Header */}
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                <div className="flex flex-col space-y-1">
                  <h4 className="text-sm font-bold text-gray-900 truncate">
                    Response {index + 1} 
                    <span className="text-xs text-gray-400 font-normal">
                      {" "}(For internal testing only: {output.modelId})
                    </span>
                  </h4>
                </div>
              </div>
              
              {/* Model Output Content */}
              <div className="p-6 space-y-4">
                <div 
                  className="text-sm leading-relaxed overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: createPrettifiedMarkdown(output.output) }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}