'use client';

import { useState, useMemo } from 'react';
import { RubricVersion } from '@/types/rubric';

interface EvaluationResult {
  id: string;
  useCaseId: string;
  useCaseName: string;
  testCaseId: string;
  testCaseInput: string;
  systemPrompt: string;
  llmResponse: string;
  scores: {
    [criteriaId: string]: number;
  };
  overallScore: number;
  feedback: string;
  evaluatedAt: Date;
  evaluator: string;
}

interface ResultsComparisonAnalysisProps {
  currentVersion: RubricVersion;
  isOpen: boolean;
  onClose: () => void;
}

export default function ResultsComparisonAnalysis({ 
  currentVersion, 
  isOpen, 
  onClose 
}: ResultsComparisonAnalysisProps) {
  const [selectedUseCase, setSelectedUseCase] = useState<string>('');
  const [evaluationResults, setEvaluationResults] = useState<EvaluationResult[]>([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationProgress, setEvaluationProgress] = useState(0);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [isUseCasesCardExpanded, setIsUseCasesCardExpanded] = useState(true);

  // Mock evaluation results for demonstration
  const mockEvaluationResults: EvaluationResult[] = [
    {
      id: 'eval-1',
      useCaseId: 'usecase-1',
      useCaseName: 'Generate reflective questions',
      testCaseId: 'test-1',
      testCaseInput: 'A teacher wants to help students reflect on their learning process',
      systemPrompt: currentVersion.systemPrompt,
      llmResponse: 'Here are some reflective questions: 1) What did you learn today? 2) What challenges did you face? 3) How did you overcome them?',
      scores: {
        '1': 4, // Theoretical Accuracy
        '2': 5, // Safety & Ethics
        '3': 4, // Practical Application
      },
      overallScore: 4.3,
      feedback: 'Good understanding of reflective pedagogy with appropriate safety considerations.',
      evaluatedAt: new Date('2024-01-20T10:00:00'),
      evaluator: 'LLM-as-a-Judge'
    },
    {
      id: 'eval-2',
      useCaseId: 'usecase-1',
      useCaseName: 'Generate reflective questions',
      testCaseId: 'test-2',
      testCaseInput: 'A counselor needs questions to help clients process their emotions',
      systemPrompt: currentVersion.systemPrompt,
      llmResponse: 'Consider these questions: 1) How are you feeling right now? 2) What triggered these emotions? 3) What would be most helpful?',
      scores: {
        '1': 5, // Theoretical Accuracy
        '2': 5, // Safety & Ethics
        '3': 4, // Practical Application
      },
      overallScore: 4.7,
      feedback: 'Excellent therapeutic approach with strong safety considerations.',
      evaluatedAt: new Date('2024-01-21T14:30:00'),
      evaluator: 'LLM-as-a-Judge'
    }
  ];

  const allResults = [...evaluationResults, ...mockEvaluationResults];

  const selectedUseCaseData = useMemo(() => {
    return currentVersion.useCases?.find(uc => uc.id === selectedUseCase);
  }, [currentVersion.useCases, selectedUseCase]);

  const useCaseResults = useMemo(() => {
    return allResults.filter(result => result.useCaseId === selectedUseCase);
  }, [allResults, selectedUseCase]);

  const averageScore = useMemo(() => {
    if (useCaseResults.length === 0) return 0;
    const total = useCaseResults.reduce((sum, result) => sum + result.overallScore, 0);
    return total / useCaseResults.length;
  }, [useCaseResults]);

  const scoreDistribution = useMemo(() => {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    useCaseResults.forEach(result => {
      Object.values(result.scores).forEach(score => {
        distribution[score as keyof typeof distribution]++;
      });
    });
    return distribution;
  }, [useCaseResults]);

  const handleRunEvaluation = async () => {
    if (!selectedUseCaseData) return;

    setIsEvaluating(true);
    setEvaluationProgress(0);

    // Simulate evaluation process
    const testCases = selectedUseCaseData.testCases;
    
    for (let i = 0; i < testCases.length; i++) {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const progress = ((i + 1) / testCases.length) * 100;
      setEvaluationProgress(progress);

      // Mock evaluation result
      const mockResult: EvaluationResult = {
        id: `eval-${Date.now()}-${i}`,
        useCaseId: selectedUseCase,
        useCaseName: selectedUseCaseData.name,
        testCaseId: testCases[i].id,
        testCaseInput: testCases[i].input,
        systemPrompt: currentVersion.systemPrompt,
        llmResponse: `Mock LLM response for test case ${i + 1}`,
        scores: {
          '1': Math.floor(Math.random() * 3) + 3, // 3-5
          '2': Math.floor(Math.random() * 3) + 3,
          '3': Math.floor(Math.random() * 3) + 3,
        },
        overallScore: Math.random() * 2 + 3, // 3-5
        feedback: `Evaluation feedback for test case ${i + 1}`,
        evaluatedAt: new Date(),
        evaluator: 'LLM-as-a-Judge'
      };

      setEvaluationResults(prev => [...prev, mockResult]);
    }

    setIsEvaluating(false);
    setEvaluationProgress(0);
  };

  if (!isOpen) return null;

  return (
    <div className="w-full">
      <div className="bg-gray-50 rounded-lg border border-gray-200 mb-4">
        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">🎯 Use Case Evaluation</h3>
              <p className="text-sm text-gray-600">LLM-as-a-Judge evaluation of system prompts across use cases</p>
            </div>
          </div>
        </div>

        <div className="flex h-[600px]">
          {/* Left Panel - Use Case Selection */}
          <div className="w-1/3 border-r border-gray-200 p-6 overflow-y-auto">
            {/* Use Cases Folded Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md mb-6">
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Use Cases</h3>
                  <button
                    onClick={() => setIsUseCasesCardExpanded(!isUseCasesCardExpanded)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <span className="text-lg">
                      {isUseCasesCardExpanded ? "▼" : "▶"}
                    </span>
                  </button>
                </div>
              </div>
              
              {isUseCasesCardExpanded && (
                <div className="p-4">
                  <div className="space-y-3">
                    {(currentVersion.useCases || []).map(useCase => (
                      <div
                        key={useCase.id}
                        onClick={() => setSelectedUseCase(useCase.id)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedUseCase === useCase.id
                            ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <h4 className="font-medium text-gray-900 mb-2">{useCase.name}</h4>
                        <p className="text-sm text-gray-600 mb-3">{useCase.description}</p>
                        <div className="text-xs text-gray-500">
                          {useCase.testCases.length} test cases
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selectedUseCaseData && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">📋 Selected Use Case</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">{selectedUseCaseData.name}</h5>
                  <div className="text-xs text-gray-500">
                    <strong>Test Cases:</strong>
                    <div className="mt-2 space-y-1">
                      {selectedUseCaseData.testCases.map((tc, index) => (
                        <div key={tc.id} className="pl-2 border-l-2 border-gray-300">
                          {tc.input}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedUseCaseData && (
              <div>
                <button
                  onClick={handleRunEvaluation}
                  disabled={isEvaluating}
                  className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                    isEvaluating
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {isEvaluating ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Evaluating... {evaluationProgress.toFixed(0)}%</span>
                    </div>
                  ) : (
                    '🚀 Run LLM-as-a-Judge Evaluation'
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Right Panel - Results */}
          <div className="flex-1 p-6 overflow-y-auto">
            {!selectedUseCase ? (
              <div className="text-center text-gray-500 py-12">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-lg font-medium mb-2">Select a Use Case</h3>
                <p className="text-sm">Choose a use case from the left panel to view evaluation results</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{useCaseResults.length}</div>
                    <div className="text-sm text-blue-700">Total Evaluations</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{averageScore.toFixed(1)}</div>
                    <div className="text-sm text-green-700">Average Score</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {useCaseResults.filter(r => r.overallScore >= 4).length}
                    </div>
                    <div className="text-sm text-purple-700">High Scores (≥4)</div>
                  </div>
                </div>

                {/* Score Distribution */}
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">📊 Score Distribution</h4>
                  <div className="space-y-2">
                    {Object.entries(scoreDistribution).map(([score, count]) => (
                      <div key={score} className="flex items-center space-x-3">
                        <span className="text-sm font-medium w-8">Score {score}:</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${count > 0 ? (count / Math.max(...Object.values(scoreDistribution))) * 100 : 0}%`
                            }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Evaluation Results */}
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">📋 Evaluation Results</h4>
                  <div className="space-y-4">
                    {useCaseResults.map(result => (
                      <div key={result.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h5 className="font-medium text-gray-900">Test Case: {result.testCaseInput.substring(0, 50)}...</h5>
                            <p className="text-sm text-gray-500">
                              {new Date(result.evaluatedAt).toLocaleDateString()} • {result.evaluator}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">{result.overallScore.toFixed(1)}</div>
                            <div className="text-xs text-gray-500">Overall Score</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <h6 className="font-medium text-gray-700 mb-2">LLM Response</h6>
                            <div className="bg-gray-50 p-3 rounded text-sm">
                              {result.llmResponse}
                            </div>
                          </div>
                          <div>
                            <h6 className="font-medium text-gray-700 mb-2">Criteria Scores</h6>
                            <div className="space-y-1">
                              {Object.entries(result.scores).map(([criteriaId, score]) => (
                                <div key={criteriaId} className="flex items-center justify-between text-sm">
                                  <span>Criteria {criteriaId}</span>
                                  <span className="font-medium">{score}/5</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div>
                          <h6 className="font-medium text-gray-700 mb-2">Feedback</h6>
                          <div className="bg-blue-50 p-3 rounded text-sm">
                            {result.feedback}
                          </div>
                        </div>

                        <button
                          onClick={() => setShowDetails(showDetails === result.id ? null : result.id)}
                          className="mt-3 text-sm text-blue-600 hover:text-blue-700"
                        >
                          {showDetails === result.id ? 'Hide Details' : 'Show Details'}
                        </button>

                        {showDetails === result.id && (
                          <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                            <div className="space-y-2">
                              <div>
                                <strong>System Prompt:</strong>
                                <div className="mt-1 p-2 bg-white rounded border text-xs">
                                  {result.systemPrompt}
                                </div>
                              </div>
                              <div>
                                <strong>Full Test Case Input:</strong>
                                <div className="mt-1 p-2 bg-white rounded border text-xs">
                                  {result.testCaseInput}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 