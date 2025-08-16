'use client';

import React, { useState, useEffect } from 'react';
import { TestCaseWithModelOutputs, ModelOutput } from '@/types';

export interface ModelComparisonEvaluationResult {
  testCaseId: string;
  modelOutputs: ModelOutput[];
  rubricEffectiveness: 'high' | 'medium' | 'low';
  refinementSuggestions: string[];
}

export interface ModelComparisonEvaluatorProps {
  testCases: TestCaseWithModelOutputs[];
  systemPrompt?: string;
  onEvaluationComplete: (results: ModelComparisonEvaluationResult[]) => void;
  onError: (error: string) => void;
  onProgress?: (currentIndex: number, progress: number) => void;
  shouldStart?: boolean;
}

export default function ModelComparisonEvaluator({
  testCases,
  systemPrompt,
  onEvaluationComplete,
  onError,
  onProgress,
  shouldStart = false
}: ModelComparisonEvaluatorProps) {
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    console.log(`ModelComparisonEvaluator useEffect: testCases.length=${testCases.length}, shouldStart=${shouldStart}`);
    if (testCases.length > 0 && shouldStart) {
      console.log('Starting model comparison evaluation...');
      evaluateModelComparison();
    }
  }, [testCases, shouldStart]);

  const evaluateModelComparison = async () => {
    setIsEvaluating(true);

    try {
      // Since RunStep already handles output generation and evaluation,
      // we just need to process the existing model outputs
      const results: ModelComparisonEvaluationResult[] = testCases.map(testCase => {
        // Simple assessment based on existing rubric scores
        const rubricEffectiveness = assessRubricEffectiveness(testCase.modelOutputs, testCase);
        const refinementSuggestions = generateRefinementSuggestions(testCase.modelOutputs, testCase);

        return {
          testCaseId: testCase.id,
          modelOutputs: testCase.modelOutputs,
          rubricEffectiveness,
          refinementSuggestions
        };
      });

      console.log('✅ Model comparison evaluation completed!');
      onEvaluationComplete(results);
    } catch (error) {
      console.error('Error during model comparison evaluation:', error);
      onError(error instanceof Error ? error.message : 'Unknown error during evaluation');
    } finally {
      setIsEvaluating(false);
    }
  };

  const assessRubricEffectiveness = (modelOutputs: ModelOutput[], testCase: TestCaseWithModelOutputs): 'high' | 'medium' | 'low' => {
    if (!modelOutputs || modelOutputs.length === 0) return 'low';
    
    // Calculate average scores across all models
    const allScores = modelOutputs.flatMap(output => 
      output.rubricScores ? Object.values(output.rubricScores) : []
    );
    
    if (allScores.length === 0) return 'low';
    
    const averageScore = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
    
    if (averageScore >= 4.5) return 'high';
    if (averageScore >= 3.5) return 'medium';
    return 'low';
  };

  const generateRefinementSuggestions = (modelOutputs: ModelOutput[], testCase: TestCaseWithModelOutputs): string[] => {
    const suggestions: string[] = [];
    
    if (!modelOutputs || modelOutputs.length === 0) {
      suggestions.push('No model outputs available for analysis');
      return suggestions;
    }
    
    // Collect all existing suggestions from model evaluations
    const allSuggestions = modelOutputs.flatMap(output => output.suggestions || []);
    
    // Add unique suggestions
    const uniqueSuggestions = [...new Set(allSuggestions)];
    suggestions.push(...uniqueSuggestions.slice(0, 3)); // Limit to top 3
    
    // Add general suggestions based on scores if available
    const allScores = modelOutputs.flatMap(output => 
      output.rubricScores ? Object.values(output.rubricScores) : []
    );
    
    if (allScores.length > 0) {
      const averageScore = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
      
      if (averageScore < 3.5) {
        suggestions.push('Consider providing more specific context or examples in future test cases');
      }
      
      // Check for structured output format compliance
      const hasStructuredOutput = modelOutputs.some(output => 
        output.output && output.output.includes('===== SECTION')
      );
      
      if (!hasStructuredOutput) {
        suggestions.push('Ensure models follow the required structured output format with section headers');
      }
    }
    
    return suggestions.slice(0, 5); // Limit total suggestions
  };

  if (isEvaluating) {
    return (
      <div className="text-center py-8">
        <div className="mb-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-600"></div>
        </div>
        <p className="text-gray-600 mb-2">
          Processing model comparison results...
        </p>
        <p className="text-sm text-gray-500">
          Analyzing {testCases.length} test cases with structured outputs
        </p>
      </div>
    );
  }

  return null;
}