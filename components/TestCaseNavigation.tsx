'use client';

interface TestCaseNavigationProps {
  testCasesCount: number;
  selectedTestCaseIndex: number;
  onTestCaseSelect: (index: number) => void;
  className?: string;
}

export default function TestCaseNavigation({ 
  testCasesCount, 
  selectedTestCaseIndex, 
  onTestCaseSelect,
  className = ""
}: TestCaseNavigationProps) {
  return (
    <div className={`flex justify-center space-x-2 ${className}`}>
      {Array.from({ length: testCasesCount }, (_, index) => (
        <button
          key={index}
          onClick={() => onTestCaseSelect(index)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedTestCaseIndex === index
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Test Case {index + 1}
        </button>
      ))}
    </div>
  );
}