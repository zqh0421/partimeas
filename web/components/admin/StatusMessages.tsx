import { Alert, Space } from 'antd';

interface StatusMessagesProps {
  error: string | null;
  success: string | null;
  onClearError: () => void;
  onClearSuccess: () => void;
}

export function StatusMessages({ error, success, onClearError, onClearSuccess }: StatusMessagesProps) {
  return (
    <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }}>
      {error && (
        <Alert
          message={error}
          type="error"
          closable
          onClose={onClearError}
          style={{ marginBottom: 0 }}
        />
      )}
      {success && (
        <Alert
          message={success}
          type="success"
          closable
          onClose={onClearSuccess}
          style={{ marginBottom: 0 }}
        />
      )}
    </Space>
  );
} 