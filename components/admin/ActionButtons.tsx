interface ActionButtonsProps {
  hasChanges: boolean;
  onSave: () => void;
  onReload: () => void;
}

export function ActionButtons({ hasChanges, onSave, onReload }: ActionButtonsProps) {
  return (
    <div className="flex gap-4 mb-6">
      <button 
        onClick={onSave} 
        disabled={!hasChanges}
        className={`px-4 py-2 rounded-md font-medium flex items-center gap-2 ${
          hasChanges 
            ? 'bg-blue-600 text-white hover:bg-blue-700' 
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
        Save Changes
      </button>
      
      <button 
        onClick={onReload}
        className="px-4 py-2 border border-gray-300 rounded-md font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Reload
      </button>
    </div>
  );
} 