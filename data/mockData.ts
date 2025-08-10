import { HistoryEntry, RubricVersion, CriteriaConfig, UseCaseConfig, CaseData } from '@/types';

export const mockTestCases = [
  {
    id: 'mock-test-1',
    input: 'Marcus, a 5-year-old child, is sitting in circle time. The teacher asks the class to raise their hand if they have something to share about their weekend. Marcus immediately starts talking without raising his hand, disrupting the flow of the discussion.',
    context: 'Analysis should consider the child\'s developmental stage, classroom dynamics, and appropriate interventions.',
    modelName: 'Mock Model',
    timestamp: new Date().toISOString(),
    useCase: 'General Analysis',
    scenarioCategory: 'Classroom Behavior',
    rubricScores: {},
    feedback: '',
    suggestions: []
  },
  {
    id: 'mock-test-2',
    input: 'Sarah, a 4-year-old, has been having difficulty transitioning from free play to cleanup time. She often cries and refuses to put away toys, requiring individual attention from teachers.',
    context: 'Response should address transition strategies and emotional regulation support.',
    modelName: 'Mock Model',
    timestamp: new Date().toISOString(),
    useCase: 'General Analysis',
    scenarioCategory: 'Transitions',
    rubricScores: {},
    feedback: '',
    suggestions: []
  },
  {
    id: 'mock-test-3',
    input: 'During snack time, 3-year-old Jake consistently takes food from other children\'s plates. When redirected, he becomes upset and sometimes hits the table.',
    context: 'Analysis should consider developmental appropriateness and guidance strategies.',
    modelName: 'Mock Model',
    timestamp: new Date().toISOString(),
    useCase: 'General Analysis',
    scenarioCategory: 'Social Skills',
    rubricScores: {},
    feedback: '',
    suggestions: []
  }
];

export const mockEvaluationResults = [
  {
    id: 'eval-4',
    testCaseInput: 'I wanted reflective questions because I was feeling a disconnect between the way that I was framing our conversations and the teachers\' understanding (of my words and of the child). I don\'t want to include observations that don\'t directly involve M, but I\'d like some reflective questions to explore. I want them to tie in with M and his history and experiences while also addressing the classroom environment and social and emotional supports.',
    llmResponse: `Reflective Questions: Exploring the Environment & Emotional Supports

Co-Regulation & Trauma Sensitivity:

How can we continue using co-regulating adult presence to help Messiah sustain attention and manage transitions, especially during less structured times like centers?

Given Messiah's history of trauma and the potential for hypervigilance, how can we create a classroom rhythm that balances stimulation and calm moments, helping him feel safe without needing to be "on alert"?

Social Problem-Solving & Peer Dynamics:

How can we strengthen peer problem-solving skills in ways that reduce "policing" behaviors and instead foster empathy and collaboration?

What language or modeling can help peers support Messiah in moments of dysregulation without triggering feelings of shame or exclusion?

Emotional Expression & Repair:

When Messiah expresses frustration (e.g., "Lunch is boring!"), how can we validate his emotions while guiding him toward alternative ways of expressing them?

How can we use everyday moments to model emotional repair (e.g., "It looks like you didn't mean to splash me. What could we do to fix it?") instead of relying on scripted apologies?

Classroom Regulation Spaces:

Does Messiah view spaces like the sensory table or cozy corner as tools for regulation?

How might we adjust the use of these spaces to ensure they are always framed as supportive, not punitive, especially for children with trauma histories who may be sensitive to perceived exclusion?

Supporting Autonomy & Boundaries:

In moments of dysregulation, how can we offer Messiah choices that give him a sense of control while still maintaining classroom boundaries?

Are there opportunities to shift from directive language ("Don't do that") to reflective or choice-based prompts ("I see you want to splash—what's another way we can play with the water?")?`,
    scores: {
      '1': 5, // Theoretical Accuracy
      '2': 5, // Safety & Ethics
      '3': 4, // Practical Application
      '4': 5, // Assessment & Observation
      '5': 4, // Communication & Collaboration
      '6': 5, // Developmental Appropriateness
      '7': 4, // Evidence-Based Practice
      '8': 3, // Cultural Sensitivity
      '9': 4, // Resource Awareness
      '10': 5, // Problem-Solving
      '11': 4, // Adaptability
      '12': 3, // Professional Boundaries
      '13': 4, // Collaboration
      '14': 5, // Child-Centered Approach
      '15': 4, // Documentation
      '16': 3, // Reflection
      '17': 4, // Growth Mindset
      '18': 4  // Systems Thinking
    },
    feedback: 'Excellent theoretical grounding and practical application of trauma-informed care principles.',
    overallScore: 4.2,
    modelName: 'GPT-4',
    timestamp: new Date('2024-12-15T10:30:00').toISOString()
  }
];

export const mockCaseData: Record<string, CaseData> = {
  case1: {
    useCaseId: 'usecase-5',
    name: 'Providing reflective questions for teacher meetings',
    description: 'For use case: Providing reflective questions (and explanations for why those questions may be helpful) that the worker could use to facilitate discussion in a future teacher meeting …. including questions that help reflect on the teacher\'s strengths and concerning behaviors. The goal here is to help the S123 worker work with the teacher to help the teacher reflect on their strengths and any concerning behaviors, so that they could collaboratively work together to understand how the teacher could best bring out their strengths.',
    testCasesCount: 9
  },
  case2: {
    useCaseId: 'usecase-6',
    name: 'Providing reflective questions for teacher meetings',
    description: 'Create reflective questions that help workers facilitate discussion in future teacher meetings, addressing disconnects between framing and understanding',
    testCasesCount: 3
  }
};

export const mockHistoryData: HistoryEntry[] = [
  {
    id: 'v1.0-created',
    timestamp: new Date('2024-01-15T10:30:00'),
    modifier: 'Dr. Sarah Johnson',
    action: 'created',
    field: 'Evaluation Framework',
    newValue: 'Initial child development evaluation framework with 18 criteria',
    comment: 'Created comprehensive evaluation framework for child development AI responses',
    version: 'v1.0',
    changeType: 'add_criteria',
    parentId: undefined,
    differenceSummary: '+18 Evaluation criteria'
  },
  {
    id: 'v1.1-safety',
    timestamp: new Date('2024-01-20T14:15:00'),
    modifier: 'Prof. Michael Chen',
    action: 'modified',
    field: 'Safety Guidelines',
    oldValue: 'Basic safety protocols',
    newValue: 'Enhanced safety protocols with emergency procedures and risk assessment',
    comment: 'Updated safety guidelines to include comprehensive emergency response procedures',
    version: 'v1.1',
    changeType: 'criteria_description',
    parentId: 'v1.0-created',
    differenceSummary: 'Modified Safety description'
  },
  {
    id: 'v1.2-communication',
    timestamp: new Date('2024-02-01T09:45:00'),
    modifier: 'Dr. Emily Rodriguez',
    action: 'modified',
    field: 'Communication Standards',
    oldValue: 'Standard communication protocols',
    newValue: 'Multilingual communication protocols with cultural sensitivity and accessibility',
    comment: 'Enhanced communication standards to support diverse populations',
    version: 'v1.2',
    changeType: 'criteria_description',
    parentId: 'v1.0-created',
    differenceSummary: '+1 Communication criteria'
  }
];

export const mockIndividualCriteriaHistory: HistoryEntry[] = [
  {
    id: 'criteria-1-v1',
    timestamp: new Date('2024-01-15T10:30:00'),
    modifier: 'Dr. Sarah Johnson',
    action: 'created',
    field: 'Theoretical Accuracy',
    newValue: 'Demonstrates accurate understanding of child development theories',
    comment: 'Initial creation of theoretical accuracy criteria',
    version: 'v1.0',
    changeType: 'add_criteria',
    parentId: undefined,
    differenceSummary: 'Created Theoretical Accuracy criteria'
  }
];

export const mockCurrentVersion: RubricVersion = {
  id: '1',
  version: 'v2.4',
  name: 'Child Development Assessment Framework',
  systemPrompt: `Purpose: This GPT model is designed to act as an expert in understanding the needs of children and people supporting those children in relation to specific theories or approaches...`,
  evaluationPrompt: `You are an expert evaluator of AI responses in child development scenarios...`,
  rubricItems: [
    {
      id: '1',
      criteria: 'Theoretical Accuracy & Application',
      description: 'Demonstrates accurate understanding and application of child development theories such as Piaget, Vygotsky, Erikson, and contemporary frameworks like Polyvagal Theory and Neurosequential Model.',
      category: 'Theory Application'
    },
    {
      id: '2',
      criteria: 'Safety & Ethics',
      description: 'Ensures child safety and ethical considerations in all recommendations. Evaluates awareness of potential risks, appropriate boundaries, confidentiality, and child-centered approaches.',
      category: 'Safety & Ethics'
    },
    {
      id: '3',
      criteria: 'Practical Application',
      description: 'Provides concrete, actionable strategies that can be implemented in real-world settings. Evaluates the feasibility, appropriateness, and effectiveness of suggested interventions.',
      category: 'Practical Application'
    },
    {
      id: '4',
      criteria: 'Assessment & Observation',
      description: 'Demonstrates understanding of developmentally appropriate assessment methods and observational techniques.',
      category: 'Assessment & Observation'
    },
    {
      id: '5',
      criteria: 'Communication & Collaboration',
      description: 'Provides clear, professional communication strategies and promotes effective collaboration between caregivers, educators, and families.',
      category: 'Communication & Collaboration'
    }
  ],
  testCases: [],
  createdAt: new Date('2024-01-15T10:30:00'),
  history: mockHistoryData
};

export const mockCriteriaConfig: CriteriaConfig[] = [
  {
    id: 'rubric-criteria',
    name: 'Rubric Criteria (Test Version)',
    description: '',
    spreadsheetId: '1xvWtZMe9kWyuKZEsZCUNZkxUxK8nCz20eswaNa_WJws',
    sheetName: 'Sheet1',
    category: ''
  }
];

export const mockUseCaseConfig: UseCaseConfig[] = [
  {
    id: 'test-cases',
    name: 'Test Cases',
    description: 'Test cases for rubric evaluation and analysis',
    spreadsheetId: '1GAKpJzbIWEIi2RxwrKcJVe0fLj2glpuDu1rDC_UkSAs',
    sheetName: 'Sheet1',
    category: 'Testing',
    tags: ['evaluation', 'analysis', 'rubric'],
    dataType: 'test-cases'
  }
];

export const mockModelConfig = {
  availableModels: [
    'gpt-4',
    'gpt-3.5-turbo',
    'claude-3-opus',
    'claude-3-sonnet',
    'gemini-pro'
  ],
  defaultModel: 'gpt-4',
  modelSettings: {
    temperature: 0.7,
    maxTokens: 2000,
    topP: 1.0
  }
};

export const mockData = {
  testCases: mockTestCases,
  evaluationResults: mockEvaluationResults,
  historyData: mockHistoryData,
  individualCriteriaHistory: mockIndividualCriteriaHistory,
  currentVersion: mockCurrentVersion,
  useCaseConfig: mockUseCaseConfig,
  criteriaConfig: mockCriteriaConfig,
  modelConfig: mockModelConfig
};

export default mockData;