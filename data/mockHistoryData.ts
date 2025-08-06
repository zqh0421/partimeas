import { HistoryEntry, RubricVersion } from '../types/rubric';

// Mock data for overall evaluation criteria version history with branching
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
    parentId: undefined, // 真正的根节点，没有前继
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
    parentId: 'v1.0-created', // 从根节点分支出来
    differenceSummary: '+1 Communication criteria'
  },
  {
    id: 'v1.3-merge',
    timestamp: new Date('2024-02-10T16:20:00'),
    modifier: 'System',
    action: 'merged',
    field: 'Version Merge',
    oldValue: 'Separate safety and communication branches',
    newValue: 'Merged safety and communication features into main branch',
    comment: 'Merged safety and communication branches into unified framework',
    version: 'v1.3',
    changeType: 'merge_versions',
    parentId: 'v1.1-safety', // 主要前继节点
    differenceSummary: 'Merged Safety + Communication branches'
  }
];

// Mock data for individual criteria history (for comparison)
export const mockIndividualCriteriaHistory: HistoryEntry[] = [
  {
    id: 'criteria-1-created',
    timestamp: new Date('2024-01-15T10:30:00'),
    modifier: 'Dr. Sarah Johnson',
    action: 'created',
    field: 'Theory Application',
    newValue: 'Theoretical Accuracy & Application',
    comment: 'Created new criteria for theoretical application assessment',
    version: 'v1.0',
    differenceSummary: '+1 Theory Application criteria'
  },
  {
    id: 'criteria-1-modified',
    timestamp: new Date('2024-01-20T14:15:00'),
    modifier: 'Prof. Michael Chen',
    action: 'modified',
    field: 'Description',
    oldValue: 'Basic theoretical application',
    newValue: 'Comprehensive theoretical application with practical examples',
    comment: 'Enhanced description to include practical application examples',
    version: 'v1.1',
    differenceSummary: 'Modified Theory Application description'
  },
  {
    id: 'criteria-1-category-change',
    timestamp: new Date('2024-02-01T09:45:00'),
    modifier: 'Dr. Emily Rodriguez',
    action: 'modified',
    field: 'Category',
    oldValue: 'Theory Application',
    newValue: 'Practical Application',
    comment: 'Moved criteria to practical application category for better alignment',
    version: 'v1.2',
    differenceSummary: 'Changed Theory → Practical Application category'
  }
];

// Mock data for current version
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
      description: 'Demonstrates accurate understanding and application of child development theories',
      category: 'Theory Application'
    },
    {
      id: '2',
      criteria: 'Safety & Ethics',
      description: 'Ensures child safety and ethical considerations in all recommendations',
      category: 'Safety & Ethics'
    }
  ],
  testCases: [
    {
      id: '1',
      input: 'A 4-year-old child is having difficulty transitioning from playtime to cleanup time in preschool.',
      expectedOutput: 'Response should demonstrate understanding of child development theories and provide practical strategies.'
    },
    {
      id: '2',
      input: 'A parent is concerned about their 2-year-old\'s speech development.',
      expectedOutput: 'Response should include assessment guidance and family-centered approaches.'
    }
  ],
  useCases: [
    {
      id: 'usecase-1',
      name: 'Generate reflective questions',
      description: 'Create thoughtful questions that help students, teachers, or parents reflect on their learning and development process',
      testCases: [
        {
          id: 'test-1-1',
          input: 'A teacher wants to help students reflect on their learning process',
          expectedOutput: 'Response should include open-ended questions that encourage self-reflection and metacognition',
          useCaseId: 'usecase-1'
        },
        {
          id: 'test-1-2',
          input: 'A counselor needs questions to help clients process their emotions',
          expectedOutput: 'Response should provide therapeutic questions that promote emotional awareness and processing',
          useCaseId: 'usecase-1'
        }
      ]
    },
    {
      id: 'usecase-2',
      name: 'Provide developmental guidance',
      description: 'Offer age-appropriate guidance and recommendations for child development milestones',
      testCases: [
        {
          id: 'test-2-1',
          input: 'A parent asks about their 3-year-old\'s social development',
          expectedOutput: 'Response should include typical social milestones and strategies for supporting social growth',
          useCaseId: 'usecase-2'
        },
        {
          id: 'test-2-2',
          input: 'A teacher needs strategies for supporting a child with learning differences',
          expectedOutput: 'Response should provide inclusive teaching strategies and accommodation suggestions',
          useCaseId: 'usecase-2'
        }
      ]
    },
    {
      id: 'usecase-3',
      name: 'Address behavioral challenges',
      description: 'Help understand and respond to challenging behaviors in developmentally appropriate ways',
      testCases: [
        {
          id: 'test-3-1',
          input: 'A child is having tantrums during transitions',
          expectedOutput: 'Response should provide strategies for smooth transitions and emotional regulation',
          useCaseId: 'usecase-3'
        },
        {
          id: 'test-3-2',
          input: 'A student is struggling with attention in class',
          expectedOutput: 'Response should offer classroom management strategies and attention-building activities',
          useCaseId: 'usecase-3'
        }
      ]
    },
    {
      id: 'usecase-4',
      name: 'Support learning activities',
      description: 'Design and recommend educational activities that promote learning and development',
      testCases: [
        {
          id: 'test-4-1',
          input: 'A parent wants to create learning activities for their 4-year-old',
          expectedOutput: 'Response should suggest age-appropriate educational activities that are engaging and developmentally suitable',
          useCaseId: 'usecase-4'
        },
        {
          id: 'test-4-2',
          input: 'A teacher needs ideas for hands-on science activities for preschoolers',
          expectedOutput: 'Response should provide safe, engaging science experiments that teach basic concepts',
          useCaseId: 'usecase-4'
        }
      ]
    },
    {
      id: 'usecase-5',
      name: 'Handle emotional support',
      description: 'Provide guidance for supporting children\'s emotional well-being and mental health',
      testCases: [
        {
          id: 'test-5-1',
          input: 'A child is experiencing anxiety about starting school',
          expectedOutput: 'Response should offer strategies to help the child feel more comfortable and confident',
          useCaseId: 'usecase-5'
        },
        {
          id: 'test-5-2',
          input: 'A parent is concerned about their child\'s self-esteem',
          expectedOutput: 'Response should provide positive reinforcement techniques and confidence-building activities',
          useCaseId: 'usecase-5'
        }
      ]
    }
  ],
  createdAt: new Date('2024-01-15T10:00:00Z'),
  history: mockHistoryData
};

// Mock data for additional versions
export const mockVersions: RubricVersion[] = [
  mockCurrentVersion,
  {
    ...mockCurrentVersion,
    id: '2',
    version: 'v2.0',
    name: 'Enhanced Safety Framework',
    rubricItems: [
      ...mockCurrentVersion.rubricItems,
      {
        id: '3',
        criteria: 'Emergency Response Protocols',
        description: 'Demonstrates knowledge of emergency procedures and crisis management',
        category: 'Safety & Ethics'
      }
    ],
    createdAt: new Date('2024-02-01T10:00:00Z')
  },
  {
    ...mockCurrentVersion,
    id: '3',
    version: 'v2.1',
    name: 'Communication Enhancement',
    rubricItems: [
      ...mockCurrentVersion.rubricItems,
      {
        id: '4',
        criteria: 'Cultural Sensitivity',
        description: 'Shows awareness of cultural differences and inclusive communication',
        category: 'Communication & Collaboration'
      }
    ],
    createdAt: new Date('2024-02-15T14:30:00Z')
  }
]; 