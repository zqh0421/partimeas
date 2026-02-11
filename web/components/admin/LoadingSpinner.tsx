import { Spin } from 'antd';

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spin size="large" />
    </div>
  );
} 