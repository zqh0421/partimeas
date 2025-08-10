import React from 'react';
import EvaluationResultsTable from './EvaluationResultsTable';

export default function EvaluationResultsTableExample() {
  // Example criteria structure with multi-level foldable design
  const exampleCriteria = [
    {
      id: 'content_quality',
      name: 'Content Quality',
      description: 'Evaluation of response content and substance',
      subcriteria: [
        {
          id: 'relevance',
          name: 'Relevance to Question',
          description: 'How well the response addresses the given question',
          scoreLevels: {
            0: 'Completely irrelevant or off-topic response',
            1: 'Partially relevant but misses key points or requirements',
            2: 'Highly relevant and directly addresses all aspects of the question'
          }
        },
        {
          id: 'accuracy',
          name: 'Accuracy of Information',
          description: 'Factual correctness and reliability of the content provided',
          scoreLevels: {
            0: 'Contains significant factual errors or misinformation',
            1: 'Mostly accurate with minor inaccuracies or uncertainties',
            2: 'Completely accurate and reliable information throughout'
          }
        },
        {
          id: 'completeness',
          name: 'Completeness of Response',
          description: 'Whether the response covers all necessary aspects comprehensively',
          scoreLevels: {
            0: 'Incomplete response missing key information or requirements',
            1: 'Partially complete with some gaps or missing elements',
            2: 'Comprehensive coverage addressing all requirements thoroughly'
          }
        }
      ]
    },
    {
      id: 'language_quality',
      name: 'Language Quality',
      description: 'Evaluation of writing style, clarity, and communication effectiveness',
      subcriteria: [
        {
          id: 'clarity',
          name: 'Clarity of Expression',
          description: 'How clear and understandable the response is',
          scoreLevels: {
            0: 'Unclear, confusing, or difficult to understand',
            1: 'Generally clear with some confusing passages',
            2: 'Crystal clear and easy to understand throughout'
          }
        },
        {
          id: 'coherence',
          name: 'Logical Coherence',
          description: 'How well-organized and logically structured the response is',
          scoreLevels: {
            0: 'Poorly organized with no logical flow',
            1: 'Somewhat organized but flow could be improved',
            2: 'Well-organized with clear logical progression'
          }
        }
      ]
    }
  ];

  // Example model scores
  const exampleModelScores = [
    {
      modelId: 'gpt-4o',
      modelName: 'GPT-4o',
      scores: {
        relevance: 2,
        accuracy: 2,
        completeness: 1,
        clarity: 2,
        coherence: 2
      }
    },
    {
      modelId: 'claude-3-sonnet',
      modelName: 'Claude 3 Sonnet',
      scores: {
        relevance: 2,
        accuracy: 2,
        completeness: 2,
        clarity: 2,
        coherence: 2
      }
    },
    {
      modelId: 'gemini-pro',
      modelName: 'Gemini Pro',
      scores: {
        relevance: 1,
        accuracy: 2,
        completeness: 1,
        clarity: 1,
        coherence: 1
      }
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Evaluation Results Table
        </h1>
        <p className="text-gray-600">
          Multi-level foldable criteria structure with model comparison
        </p>
      </div>

      <EvaluationResultsTable
        criteria={exampleCriteria}
        modelScores={exampleModelScores}
        title="Model Response Evaluation"
      />

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-2xl mx-auto">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Usage Guide</h3>
        <ul className="text-gray-600 space-y-1 text-sm">
          <li>• Click arrows to expand criteria and subcriteria</li>
          <li>• View score explanations (0/1/2) for detailed feedback</li>
          <li>• Each subcriteria has a maximum score of 2 points</li>
          <li>• Main criteria scores are calculated from subcriteria totals</li>
          <li>• Color coding indicates performance levels</li>
        </ul>
      </div>
    </div>
  );
} 