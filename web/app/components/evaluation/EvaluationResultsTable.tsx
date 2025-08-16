import React, { useState } from 'react';

export interface Subcriteria {
  id: string;
  name: string;
  description: string;
  scoreLevels: {
    0: string;
    1: string;
    2: string;
  };
}

export interface Criteria {
  id: string;
  name: string;
  description: string;
  subcriteria: Subcriteria[];
}

export interface ModelScore {
  modelId: string;
  modelName: string;
  scores: Record<string, number>; // criteriaId -> score
}

export default function EvaluationResultsTable({
  criteria,
  modelScores,
}: {
  criteria: Criteria[];
  modelScores: ModelScore[];
}) {
  const [expandedCriteria, setExpandedCriteria] = useState<Set<string>>(new Set());
  const [expandedSubcriteria, setExpandedSubcriteria] = useState<Set<string>>(new Set());

  const toggleCriteria = (criteriaId: string) => {
    const newExpanded = new Set(expandedCriteria);
    if (newExpanded.has(criteriaId)) {
      newExpanded.delete(criteriaId);
    } else {
      newExpanded.add(criteriaId);
    }
    setExpandedCriteria(newExpanded);
  };

  const toggleSubcriteria = (subcriteriaId: string) => {
    const newExpanded = new Set(expandedSubcriteria);
    if (newExpanded.has(subcriteriaId)) {
      newExpanded.delete(subcriteriaId);
    } else {
      newExpanded.add(subcriteriaId);
    }
    setExpandedSubcriteria(newExpanded);
  };

  const getScoreColor = (score: number, maxScore: number = 2) => {
    // const percentage = score / maxScore;
    // if (percentage >= 0.8) return 'text-emerald-600';
    // if (percentage >= 0.6) return 'text-amber-600';
    // if (percentage >= 0.4) return 'text-orange-600';
    return 'text-blue-500';
  };

  const getScoreBadgeColor = (score: number, maxScore: number = 2) => {
    const percentage = score / maxScore;
    if (percentage >= 0.8) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (percentage >= 0.6) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (percentage >= 0.4) return 'bg-orange-50 text-orange-700 border-orange-200';
    return 'bg-red-50 text-red-700 border-red-200';
  };

  return (
    <div className="space-y-4">
      
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-slate-700 min-w-[320px]">
                  Evaluation Criteria
                </th>
                {modelScores.map((model) => (
                  <th key={model.modelId} className="px-4 py-3 text-center text-sm font-medium text-gray-700 min-w-[100px]">
                    {model.modelName}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {criteria.map((criterion) => (
                <React.Fragment key={criterion.id}>
                  {/* Main Criteria Row */}
                  <tr className="hover:bg-slate-50/50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => toggleCriteria(criterion.id)}
                          className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100"
                        >
                          {expandedCriteria.has(criterion.id) ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          )}
                        </button>
                        <div className="flex-1">
                          <div className="font-medium text-slate-900 text-sm">{criterion.name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{criterion.description}</div>
                        </div>
                      </div>
                    </td>
                    {modelScores.map((model) => {
                      const totalScore = criterion.subcriteria.reduce((sum, sub) => {
                        return sum + (model.scores[sub.id] || 0);
                      }, 0);
                      const maxPossibleScore = criterion.subcriteria.length * 2;
                      
                      return (
                        <td key={model.modelId} className="px-4 py-4 text-center">
                          <div className="flex flex-col items-center space-y-1">
                            <span className={`text-base font-semibold ${getScoreColor(totalScore, maxPossibleScore)}`}>
                              {totalScore}/{maxPossibleScore}
                            </span>
                            <div className="w-16 bg-slate-100 rounded-full h-1">
                              <div 
                                className={`h-1 rounded-full transition-all duration-300 ${
                                  getScoreColor(totalScore, maxPossibleScore).replace('text-', 'bg-').replace('-600', '-500').replace('-500', '-500')
                                }`}
                                style={{ width: `${(totalScore / maxPossibleScore) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                  
                  {/* Subcriteria Rows (when expanded) */}
                  {expandedCriteria.has(criterion.id) && criterion.subcriteria.map((subcriterion) => (
                    <React.Fragment key={subcriterion.id}>
                      <tr className=" hover:bg-slate-100/30 transition-colors duration-150">
                        <td className="px-6 py-2 pl-16">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => toggleSubcriteria(subcriterion.id)}
                              className="text-slate-500 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100/50"
                            >
                              {expandedSubcriteria.has(subcriterion.id) ? (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              )}
                            </button>
                            <div className="flex-1">
                              <div className="font-medium text-slate-700 text-sm">{subcriterion.name}</div>
                              <div className="text-xs text-slate-500 mt-0.5">{subcriterion.description}</div>
                            </div>
                          </div>
                        </td>
                        {modelScores.map((model) => {
                          const score = model.scores[subcriterion.id] || 0;
                          return (
                            <td key={model.modelId} className="px-4 py-3 text-center">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getScoreBadgeColor(score, 2)}`}>
                                {score}/2
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                      
                      {/* Score Level Explanations (when subcriteria expanded) */}
                      {expandedSubcriteria.has(subcriterion.id) && (
                        <tr className="">
                          <td colSpan={modelScores.length + 1} className="px-6 py-3 pl-20">
                            <div className="space-y-1 text-sm">
                              <div>
                                <div className="font-medium text-red-700 text-xs tracking-wide">Score 0: {subcriterion.scoreLevels[0]}</div>
                              </div>
                              <div>
                                <div className="font-medium text-amber-700 text-xs tracking-wide">Score 1: {subcriterion.scoreLevels[1]}</div>
                              </div>
                              <div>
                                <div className="font-medium text-emerald-700 text-xs tracking-wide">Score 2: {subcriterion.scoreLevels[2]}</div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 