import UseCaseSelector from '@/components/(archived)/output-analysis/UseCaseSelector';
import CriteriaSelector from '@/components/(archived)/rubric/CriteriaSelector';
import { TestCase, Criteria } from '../../../types/types';
import { validateSelections } from '../../../utils/analysisUtils';

interface SyncStepProps {
  testCases: TestCase[];
  criteria: Criteria[];
  selectedUseCaseId: string;
  selectedScenarioCategory: string;
  selectedCriteriaId: string;
  selectedSystemPrompt: string;
  validationError: string;
  onUseCaseSelected: (useCaseId: string) => void;
  onScenarioCategorySelected: (categoryId: string) => void;
  onUseCaseDataLoaded: (useCaseTestCases: Array<{
    id: string;
    input: string;
    context: string;
    modelName?: string;
    timestamp?: string;
    useCase?: string;
    scenarioCategory?: string;
    use_case_title?: string;
    use_case_index?: string;
  }>) => void;
  onCriteriaSelected: (criteriaId: string) => void;
  onCriteriaLoaded: (loadedCriteria: Criteria[]) => void;
  onUseCaseError: (error: string) => void;
  onCriteriaError: (error: string) => void;
  onConfirmSelections: () => void;
  setValidationError: (error: string) => void;
}

export default function SyncStep({
  testCases,
  criteria,
  selectedUseCaseId,
  selectedScenarioCategory,
  selectedCriteriaId,
  selectedSystemPrompt,
  validationError,
  onUseCaseSelected,
  onScenarioCategorySelected,
  onUseCaseDataLoaded,
  onCriteriaSelected,
  onCriteriaLoaded,
  onUseCaseError,
  onCriteriaError,
  onConfirmSelections,
  setValidationError,
}: SyncStepProps) {
  const handleConfirmSelections = () => {
    const error = validateSelections(
      selectedUseCaseId,
      selectedScenarioCategory,
      selectedCriteriaId,
      testCases,
      criteria
    );
    
    if (error) {
      setValidationError(error);
      return;
    }
    
    setValidationError('');
    onConfirmSelections();
  };

  return (
    <div className="py-12">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Load Data for Evaluation
          </h2>
          <p className="text-gray-600 mb-8">
            Select test cases and rubric criteria for evaluation. Models will be automatically configured.
          </p>
        </div>

        {/* Four Card Layout - single column */}
        <div className="grid grid-cols-1 gap-8">
          {/* Use Case Selection */}
          <div>
            <UseCaseSelector
              onUseCaseSelected={onUseCaseSelected}
              onScenarioCategorySelected={onScenarioCategorySelected}
              onDataLoaded={onUseCaseDataLoaded}
              onError={onUseCaseError}
              testCases={testCases}
            />
          </div>

          {/* Criteria Selection */}
          <div>
            <CriteriaSelector
              onCriteriaSelected={onCriteriaSelected}
              onCriteriaLoaded={onCriteriaLoaded}
              onError={onCriteriaError}
            />
          </div>
        </div>

        {/* Status and Confirmation Section */}
        <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Configuration Status
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${selectedScenarioCategory ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-sm text-gray-700">
                Test Cases
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${selectedCriteriaId ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <span className="text-sm text-gray-700">
                Criteria: {selectedCriteriaId || 'Not selected'}
              </span>
            </div>
          </div>

          {validationError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{validationError}</p>
            </div>
          )}

          <div className="flex justify-center">
            <button
              onClick={handleConfirmSelections}
              disabled={!selectedUseCaseId || !selectedScenarioCategory || !selectedCriteriaId}
              className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                selectedUseCaseId && selectedScenarioCategory && selectedCriteriaId
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Confirm Selections
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 