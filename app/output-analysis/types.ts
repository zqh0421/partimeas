export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  rubricScores: {
    [criteriaId: string]: number;
  };
  feedback: string;
  suggestions: string[];
  useCase?: string;
  scenarioCategory?: string;
  use_case_title?: string;
  use_case_index?: string;
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
  expectedOutput: string;
  modelOutputs: ModelOutput[];
  useCase?: string;
  scenarioCategory?: string;
  use_case_title?: string;
  use_case_index?: string;
}

export interface RubricOutcome {
  testCaseId: string;
  testCase: TestCase;
  rubricEffectiveness: 'high' | 'medium' | 'low';
  refinementSuggestions: string[];
}

export interface RubricOutcomeWithModelComparison {
  testCaseId: string;
  testCase: TestCaseWithModelOutputs;
  rubricEffectiveness: 'high' | 'medium' | 'low';
  refinementSuggestions: string[];
}

export interface Criteria {
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

export type AnalysisStep = 'sync' | 'run' | 'outcomes'; 