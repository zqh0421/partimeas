"use client";

import React from 'react';
import TestCaseCard from './TestCaseCard';

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
}

interface TestCaseManagerProps {
  testCases: TestCase[];
  title: string;
  onAddTestCase: () => void;
  onDeleteTestCase: (testIndex: number) => void;
  onUpdateTestCase: (testCaseId: string, field: 'input' | 'expectedOutput', value: string) => void;
  parseInput?: (input: string) => { useContext: string; userInput: string };
  combineInput?: (useContext: string, userInput: string) => string;
  showUseContext?: boolean;
  className?: string;
}

export default function TestCaseManager({
  testCases,
  title,
  onAddTestCase,
  onDeleteTestCase,
  onUpdateTestCase,
  parseInput,
  combineInput,
  showUseContext = false,
  className = ""
}: TestCaseManagerProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-medium text-gray-700">
          {title} Test Cases
        </h5>
        <button
          onClick={onAddTestCase}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          + Add Test Case
        </button>
      </div>
      
      <div className="space-y-3">
        {testCases.map((testCase, testIndex) => (
          <TestCaseCard
            key={testCase.id}
            testCase={testCase}
            testIndex={testIndex}
            title={title}
            onDelete={() => onDeleteTestCase(testIndex)}
            onUpdate={(field, value) => onUpdateTestCase(testCase.id, field, value)}
            parseInput={parseInput}
            combineInput={combineInput}
            showUseContext={showUseContext}
          />
        ))}
      </div>
    </div>
  );
} 