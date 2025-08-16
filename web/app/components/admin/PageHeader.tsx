import { Typography, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

const { Title, Paragraph } = Typography;

interface PageHeaderProps {
  title: string;
  description: string;
  onReload?: () => void;
}

export function PageHeader({ title, description, onReload }: PageHeaderProps) {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'flex-start', 
      marginBottom: 24 
    }}>
      <div>
        <Title level={1} style={{ marginBottom: 8 }}>
          {title}
        </Title>
        <Paragraph type="secondary" style={{ fontSize: '1rem', marginBottom: 0 }}>
          {description}
        </Paragraph>
      </div>
      {onReload && (
        <Button
          icon={<ReloadOutlined />}
          onClick={onReload}
          size="large"
        >
          Reload
        </Button>
      )}
    </div>
  );
} 