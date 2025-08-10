
export type AnalysisStep = 'sync' | 'run' | 'outcomes' | 'setup' | 'running' | 'complete';

export type CurrentPhase = 'generating' | 'evaluating' | 'complete';

export type RubricEffectiveness = 'high' | 'medium' | 'low';

export type HistoryAction = 'created' | 'modified' | 'merged' | 'star' | 'unstared';

export type ChangeType = 'criteria_name' | 'criteria_description' | 'add_criteria' | 'delete_criteria' | 'change_category' | 'add_category' | 'merge_versions';


// Updated scoring interfaces for new rubric structure
export interface SubcriteriaScore {
  subcriteriaId: string;
  score: number; // 0, 1, or 2
  scoreLevel: ScoreLevel;
  reasoning?: string;
}

export interface CriteriaEvaluation {
  criteriaId: string;
  subcriteriaScores: SubcriteriaScore[];
  overallScore?: number; // Computed from subcriteria
  feedback?: string;
}

export interface ComponentEvaluation {
  responseComponentId: string;
  criteriaEvaluations: CriteriaEvaluation[];
  overallScore?: number; // Computed from criteria
  feedback?: string;
}

export interface NewEvaluationResult {
  id: string;
  testCaseId: string;
  testCaseInput: string;
  llmResponse: string;
  componentEvaluations: ComponentEvaluation[];
  overallScore: number; // 0-2 scale
  feedback: string;
  suggestions: string[];
  modelName: string;
  timestamp: string;
  rubricStructureId: string;
}

export interface TestCase {
  id: string;
  context: string;
  input: string;
  rubricScores?: {
    [criteriaId: string]: number;
  };
  // New scoring structure
  componentEvaluations?: ComponentEvaluation[];
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
  // New scoring structure
  componentEvaluations?: ComponentEvaluation[];
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

// New rubric structure based on updated criteria
export interface ScoreLevel {
  score: number; // 0, 1, or 2
  meaning: string;
  examples: string[]; // Brief concrete examples
}

export interface Subcriteria {
  id: string;
  name: string;
  description: string;
  scoreLevels: ScoreLevel[];
}

export interface Criteria {
  id: string;
  name: string;
  description: string;
  subcriteria: Subcriteria[];
}

export interface ResponseComponent {
  id: string;
  name: string; // e.g., "Overall", "Explanations"
  criteria: Criteria[];
}

export interface RubricStructure {
  id: string;
  name: string;
  version: string;
  responseComponents: ResponseComponent[];
  createdAt: Date;
  updatedAt: Date;
}

// Legacy interfaces - keeping for backward compatibility during transition
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
  rubricItems: RubricItem[]; // Legacy - keeping for backward compatibility
  rubricStructure?: RubricStructure; // New structured rubric
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

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AnalysisState {
  currentStep: AnalysisStep;
  isLoading: boolean;
  testCases: TestCase[];
  testCasesWithModelOutputs: TestCaseWithModelOutputs[];
  criteria: CriteriaData[]; // Legacy
  rubricStructure?: RubricStructure; // New structured rubric
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

// Utility types for working with the new rubric structure
export type RubricScoreRange = 0 | 1 | 2;

export interface ModelScore {
  modelId: string;
  modelName: string;
  scores: Record<string, number>; // criteriaId -> score
}

export interface RubricUtilityTypes {
  // Helper for creating score levels
  createScoreLevel: (score: RubricScoreRange, meaning: string, examples: string[]) => ScoreLevel;
  
  // Helper for calculating overall scores
  calculateCriteriaScore: (subcriteriaScores: SubcriteriaScore[]) => number;
  calculateComponentScore: (criteriaEvaluations: CriteriaEvaluation[]) => number;
  calculateOverallScore: (componentEvaluations: ComponentEvaluation[]) => number;
}

// Example structure showing the new rubric format
export const EXAMPLE_RUBRIC_STRUCTURE: RubricStructure = {
  id: "rubric-2024-v1",
  name: "Updated Assessment Rubric",
  version: "1.0",
  responseComponents: [
    {
      id: "overall",
      name: "Overall",
      criteria: [
        {
          id: "strengths-based-framing",
          name: "Strengths-Based Framing",
          description: "The response is affirming, constructive, and encourages self-reflection without judgment.",
          subcriteria: [
            {
              id: "strengths-based-framing-sub",
              name: "Strengths-Based Framing",
              description: "The response is affirming, constructive, and encourages self-reflection without judgment.",
              scoreLevels: [
                {
                  score: 0,
                  meaning: "Critical or deficit-focused language",
                  examples: ["Response uses harsh criticism", "Focuses only on what's wrong"]
                },
                {
                  score: 1,
                  meaning: "Mostly constructive but with minor negative framing",
                  examples: ["Generally positive but some negative language", "Mixed tone"]
                },
                {
                  score: 2,
                  meaning: "Fully strengths-based and encouraging",
                  examples: ["Consistently positive and affirming", "Encourages growth mindset"]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: "explanations",
      name: "Explanations",
      criteria: [
        {
          id: "explanation-quality",
          name: "Explanation Quality",
          description: "The explanation is clear and accurate",
          subcriteria: [
            {
              id: "clear-explanations",
              name: "Clear Explanations",
              description: "The explanation would be interpretable to even a toddler.",
              scoreLevels: [
                {
                  score: 0,
                  meaning: "No explanations or unclear reasoning",
                  examples: ["Missing explanations", "Confusing language"]
                },
                {
                  score: 1,
                  meaning: "Partial or vague explanations",
                  examples: ["Some explanation but lacks clarity", "Incomplete reasoning"]
                },
                {
                  score: 2,
                  meaning: "Clear, concise, and directly tied to the scenario inputted to the model",
                  examples: ["Crystal clear explanations", "Easy to understand", "Well connected to input"]
                }
              ]
            },
            {
              id: "accurate-explanations",
              name: "Accurate Explanations",
              description: "The explanation is accurate based on the information presented to the model.",
              scoreLevels: [
                {
                  score: 0,
                  meaning: "Inaccurate explanation",
                  examples: ["Factually wrong", "Misinterprets the scenario"]
                },
                {
                  score: 1,
                  meaning: "Partially inaccurate or sound explanation",
                  examples: ["Mostly accurate with minor errors", "Generally sound reasoning"]
                },
                {
                  score: 2,
                  meaning: "Accurate, sound explanation",
                  examples: ["Completely accurate", "Factually correct", "Sound reasoning throughout"]
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  createdAt: new Date(),
  updatedAt: new Date()
};