import { Tabs } from 'antd';
import { AdminSection } from '../../types/admin';

interface SectionNavigationProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
}

export function SectionNavigation({ activeSection, onSectionChange }: SectionNavigationProps) {
  const items = [
    {
      key: 'assistants',
      label: 'Main Settings',
    },
    {
      key: 'output-generation',
      label: 'Output Generation',
    },
    {
      key: 'evaluation',
      label: 'Evaluation',
    },
    {
      key: 'models',
      label: 'Models',
    },
  ];

  return (
    <Tabs
      activeKey={activeSection}
      onChange={(key) => onSectionChange(key as AdminSection)}
      items={items}
      style={{ marginBottom: 24 }}
      size="large"
    />
  );
} 