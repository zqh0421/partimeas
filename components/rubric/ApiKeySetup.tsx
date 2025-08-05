'use client';

import { useState } from 'react';

interface ApiKeySetupProps {
  rubricData: any;
  setRubricData: (data: any) => void;
}

export default function ApiKeySetup({ rubricData, setRubricData }: ApiKeySetupProps) {
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
    // In a real application, you'd want to encrypt these or use a secure backend
    localStorage.setItem('rubricApiKeys', JSON.stringify(apiKeys));
    alert('API keys saved locally. Remember to add them to your .env.local file for production.');
  };

  const loadApiKeys = () => {
    const saved = localStorage.getItem('rubricApiKeys');
    if (saved) {
      setApiKeys(JSON.parse(saved));
    }
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">API Key Configuration</h2>
        <p className="text-gray-600 mb-6">
          Configure API keys for different LLM providers to enable rubric evaluation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          {providers.map((provider) => (
            <div key={provider.key} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{provider.name}</h3>
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
          
          <div className="flex space-x-3">
            <button
              onClick={saveApiKeys}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Save Keys
            </button>
            <button
              onClick={loadApiKeys}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Load Saved
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Environment Setup</h3>
            <p className="text-sm text-blue-800 mb-3">
              For production use, add your API keys to the <code className="bg-blue-100 px-1 rounded">.env.local</code> file:
            </p>
            <pre className="text-xs text-blue-900 bg-blue-100 p-2 rounded overflow-x-auto">
{`OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
GOOGLE_API_KEY=your_google_key_here`}
            </pre>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 className="text-sm font-medium text-yellow-900 mb-2">Security Notes</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• API keys are stored locally in this demo</li>
              <li>• For production, use environment variables</li>
              <li>• Never commit API keys to version control</li>
              <li>• Rotate keys regularly for security</li>
            </ul>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-sm font-medium text-green-900 mb-2">Usage Tips</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Test each API key to ensure it's valid</li>
              <li>• Different providers may have different rate limits</li>
              <li>• Consider costs when choosing providers</li>
              <li>• Some providers offer free tiers for testing</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Current Status</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
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
  );
} 