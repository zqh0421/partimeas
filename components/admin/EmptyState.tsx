import { Empty } from 'antd';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <Empty
      image={<div style={{ fontSize: 48, color: '#d9d9d9' }}>{icon}</div>}
      description={
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>{title}</div>
          <div style={{ color: '#8c8c8c', fontSize: '0.875rem' }}>{description}</div>
        </div>
      }
    />
  );
} 