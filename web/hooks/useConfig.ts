import { useState, useEffect } from 'react';

interface ConfigState {
  numOutputsToRun: number;
  numOutputsToShow: number;
  assistantModelAlgorithm: 'random_selection' | 'unique_model';
  enableGroupIdCollection: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useConfig() {
  const [config, setConfig] = useState<ConfigState>({
    numOutputsToRun: 2,
    numOutputsToShow: 2,
    assistantModelAlgorithm: 'random_selection',
    enableGroupIdCollection: false,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setConfig(prev => ({ ...prev, isLoading: true, error: null }));
        
        const response = await fetch('/api/config?name=numOutputsToRun&name=numOutputsToShow&name=assistantModelAlgorithm&name=enableGroupIdCollection');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Config API response:', data);
        console.log('enableGroupIdCollection raw value:', data.config.enableGroupIdCollection?.value);
        if (data.success && data.config) {
          const numOutputsToRun = parseInt(data.config.numOutputsToRun?.value || '2');
          const numOutputsToShow = parseInt(data.config.numOutputsToShow?.value || '2');
          const assistantModelAlgorithm = (data.config.assistantModelAlgorithm?.value || 'random_selection') as 'random_selection' | 'unique_model';
          const enableGroupIdCollection = data.config.enableGroupIdCollection?.value === '1';
          
          console.log('Parsed config values:', {
            numOutputsToRun,
            numOutputsToShow,
            assistantModelAlgorithm,
            enableGroupIdCollection,
            rawEnableGroupIdCollection: data.config.enableGroupIdCollection?.value
          });
          
          setConfig({
            numOutputsToRun,
            numOutputsToShow,
            assistantModelAlgorithm,
            enableGroupIdCollection,
            isLoading: false,
            error: null
          });
        } else {
          throw new Error('Invalid configuration data');
        }
      } catch (error) {
        console.warn('Failed to fetch configuration, using defaults:', error);
        setConfig({
          numOutputsToRun: 2,
          numOutputsToShow: 2,
          assistantModelAlgorithm: 'random_selection',
          enableGroupIdCollection: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    fetchConfig();
  }, []);

  return config;
} 