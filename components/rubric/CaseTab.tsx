"use client";

import { useState } from "react";
import { RubricVersion } from "@/types/rubric";
import { getCaseData } from "@/data/caseData";

interface CaseTabProps {
  currentVersion: RubricVersion;
  setCurrentVersion: (version: RubricVersion | ((prev: RubricVersion) => RubricVersion)) => void;
}

export default function CaseTab({
  currentVersion,
  setCurrentVersion,
}: CaseTabProps) {
  const [activeTab, setActiveTab] = useState<'case1' | 'case2'>('case1');
  const [case1SubTab, setCase1SubTab] = useState<'concerning' | 'strengths'>('concerning');

  const handleAddTestCase = (useCaseId: string) => {
    const newTestCase = {
      id: `test-${useCaseId}-${Date.now()}`,
      input: '',
      expectedOutput: '',
      useCaseId: useCaseId
    };
    const updatedUseCases = [...(currentVersion.useCases || [])];
    const useCaseIndex = updatedUseCases.findIndex(uc => uc.id === useCaseId);
    if (useCaseIndex !== -1) {
      updatedUseCases[useCaseIndex] = {
        ...updatedUseCases[useCaseIndex],
        testCases: [...updatedUseCases[useCaseIndex].testCases, newTestCase]
      };
      setCurrentVersion((prev) => ({
        ...prev,
        useCases: updatedUseCases,
      }));
    }
  };

  const handleDeleteTestCase = (useCaseId: string, testIndex: number) => {
    const updatedUseCases = [...(currentVersion.useCases || [])];
    const useCaseIndex = updatedUseCases.findIndex(uc => uc.id === useCaseId);
    if (useCaseIndex !== -1) {
      updatedUseCases[useCaseIndex] = {
        ...updatedUseCases[useCaseIndex],
        testCases: updatedUseCases[useCaseIndex].testCases.filter((_, i) => i !== testIndex)
      };
      setCurrentVersion((prev) => ({
        ...prev,
        useCases: updatedUseCases,
      }));
    }
  };

  const handleUpdateTestCase = (useCaseId: string, testCaseId: string, field: 'input' | 'expectedOutput', value: string) => {
    const updatedUseCases = [...(currentVersion.useCases || [])];
    const useCaseIndex = updatedUseCases.findIndex(uc => uc.id === useCaseId);
    if (useCaseIndex !== -1) {
      const testCaseIndex = updatedUseCases[useCaseIndex].testCases.findIndex(tc => tc.id === testCaseId);
      if (testCaseIndex !== -1) {
        updatedUseCases[useCaseIndex].testCases[testCaseIndex] = {
          ...updatedUseCases[useCaseIndex].testCases[testCaseIndex],
          [field]: value
        };
        setCurrentVersion((prev) => ({
          ...prev,
          useCases: updatedUseCases,
        }));
      }
    }
  };

  const parseInputContent = (input: string) => {
    const useContextMatch = input.match(/Use Context: (.+?)(?:\n\nScenario:|$)/);
    const scenarioMatch = input.match(/Scenario: (.+?)$/);
    
    return {
      useContext: useContextMatch ? useContextMatch[1].trim() : '',
      userInput: scenarioMatch ? scenarioMatch[1].trim() : input
    };
  };

  const combineInputContent = (useContext: string, userInput: string) => {
    if (!useContext && !userInput) return '';
    if (!useContext) return userInput;
    if (!userInput) return `Use Context: ${useContext}`;
    return `Use Context: ${useContext}\n\nScenario: ${userInput}`;
  };

  const renderCase1Content = () => {
    const caseData = getCaseData('case1');
    const useCase = (currentVersion.useCases || []).find(uc => uc.id === caseData.useCaseId);
    
    // Split test cases into concerning behaviors (first 5) and strengths (last 4)
    const concerningBehaviors = useCase?.testCases.slice(0, 5) || [];
    const teacherStrengths = useCase?.testCases.slice(5, 9) || [];

    return (
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="mb-3">
            <h4 className="font-medium text-gray-900">
              {caseData.name}
            </h4>
            <div className="text-xs text-gray-500 mt-1">
              {caseData.testCasesCount} test cases
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {caseData.description}
          </p>
          
          {/* Sub-tab Navigation for Case 1 */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-4">
            <button
              onClick={() => setCase1SubTab('concerning')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                case1SubTab === 'concerning'
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Concerning Behaviors
            </button>
            <button
              onClick={() => setCase1SubTab('strengths')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                case1SubTab === 'strengths'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Teacher Strengths
            </button>
          </div>
          
          {/* Test Cases Management */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-medium text-gray-700">
                {case1SubTab === 'concerning' ? 'Concerning Behaviors' : 'Teacher Strengths'} Test Cases
              </h5>
              <button
                onClick={() => handleAddTestCase(caseData.useCaseId)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                + Add Test Case
              </button>
            </div>
            
            {/* Test Cases List */}
            <div className="space-y-3">
              {(case1SubTab === 'concerning' ? concerningBehaviors : teacherStrengths).map((testCase, testIndex) => {
                // Find the actual index in the full test cases array
                const actualIndex = case1SubTab === 'concerning' ? testIndex : testIndex + 5;
                const { useContext, userInput } = parseInputContent(testCase.input);
                
                return (
                  <div key={testCase.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <h6 className="text-sm font-medium text-gray-700">
                        {case1SubTab === 'concerning' ? 'Concerning Behavior' : 'Teacher Strength'} Test Case {testIndex + 1}
                      </h6>
                      <button
                        onClick={() => handleDeleteTestCase(caseData.useCaseId, actualIndex)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Use Context</label>
                        <textarea
                          rows={2}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          value={useContext}
                          onChange={(e) => {
                            const newInput = combineInputContent(e.target.value, userInput);
                            handleUpdateTestCase(caseData.useCaseId, testCase.id, 'input', newInput);
                          }}
                          placeholder="Enter the general context..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">User Input</label>
                        <textarea
                          rows={3}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          value={userInput}
                          onChange={(e) => {
                            const newInput = combineInputContent(useContext, e.target.value);
                            handleUpdateTestCase(caseData.useCaseId, testCase.id, 'input', newInput);
                          }}
                          placeholder="Enter the specific scenario..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Expected Output</label>
                        <textarea
                          rows={2}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          value={testCase.expectedOutput}
                          onChange={(e) => handleUpdateTestCase(caseData.useCaseId, testCase.id, 'expectedOutput', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCaseContent = (tabId: 'case1' | 'case2') => {
    if (tabId === 'case1') {
      return renderCase1Content();
    }

    const caseData = getCaseData('case2');
    return (
      <div className="space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="mb-3">
            <h4 className="font-medium text-gray-900">
              {caseData.name}
            </h4>
            <div className="text-xs text-gray-500 mt-1">
              {caseData.testCasesCount} test cases
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            {caseData.description}
          </p>
          
          {/* Test Cases Management */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-sm font-medium text-gray-700">Test Cases</h5>
              <button
                onClick={() => handleAddTestCase(caseData.useCaseId)}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                + Add Test Case
              </button>
            </div>
            
            {/* Test Cases List */}
            <div className="space-y-3">
              {(() => {
                const useCase = (currentVersion.useCases || []).find(uc => uc.id === caseData.useCaseId);
                return useCase?.testCases.map((testCase, testIndex) => (
                  <div key={testCase.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <h6 className="text-sm font-medium text-gray-700">Test Case {testIndex + 1}</h6>
                      <button
                        onClick={() => handleDeleteTestCase(caseData.useCaseId, testIndex)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Input</label>
                        <textarea
                          rows={2}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          value={testCase.input}
                          onChange={(e) => handleUpdateTestCase(caseData.useCaseId, testCase.id, 'input', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Expected Output</label>
                        <textarea
                          rows={2}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                          value={testCase.expectedOutput}
                          onChange={(e) => handleUpdateTestCase(caseData.useCaseId, testCase.id, 'expectedOutput', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-3">
        Select to activate a use case for evaluation.
      </div>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('case1')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'case1'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Case 1
        </button>
        <button
          onClick={() => setActiveTab('case2')}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'case2'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Case 2
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'case1' && renderCaseContent('case1')}
        {activeTab === 'case2' && renderCaseContent('case2')}
      </div>
    </div>
  );
} 