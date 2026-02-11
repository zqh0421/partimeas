"use client";
import { Card, Button, List, Typography, Space, Row, Col, Tooltip } from "antd";
import { PlusOutlined, SaveOutlined } from "@ant-design/icons";
import { PromptConfig } from "@/types/admin";
import { useState, useRef } from "react";
import { PromptItem } from "@/components/admin/blocks/PromptItem";
import { useAutoEditNewPrompt } from "@/hooks/useAutoEditNewPrompt";

const { Title } = Typography;

interface SimplifiedPromptsSectionProps {
  prompts: PromptConfig[];
  onAddPrompt: (type: "system" | "evaluation") => void;
  onUpdatePrompt: (id: string, updates: Partial<PromptConfig>) => void;
  onRemovePrompt: (id: string) => void;
  onSave: () => void;
  hasChanges?: boolean;
  promptType: "system" | "evaluation";
}

export function SimplifiedPromptsSection({
  prompts,
  onAddPrompt,
  onUpdatePrompt,
  onRemovePrompt,
  onSave,
  hasChanges = false,
  promptType,
}: SimplifiedPromptsSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const promptRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const newPromptId = useAutoEditNewPrompt(
    prompts,
    editingId,
    setEditingId,
    promptRefs,
  );

  const editingPrompt = editingId
    ? prompts.find((p) => p.id === editingId) || null
    : null;
  const isEditingPromptValid =
    !editingId ||
    (!!editingPrompt &&
      !!editingPrompt.name.trim() &&
      !!editingPrompt.content.trim());
  const canSave = hasChanges && isEditingPromptValid;

  const handleSave = async () => {
    if (!isEditingPromptValid) return;

    if (isSaving) return; // Prevent multiple save attempts

    setIsSaving(true);
    try {
      onSave();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card
      title={
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              {promptType === "system"
                ? "System Prompts"
                : "Evaluation Prompts"}
            </Title>
          </Col>
          <Col>
            <Space>
              <Tooltip
                title={
                  !canSave && editingId
                    ? "Please fill in all required fields before saving"
                    : undefined
                }
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
                  {isSaving ? "Saving..." : "Save Prompts"}
                </Button>
              </Tooltip>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => onAddPrompt(promptType)}
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
        dataSource={prompts}
        renderItem={(prompt) => (
          <PromptItem
            prompt={prompt}
            isEditing={editingId === prompt.id}
            isNewPrompt={newPromptId === prompt.id}
            onEditToggle={() =>
              setEditingId(editingId === prompt.id ? null : prompt.id)
            }
            onUpdatePrompt={onUpdatePrompt}
            onRemovePrompt={onRemovePrompt}
            setPromptRef={(id, el) => {
              promptRefs.current[id] = el;
            }}
          />
        )}
        locale={{ emptyText: "No prompts configured" }}
      />
    </Card>
  );
}
