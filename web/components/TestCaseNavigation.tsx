'use client';

export default function TestCaseNavigation({ 
  testCases, 
  selectedTestCaseIndex, 
  onTestCaseSelect,
  className = "",
  showContent = true
}: {
  testCases: {
    context: string;
    input: string;
  }[];
  selectedTestCaseIndex: number;
  onTestCaseSelect: (index: number) => void;
  className?: string;
  showContent?: boolean;
}) {
  const selectedTestCase = testCases[selectedTestCaseIndex];

  return (
    <div className={className}>
      {/* Navigation Buttons */}
      <div className="flex justify-center space-x-2 mb-6">
        {testCases.map((_, index) => (
          <button
            key={index}
            onClick={() => onTestCaseSelect(index)}
            className={`px-4 py-2 rounded-lg font-base transition-colors ${
              selectedTestCaseIndex === index
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            Test Case {index + 1}
          </button>
        ))}
      </div>

      {/* Test Case Content */}
      {showContent && selectedTestCase && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Test Case {selectedTestCaseIndex + 1}
          </h3>
          <div className="bg-gray-50 p-3 rounded text-sm">
            <p className="text-gray-600 mt-1 font-bold">
              {selectedTestCase.context || 'No context available'}
            </p>
            <p className="text-gray-600 mt-1">
              {selectedTestCase.input || 'No input available'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}