"use client";

import { useState } from "react";
import { RubricVersion } from "@/types/rubric";

interface ResultsComparisonCardProps {
  currentVersion: RubricVersion;
  setCurrentVersion: (version: RubricVersion | ((prev: RubricVersion) => RubricVersion)) => void;
}

// Mock evaluation result type for the analysis section
interface EvaluationResult {
  id: string;
  testCaseInput: string;
  llmResponse: string;
  scores: Record<string, number>;
  overallScore: number;
  feedback: string;
  evaluatedAt: Date;
  evaluator: string;
}

export default function ResultsComparisonCard({
  currentVersion,
  setCurrentVersion,
}: ResultsComparisonCardProps) {
  const [isComparisonCardExpanded, setIsComparisonCardExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    evaluationPrompt: false,
    analysis: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Mock evaluation results for demonstration
  const mockEvaluationResults: EvaluationResult[] = [
    {
      id: 'eval-1',
      testCaseInput: 'A teacher wants to help students reflect on their learning process',
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
      testCaseInput: 'Create engaging activities for kindergarten students',
      llmResponse: 'Try these activities: 1) Story time with props 2) Simple crafts 3) Movement games 4) Counting songs',
      scores: {
        '1': 5, // Theoretical Accuracy
        '2': 4, // Safety & Ethics
        '3': 5, // Practical Application
      },
      overallScore: 4.7,
      feedback: 'Excellent age-appropriate activities with good safety awareness.',
      evaluatedAt: new Date('2024-01-21T14:30:00'),
      evaluator: 'LLM-as-a-Judge'
    },
    {
      id: 'eval-3',
      testCaseInput: 'Help a student struggling with math anxiety',
      llmResponse: 'Address math anxiety by: 1) Building confidence through small wins 2) Using visual aids 3) Connecting math to real life 4) Providing positive reinforcement',
      scores: {
        '1': 4, // Theoretical Accuracy
        '2': 5, // Safety & Ethics
        '3': 4, // Practical Application
      },
      overallScore: 4.3,
      feedback: 'Comprehensive approach to math anxiety with strong emotional support.',
      evaluatedAt: new Date('2024-01-22T09:15:00'),
      evaluator: 'LLM-as-a-Judge'
    }
  ];

  const averageScore = mockEvaluationResults.reduce((sum, result) => sum + result.overallScore, 0) / mockEvaluationResults.length;
  const highScores = mockEvaluationResults.filter(r => r.overallScore >= 4).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 transition-all duration-200 hover:shadow-md">
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              📊 Results Comparison & Analysis
            </h2>
          </div>
          <button
            onClick={() =>
              setIsComparisonCardExpanded(!isComparisonCardExpanded)
            }
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <span className="text-lg">
              {isComparisonCardExpanded ? "▼" : "▶"}
            </span>
          </button>
        </div>
      </div>

      {isComparisonCardExpanded && (
        <div className="p-4 sm:p-6">
          {/* Evaluation Prompt Section */}
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <button
                  onClick={() => toggleSection("evaluationPrompt")}
                  className="flex justify-between items-center w-full text-left"
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    Evaluation Prompt (Criteria Testing)
                  </h3>
                  <span className="text-gray-500">
                    {expandedSections.evaluationPrompt ? "▼" : "▶"}
                  </span>
                </button>
              </div>
              {expandedSections.evaluationPrompt && (
                <div className="p-4">
                  <textarea
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 overflow-visible"
                    placeholder="Enter the evaluation prompt for testing criteria..."
                    value={currentVersion.evaluationPrompt}
                    onChange={(e) =>
                      setCurrentVersion((prev) => ({
                        ...prev,
                        evaluationPrompt: e.target.value,
                      }))
                    }
                  />
                </div>
              )}
            </div>
          </div>

          {/* Results Comparison Analysis Section */}
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200">
                <button
                  onClick={() => toggleSection("analysis")}
                  className="flex justify-between items-center w-full text-left"
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    📈 Results Analysis & Insights
                  </h3>
                  <span className="text-gray-500">
                    {expandedSections.analysis ? "▼" : "▶"}
                  </span>
                </button>
              </div>
              {expandedSections.analysis && (
                <div className="p-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{mockEvaluationResults.length}</div>
                      <div className="text-sm text-blue-700">Total Evaluations</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{averageScore.toFixed(1)}</div>
                      <div className="text-sm text-green-700">Average Score</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{highScores}</div>
                      <div className="text-sm text-purple-700">High Scores (≥4)</div>
                    </div>
                  </div>

                  {/* Score Distribution */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">📊 Score Distribution</h4>
                    <div className="bg-white border rounded-lg p-4">
                      <div className="space-y-3">
                        {mockEvaluationResults.map((result, index) => (
                          <div key={result.id} className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                Test {index + 1}: {result.testCaseInput.substring(0, 40)}...
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(result.evaluatedAt).toLocaleDateString()} • {result.evaluator}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-blue-600">{result.overallScore.toFixed(1)}</div>
                              <div className="text-xs text-gray-500">Overall</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Results */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">📋 Detailed Evaluation Results</h4>
                    <div className="space-y-4">
                      {mockEvaluationResults.map((result, index) => (
                        <div key={result.id} className="bg-white border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h5 className="font-medium text-gray-900">Test Case {index + 1}</h5>
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
                              <h6 className="font-medium text-gray-700 mb-2">Test Input</h6>
                              <div className="bg-gray-50 p-3 rounded text-sm">
                                {result.testCaseInput}
                              </div>
                            </div>
                            <div>
                              <h6 className="font-medium text-gray-700 mb-2">LLM Response</h6>
                              <div className="bg-gray-50 p-3 rounded text-sm">
                                {result.llmResponse}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
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
                            <div>
                              <h6 className="font-medium text-gray-700 mb-2">Feedback</h6>
                              <div className="bg-blue-50 p-3 rounded text-sm">
                                {result.feedback}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 