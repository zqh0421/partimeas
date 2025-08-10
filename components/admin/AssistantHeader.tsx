interface AssistantHeaderProps {
  name: string;
  isEnabled: boolean;
  onNameChange: (name: string) => void;
  onEnabledChange: (enabled: boolean) => void;
  onRemove: () => void;
}

export function AssistantHeader({
  name,
  isEnabled,
  onNameChange,
  onEnabledChange,
  onRemove
}: AssistantHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-64 px-3 py-2 border border-gray-300 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Assistant name"
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="text-sm font-medium text-gray-700">Enabled</label>
        </div>
      </div>
      <button
        onClick={onRemove}
        className="text-red-600 hover:text-red-700 p-1"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
} 