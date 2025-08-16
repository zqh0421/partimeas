import React from 'react';
import { useCriteriaData } from '@/hooks/useCriteriaData';
import EvaluationResultsTable from './EvaluationResultsTable';
import { Criteria, Subcriteria, ModelScore } from './EvaluationResultsTable';

interface RealCriteriaTableProps {
  modelScores: ModelScore[];
  title?: string;
}

export default function RealCriteriaTable({ modelScores, title }: RealCriteriaTableProps) {
  const { criteria, isLoading, error, refetch } = useCriteriaData();

  // Convert hierarchical criteria data to the format expected by EvaluationResultsTable
  const convertToCriteria = (hierarchicalData: any[]): Criteria[] => {
    console.log('Converting hierarchical criteria data:', hierarchicalData);
    
    const result: Criteria[] = [];
    
    // 遍历每个 category
    hierarchicalData.forEach((category, categoryIndex) => {
      // 遍历每个 criterion
      category.criteria.forEach((criterion: any, criterionIndex: number) => {
        const criteriaId = `${category.name}-${criterion.name}`.replace(/\s+/g, '-').toLowerCase();
        
        // 转换 subcriteria
        const subcriteria: Subcriteria[] = criterion.subcriteria.map((sub: any, subIndex: number) => {
          const subcriteriaId = `${criteriaId}-${sub.name}`.replace(/\s+/g, '-').toLowerCase();
          
          // 构建 scoreLevels 对象
          const scoreLevels: { 0: string; 1: string; 2: string } = {
            0: 'Score 0 not available',
            1: 'Score 1 not available', 
            2: 'Score 2 not available'
          };
          
          // 填充实际的分数描述
          sub.scoreLevels.forEach((scoreLevel: any) => {
            const score = parseInt(scoreLevel.score);
            if (score >= 0 && score <= 2) {
              scoreLevels[score as 0 | 1 | 2] = scoreLevel.scoreMeaning || `Score ${score} description not available`;
            }
          });
          
          return {
            id: subcriteriaId,
            name: sub.name,
            description: sub.description || 'No description available',
            scoreLevels
          };
        });
        
        result.push({
          id: criteriaId,
          name: `${category.name} - ${criterion.name}`,
          description: criterion.description || 'No description available',
          subcriteria
        });
      });
    });
    
    console.log('Converted criteria result:', result);
    return result;
  };

  // Convert model scores to match the hierarchical criteria structure
  const convertModelScores = (modelScores: ModelScore[], hierarchicalData: any[]): ModelScore[] => {
    console.log('Converting model scores for hierarchical data:', { modelScores, hierarchicalData });
    
    const result = modelScores.map(modelScore => {
      const convertedScores: { [key: string]: number } = {};
      
      // 遍历层级数据结构，为每个 subcriteria 生成分数
      hierarchicalData.forEach((category) => {
        category.criteria.forEach((criterion: any) => {
          const criteriaId = `${category.name}-${criterion.name}`.replace(/\s+/g, '-').toLowerCase();
          
          criterion.subcriteria.forEach((sub: any) => {
            const subcriteriaId = `${criteriaId}-${sub.name}`.replace(/\s+/g, '-').toLowerCase();
            
            // 尝试从现有分数映射
            let score = 0;
            
            // 检查是否有直接匹配的ID
            if (modelScore.scores[subcriteriaId]) {
              score = modelScore.scores[subcriteriaId];
            } else {
              // 根据名称进行智能映射
              const criterionName = criterion.name.toLowerCase();
              const subcriteriaName = sub.name.toLowerCase();
              
              // 映射常见的评估标准
              if (criterionName.includes('relevance') || subcriteriaName.includes('relevance')) {
                score = modelScore.scores['relevance'] || 0;
              } else if (criterionName.includes('accuracy') || subcriteriaName.includes('accuracy')) {
                score = modelScore.scores['accuracy'] || 0;
              } else if (criterionName.includes('complete') || subcriteriaName.includes('complete')) {
                score = modelScore.scores['completeness'] || 0;
              } else if (criterionName.includes('clarity') || subcriteriaName.includes('clear')) {
                score = modelScore.scores['clarity'] || 0;
              } else if (criterionName.includes('strength') || subcriteriaName.includes('strength')) {
                score = modelScore.scores['strengths'] || 1; // 默认中等分数
              } else if (criterionName.includes('explanation') || subcriteriaName.includes('explanation')) {
                score = modelScore.scores['explanation'] || 1;
              } else if (criterionName.includes('question') || subcriteriaName.includes('question')) {
                score = modelScore.scores['questions'] || 1;
              } else {
                // 为演示目的，生成随机分数 (0-2)
                score = Math.floor(Math.random() * 3);
              }
            }
            
            convertedScores[subcriteriaId] = score;
          });
        });
      });
      
      return {
        ...modelScore,
        scores: convertedScores
      };
    });
    
    console.log('Converted model scores result:', result);
    return result;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="w-6 h-6 border-2 border-transparent border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-600">Loading evaluation criteria...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">
          <p className="font-medium">Failed to load criteria</p>
          <p className="text-sm">{error}</p>
        </div>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!criteria || criteria.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        No evaluation criteria available
      </div>
    );
  }

  const convertedCriteria = convertToCriteria(criteria);
  const convertedModelScores = convertModelScores(modelScores, criteria);

  // Debug logging
  console.log('RealCriteriaTable Debug:', {
    originalCriteria: criteria,
    convertedCriteria,
    originalModelScores: modelScores,
    convertedModelScores
  });

  return (
    <EvaluationResultsTable
      criteria={convertedCriteria}
      modelScores={convertedModelScores}
    />
  );
} 