export const getProviderColor = (provider: string) => {
  switch (provider) {
    case 'openai': return 'bg-green-100 text-green-800';
    case 'anthropic': return 'bg-blue-100 text-blue-800';
    case 'google': return 'bg-purple-100 text-purple-800';
    case 'openrouter': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getSectionButtonClass = (isActive: boolean) => {
  return `border-b-2 py-2 px-1 text-sm font-medium ${
    isActive
      ? 'border-blue-500 text-blue-600'
      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
  }`;
}; 