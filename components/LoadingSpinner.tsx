import { AnalysisStep, TestCaseWithModelOutputs } from '@/types';

export default function LoadingSpinner({ 
  currentStep,
  testCasesLength, 
  evaluationProgress,
  testCasesWithModelOutputs = []
}: {
  currentStep: AnalysisStep;
  testCasesLength: number;
  evaluationProgress: number;
  testCasesWithModelOutputs?: TestCaseWithModelOutputs[];
}) {
  // Calculate model count dynamically from actual data
  const modelCount = testCasesWithModelOutputs.length > 0 
    ? testCasesWithModelOutputs[0].modelOutputs?.length || 0 
    : 0;
  const totalEvaluations = testCasesLength * modelCount;
  const completedCount = Math.round((evaluationProgress / 100) * totalEvaluations);
  
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">
          {currentStep === 'sync' && 'Processing spreadsheet data...'}
          {currentStep === 'run' && `Evaluating ${testCasesLength} test cases with ${modelCount} model${modelCount !== 1 ? 's' : ''}...`}
          {currentStep === 'outcomes' && 'Analyzing outcomes...'}
        </p>
        {currentStep === 'run' && (
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