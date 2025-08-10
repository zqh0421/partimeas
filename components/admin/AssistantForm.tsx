import { AssistantConfig, ModelConfig, PromptConfig } from '../../types/admin';

interface AssistantFormProps {
  assistant: AssistantConfig;
  models: ModelConfig[];
  prompts: PromptConfig[];
  onUpdate: (id: string, updates: Partial<AssistantConfig>) => void;
}

export function AssistantForm({
  assistant,
  models,
  prompts,
  onUpdate
}: AssistantFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <input
          type="text"
          value={assistant.description}
          onChange={(e) => onUpdate(assistant.id, { description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Brief description of this assistant's purpose"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt</label>
          <select
            value={assistant.systemPromptId}
            onChange={(e) => onUpdate(assistant.id, { systemPromptId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a system prompt</option>
            {prompts
              .filter(prompt => prompt.type === 'system')
              .map(prompt => (
                <option key={prompt.id} value={prompt.id}>
                  {prompt.name}
                </option>
              ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Response Count</label>
          <input
            type="number"
            min="1"
            max="10"
            value={assistant.responseCount}
            onChange={(e) => onUpdate(assistant.id, { responseCount: parseInt(e.target.value) || 1 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Models</label>
        <div className="space-y-2">
          {models
            .filter(model => 
              (assistant.type === 'output-generation' ? model.isOutputGenerationModel : model.isEvaluationModel) && 
              model.isEnabled
            )
            .map(model => (
              <div key={model.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={assistant.modelIds.includes(model.id)}
                  onChange={(e) => {
                    const newModelIds = e.target.checked
                      ? [...assistant.modelIds, model.id]
                      : assistant.modelIds.filter(id => id !== model.id);
                    onUpdate(assistant.id, { modelIds: newModelIds });
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="text-sm text-gray-700">
                  {model.name} ({model.provider}/{model.model})
                </label>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
} 