'use client';

import { useState, useEffect } from 'react';  
import mockData from '@/data/mockData';
import GenericSelector from './GenericSelector';

interface CriteriaSelectorProps {
  onCriteriaSelected: (criteriaId: string) => void;
  onCriteriaLoaded: (criteria: Array<{
    id: string;
    category: string;
    criteria: string;
    description: string;
    weight: number;
    score1: string;
    score2: string;
    score3: string;
    score4: string;
    score5: string;
  }>) => void;
  onError: (error: string) => void;
}

export default function CriteriaSelector({ onCriteriaSelected, onCriteriaLoaded, onError }: CriteriaSelectorProps) {
  const [selectedCriteria, setSelectedCriteria] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [sheetNames, setSheetNames] = useState<{[key: string]: string}>({});
  const criteriaConfig = mockData.criteriaConfig;

  useEffect(() => {
    // Load sheet names for all criteria
    loadSheetNames();
    
    // Auto-select the first criteria if available
    if (criteriaConfig.length > 0) {
      const firstCriteria = criteriaConfig[0];
      console.log('Auto-selecting first criteria:', firstCriteria.id);
      setSelectedCriteria(firstCriteria.id);
      // Auto-load the first criteria data
      handleCriteriaSelect(firstCriteria.id);
    }
  }, []);

  const loadSheetNames = async () => {
    const names: {[key: string]: string} = {};
    
    for (const criteria of criteriaConfig) {
      if (criteria.spreadsheetId) {
        // Store full spreadsheet URL for direct opening
        names[criteria.id] = `https://docs.google.com/spreadsheets/d/${criteria.spreadsheetId}/edit`;
      }
    }
    
    setSheetNames(names);
  };

  const handleCriteriaSelect = async (criteriaId: string) => {
    setSelectedCriteria(criteriaId);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/criteria-data?criteriaId=${criteriaId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load criteria data');
      }

      if (data.success) {
        const criteria = data.criteria.map((c: any) => ({
          id: c.id,
          category: c.category,
          criteria: c.criteria,
          description: c.description,
          weight: c.weight,
          score1: c.score1,
          score2: c.score2,
          score3: c.score3,
          score4: c.score4,
          score5: c.score5
        }));
        
        onCriteriaSelected(criteriaId);
        onCriteriaLoaded(criteria);
      } else {
        throw new Error(data.error || 'Failed to load data');
      }
    } catch (error) {
      onError(`Failed to load criteria data: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert criteria config to generic options format
  const criteriaOptions = criteriaConfig.map(criteria => ({
    id: criteria.id,
    name: criteria.name,
    description: criteria.description,
    category: criteria.category,
          metadata: {
        type: 'Spreadsheet',
        value: sheetNames[criteria.id] || 'Loading...'
      }
  }));

  return (
    <GenericSelector
      title="Select Rubric Criteria"
      description="Choose the evaluation criteria for LLM response evaluation."
      options={criteriaOptions}
      onOptionSelected={handleCriteriaSelect}
      onError={onError}
      isLoading={isLoading}
      selectedOption={selectedCriteria}
      showCategoryFilter={false}
      loadingText="Loading criteria..."
      emptyText="No criteria configurations available."
    />
  );
} 