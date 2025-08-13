import { useState, useEffect } from 'react';
import { AdminState, ModelConfig, PromptConfig, AdminSection, Assistant, ConfigValue } from '../types/admin';

export function useAdminState() {
  const [state, setState] = useState<AdminState>({
    modelConfigs: [],
    promptConfigs: [],
    assistants: [],
    assistantModels: [],
    configValues: [],
    isLoading: true,
    hasChanges: false,
    hasModelChanges: false,
    hasPromptChanges: false,
    hasAssistantChanges: false,
    hasConfigChanges: false,
    error: null,
    success: null,
    activeSection: 'assistants',
    deletedModels: [],
    deletedPrompts: [],
    deletedAssistants: [],
    deletedAssistantModels: []
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
      
      console.log('Loading assistant configurations...');
      const assistantResponse = await fetch('/api/admin/assistants');
      console.log('Assistant response status:', assistantResponse.status, assistantResponse.statusText);
      
      // Load configuration values
      console.log('Loading configuration values...');
      let configValues: ConfigValue[] = [];
      try {
        const configResponse = await fetch('/api/config?name=numOutputsToRun&name=numOutputsToShow&name=assistantModelAlgorithm');
        console.log('Config response status:', configResponse.status, configResponse.statusText);
        
        if (configResponse.ok) {
          const configData = await configResponse.json();
          console.log('Loaded configs:', configData.config ? Object.keys(configData.config).length : 0);
          
          // Transform config data to ConfigValue format
          if (configData.config) {
            Object.entries(configData.config).forEach(([name, config]: [string, any]) => {
              configValues.push({
                name,
                value: config.value,
                scope: config.scope || 'global',
                created_at: config.created_at,
                updated_at: config.updated_at
              });
            });
          }
        }
      } catch (configError) {
        console.warn('Failed to load configuration values, using defaults:', configError);
      }
      
      // Ensure default configuration values exist
      const defaultConfigs = [
        { name: 'numOutputsToRun', value: '3', scope: 'global' },
        { name: 'numOutputsToShow', value: '2', scope: 'global' },
        { name: 'assistantModelAlgorithm', value: 'random_selection', scope: 'global' }
      ];
      
      defaultConfigs.forEach(defaultConfig => {
        if (!configValues.find(c => c.name === defaultConfig.name)) {
          configValues.push({
            ...defaultConfig,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      });
      
      if (modelResponse.ok && promptResponse.ok && assistantResponse.ok) {
        const modelData = await modelResponse.json();
        const promptData = await promptResponse.json();
        const assistantData = await assistantResponse.json();
        
        console.log('Loaded models:', modelData.models?.length || 0);
        console.log('Loaded prompts:', promptData.prompts?.length || 0);
        console.log('Loaded assistants:', assistantData.assistants?.length || 0);
        console.log('Final config values:', configValues.length);
        
        setState(prev => ({
          ...prev,
          modelConfigs: modelData.models || [],
          promptConfigs: promptData.prompts || [],
          assistants: assistantData.assistants || [],
          configValues,
          isLoading: false,
          hasChanges: false,
          hasModelChanges: false,
          hasPromptChanges: false,
          hasAssistantChanges: false,
          hasConfigChanges: false
        }));
      } else {
        throw new Error('Failed to load configuration');
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load configuration'
      }));
    }
  };

  const saveConfiguration = async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const response = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          models: state.modelConfigs,
          prompts: state.promptConfigs,
          deletedPrompts: state.deletedPrompts || []
        })
      });

      if (response.ok) {
        const result = await response.json();
        setState(prev => ({
          ...prev,
          success: result.message || 'Configuration saved successfully',
          hasChanges: false,
          hasModelChanges: false,
          hasPromptChanges: false,
          deletedModels: [],
          deletedPrompts: []
        }));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save configuration'
      }));
    }
  };

  const saveModelsOnly = async () => {
    try {
      setState(prev => ({ ...prev, error: null }));

      // 1) Create newly added models (those with temporary IDs)
      const modelsToCreate = state.modelConfigs
        .filter(m => m.id.startsWith('temp-'))
        .map(m => ({ provider: m.provider, modelId: m.model }));

      if (modelsToCreate.length > 0) {
        const createResponse = await fetch('/api/admin/models', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ models: modelsToCreate })
        });
        if (!createResponse.ok) {
          const errorData = await createResponse.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to create models');
        }
      }

      // 2) Delete removed models that exist in DB
      if (state.deletedModels && state.deletedModels.length > 0) {
        await Promise.all(
          state.deletedModels.map(m =>
            fetch(`/api/admin/models/${m.id}`, { method: 'DELETE' })
          )
        );
      }

      // 3) Refresh configuration (to pick up DB-generated IDs and clear temp ones)
      await loadConfiguration();

      setState(prev => ({
        ...prev,
        success: 'Models saved successfully',
        hasModelChanges: false,
        deletedModels: []
      }));
    } catch (error) {
      console.error('Error saving models:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save models'
      }));
    }
  };

  const savePromptsOnly = async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const response = await fetch('/api/admin/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          models: state.modelConfigs,
          prompts: state.promptConfigs,
          deletedPrompts: state.deletedPrompts || []
        })
      });

      if (response.ok) {
        const result = await response.json();
        setState(prev => ({
          ...prev,
          success: result.message || 'Prompts saved successfully',
          hasPromptChanges: false,
          deletedPrompts: []
        }));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save prompts');
      }
    } catch (error) {
      console.error('Error saving prompts:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save prompts'
      }));
    }
  };

  const saveAssistantsOnly = async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      // Preflight validation: ensure referenced IDs are UUIDs when saving
      const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;
      for (const assistant of state.assistants) {
        const isCreate = assistant.id <= 0;
        const hasInvalidModels = !assistant.model_ids || !Array.isArray(assistant.model_ids) || 
          assistant.model_ids.length === 0 || !assistant.model_ids.every(id => uuidRegex.test(id));
        const hasInvalidPrompt = !uuidRegex.test(assistant.system_prompt_id || '');
        if ((isCreate || hasInvalidModels || hasInvalidPrompt) && (hasInvalidModels || hasInvalidPrompt)) {
          throw new Error('Please select at least one saved Model and a System Prompt before saving assistants.');
        }
      }

      // Save assistants individually since they have their own API
      const assistantPromises = state.assistants.map(async (assistant) => {
        // No transformation needed since we now use model_ids directly
        if (assistant.id > 0) {
          // Update existing assistant
          return fetch('/api/admin/assistants', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assistant)
          });
        } else {
          // Create new assistant
          return fetch('/api/admin/assistants', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assistant)
          });
        }
      });

      // Delete removed assistants
      if (state.deletedAssistants && state.deletedAssistants.length > 0) {
        const deletePromises = state.deletedAssistants.map(async (deletedAssistant) => {
          return fetch(`/api/admin/assistants?id=${deletedAssistant.id}`, {
            method: 'DELETE'
          });
        });
        await Promise.all(deletePromises);
      }

      // Save configuration values along with assistants
      if (state.hasConfigChanges) {
        const configPromises = state.configValues.map(async (config) => {
          const response = await fetch('/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: config.name,
              value: config.value,
              scope: config.scope
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Failed to save config ${config.name}: ${errorData.error || 'Unknown error'}`);
          }
          
          return response.json();
        });

        await Promise.all(configPromises);
      }

      await Promise.all(assistantPromises);
      
      setState(prev => ({
        ...prev,
        success: 'Assistants and configuration saved successfully',
        hasAssistantChanges: false,
        hasConfigChanges: false,
        deletedAssistants: []
      }));
    } catch (error) {
      console.error('Error saving assistants:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to save assistants'
      }));
    }
  };

  const updateModelConfig = (id: string, updates: Partial<ModelConfig>) => {
    setState(prev => ({
      ...prev,
      modelConfigs: prev.modelConfigs.map(model =>
        model.id === id ? { ...model, ...updates } : model
      ),
      hasChanges: true,
      hasModelChanges: true
    }));
  };

  const updatePromptConfig = (id: string, updates: Partial<PromptConfig>) => {
    setState(prev => ({
      ...prev,
      promptConfigs: prev.promptConfigs.map(prompt =>
        prompt.id === id ? { ...prompt, ...updates } : prompt
      ),
      hasChanges: true,
      hasPromptChanges: true
    }));
  };

  const updateAssistant = (id: number, updates: Partial<Assistant>) => {
    setState(prev => ({
      ...prev,
      assistants: prev.assistants.map(assistant =>
        assistant.id === id ? { ...assistant, ...updates } : assistant
      ),
      hasChanges: true,
      hasAssistantChanges: true
    }));
  };

  const updateConfigValue = (name: string, value: string) => {
    setState(prev => ({
      ...prev,
      configValues: prev.configValues.map(config =>
        config.name === name ? { ...config, value } : config
      ),
      hasChanges: true,
      hasConfigChanges: true,
      hasAssistantChanges: true  // Also enable assistant saving since config is saved with assistants
    }));
  };

  const addModelConfig = (model: ModelConfig) => {
    setState(prev => ({
      ...prev,
      modelConfigs: [...prev.modelConfigs, model],
      hasChanges: true,
      hasModelChanges: true
    }));
  };

  const addPromptConfig = (type: 'system' | 'evaluation') => {
    const newPrompt: PromptConfig = {
      // Use 'prompt-' prefix so backend knows this is a new prompt to be inserted
      id: `prompt-${type}-${Date.now()}`,
      name: `New ${type === 'system' ? 'System' : 'Evaluation'} Prompt`,
      content: '',
      type
    };
    
    setState(prev => ({
      ...prev,
      promptConfigs: [...prev.promptConfigs, newPrompt],
      hasChanges: true,
      hasPromptChanges: true
    }));
  };

  const addAssistant = (assistant: Omit<Assistant, 'id' | 'created_at' | 'updated_at'>) => {
    const newAssistant: Assistant = {
      ...assistant,
      id: -Date.now(), // Temporary negative ID for new assistants
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setState(prev => ({
      ...prev,
      assistants: [...prev.assistants, newAssistant],
      hasChanges: true,
      hasAssistantChanges: true
    }));
  };

  const addProviderModels = (provider: 'openai' | 'anthropic' | 'google', modelNames: string[]) => {
    const newModels: ModelConfig[] = modelNames.map(modelName => ({
      id: `temp-${Date.now()}-${Math.random()}`,
      name: modelName,
      provider,
      model: modelName,
      isEnabled: true,
      isEvaluationModel: true,
      isOutputGenerationModel: true
    }));

    setState(prev => ({
      ...prev,
      modelConfigs: [...prev.modelConfigs, ...newModels],
      hasChanges: true,
      hasModelChanges: true
    }));
  };

  const removeModelConfig = (id: string) => {
    setState(prev => {
      const modelToRemove = prev.modelConfigs.find(m => m.id === id);
      const updatedModels = prev.modelConfigs.filter(m => m.id !== id);
      
      return {
        ...prev,
        modelConfigs: updatedModels,
        hasChanges: true,
        hasModelChanges: true,
        deletedModels: modelToRemove && modelToRemove.id.startsWith('temp-') === false
          ? [...(prev.deletedModels || []), { id, provider: modelToRemove.provider, model: modelToRemove.model }]
          : prev.deletedModels
      };
    });
  };

  const removePromptConfig = (id: string) => {
    setState(prev => {
      const promptToRemove = prev.promptConfigs.find(p => p.id === id);
      const updatedPrompts = prev.promptConfigs.filter(p => p.id !== id);
      
      return {
        ...prev,
        promptConfigs: updatedPrompts,
        hasChanges: true,
        hasPromptChanges: true,
        deletedPrompts: promptToRemove && promptToRemove.id.startsWith('temp-') === false
          ? [...(prev.deletedPrompts || []), { id, type: promptToRemove.type }]
          : prev.deletedPrompts
      };
    });
  };

  const removeAssistant = (id: number) => {
    setState(prev => {
      const assistantToRemove = prev.assistants.find(a => a.id === id);
      const updatedAssistants = prev.assistants.filter(a => a.id !== id);
      
      return {
        ...prev,
        assistants: updatedAssistants,
        hasChanges: true,
        hasAssistantChanges: true,
        deletedAssistants: assistantToRemove && assistantToRemove.id > 0
          ? [...(prev.deletedAssistants || []), { id, type: assistantToRemove.type }]
          : prev.deletedAssistants
      };
    });
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
    saveModelsOnly,
    savePromptsOnly,
    saveAssistantsOnly,
    updateModelConfig,
    updatePromptConfig,
    updateAssistant,
    updateConfigValue,
    addModelConfig,
    addPromptConfig,
    addAssistant,
    addProviderModels,
    removeModelConfig,
    removePromptConfig,
    removeAssistant,
    setActiveSection,
    clearError,
    clearSuccess
  };
} 