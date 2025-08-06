'use client';

import { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluationPrompt?: string;
  onEvaluationPromptChange?: (prompt: string) => void;
}

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  evaluationPrompt = '', 
  onEvaluationPromptChange 
}: SettingsModalProps) {
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    anthropic: '',
    google: ''
  });
  const [showKeys, setShowKeys] = useState(false);
  const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({
    openai: 'idle',
    anthropic: 'idle',
    google: 'idle'
  });

  useEffect(() => {
    // Load API keys from localStorage if available
    const saved = localStorage.getItem('rubricApiKeys');
    if (saved) {
      setApiKeys(JSON.parse(saved));
    }
  }, []);

  const handleApiKeyChange = (provider: string, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [provider]: value
    }));
  };

  const testApiKey = async (provider: string) => {
    setTestStatus(prev => ({ ...prev, [provider]: 'testing' }));
    
    try {
      // Simulate API test - in real implementation, you'd make actual API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock test results
      const isValid = apiKeys[provider as keyof typeof apiKeys].length > 10;
      
      setTestStatus(prev => ({ 
        ...prev, 
        [provider]: isValid ? 'success' : 'error' 
      }));
    } catch (error) {
      setTestStatus(prev => ({ ...prev, [provider]: 'error' }));
    }
  };

  const saveApiKeys = () => {
    localStorage.setItem('rubricApiKeys', JSON.stringify(apiKeys));
    alert('API keys saved locally. Remember to add them to your .env.local file for production.');
  };

  const providers = [
    {
      key: 'openai',
      name: 'OpenAI',
      description: 'GPT-4, GPT-3.5-turbo, and other OpenAI models',
      placeholder: 'sk-...',
      docs: 'https://platform.openai.com/api-keys'
    },
    {
      key: 'anthropic',
      name: 'Anthropic',
      description: 'Claude models for advanced reasoning',
      placeholder: 'sk-ant-...',
      docs: 'https://console.anthropic.com/'
    },
    {
      key: 'google',
      name: 'Google AI',
      description: 'Gemini models for multimodal evaluation',
      placeholder: 'AIza...',
      docs: 'https://aistudio.google.com/app/apikey'
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Evaluation Prompt Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">🎯 Evaluation Prompt Configuration</h3>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="mb-3">
                  <h4 className="text-base font-medium text-gray-900 mb-2">Evaluation Prompt</h4>
                  <p className="text-sm text-gray-600">
                    Configure the prompt used for evaluating LLM outputs. This prompt will be used by the evaluation system to assess the quality of model responses.
                  </p>
                </div>
                <textarea
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Enter the evaluation prompt for comparing LLM outputs..."
                  value={evaluationPrompt}
                  onChange={(e) => onEvaluationPromptChange?.(e.target.value)}
                />
                <div className="mt-2 text-xs text-gray-500">
                  Use placeholders like {'{input}'}, {'{output}'}, {'{criteria}'} to reference dynamic content.
                </div>
              </div>
            </div>
          </div>

          {/* API Keys Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">API Key Configuration</h3>
            <div className="space-y-4">
              {providers.map((provider) => (
                <div key={provider.key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{provider.name}</h4>
                      <p className="text-sm text-gray-600">{provider.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => testApiKey(provider.key)}
                        disabled={testStatus[provider.key] === 'testing'}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                      >
                        {testStatus[provider.key] === 'testing' ? 'Testing...' : 'Test'}
                      </button>
                      {testStatus[provider.key] === 'success' && (
                        <span className="text-green-600 text-sm">✓ Valid</span>
                      )}
                      {testStatus[provider.key] === 'error' && (
                        <span className="text-red-600 text-sm">✗ Invalid</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="relative">
                      <input
                        type={showKeys ? 'text' : 'password'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder={provider.placeholder}
                        value={apiKeys[provider.key as keyof typeof apiKeys]}
                        onChange={(e) => handleApiKeyChange(provider.key, e.target.value)}
                      />
                      <button
                        onClick={() => setShowKeys(!showKeys)}
                        className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                      >
                        {showKeys ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <a
                        href={provider.docs}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Get API Key →
                      </a>
                      <span className="text-xs text-gray-500">
                        {apiKeys[provider.key as keyof typeof apiKeys].length} characters
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-end">
                <button
                  onClick={saveApiKeys}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Save Keys
                </button>
              </div>
            </div>
          </div>


          {/* Provider Status */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Provider Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {providers.map((provider) => (
                <div key={provider.key} className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${
                    apiKeys[provider.key as keyof typeof apiKeys] ? 'bg-green-500' : 'bg-gray-300'
                  }`}></span>
                  <span className="text-gray-700">{provider.name}</span>
                  <span className="text-gray-500">
                    {apiKeys[provider.key as keyof typeof apiKeys] ? 'Configured' : 'Not set'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
} 