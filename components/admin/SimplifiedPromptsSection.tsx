import { Card, Button, List, Radio, Typography, Space, Row, Col, Input, Switch, Tooltip } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, SaveOutlined } from '@ant-design/icons';
import { PromptConfig } from '../../types/admin';
import { useState, useEffect, useRef } from 'react';

const { Title, Text, Paragraph } = Typography;

interface SimplifiedPromptsSectionProps {
  prompts: PromptConfig[];
  onAddPrompt: (type: 'system' | 'evaluation') => void;
  onUpdatePrompt: (id: string, updates: Partial<PromptConfig>) => void;
  onRemovePrompt: (id: string) => void;
  onSave: () => void;
  hasChanges?: boolean;
  promptType: 'system' | 'evaluation';
}

export function SimplifiedPromptsSection({ 
  prompts, 
  onAddPrompt, 
  onUpdatePrompt, 
  onRemovePrompt,
  onSave,
  hasChanges = false,
  promptType
}: SimplifiedPromptsSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPromptId, setNewPromptId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const promptRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const listRef = useRef<HTMLDivElement>(null);

  // Track when a new prompt is added and automatically edit it
  useEffect(() => {
    if (prompts.length > 0) {
      const lastPrompt = prompts[prompts.length - 1];
      // Check if this is a newly added prompt (has empty content and name starts with "New")
      if (lastPrompt.content === '' && lastPrompt.name.startsWith('New') && !editingId) {
        setNewPromptId(lastPrompt.id);
        setEditingId(lastPrompt.id);
        
        // Scroll to the new prompt after a short delay to ensure DOM is rendered
        setTimeout(() => {
          if (promptRefs.current[lastPrompt.id]) {
            promptRefs.current[lastPrompt.id]?.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
            
            // Focus on the name input after scrolling
            setTimeout(() => {
              const nameInput = promptRefs.current[lastPrompt.id]?.querySelector('input[placeholder="Enter prompt name"]') as HTMLInputElement;
              if (nameInput) {
                nameInput.focus();
                nameInput.select();
              }
            }, 200);
          }
        }, 100);
      }
    }
  }, [prompts, editingId]);

  // Clear new prompt tracking when editing stops
  useEffect(() => {
    if (!editingId && newPromptId) {
      setNewPromptId(null);
    }
  }, [editingId, newPromptId]);

  const handleAddPrompt = () => {
    onAddPrompt(promptType);
  };

  const handleSave = async () => {
    // Check if any prompt being edited has empty content
    if (editingId) {
      const editingPrompt = prompts.find(p => p.id === editingId);
      if (editingPrompt && (!editingPrompt.content.trim() || !editingPrompt.name.trim())) {
        // Don't save if content or name is empty
        return;
      }
    }
    
    if (isSaving) return; // Prevent multiple save attempts
    
    setIsSaving(true);
    try {
      await onSave();
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = hasChanges && (!editingId || (() => {
    const editingPrompt = prompts.find(p => p.id === editingId);
    return editingPrompt && editingPrompt.content.trim() && editingPrompt.name.trim();
  })());

  return (
    <Card
      title={
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              {promptType === 'system' ? 'System Prompts' : 'Evaluation Prompts'}
            </Title>
          </Col>
          <Col>
            <Space>
              <Tooltip 
                title={!canSave && editingId ? "Please fill in all required fields before saving" : undefined}
                placement="top"
              >
                <Button 
                  type="primary"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  disabled={!canSave || isSaving}
                  loading={isSaving}
                  size="small"
                >
                  {isSaving ? 'Saving...' : 'Save Prompts'}
                </Button>
              </Tooltip>
              <Button 
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddPrompt}
                size="small"
              >
                Add Prompt
              </Button>
            </Space>
          </Col>
        </Row>
      }
      style={{ marginBottom: 24 }}
    >
      <List
        ref={listRef}
        dataSource={prompts}
        renderItem={(prompt) => (
          <List.Item 
            key={prompt.id} 
            style={{ 
              padding: '20px 0',
              backgroundColor: newPromptId === prompt.id ? '#f6ffed' : 'transparent',
              border: newPromptId === prompt.id ? '1px solid #b7eb8f' : 'none',
              borderRadius: newPromptId === prompt.id ? '8px' : '0',
              margin: newPromptId === prompt.id ? '8px 0' : '0'
            }}
            ref={(el) => {
              promptRefs.current[prompt.id] = el;
            }}
          >
            <div style={{ width: '100%' }}>
              {/* Header Row - Name and Actions */}
              <Row gutter={[16, 8]} style={{ marginBottom: '16px', width: '100%' }}>
                <Col xs={24} sm={16}>
                  <Space direction="vertical" size={4}>
                    {newPromptId === prompt.id && (
                      <Text type="success" style={{ fontSize: '12px', fontWeight: 500 }}>
                        ✨ New Prompt - Please fill in the details below
                      </Text>
                    )}
                    <Text strong style={{ fontSize: '14px', color: '#595959' }}>Name</Text>
                    {editingId === prompt.id ? (
                      <Input
                        value={prompt.name}
                        onChange={(e) => onUpdatePrompt(prompt.id, { name: e.target.value })}
                        placeholder="Enter prompt name"
                        size="middle"
                        style={{ width: '300px' }}
                        status={!prompt.name.trim() ? 'error' : undefined}
                      />
                    ) : (
                      <Text style={{ fontSize: '16px', color: '#595959', fontWeight: 400 }}>
                        {prompt.name || 'Unnamed prompt'}
                      </Text>
                    )}
                    {editingId === prompt.id && !prompt.name.trim() && (
                      <Text type="danger" style={{ fontSize: '12px' }}>
                        Prompt name cannot be empty
                      </Text>
                    )}
                  </Space>
                </Col>

                <Col xs={24} sm={8}>
                  <Space direction="vertical" size={4}>
                    <Text strong style={{ fontSize: '14px', color: '#262626' }}>Actions</Text>
                    <Space>
                      <Button
                        type={editingId === prompt.id ? "primary" : "default"}
                        icon={<EditOutlined />}
                        onClick={() => setEditingId(editingId === prompt.id ? null : prompt.id)}
                        size="middle"
                      >
                        {editingId === prompt.id ? 'Stop Editing' : 'Edit'}
                      </Button>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => onRemovePrompt(prompt.id)}
                        size="middle"
                      >
                        Delete
                      </Button>
                    </Space>
                  </Space>
                </Col>
              </Row>

              {/* Content Section */}
              <div>
                <Text strong style={{ fontSize: '14px', color: '#262626', display: 'block', marginBottom: '8px' }}>
                  Prompt Content
                </Text>
                <div style={{ 
                  backgroundColor: '#fafafa', 
                  padding: '16px', 
                  borderRadius: '8px',
                  border: editingId === prompt.id && !prompt.content.trim() ? '1px solid #ff4d4f' : '1px solid #d9d9d9',
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  {editingId === prompt.id ? (
                    <Input.TextArea
                      value={prompt.content}
                      onChange={(e) => onUpdatePrompt(prompt.id, { content: e.target.value })}
                      placeholder="Enter prompt content"
                      status={!prompt.content.trim() ? 'error' : undefined}
                      style={{ 
                        fontFamily: 'monospace', 
                        fontSize: '13px',
                        height: '250px',
                        width: '100%',
                        resize: 'none',
                        border: 'none',
                        backgroundColor: 'white'
                      }}
                    />
                  ) : (
                    <Paragraph 
                      style={{ 
                        margin: 0, 
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        lineHeight: '1.6',
                        color: '#595959'
                      }}
                    >
                      {prompt.content || 'No content available'}
                    </Paragraph>
                  )}
                </div>
                {editingId === prompt.id && !prompt.content.trim() && (
                  <Text type="danger" style={{ fontSize: '12px', marginTop: '4px' }}>
                    Prompt content cannot be empty
                  </Text>
                )}
              </div>
            </div>
          </List.Item>
        )}
        locale={{ emptyText: 'No prompts configured' }}
      />
    </Card>
  );
}