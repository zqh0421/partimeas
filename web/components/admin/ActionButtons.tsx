import React from 'react';
import { Button, Space } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

interface ActionButtonsProps {
  onReload: () => void;
}

export function ActionButtons({ onReload }: ActionButtonsProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Space>
        <Button
          icon={<ReloadOutlined />}
          onClick={onReload}
          size="middle"
        >
          Reload Configuration
        </Button>
      </Space>
    </div>
  );
} 