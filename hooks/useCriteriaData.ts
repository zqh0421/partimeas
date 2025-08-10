import { useState, useEffect } from 'react';
import { NewCriteriaItem } from '@/utils/criteriaReader';

interface UseCriteriaDataReturn {
  criteria: NewCriteriaItem[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCriteriaData(): UseCriteriaDataReturn {
  const [criteria, setCriteria] = useState<NewCriteriaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCriteria = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/criteria-data');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || `Failed to fetch criteria: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.criteria) {
        setCriteria(data.criteria);
      } else {
        throw new Error(data.error || 'Failed to load criteria data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      console.error('Error fetching criteria:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCriteria();
  }, []);

  return {
    criteria,
    isLoading,
    error,
    refetch: fetchCriteria
  };
} 