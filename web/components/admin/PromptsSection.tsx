import { PromptConfig } from '../../types/admin';
import { useState } from 'react';

interface PromptsSectionProps {
  prompts: PromptConfig[];
  onAddPrompt: (type: 'system' | 'evaluation') => void;
  onUpdatePrompt: (id: string, updates: Partial<PromptConfig>) => void;
  onRemovePrompt: (id: string) => void;
  title: string;
  addButtonColor: string;
  radioColor: string;
  promptType: 'system' | 'evaluation';
}

export function PromptsSection({ 
  prompts, 
  onAddPrompt, 
  onUpdatePrompt,
  onRemovePrompt, 
  title, 
  addButtonColor, 
  radioColor, 
  promptType 
}: PromptsSectionProps) {
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());

  const toggleExpanded = (promptId: string) => {
    const newExpanded = new Set(expandedPrompts);
    if (newExpanded.has(promptId)) {
      newExpanded.delete(promptId);
    } else {
      newExpanded.add(promptId);
    }
    setExpandedPrompts(newExpanded);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <button 
          onClick={() => onAddPrompt(promptType)}
          className={`px-3 py-1 ${addButtonColor} text-white text-sm rounded-md hover:opacity-90`}
        >
          Add Prompt
        </button>
      </div>
      
      <div className="space-y-4">
        {prompts.map(prompt => {
          const isExpanded = expandedPrompts.has(prompt.id);
          return (
            <div key={prompt.id} className="border border-gray-200 rounded-lg">
              {/* Header with name and controls */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Prompt</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleExpanded(prompt.id)}
                      className="text-gray-600 hover:text-gray-700 p-1"
                      title={isExpanded ? "Collapse" : "Expand to edit"}
                    >
                      <svg className={`h-4 w-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onRemovePrompt(prompt.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                      title="Delete prompt"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Name input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={prompt.name}
                    onChange={(e) => onUpdatePrompt(prompt.id, { name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Enter prompt name"
                  />
                </div>
              </div>

              {/* Expanded content area */}
              {isExpanded && (
                <div className="p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prompt Content</label>
                  <textarea
                    value={prompt.content}
                    onChange={(e) => onUpdatePrompt(prompt.id, { content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                    rows={12}
                    placeholder="Enter your prompt content here..."
                  />

                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 