"use client";

import { useState } from "react";
import { RubricVersion } from "@/types/rubric";

interface ConfigurationPanelProps {
  currentVersion: RubricVersion;
  setCurrentVersion: (version: RubricVersion | ((prev: RubricVersion) => RubricVersion)) => void;
  onOpenSettings: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function ConfigurationPanel({ 
  currentVersion, 
  setCurrentVersion, 
  onOpenSettings,
  isCollapsed = false,
  onToggleCollapse
}: ConfigurationPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    systemPrompt: false,
    useCases: false,
  });

  const [selectedUseCaseForTests, setSelectedUseCaseForTests] = useState<string>('');

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // If collapsed, show only a minimal toggle button
  if (isCollapsed) {
    return (
      <div className="bg-white rounded-r-lg shadow-lg border border-gray-200 transition-all duration-200 hover:shadow-xl">
        <div className="p-2">
          <button
            onClick={onToggleCollapse}
            className="w-full flex items-center justify-center p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
            title="Expand Configuration Panel"
          >
            <span className="text-lg">🔧</span>
          </button>
        </div>
        
        {/* Quick Settings Button */}
        <div className="px-2 pb-2">
          <button
            onClick={onOpenSettings}
            className="w-full flex items-center justify-center p-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            title="Settings"
          >
            <span className="text-sm">⚙️</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 lg:sticky lg:top-6 transition-all duration-200 hover:shadow-md">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              🔧 Context Configuration
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleCollapse}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
              title="Collapse Panel"
            >
              ◀
            </button>
            <button
              onClick={onOpenSettings}
              className="px-3 py-1 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
            >
              ⚙️
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="space-y-4">
          {/* System Prompt Section */}
          <div className="bg-gray-50 rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <button
                onClick={() => toggleSection("systemPrompt")}
                className="flex justify-between items-center w-full text-left"
              >
                <h3 className="text-base font-semibold text-gray-900">
                  S123 Relation GPT
                </h3>
                <span className="text-gray-500">
                  {expandedSections.systemPrompt ? "▼" : "▶"}
                </span>
              </button>
            </div>
            {expandedSections.systemPrompt && (
              <div className="p-4">
                <textarea
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm overflow-visible"
                  placeholder="Enter the system prompt for evaluating LLM outputs..."
                  value={currentVersion.systemPrompt}
                  onChange={(e) =>
                    setCurrentVersion((prev) => ({
                      ...prev,
                      systemPrompt: e.target.value,
                    }))
                  }
                />
              </div>
            )}
          </div>

          {/* Use Cases & Test Cases Section */}
          <div className="bg-gray-50 rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <button
                onClick={() => toggleSection("useCases")}
                className="flex justify-between items-center w-full text-left"
              >
                <h3 className="text-base font-semibold text-gray-900">
                  Use Cases
                </h3>
                <span className="text-gray-500">
                  {expandedSections.useCases ? "▼" : "▶"}
                </span>
              </button>
            </div>
            {expandedSections.useCases && (
              <div className="p-4">
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 mb-3">
                    Five predefined use cases for LLM-as-a-judge evaluation scenarios. Select a use case to manage its test cases.
                  </div>
                  
                  {/* Use Case Selection */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Select Use Case
                    </label>
                    <select
                      value={selectedUseCaseForTests}
                      onChange={(e) => setSelectedUseCaseForTests(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="">-- Choose a use case --</option>
                      {(currentVersion.useCases || []).map((useCase, index) => (
                        <option key={useCase.id} value={useCase.id}>
                          {index + 1}. {useCase.name} ({useCase.testCases.length} test cases)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Selected Use Case Details */}
                  {selectedUseCaseForTests && (() => {
                    const selectedUseCase = (currentVersion.useCases || []).find(uc => uc.id === selectedUseCaseForTests);
                    const useCaseIndex = (currentVersion.useCases || []).findIndex(uc => uc.id === selectedUseCaseForTests);
                    
                    if (!selectedUseCase) return null;
                    
                    return (
                      <div className="space-y-4">
                        {/* Use Case Info */}
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">
                              {selectedUseCase.name}
                            </h4>
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {selectedUseCase.testCases.length} test cases
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">{selectedUseCase.description}</p>
                          
                          {/* Test Cases Management */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h5 className="text-sm font-medium text-gray-700">Test Cases</h5>
                              <button
                                onClick={() => {
                                  const newTestCase = {
                                    id: `test-${selectedUseCaseForTests}-${Date.now()}`,
                                    input: '',
                                    expectedOutput: '',
                                    useCaseId: selectedUseCaseForTests
                                  };
                                  const updatedUseCases = [...(currentVersion.useCases || [])];
                                  updatedUseCases[useCaseIndex] = {
                                    ...selectedUseCase,
                                    testCases: [...selectedUseCase.testCases, newTestCase]
                                  };
                                  setCurrentVersion((prev) => ({
                                    ...prev,
                                    useCases: updatedUseCases,
                                  }));
                                }}
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                + Add Test Case
                              </button>
                            </div>
                            
                            {/* Test Cases List */}
                            <div className="space-y-3">
                              {selectedUseCase.testCases.map((testCase, testIndex) => (
                                <div key={testCase.id} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                                  <div className="flex items-center justify-between mb-2">
                                    <h6 className="text-sm font-medium text-gray-700">Test Case {testIndex + 1}</h6>
                                    <button
                                      onClick={() => {
                                        const updatedUseCases = [...(currentVersion.useCases || [])];
                                        updatedUseCases[useCaseIndex] = {
                                          ...selectedUseCase,
                                          testCases: selectedUseCase.testCases.filter((_, i) => i !== testIndex)
                                        };
                                        setCurrentVersion((prev) => ({
                                          ...prev,
                                          useCases: updatedUseCases,
                                        }));
                                      }}
                                      className="text-red-500 hover:text-red-700 text-sm"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                  <div className="space-y-2">
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Input
                                      </label>
                                      <textarea
                                        rows={2}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                        value={testCase.input}
                                        onChange={(e) => {
                                          const updatedUseCases = [...(currentVersion.useCases || [])];
                                          const updatedTestCases = [...selectedUseCase.testCases];
                                          updatedTestCases[testIndex] = {
                                            ...testCase,
                                            input: e.target.value,
                                          };
                                          updatedUseCases[useCaseIndex] = {
                                            ...selectedUseCase,
                                            testCases: updatedTestCases,
                                          };
                                          setCurrentVersion((prev) => ({
                                            ...prev,
                                            useCases: updatedUseCases,
                                          }));
                                        }}
                                        placeholder="Enter test case input..."
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-xs font-medium text-gray-700 mb-1">
                                        Expected Output
                                      </label>
                                      <textarea
                                        rows={2}
                                        className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
                                        value={testCase.expectedOutput}
                                        onChange={(e) => {
                                          const updatedUseCases = [...(currentVersion.useCases || [])];
                                          const updatedTestCases = [...selectedUseCase.testCases];
                                          updatedTestCases[testIndex] = {
                                            ...testCase,
                                            expectedOutput: e.target.value,
                                          };
                                          updatedUseCases[useCaseIndex] = {
                                            ...selectedUseCase,
                                            testCases: updatedTestCases,
                                          };
                                          setCurrentVersion((prev) => ({
                                            ...prev,
                                            useCases: updatedUseCases,
                                          }));
                                        }}
                                        placeholder="Enter expected output..."
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              {selectedUseCase.testCases.length === 0 && (
                                <div className="text-center text-gray-500 py-6">
                                  <div className="text-2xl mb-2">📝</div>
                                  <p className="text-sm">No test cases yet</p>
                                  <p className="text-xs text-gray-400">Click &quot;Add Test Case&quot; to get started</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Empty State */}
                  {!selectedUseCaseForTests && (
                    <div className="text-center text-gray-500 py-8">
                      <div className="text-3xl mb-3">🎯</div>
                      <p className="text-sm font-medium mb-1">No Use Case Selected</p>
                      <p className="text-xs">Choose a use case from the dropdown above to manage its test cases</p>
                    </div>
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