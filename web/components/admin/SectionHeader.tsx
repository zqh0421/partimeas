import { Typography } from 'antd';

const { Title, Paragraph } = Typography;

interface SectionHeaderProps {
  title: string;
  description: string;
}

export function SectionHeader({
  title,
  description,
}: SectionHeaderProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
      <div>
        <Title level={2} style={{ marginBottom: 8 }}>{title}</Title>
        <Paragraph type="secondary" style={{ marginBottom: 0 }}>{description}</Paragraph>
      </div>
    </div>
  );
} 