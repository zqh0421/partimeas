import { AdminSection } from '../../types/admin';
import { getSectionButtonClass } from '../../utils/adminHelpers';

interface SectionNavigationProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
}

export function SectionNavigation({ activeSection, onSectionChange }: SectionNavigationProps) {
  return (
    <div className="border-b border-gray-200 mb-8">
      <nav className="-mb-px flex space-x-8">
        <button
          onClick={() => onSectionChange('output-generation')}
          className={getSectionButtonClass(activeSection === 'output-generation')}
        >
          Output Generation
        </button>
        <button
          onClick={() => onSectionChange('evaluation')}
          className={getSectionButtonClass(activeSection === 'evaluation')}
        >
          Evaluation
        </button>
      </nav>
    </div>
  );
} 