import React from 'react';
import EvaluationResultsTable, { Criteria, Subcriteria, ModelScore } from './EvaluationResultsTable';

interface MockCriteriaTableProps {
  modelScores: ModelScore[];
  title?: string;
}

export default function MockCriteriaTable({ modelScores, title }: MockCriteriaTableProps) {
  // Define mock criteria for demonstration purposes
  const mockCriteria: Criteria[] = [
    {
      id: 'relevance',
      name: 'Relevance',
      description: 'How well the response addresses the question or task',
      subcriteria: [
        {
          id: 'relevance-main',
          name: 'Main Relevance',
          description: 'Direct relevance to the main question',
          scoreLevels: {
            0: 'Not relevant to the question',
            1: 'Somewhat relevant but misses key points',
            2: 'Highly relevant and directly addresses the question'
          }
        }
      ]
    },
    {
      id: 'accuracy',
      name: 'Accuracy',
      description: 'Factual correctness and precision of information',
      subcriteria: [
        {
          id: 'accuracy-facts',
          name: 'Factual Accuracy',
          description: 'Correctness of stated facts and information',
          scoreLevels: {
            0: 'Contains significant factual errors',
            1: 'Mostly accurate with minor inaccuracies',
            2: 'Completely accurate and precise'
          }
        }
      ]
    },
    {
      id: 'completeness',
      name: 'Completeness',
      description: 'Thoroughness and comprehensiveness of the response',
      subcriteria: [
        {
          id: 'completeness-coverage',
          name: 'Coverage',
          description: 'How thoroughly the topic is covered',
          scoreLevels: {
            0: 'Incomplete or superficial coverage',
            1: 'Moderate coverage with some gaps',
            2: 'Comprehensive and thorough coverage'
          }
        }
      ]
    }
  ];

  // Convert model scores to match the mock criteria structure
  const mockModelScores: ModelScore[] = modelScores.map(modelScore => ({
    ...modelScore,
    scores: {
      'relevance-main': modelScore.scores.relevance || 0,
      'accuracy-facts': modelScore.scores.accuracy || 0,
      'completeness-coverage': modelScore.scores.completeness || 0
    }
  }));

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">!</span>
          </div>
          <p className="text-amber-800 text-sm font-medium">
            Mock Evaluation Mode
          </p>
        </div>
        <p className="text-amber-700 text-sm mt-2">
          This is a demonstration using sample evaluation criteria and mock scores. 
          Activate the evaluation assistant to see real evaluation results.
        </p>
      </div>
      
      <EvaluationResultsTable
        criteria={mockCriteria}
        modelScores={mockModelScores}
      />
    </div>
  );
} 