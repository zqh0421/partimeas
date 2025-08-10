import { useState, useEffect } from 'react';
import { AdminState, ModelConfig, PromptConfig, AssistantConfig, AdminSection } from '../types/admin';

export function useAdminState() {
  const [state, setState] = useState<AdminState>({
    modelConfigs: [],
    promptConfigs: [],
    assistantConfigs: [],
    isLoading: true,
    hasChanges: false,
    error: null,
    success: null,
    activeSection: 'output-generation'
  });

  // Load initial configuration
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Load model configurations
      console.log('Loading model configurations...');
      const modelResponse = await fetch('/api/admin/models');
      console.log('Model response status:', modelResponse.status, modelResponse.statusText);
      
      console.log('Loading prompt configurations...');
      const promptResponse = await fetch('/api/admin/prompts');
      console.log('Prompt response status:', promptResponse.status, promptResponse.statusText);
      
      // Load assistant configurations
      console.log('Loading assistant configurations...');
      const assistantResponse = await fetch('/api/admin/assistants');
      console.log('Assistant response status:', assistantResponse.status, assistantResponse.statusText);
      
      if (modelResponse.ok && promptResponse.ok && assistantResponse.ok) {
        const modelData = await modelResponse.json();
        const promptData = await promptResponse.json();
        const assistantData = await assistantResponse.json();
        
        setState(prev => ({
          ...prev,
          modelConfigs: modelData.models,
          promptConfigs: promptData.prompts,
          assistantConfigs: assistantData.assistants || [],
          isLoading: false
        }));
      } else {
        // Get more specific error information
        let errorMessage = 'Failed to load configuration';
        if (!modelResponse.ok) {
          const modelError = await modelResponse.text();
          errorMessage += ` - Models API: ${modelResponse.status} ${modelResponse.statusText}`;
          if (modelError) errorMessage += ` - ${modelError}`;
        }
        if (!promptResponse.ok) {
          const promptError = await promptResponse.text();
          errorMessage += ` - Prompts API: ${promptResponse.status} ${promptResponse.statusText}`;
          if (promptError) errorMessage += ` - ${promptError}`;
        }
        if (!assistantResponse.ok) {
          const assistantError = await assistantResponse.text();
          errorMessage += ` - Assistants API: ${assistantResponse.status} ${assistantResponse.statusText}`;
          if (assistantError) errorMessage += ` - ${assistantError}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load configuration'
      }));
    }
  };

  const saveConfiguration = async () => {
    try {
      setState(prev => ({ ...prev, error: null, success: null }));
      
      // Save model configurations
      const modelResponse = await fetch('/api/admin/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ models: state.modelConfigs })
      });
      
      // Save prompt configurations
      const promptResponse = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompts: state.promptConfigs })
      });
      
      // Save assistant configurations
      const assistantResponse = await fetch('/api/admin/assistants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assistants: state.assistantConfigs })
      });
      
      if (modelResponse.ok && promptResponse.ok && assistantResponse.ok) {
        setState(prev => ({
          ...prev,
          hasChanges: false,
          success: 'Configuration saved successfully!'
        }));
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setState(prev => ({ ...prev, success: null }));
        }, 3000);
      } else {
        let errorMessage = 'Failed to save configuration';
        if (!modelResponse.ok) errorMessage += ' - Models';
        if (!promptResponse.ok) errorMessage += ' - Prompts';
        if (!assistantResponse.ok) errorMessage += ' - Assistants';
        throw new Error(errorMessage);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save configuration'
      }));
    }
  };

  const updateModelConfig = (id: string, updates: Partial<ModelConfig>) => {
    setState(prev => ({
      ...prev,
      modelConfigs: prev.modelConfigs.map(model => 
        model.id === id ? { ...model, ...updates } : model
      ),
      hasChanges: true
    }));
  };

  const updatePromptConfig = (id: string, updates: Partial<PromptConfig>) => {
    setState(prev => ({
      ...prev,
      promptConfigs: prev.promptConfigs.map(prompt => 
        prompt.id === id ? { ...prompt, ...updates } : prompt
      ),
      hasChanges: true
    }));
  };

  const addModelConfig = () => {
    const newModel: ModelConfig = {
      id: `model-${Date.now()}`,
      name: 'New Model',
      provider: 'openai',
      model: 'gpt-4',
      isEnabled: true,
      isEvaluationModel: false,
      isOutputGenerationModel: false
    };
    
    setState(prev => ({
      ...prev,
      modelConfigs: [...prev.modelConfigs, newModel],
      hasChanges: true
    }));
  };

  const addPromptConfig = (type: 'system' | 'evaluation') => {
    const newPrompt: PromptConfig = {
      id: `prompt-${Date.now()}`,
      name: `New ${type === 'system' ? 'System' : 'Evaluation'} Prompt`,
      content: type === 'system' 
        ? 'Enter your system prompt content here...'
        : 'Enter your evaluation prompt content here...',
      type,
      isDefault: false
    };
    
    setState(prev => ({
      ...prev,
      promptConfigs: [...prev.promptConfigs, newPrompt],
      hasChanges: true
    }));
  };

  const removeModelConfig = (id: string) => {
    setState(prev => ({
      ...prev,
      modelConfigs: prev.modelConfigs.filter(model => model.id !== id),
      hasChanges: true
    }));
  };

  const removePromptConfig = (id: string) => {
    setState(prev => ({
      ...prev,
      promptConfigs: prev.promptConfigs.filter(prompt => prompt.id !== id),
      hasChanges: true
    }));
  };

  const setDefaultPrompt = (type: 'system' | 'evaluation', id: string) => {
    setState(prev => ({
      ...prev,
      promptConfigs: prev.promptConfigs.map(prompt => ({
        ...prompt,
        isDefault: prompt.type === type ? prompt.id === id : false
      })),
      hasChanges: true
    }));
  };

  const addAssistantConfig = (type: 'output-generation' | 'evaluation') => {
    const newAssistant: AssistantConfig = {
      id: `assistant-${Date.now()}`,
      name: `New ${type === 'output-generation' ? 'Output Generation' : 'Evaluation'} Assistant`,
      description: '',
      systemPromptId: '',
      modelIds: [],
      isEnabled: true,
      type,
      responseCount: 1
    };
    
    setState(prev => ({
      ...prev,
      assistantConfigs: [...prev.assistantConfigs, newAssistant],
      hasChanges: true
    }));
  };

  const updateAssistantConfig = (id: string, updates: Partial<AssistantConfig>) => {
    setState(prev => ({
      ...prev,
      assistantConfigs: prev.assistantConfigs.map(assistant =>
        assistant.id === id ? { ...assistant, ...updates } : assistant
      ),
      hasChanges: true
    }));
  };

  const removeAssistantConfig = (id: string) => {
    setState(prev => ({
      ...prev,
      assistantConfigs: prev.assistantConfigs.filter(assistant => assistant.id !== id),
      hasChanges: true
    }));
  };

  const setActiveSection = (section: AdminSection) => {
    setState(prev => ({ ...prev, activeSection: section }));
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const clearSuccess = () => {
    setState(prev => ({ ...prev, success: null }));
  };

  return {
    state,
    loadConfiguration,
    saveConfiguration,
    updateModelConfig,
    updatePromptConfig,
    addModelConfig,
    addPromptConfig,
    removeModelConfig,
    removePromptConfig,
    setDefaultPrompt,
    addAssistantConfig,
    updateAssistantConfig,
    removeAssistantConfig,
    setActiveSection,
    clearError,
    clearSuccess
  };
} 