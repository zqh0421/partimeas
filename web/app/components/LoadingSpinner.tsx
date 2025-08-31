import React from 'react';
import { AnalysisStep, TestCaseWithModelOutputs } from "@/app/types";

// Reusable spinner components
export const Spinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6'
  };
  
  return (
    <span 
      className={`${sizeClasses[size]} border-2 rounded-full animate-spin ${className}`}
      style={{
        borderColor: 'inherit',
        borderTopColor: 'transparent'
      }}
    />
  );
};

export const ButtonSpinner: React.FC<{
  className?: string;
  light?: boolean;
}> = ({ className = '', light = false }) => {
  const borderClass = light 
    ? 'border-white/50 border-t-white' 
    : 'border-gray-300 border-t-gray-600';
    
  return (
    <span 
      className={`w-4 h-4 border-2 rounded-full animate-spin ${borderClass} ${className}`}
    />
  );
};

export const InlineSpinner: React.FC<{
  text?: string;
  className?: string;
  spinnerClassName?: string;
}> = ({ text, className = '', spinnerClassName = '' }) => {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span 
        className={`w-3 h-3 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin ${spinnerClassName}`}
      />
      {text && <span>{text}</span>}
    </span>
  );
};

export default function LoadingSpinner({
  currentStep,
  testCasesLength,
  evaluationProgress,
  testCasesWithModelOutputs = [],
}: {
  currentStep: AnalysisStep;
  testCasesLength: number;
  evaluationProgress: number;
  testCasesWithModelOutputs?: TestCaseWithModelOutputs[];
}) {
  // Calculate model count dynamically from actual data
  const modelCount =
    testCasesWithModelOutputs.length > 0
      ? testCasesWithModelOutputs[0].modelOutputs?.length || 0
      : 0;
  const totalEvaluations = testCasesLength * modelCount;
  const completedCount = Math.round(
    (evaluationProgress / 100) * totalEvaluations
  );

  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">
          {currentStep === "sync" && "Processing spreadsheet data..."}
          {currentStep === "run" &&
            `Evaluating ${testCasesLength} test cases with ${modelCount} model${
              modelCount !== 1 ? "s" : ""
            }...`}
          {currentStep === "outcomes" && "Analyzing outcomes..."}
        </p>
        {currentStep === "run" && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2 max-w-md mx-auto">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${evaluationProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {Math.round(evaluationProgress)}% complete
            </p>
            {totalEvaluations > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {completedCount} of {totalEvaluations} LLM responses completed
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
