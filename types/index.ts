
export type AnalysisStep = 'sync' | 'run' | 'outcomes' | 'setup' | 'running' | 'complete';

export type CurrentPhase = 'generating' | 'evaluating' | 'complete';

export type RubricEffectiveness = 'high' | 'medium' | 'low';

export type HistoryAction = 'created' | 'modified' | 'merged' | 'star' | 'unstared';

export type ChangeType = 'criteria_name' | 'criteria_description' | 'add_criteria' | 'delete_criteria' | 'change_category' | 'add_category' | 'merge_versions';


export interface TestCase {
  id: string;
  context: string;
  input: string;
  rubricScores?: {
    [criteriaId: string]: number;
  };
  feedback?: string;
  suggestions?: string[];
  useCase?: string;
  scenarioCategory?: string;
  use_case_title?: string;
  use_case_index?: string;
  useCaseId?: string;
  modelName?: string;
  timestamp?: string;
}

export interface ModelOutput {
  modelId: string;
  modelName: string;
  output: string;
  rubricScores: {
    [criteriaId: string]: number;
  };
  feedback: string;
  suggestions: string[];
  timestamp: string;
}

export interface TestCaseWithModelOutputs {
  id: string;
  input: string;
  context: string;
  modelOutputs: ModelOutput[];
  useCase?: string;
  scenarioCategory?: string;
  use_case_title?: string;
  use_case_index?: string;
}

export interface CriteriaData {
  id: string;
  category: string;
  criteria: string;
  description: string;
  weight: number;
  score1: string;
  score2: string;
  score3: string;
  score4: string;
  score5: string;
}

export interface RubricItem {
  id: string;
  criteria: string;
  description: string;
  category: string;
}

export interface RubricOutcome {
  testCaseId: string;
  testCase: TestCase;
  rubricEffectiveness: RubricEffectiveness;
  refinementSuggestions: string[];
}

export interface RubricOutcomeWithModelComparison {
  testCaseId: string;
  testCase: TestCaseWithModelOutputs;
  rubricEffectiveness: RubricEffectiveness;
  refinementSuggestions: string[];
  modelOutputs?: ModelOutput[];
}

export interface EvaluationResult {
  id: string;
  testCaseInput: string;
  llmResponse: string;
  scores: {
    [criteriaId: string]: number;
  };
  feedback: string;
  overallScore: number;
  modelName: string;
  timestamp: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  modifier: string;
  action: HistoryAction;
  field?: string;
  oldValue?: string;
  newValue?: string;
  comment?: string;
  version?: string;
  changeType?: ChangeType;
  parentId?: string; // 前继节点的ID，用于构建分支结构
  summary?: string; // AI生成的版本摘要
  differenceSummary?: string; // 客观的变化描述
}

export interface VersionData {
  versionId: string;
  version: string;
  timestamp: Date;
  modifier: string;
  action: string;
  field?: string;
  comment?: string;
}

export interface UseCase {
  id: string;
  name: string;
  description: string;
  testCases: TestCase[];
}

export interface RubricVersion {
  id: string;
  version: string;
  name: string;
  systemPrompt: string;
  evaluationPrompt: string;
  rubricItems: RubricItem[];
  testCases: TestCase[];
  useCases?: UseCase[];
  createdAt: Date;
  history: HistoryEntry[];
}

export interface UseCaseConfig {
  id: string;
  name: string;
  description: string;
  spreadsheetId: string;
  sheetName: string;
  category: string;
  tags: string[];
  dataType: string;
}

export interface CriteriaConfig {
  id: string;
  name: string;
  description: string;
  spreadsheetId: string;
  sheetName: string;
  category: string;
}

export interface AnalysisState {
  currentStep: AnalysisStep;
  isLoading: boolean;
  testCases: TestCase[];
  testCasesWithModelOutputs: TestCaseWithModelOutputs[];
  criteria: CriteriaData[];
  outcomes: RubricOutcome[];
  outcomesWithModelComparison: RubricOutcomeWithModelComparison[];
  selectedTestCaseIndex: number;
  selectedUseCaseId: string;
  selectedScenarioCategory: string;
  selectedCriteriaId: string;
  selectedSystemPrompt: string;
  shouldStartEvaluation: boolean;
  evaluationProgress: any;
  currentTestCaseIndex: number;
  validationError: string;
}

export interface AnalysisHandlers {
  handleUseCaseSelected: (useCaseId: string) => void;
  handleScenarioCategorySelected: (categoryId: string) => void;
  handleMultiLevelSelectionChange: (selections: Array<{
    useCaseId: string;
    scenarioCategoryIds: string[];
  }>) => void;
  handleUseCaseDataLoaded: (testCases: TestCase[]) => void;
  handleUseCaseError: (error: string) => void;
  handleEvaluationComplete: (results: RubricOutcome[]) => void;
  handleModelComparisonEvaluationComplete: (results: RubricOutcomeWithModelComparison[]) => void;
  handleEvaluationError: (error: string) => void;
  handleEvaluationProgress: (currentIndex: number, progress: number) => void;
  handleStartEvaluation: () => void;
  handleTestCaseSelect: (index: number) => void;
  handleRestart: () => void;
}

export interface CaseData {
  useCaseId: string;
  name: string;
  description: string;
  testCasesCount: number;
}