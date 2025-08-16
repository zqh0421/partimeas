"use client";

interface HeaderProps {
  onOpenVersionHistory: () => void;
}

export default function Header({ onOpenVersionHistory }: HeaderProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Child Development Rubric Refiner
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Refine evaluation criteria for AI responses in child development scenarios
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onOpenVersionHistory}
            className="px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm sm:text-base"
          >
            <span>🚀</span>
            <span className="hidden sm:inline">Version History</span>
          </button>
        </div>
      </div>
    </div>
  );
} 