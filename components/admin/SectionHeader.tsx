interface SectionHeaderProps {
  title: string;
  description: string;
  buttonText: string;
  buttonColor: string;
  onAddClick: () => void;
}

export function SectionHeader({
  title,
  description,
  buttonText,
  buttonColor,
  onAddClick
}: SectionHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
        <p className="text-gray-600">{description}</p>
      </div>
      <button 
        onClick={onAddClick} 
        className={`px-4 py-2 ${buttonColor} text-white rounded-md hover:opacity-90 flex items-center gap-2`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        {buttonText}
      </button>
    </div>
  );
} 