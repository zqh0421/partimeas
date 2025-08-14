'use client';

import React, { useState } from 'react';
import { Modal, Form, Input, Button, Typography } from 'antd';

const { Title, Text } = Typography;

interface GroupIdModalProps {
  visible: boolean;
  onConfirm: (groupId: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function GroupIdModal({ visible, onConfirm, onCancel, loading = false }: GroupIdModalProps) {
  const [form] = Form.useForm();
  const [groupId, setGroupId] = useState('');

  // Debug logging
  console.log('GroupIdModal render:', { visible, loading, groupId });

  const handleSubmit = () => {
    console.log('Modal submit clicked, groupId:', groupId);
    form.validateFields().then(() => {
      console.log('Form validation passed, calling onConfirm');
      onConfirm(groupId.trim());
    });
  };

  const handleCancel = () => {
    console.log('Modal cancel clicked');
    form.resetFields();
    setGroupId('');
    onCancel();
  };

  return (
    <>



      
      <Modal
        title={
          <div className="text-center">
            <Title level={3} className="mb-2">Workshop Group Information</Title>
            <Text type="secondary">Please enter your group identifier to continue</Text>
          </div>
        }
        open={visible}
        onCancel={handleCancel}
        footer={null}
        centered
        width={500}
        maskClosable={false}
        closable={false}
      >
        <div className="py-4">
          <Form form={form} layout="vertical">
            <Form.Item
              label="Group ID"
              name="groupId"
              rules={[
                { required: true, message: 'Please enter a group ID' },
                { min: 1, message: 'Group ID must not be empty' },
                { max: 255, message: 'Group ID must be less than 255 characters' }
              ]}
              extra="Enter a unique identifier for your workshop group (e.g., team name, project code, or session identifier)"
            >
              <Input
                placeholder="e.g., Team Alpha, Project-2024, Session-A"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                size="large"
                autoFocus
              />
            </Form.Item>

            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                size="large" 
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                size="large" 
                onClick={handleSubmit}
                loading={loading}
                disabled={!groupId.trim()}
              >
                Continue to Workshop
              </Button>
            </div>
          </Form>
        </div>
      </Modal>
    </>
  );
} 