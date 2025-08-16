'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  RubricStructure, 
  ComponentEvaluation, 
  NewEvaluationResult,
  RubricScoreRange 
} from '../types/index';

// Legacy interface - keeping for backward compatibility
export interface RubricCriteria {
  id: string;
  name: string;
  description: string;
  weight: number;
}

// Legacy interface - keeping for backward compatibility  
export interface EvaluationResult {
  testCaseId: string;
  scores: { [criteriaId: string]: number };
  overallScore: number;
  feedback: string;
  rubricEffectiveness: 'high' | 'medium' | 'low';
  refinementSuggestions: string[];
  testCaseSpecificSuggestions: string[];
}

export interface RubricEvaluatorProps {
  testCases: Array<{
    id: string;
    input: string;
    context: string;
  }>;
  onEvaluationComplete: (results: EvaluationResult[]) => void;
  onError: (error: string) => void;
  onProgress?: (currentIndex: number, progress: number) => void;
  shouldStart?: boolean;
  // New props for structured rubric
  rubricStructure?: RubricStructure;
  onNewEvaluationComplete?: (results: NewEvaluationResult[]) => void;
  useNewRubricFormat?: boolean;
}

// Default rubric criteria for evaluation
const defaultCriteria: RubricCriteria[] = [
  {
    id: 'accuracy',
    name: 'Accuracy',
    description: 'Factual correctness and reliability of information',
    weight: 0.3
  },
  {
    id: 'relevance',
    name: 'Relevance',
    description: 'How well the response addresses the input question',
    weight: 0.25
  },
  {
    id: 'clarity',
    name: 'Clarity',
    description: 'Clearness and understandability of the response',
    weight: 0.2
  },
  {
    id: 'completeness',
    name: 'Completeness',
    description: 'Thoroughness and comprehensiveness of the response',
    weight: 0.15
  },
  {
    id: 'creativity',
    name: 'Creativity',
    description: 'Innovativeness and originality of the response',
    weight: 0.1
  }
];

export default function RubricEvaluator({
  testCases,
  onEvaluationComplete,
  onError,
  onProgress,
  shouldStart = false
}: RubricEvaluatorProps) {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [progress, setProgress] = useState(0);
  const completedCountRef = useRef(0);

  useEffect(() => {
    console.log(`RubricEvaluator useEffect: testCases.length=${testCases.length}, shouldStart=${shouldStart}`);
    if (testCases.length > 0 && shouldStart) {
      console.log('Starting evaluation...');
      evaluateRubric();
    }
  }, [testCases, shouldStart]);

  const evaluateRubric = async () => {
    setIsEvaluating(true);
    setProgress(0);
    completedCountRef.current = 0;

    try {
      const results: EvaluationResult[] = [];
      const totalEvaluations = testCases.length;

      // OPTIMIZATION: Process all test cases in parallel for better performance
      // This replaces the previous sequential approach for consistency and future AI integration
      const testCasePromises = testCases.map(async (testCase, testCaseIndex) => {
        try {
          // Simulate evaluation process (in real implementation, this would use AI)
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Mock evaluation logic - in real implementation, this would use AI to evaluate
          const scores = evaluateTestCase(testCase);
          const overallScore = calculateOverallScore(scores);
          const feedback = generateFeedback(testCase, scores);
          const rubricEffectiveness = assessRubricEffectiveness(scores, testCase);
          const refinementSuggestions = generateRefinementSuggestions(scores, testCase);
          const testCaseSpecificSuggestions = generateTestCaseSpecificSuggestions(testCase, scores);

          // Update progress atomically using ref to avoid race conditions
          completedCountRef.current++;
          const progress = (completedCountRef.current / totalEvaluations) * 100;
          setProgress(progress);
          
          if (onProgress) {
            onProgress(testCaseIndex, progress);
          }

          return {
            testCaseId: testCase.id,
            scores,
            overallScore,
            feedback,
            rubricEffectiveness,
            refinementSuggestions,
            testCaseSpecificSuggestions
          };
        } catch (error) {
          console.error(`Failed to evaluate test case ${testCase.id}:`, error);
          
          // Update progress even for failed evaluations
          completedCountRef.current++;
          const progress = (completedCountRef.current / totalEvaluations) * 100;
          setProgress(progress);
          
          if (onProgress) {
            onProgress(testCaseIndex, progress);
          }
          
          // Return a fallback result
          return {
            testCaseId: testCase.id,
            scores: {},
            overallScore: 0,
            feedback: 'Evaluation failed',
            rubricEffectiveness: 'low' as const,
            refinementSuggestions: ['Check test case data'],
            testCaseSpecificSuggestions: []
          };
        }
      });

      // Wait for all test cases to complete
      const testCaseResults = await Promise.all(testCasePromises);
      results.push(...testCaseResults);

      onEvaluationComplete(results);
    } catch (error) {
      onError('Failed to evaluate rubric');
    } finally {
      setIsEvaluating(false);
    }
  };

  const evaluateTestCase = (testCase: any) => {
    // Real evaluation logic - analyze test case content
    const scores: { [key: string]: number } = {};
    
    defaultCriteria.forEach(criteria => {
      // Analyze test case content for scoring
      const inputLength = testCase.input.length;
      const contextLength = testCase.context.length;
      const hasContext = testCase.context && testCase.context.length > 0;
      const hasDetailedInput = inputLength > 100;
      const hasDetailedContext = contextLength > 100;
      
      let score = 3; // Default middle score
      
      switch (criteria.id) {
        case 'accuracy':
          score = hasContext ? 4 : 3;
          break;
        case 'relevance':
          score = hasDetailedInput ? 4 : 3;
          break;
        case 'clarity':
          score = hasDetailedContext ? 4 : 3;
          break;
        case 'completeness':
          score = hasDetailedInput && hasDetailedContext ? 5 : 
                 hasDetailedInput || hasDetailedContext ? 4 : 3;
          break;
        case 'creativity':
          const creativeKeywords = ['creative', 'innovative', 'unique', 'original', 'novel'];
          const hasCreativeElements = creativeKeywords.some(keyword => 
            testCase.context.toLowerCase().includes(keyword) || 
            testCase.input.toLowerCase().includes(keyword)
          );
          score = hasCreativeElements ? 4 : 3;
          break;
      }
      
      scores[criteria.id] = score;
    });

    return scores;
  };

  const calculateOverallScore = (scores: { [key: string]: number }) => {
    let totalScore = 0;
    let totalWeight = 0;

    defaultCriteria.forEach(criteria => {
      if (scores[criteria.id] !== undefined) {
        totalScore += scores[criteria.id] * criteria.weight;
        totalWeight += criteria.weight;
      }
    });

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  };

  const generateFeedback = (testCase: any, scores: { [key: string]: number }) => {
    const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;
    
    if (avgScore >= 4.5) {
      return 'Excellent response that meets all criteria effectively.';
    } else if (avgScore >= 3.5) {
      return 'Good response with room for improvement in specific areas.';
    } else if (avgScore >= 2.5) {
      return 'Fair response that needs significant improvement.';
    } else {
      return 'Poor response that requires substantial revision.';
    }
  };

  const assessRubricEffectiveness = (scores: { [key: string]: number }, testCase: any): 'high' | 'medium' | 'low' => {
    const scoreVariance = Math.sqrt(
      Object.values(scores).reduce((sum, score) => sum + Math.pow(score - 3, 2), 0) / Object.values(scores).length
    );
    
    if (scoreVariance < 0.5) {
      return 'low'; // Rubric doesn't differentiate well
    } else if (scoreVariance < 1.0) {
      return 'medium';
    } else {
      return 'high';
    }
  };

  const generateRefinementSuggestions = (scores: { [key: string]: number }, testCase: any) => {
    const suggestions: string[] = [];
    
    // Analyze score distribution
    const lowScores = Object.entries(scores).filter(([_, score]) => score < 3);
    const highScores = Object.entries(scores).filter(([_, score]) => score > 4);
    
    if (lowScores.length > 0) {
      suggestions.push(`Consider adding more specific criteria for ${lowScores.map(([criteria, _]) => criteria).join(', ')}`);
    }
    
    if (highScores.length === Object.keys(scores).length) {
      suggestions.push('Rubric may be too lenient - consider adding more challenging criteria');
    }
    
    if (Object.values(scores).every(score => score === Object.values(scores)[0])) {
      suggestions.push('Rubric criteria may not be differentiated enough - consider making them more specific');
    }
    
    return suggestions.length > 0 ? suggestions : ['Rubric appears to be working well for this test case'];
  };

  const generateTestCaseSpecificSuggestions = (testCase: any, scores: { [key: string]: number }) => {
    const suggestions: string[] = [];
    
    if (testCase.input.length < 50) {
      suggestions.push('Consider adding criteria for input complexity or detail level');
    }
    
    if (!testCase.context || testCase.context.length < 20) {
      suggestions.push('Add more detailed context to improve evaluation accuracy');
    }
    
    if (testCase.input.split(' ').length < 10) {
      suggestions.push('Consider evaluating more complex input scenarios');
    }
    
    return suggestions;
  };

  if (isEvaluating) {
    return (
      <div className="text-center py-8">
        <div className="mb-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-600"></div>
        </div>
        <p className="text-gray-600 mb-2">
          Analyzing evaluation results...
        </p>
        <p className="text-sm text-gray-500">
          Please wait while we process the evaluation
        </p>
      </div>
    );
  }

  return null;
} 