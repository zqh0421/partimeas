'use client';

import { useStepLoading } from '@/components/steps/VerticalStepper';
import TestCaseNavigation from '@/components/TestCaseNavigation';
import TestCaseContext from '@/components/TestCaseContext';
import { TestCase } from '@/types';

interface GeneratingResponsesContentProps {
  testCases: TestCase[];
  selectedTestCaseIndex: number;
  onTestCaseSelect: (index: number) => void;
  modelList: string[];
  getGridCols: (count: number) => string;
}

// Component that registers loading state for generating responses
export default function GeneratingResponsesContent({ 
  testCases, 
  selectedTestCaseIndex, 
  onTestCaseSelect, 
  modelList, 
  getGridCols 
}: GeneratingResponsesContentProps) {
  // Explicitly register loading state for the analysis step
  useStepLoading('analysis', true);
  
  console.log('🔄 GeneratingResponsesContent rendered - loading state should be active for analysis step');

  return (
    <>
      {/* Test Case Navigation */}
      <TestCaseNavigation
        testCasesCount={testCases.length}
        selectedTestCaseIndex={selectedTestCaseIndex}
        onTestCaseSelect={onTestCaseSelect}
        className="mb-6"
      />

      {/* Test Case Context */}
      {testCases[selectedTestCaseIndex] && (
        <TestCaseContext
          testCase={testCases[selectedTestCaseIndex]}
          testCaseIndex={selectedTestCaseIndex}
          className="mb-6"
        />
      )}

      {/* Possible Responses with Loading Cards */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Possible Responses</h3>
        <div className={`grid ${getGridCols(modelList.length)} gap-4`}>
          {modelList.map((modelId: string, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden h-fit">
              {/* Model Header */}
              <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                <div className="flex flex-col space-y-1">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">{modelId}</h4>
                </div>
              </div>
              
              {/* Model Output Content - Loading State */}
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
    </>
  );
}