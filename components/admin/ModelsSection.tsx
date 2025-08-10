import { ModelConfig } from '../../types/admin';

interface ModelsSectionProps {
  models: ModelConfig[];
  onAddModel: () => void;
  onUpdateModel: (id: string, updates: Partial<ModelConfig>) => void;
  onRemoveModel: (id: string) => void;
  title: string;
  addButtonColor: string;
  checkboxColor: string;
}

export function ModelsSection({ 
  models, 
  onAddModel, 
  onUpdateModel, 
  onRemoveModel, 
  title, 
  addButtonColor, 
  checkboxColor 
}: ModelsSectionProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <button 
          onClick={onAddModel}
          className={`px-3 py-1 ${addButtonColor} text-white text-sm rounded-md hover:opacity-90`}
        >
          Add Model
        </button>
      </div>
      
      <div className="space-y-3">
        {models.map(model => (
          <div key={model.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={model.isEnabled}
                onChange={(e) => onUpdateModel(model.id, { isEnabled: e.target.checked })}
                className={`h-4 w-4 ${checkboxColor} focus:ring-blue-500 border-gray-300 rounded`}
              />
              <div>
                <div className="font-medium text-gray-900">{model.name}</div>
                <div className="text-sm text-gray-500">{model.provider}/{model.model}</div>
              </div>
            </div>
            <button
              onClick={() => onRemoveModel(model.id)}
              className="text-red-600 hover:text-red-700 p-1"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
} 