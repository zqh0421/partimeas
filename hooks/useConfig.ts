import { useState, useEffect } from 'react';

interface ConfigState {
  numOutputsToRun: number;
  numOutputsToShow: number;
  isLoading: boolean;
  error: string | null;
}

export function useConfig() {
  const [config, setConfig] = useState<ConfigState>({
    numOutputsToRun: 2,
    numOutputsToShow: 2,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setConfig(prev => ({ ...prev, isLoading: true, error: null }));
        
        const response = await fetch('/api/config?name=numOutputsToRun&name=numOutputsToShow');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success && data.config) {
          const numOutputsToRun = parseInt(data.config.numOutputsToRun?.value || '2');
          const numOutputsToShow = parseInt(data.config.numOutputsToShow?.value || '2');
          
          setConfig({
            numOutputsToRun,
            numOutputsToShow,
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
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    fetchConfig();
  }, []);

  return config;
} 