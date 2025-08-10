'use client';

export default function TestCaseContext({ 
  testCase, 
  testCaseIndex,
  className = ""
}: {
  testCase: {
    context: string;
    input: string;
  };
  testCaseIndex: number;
  className?: string;
}) {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Test Case {testCaseIndex + 1}
      </h3>
      <div className="bg-gray-50 p-3 rounded text-sm">
        <p className="text-gray-600 mt-1 font-bold">
          {testCase.context || 'No context available'}
        </p>
        <p className="text-gray-600 mt-1">
          {testCase.input || 'No input available'}
        </p>
      </div>
    </div>
  );
}