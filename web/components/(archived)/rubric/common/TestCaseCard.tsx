"use client";

import React from 'react';

interface TestCase {
  id: string;
  input: string;
  context: string;
}

interface TestCaseCardProps {
  testCase: TestCase;
  testIndex: number;
  title: string;
  onDelete: () => void;
  onUpdate: (field: 'input' | 'expectedOutput', value: string) => void;
  parseInput?: (input: string) => { useContext: string; userInput: string };
  combineInput?: (useContext: string, userInput: string) => string;
  showUseContext?: boolean;
}

export default function TestCaseCard({
  testCase,
  testIndex,
  title,
  onDelete,
  onUpdate,
  parseInput,
  combineInput,
  showUseContext = false
}: TestCaseCardProps) {
  const { useContext, userInput } = parseInput ? parseInput(testCase.input) : { useContext: '', userInput: testCase.input };

  return (
    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <h6 className="text-sm font-medium text-gray-700">
          {title} {testIndex + 1}
        </h6>
        <button
          onClick={onDelete}
          className="text-red-500 hover:text-red-700 text-sm"
        >
          ✕
        </button>
      </div>
      <div className="space-y-2">
        {showUseContext && parseInput && combineInput ? (
          <>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Use Context</label>
              <textarea
                rows={2}
                className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                value={useContext}
                onChange={(e) => {
                  const newInput = combineInput(e.target.value, userInput);
                  onUpdate('input', newInput);
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
                  const newInput = combineInput(useContext, e.target.value);
                  onUpdate('input', newInput);
                }}
                placeholder="Enter the specific scenario..."
              />
            </div>
          </>
        ) : (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Input</label>
            <textarea
              rows={2}
              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
              value={testCase.input}
              onChange={(e) => onUpdate('input', e.target.value)}
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Context</label>
          <textarea
            rows={2}
            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
            value={testCase.context}
            onChange={(e) => onUpdate('context', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
} 