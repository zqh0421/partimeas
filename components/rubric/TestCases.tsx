'use client';

import { useState } from 'react';

interface TestCase {
  id: string;
  name: string;
  input: string;
  expectedOutput?: string;
  category: string;
}

interface RubricData {
  testCases?: TestCase[];
  [key: string]: unknown;
}

interface TestCasesProps {
  rubricData: RubricData;
  setRubricData: (data: RubricData) => void;
}

export default function TestCases({ rubricData, setRubricData }: TestCasesProps) {
  const [testCases, setTestCases] = useState<TestCase[]>(rubricData.testCases || []);
  const [newTestCase, setNewTestCase] = useState<Partial<TestCase>>({
    name: '',
    input: '',
    expectedOutput: '',
    category: 'General'
  });

  const handleAddTestCase = () => {
    if (newTestCase.name && newTestCase.input) {
      const testCase: TestCase = {
        id: Date.now().toString(),
        name: newTestCase.name,
        input: newTestCase.input,
        expectedOutput: newTestCase.expectedOutput || '',
        category: newTestCase.category || 'General'
      };
      
      const updatedTestCases = [...testCases, testCase];
      setTestCases(updatedTestCases);
      setRubricData({
        ...rubricData,
        testCases: updatedTestCases
      });
      
      setNewTestCase({
        name: '',
        input: '',
        expectedOutput: '',
        category: 'General'
      });
    }
  };

  const handleDeleteTestCase = (id: string) => {
    const updatedTestCases = testCases.filter(tc => tc.id !== id);
    setTestCases(updatedTestCases);
    setRubricData({
      ...rubricData,
      testCases: updatedTestCases
    });
  };

  const exampleTestCases = [
    {
      name: "Code Review - Simple Function",
      input: "function add(a, b) { return a + b; }",
      category: "Code Review",
      expectedOutput: "Basic function implementation"
    },
    {
      name: "Essay - Thesis Statement",
      input: "Climate change is a pressing global issue that requires immediate action from governments and individuals alike.",
      category: "Essay Evaluation",
      expectedOutput: "Clear thesis with scope and stance"
    },
    {
      name: "Business Analysis - Market Research",
      input: "Our analysis shows that the target market for our new product is growing at 15% annually, with high demand in urban areas.",
      category: "Business Analysis",
      expectedOutput: "Data-driven analysis with clear conclusions"
    }
  ];

  const categories = ['General', 'Code Review', 'Essay Evaluation', 'Business Analysis', 'Technical Writing', 'Creative Writing'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Cases & Input Examples</h2>
        <p className="text-gray-600 mb-6">
          Add test cases and input examples to validate your rubric against real scenarios.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Test Case</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Test Case Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Code Review - Simple Function"
                value={newTestCase.name}
                onChange={(e) => setNewTestCase({ ...newTestCase, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={newTestCase.category}
                onChange={(e) => setNewTestCase({ ...newTestCase, category: e.target.value })}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Input/Scenario
              </label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter the test input, scenario, or content to be evaluated..."
                value={newTestCase.input}
                onChange={(e) => setNewTestCase({ ...newTestCase, input: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Output (Optional)
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe what a good response should include..."
                value={newTestCase.expectedOutput}
                onChange={(e) => setNewTestCase({ ...newTestCase, expectedOutput: e.target.value })}
              />
            </div>

            <button
              onClick={handleAddTestCase}
              disabled={!newTestCase.name || !newTestCase.input}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Test Case
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Current Test Cases</h3>
          
          {testCases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No test cases added yet.</p>
              <p className="text-sm">Add your first test case to start validating your rubric.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {testCases.map((testCase) => (
                <div key={testCase.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{testCase.name}</h4>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {testCase.category}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Input:</strong> {testCase.input.substring(0, 100)}{testCase.input.length > 100 ? '...' : ''}
                  </div>
                  
                  {testCase.expectedOutput && (
                    <div className="text-sm text-gray-600 mb-3">
                      <strong>Expected:</strong> {testCase.expectedOutput.substring(0, 100)}{testCase.expectedOutput.length > 100 ? '...' : ''}
                    </div>
                  )}
                  
                  <button
                    onClick={() => handleDeleteTestCase(testCase.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Example Test Cases</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exampleTestCases.map((example, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{example.name}</h4>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {example.category}
                </span>
              </div>
              
              <div className="text-sm text-gray-600 mb-2">
                <strong>Input:</strong> {example.input.substring(0, 80)}...
              </div>
              
              <div className="text-sm text-gray-600">
                <strong>Expected:</strong> {example.expectedOutput}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 