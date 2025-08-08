'use client';

interface SelectorOption {
  id: string;
  name: string;
  description: string;
  category?: string;
  metadata?: {
    type: string;
    value: string;
  };
}

interface GenericSelectorProps {
  title: string;
  description: string;
  options: SelectorOption[];
  onOptionSelected: (optionId: string) => void;
  onDataLoaded?: (data: any) => void;
  onError: (error: string) => void;
  isLoading?: boolean;
  selectedOption?: string;
  showCategoryFilter?: boolean;
  categories?: string[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  loadingText?: string;
  emptyText?: string;
}

export default function GenericSelector({
  title,
  description,
  options,
  onOptionSelected,
  onDataLoaded,
  onError,
  isLoading = false,
  selectedOption = '',
  showCategoryFilter = false,
  categories = [],
  selectedCategory = 'all',
  onCategoryChange,
  loadingText = 'Loading...',
  emptyText = 'No options available.'
}: GenericSelectorProps) {
  const handleOptionSelect = async (optionId: string) => {
    try {
      onOptionSelected(optionId);
    } catch (error) {
      onError(`Failed to select option: ${error}`);
    }
  };

  const filteredOptions = showCategoryFilter && selectedCategory !== 'all'
    ? options.filter(option => option.category === selectedCategory)
    : options;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      <div className="p-6">
        {/* Category Filter */}
        {showCategoryFilter && categories.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Category
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => onCategoryChange?.(category)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {category === 'all' ? 'All Categories' : category}
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">{loadingText}</p>
            </div>
          </div>
        )}

        {!isLoading && (
          <div className="space-y-4">
            {filteredOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleOptionSelect(option.id)}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  selectedOption === option.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">
                      {option.name}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {option.description}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      {option.category && (
                        <span className="bg-gray-100 px-2 py-1 rounded">
                          {option.category}
                        </span>
                      )}
                      {option.metadata && (
                        option.metadata.type === 'Spreadsheet' && option.metadata.value && option.metadata.value !== 'Loading...'
                        ? (
                            <span>
                              {option.metadata.type}: {" "}
                              <a
                                href={option.metadata.value}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Open sheet
                              </a>
                            </span>
                          )
                          : (
                            <span>{option.metadata.type}: {option.metadata.value}</span>
                          )
                      )}
                    </div>
                  </div>
                  {selectedOption === option.id && (
                    <div className="text-blue-600">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {filteredOptions.length === 0 && !isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-500">{emptyText}</p>
          </div>
        )}
      </div>
    </div>
  );
} 