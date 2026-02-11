"use client";

import { Button, Col, Input, List, Typography, Row, Space } from "antd/es";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";
import { PromptConfig } from "@/types/admin";

export const MONO_TEXT_STYLE = {
  fontFamily: "monospace",
  fontSize: "13px",
};

const { Text, Paragraph } = Typography;

interface PromptItemProps {
  prompt: PromptConfig;
  isEditing: boolean;
  isNewPrompt: boolean;
  onEditToggle: () => void;
  onUpdatePrompt: (id: string, updates: Partial<PromptConfig>) => void;
  onRemovePrompt: (id: string) => void;
  setPromptRef: (id: string, el: HTMLDivElement | null) => void;
}

export function PromptItem({
  prompt,
  isEditing,
  isNewPrompt,
  onEditToggle,
  onUpdatePrompt,
  onRemovePrompt,
  setPromptRef,
}: PromptItemProps) {
  const hasName = !!prompt.name.trim();
  const hasContent = !!prompt.content.trim();

  return (
    <List.Item
      key={prompt.id}
      style={{
        padding: "20px 0",
        backgroundColor: isNewPrompt ? "#f6ffed" : "transparent",
        border: isNewPrompt ? "1px solid #b7eb8f" : "none",
        borderRadius: isNewPrompt ? "8px" : "0",
        margin: isNewPrompt ? "8px 0" : "0",
      }}
      ref={(el) => setPromptRef(prompt.id, el)}
    >
      <div style={{ width: "100%" }}>
        <Row gutter={[16, 8]} style={{ marginBottom: "16px", width: "100%" }}>
          <Col xs={24} sm={16}>
            <Space direction="vertical" size={4}>
              {isNewPrompt && (
                <Text
                  type="success"
                  style={{ fontSize: "12px", fontWeight: 500 }}
                >
                  New Prompt - Please fill in the details below
                </Text>
              )}
              <Text strong style={{ fontSize: "14px", color: "#595959" }}>
                Name
              </Text>
              {isEditing ? (
                <Input
                  value={prompt.name}
                  onChange={(e) =>
                    onUpdatePrompt(prompt.id, { name: e.target.value })
                  }
                  placeholder="Enter prompt name"
                  size="middle"
                  style={{ width: "300px" }}
                  status={!hasName ? "error" : undefined}
                />
              ) : (
                <Text
                  style={{
                    fontSize: "16px",
                    color: "#595959",
                    fontWeight: 400,
                  }}
                >
                  {prompt.name || "Unnamed prompt"}
                </Text>
              )}
              {isEditing && !hasName && (
                <Text type="danger" style={{ fontSize: "12px" }}>
                  Prompt name cannot be empty
                </Text>
              )}
            </Space>
          </Col>

          <Col xs={24} sm={8}>
            <Space direction="vertical" size={4}>
              <Text strong style={{ fontSize: "14px", color: "#262626" }}>
                Actions
              </Text>
              <Space>
                <Button
                  type={isEditing ? "primary" : "default"}
                  icon={<EditOutlined />}
                  onClick={onEditToggle}
                  size="middle"
                >
                  {isEditing ? "Stop Editing" : "Edit"}
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

        <div>
          <Text
            strong
            style={{
              fontSize: "14px",
              color: "#262626",
              display: "block",
              marginBottom: "8px",
            }}
          >
            Prompt Content
          </Text>
          <div
            style={{
              backgroundColor: "#fafafa",
              padding: "16px",
              borderRadius: "8px",
              border:
                isEditing && !hasContent
                  ? "1px solid #ff4d4f"
                  : "1px solid #d9d9d9",
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            {isEditing ? (
              <Input.TextArea
                value={prompt.content}
                onChange={(e) =>
                  onUpdatePrompt(prompt.id, { content: e.target.value })
                }
                placeholder="Enter prompt content"
                status={!hasContent ? "error" : undefined}
                style={{
                  ...MONO_TEXT_STYLE,
                  height: "250px",
                  width: "100%",
                  resize: "none",
                  border: "none",
                  backgroundColor: "white",
                }}
              />
            ) : (
              <Paragraph
                style={{
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  ...MONO_TEXT_STYLE,
                  lineHeight: "1.6",
                  color: "#595959",
                }}
              >
                {prompt.content || "No content available"}
              </Paragraph>
            )}
          </div>
          {isEditing && !hasContent && (
            <Text type="danger" style={{ fontSize: "12px", marginTop: "4px" }}>
              Prompt content cannot be empty
            </Text>
          )}
        </div>
      </div>
    </List.Item>
  );
}
