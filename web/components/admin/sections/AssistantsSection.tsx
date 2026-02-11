"use client";

import React, { useMemo, useState } from "react";
import "@ant-design/v5-patch-for-react-19";
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Typography,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import type {
  Assistant,
  ConfigValue,
  ModelConfig,
  PromptConfig,
} from "@/types/admin";

const { Title, Text } = Typography;

type AssistantType = "output_generation" | "evaluation";
type Strategy = "majority_voting" | "highest_score" | "lowest_score";
type Algorithm = "random_selection" | "unique_model";

type ModalState =
  | { open: false }
  | {
      open: true;
      mode: "create";
      type: AssistantType;
      initial: Partial<Assistant>;
    }
  | {
      open: true;
      mode: "edit";
      type: AssistantType;
      id: number;
      initial: Partial<Assistant>;
    };

const toInt = (value: string | undefined, fallback: number) => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export function AssistantsSection({
  assistants,
  modelConfigs,
  promptConfigs,
  configValues,
  onAddAssistant,
  onUpdateAssistant,
  onRemoveAssistant,
  onSaveAssistants,
  onConfigChange,
  hasAssistantChanges = false,
}: {
  assistants: Assistant[];
  modelConfigs: ModelConfig[];
  promptConfigs: PromptConfig[];
  configValues: ConfigValue[];
  onAddAssistant: (
    assistant: Omit<Assistant, "id" | "created_at" | "updated_at">,
  ) => void;
  onUpdateAssistant: (id: number, updates: Partial<Assistant>) => void;
  onRemoveAssistant: (id: number) => void;
  onSaveAssistants: () => void;
  onConfigChange: (configs: ConfigValue[]) => void;
  hasAssistantChanges?: boolean;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [modal, setModal] = useState<ModalState>({ open: false });

  const configMap = useMemo(
    () => new Map(configValues.map((item) => [item.name, item])),
    [configValues],
  );

  const upsertConfig = (name: string, value: string, scope = "global") => {
    const next = [...configValues];
    const index = next.findIndex((item) => item.name === name);

    if (index >= 0) {
      next[index] = { ...next[index], value };
    } else {
      next.push({ name, value, scope } as ConfigValue);
    }

    onConfigChange(next);
  };

  const numOutputsToRun = toInt(configMap.get("numOutputsToRun")?.value, 3);
  const numOutputsToShow = toInt(configMap.get("numOutputsToShow")?.value, 2);
  const assistantModelAlgorithm =
    (configMap.get("assistantModelAlgorithm")?.value as Algorithm) ||
    "random_selection";
  const useCacheSession = configMap.get("useCacheSession")?.value === "true";
  const referenceSessionIds = configMap.get("referenceSessionIds")?.value || "";
  const judgmentStrategy =
    (configMap.get("judgmentStrategy")?.value as Strategy) || "majority_voting";

  const assistantsByType = useMemo(
    () => ({
      output_generation: assistants.filter(
        (assistant) => assistant.type === "output_generation",
      ),
      evaluation: assistants.filter(
        (assistant) => assistant.type === "evaluation",
      ),
    }),
    [assistants],
  );

  const modelLabelById = useMemo(
    () =>
      new Map(
        modelConfigs.map((model) => [
          model.id,
          `${model.provider}/${model.model}`,
        ]),
      ),
    [modelConfigs],
  );

  const promptLabelById = useMemo(
    () => new Map(promptConfigs.map((prompt) => [prompt.id, prompt.name])),
    [promptConfigs],
  );

  const groupedModelOptions = useMemo(() => {
    const grouped = new Map<
      string,
      { label: string; options: Array<{ value: string; label: string }> }
    >();

    for (const model of modelConfigs) {
      const provider = model.provider || "unknown";
      if (!grouped.has(provider)) {
        grouped.set(provider, {
          label: provider.charAt(0).toUpperCase() + provider.slice(1),
          options: [],
        });
      }

      grouped.get(provider)?.options.push({
        value: model.id,
        label: `${provider}/${model.model}`,
      });
    }

    return Array.from(grouped.values());
  }, [modelConfigs]);

  const openCreateModal = (type: AssistantType) => {
    const initial: Partial<Assistant> = {
      name: "",
      model_ids: [],
      system_prompt_id: "",
      required_to_show: false,
      type,
      weight: type === "evaluation" ? 1 : undefined,
    };

    setModal({ open: true, mode: "create", type, initial });
    form.setFieldsValue(initial);
  };

  const openEditModal = (assistant: Assistant) => {
    setModal({
      open: true,
      mode: "edit",
      type: assistant.type as AssistantType,
      id: assistant.id,
      initial: assistant,
    });
    form.setFieldsValue(assistant);
  };

  const closeModal = () => {
    setModal({ open: false });
    form.resetFields();
  };

  const handleSaveAssistant = async () => {
    try {
      const values = await form.validateFields();
      if (modal.open && modal.mode === "edit") {
        onUpdateAssistant(modal.id, values);
        message.success("Assistant updated successfully");
      } else {
        onAddAssistant(values);
        message.success("Assistant created successfully");
      }
      closeModal();
    } catch {
      // Form handles display errors.
    }
  };

  const makeColumns = (type: AssistantType) => {
    const sharedColumns = [
      { title: "Name", dataIndex: "name", key: "name" },
      {
        title: "Models",
        dataIndex: "model_ids",
        key: "model_ids",
        render: (modelIds: string[]) =>
          Array.isArray(modelIds) && modelIds.length > 0
            ? modelIds
                .map((id) => modelLabelById.get(id) || "Unknown Model")
                .join(", ")
            : "No Models",
      },
      {
        title: "System Prompt",
        dataIndex: "system_prompt_id",
        key: "system_prompt_id",
        render: (promptId: string) =>
          promptLabelById.get(promptId) || "Unknown Prompt",
      },
    ];

    const typeColumns =
      type === "output_generation"
        ? [
            {
              title: "Required to Show",
              dataIndex: "required_to_show",
              key: "required_to_show",
              render: (checked: boolean, record: Assistant) => (
                <Switch
                  size="small"
                  checked={checked}
                  onChange={(value) =>
                    onUpdateAssistant(record.id, { required_to_show: value })
                  }
                />
              ),
            },
          ]
        : [
            {
              title: "Weight",
              dataIndex: "weight",
              key: "weight",
              render: (weight: number | undefined, record: Assistant) => (
                <InputNumber
                  size="small"
                  min={1}
                  max={10}
                  style={{ width: 60 }}
                  value={weight ?? 1}
                  onChange={(value) =>
                    onUpdateAssistant(record.id, { weight: value ?? 1 })
                  }
                />
              ),
            },
            {
              title: "Activate",
              dataIndex: "required_to_show",
              key: "required_to_show",
              render: (checked: boolean, record: Assistant) => (
                <Switch
                  size="small"
                  checked={checked}
                  onChange={(value) =>
                    onUpdateAssistant(record.id, { required_to_show: value })
                  }
                />
              ),
            },
          ];

    return [
      ...sharedColumns,
      ...typeColumns,
      {
        title: "Actions",
        key: "actions",
        render: (_: unknown, record: Assistant) => (
          <Space>
            <Button
              size="small"
              type="default"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record)}
            />
            <Button
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onRemoveAssistant(record.id)}
            />
          </Space>
        ),
      },
    ];
  };

  const promptOptions =
    modal.open && modal.type === "evaluation"
      ? promptConfigs.filter((prompt) => prompt.type === "evaluation")
      : promptConfigs.filter((prompt) => prompt.type === "system");

  const renderHeader = (type: AssistantType, title: string) => (
    <Row justify="space-between" align="middle">
      <Col>
        <Title level={4} style={{ margin: 0 }}>
          {title}
        </Title>
      </Col>
      <Col>
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<SaveOutlined />}
            onClick={onSaveAssistants}
            disabled={!hasAssistantChanges}
          >
            Save Assistants
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<PlusOutlined />}
            onClick={() => openCreateModal(type)}
          >
            Add Assistant
          </Button>
        </Space>
      </Col>
    </Row>
  );

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <div>
          <Title level={2}>Main Settings</Title>
          <Text type="secondary">
            Manage AI assistants for output generation and evaluation tasks.
            Configure which models and prompts each assistant uses.
          </Text>
        </div>

        <Card
          title={renderHeader(
            "output_generation",
            "Output Generation Assistants",
          )}
          className="shadow-sm"
        >
          <div
            style={{
              marginBottom: 20,
              padding: "16px 0",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <Row gutter={[24, 0]}>
              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Maximum Outputs to Generate</Text>
                  <div style={{ marginTop: 4 }}>
                    <InputNumber
                      min={1}
                      max={10}
                      style={{ width: "100%" }}
                      value={numOutputsToRun}
                      onChange={(value) => {
                        if (value == null) return;
                        upsertConfig("numOutputsToRun", String(value));
                        if (numOutputsToShow > value) {
                          upsertConfig("numOutputsToShow", String(value));
                        }
                      }}
                    />
                  </div>
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    This controls the maximum number of model responses
                    generated for each test case.
                  </Text>
                </div>
              </Col>

              <Col span={12}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Maximum Outputs to Show</Text>
                  <div style={{ marginTop: 4 }}>
                    <InputNumber
                      min={1}
                      max={4}
                      style={{ width: "100%" }}
                      value={numOutputsToShow}
                      onChange={(value) => {
                        if (value == null) return;
                        if (value > numOutputsToRun) {
                          message.error(
                            `Cannot be greater than Maximum Outputs to Generate (${numOutputsToRun})`,
                          );
                          return;
                        }
                        upsertConfig("numOutputsToShow", String(value));
                      }}
                    />
                  </div>
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    This controls the maximum number of responses displayed in
                    UI.
                  </Text>
                </div>
              </Col>
            </Row>

            <Row gutter={[24, 0]} style={{ marginTop: 16 }}>
              <Col span={24}>
                <Text strong>Model Selection Algorithm</Text>
                <div style={{ marginTop: 4 }}>
                  <Select
                    style={{ width: "100%" }}
                    value={assistantModelAlgorithm}
                    onChange={(value) =>
                      upsertConfig("assistantModelAlgorithm", value)
                    }
                  >
                    <Select.Option value="random_selection">
                      Random Selection - Each assistant randomly selects one
                      model independently
                    </Select.Option>
                    <Select.Option value="unique_model">
                      Unique Model - All assistants use different models
                    </Select.Option>
                  </Select>
                </div>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Text strong>Use Cached Session</Text>
                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Switch
                    checked={useCacheSession}
                    onChange={(checked) =>
                      upsertConfig(
                        "useCacheSession",
                        checked ? "true" : "false",
                      )
                    }
                  />
                  <Text type="secondary">
                    {useCacheSession ? "Enabled" : "Disabled"}
                  </Text>
                </div>
              </Col>

              <Col span={12}>
                <Text strong>Reference Session IDs</Text>
                <Input.TextArea
                  rows={2}
                  style={{ marginTop: 8 }}
                  disabled={!useCacheSession}
                  value={referenceSessionIds}
                  placeholder={
                    "Enter session IDs (comma-separated or range with dash)\n" +
                    "e.g., session1,session2 or session1-session10"
                  }
                  onChange={(event) =>
                    upsertConfig("referenceSessionIds", event.target.value)
                  }
                />
              </Col>
            </Row>
          </div>

          <Table
            rowKey="id"
            pagination={false}
            columns={makeColumns("output_generation")}
            dataSource={assistantsByType.output_generation}
            locale={{ emptyText: "No output generation assistants configured" }}
          />
        </Card>

        <Card
          style={{ marginTop: 20 }}
          title={renderHeader("evaluation", "Evaluation Assistants")}
          className="shadow-sm"
        >
          <Table
            rowKey="id"
            pagination={false}
            columns={makeColumns("evaluation")}
            dataSource={assistantsByType.evaluation}
            locale={{ emptyText: "No evaluation assistants configured" }}
          />

          <div style={{ marginTop: 12 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text type="secondary">
                  Multiple evaluation assistants can run simultaneously. Results
                  are aggregated with the selected strategy.
                </Text>
              </Col>
              <Col span={12}>
                <Text strong>Judgment Strategy</Text>
                <Select
                  style={{ width: "100%", marginTop: 8 }}
                  value={judgmentStrategy}
                  onChange={(value) =>
                    upsertConfig("judgmentStrategy", value, "evaluation")
                  }
                >
                  <Select.Option value="majority_voting">
                    Majority Voting
                  </Select.Option>
                  <Select.Option value="highest_score">
                    Highest Score
                  </Select.Option>
                  <Select.Option value="lowest_score">
                    Lowest Score
                  </Select.Option>
                </Select>
              </Col>
            </Row>
          </div>
        </Card>
      </div>

      <Modal
        width={600}
        forceRender
        open={modal.open}
        onOk={handleSaveAssistant}
        onCancel={closeModal}
        cancelText="Cancel"
        title={
          modal.open && modal.mode === "edit"
            ? "Edit Assistant"
            : "Add Assistant"
        }
        okText={modal.open && modal.mode === "edit" ? "Update" : "Create"}
        afterOpenChange={(open) => {
          if (open && modal.open) {
            form.setFieldsValue(modal.initial);
          }
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Assistant Name"
            rules={[{ required: true, message: "Please enter assistant name" }]}
          >
            <Input placeholder="Enter assistant name" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Type"
            rules={[
              { required: true, message: "Please select assistant type" },
            ]}
          >
            <Select disabled placeholder="Select assistant type">
              <Select.Option value="output_generation">
                Output Generation
              </Select.Option>
              <Select.Option value="evaluation">Evaluation</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="model_ids"
            label="Models"
            rules={[
              { required: true, message: "Please select at least one model" },
              {
                validator: (_, value) =>
                  Array.isArray(value) && value.length > 0
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error("Please select at least one model"),
                      ),
              },
            ]}
          >
            <Select
              mode="multiple"
              style={{ width: "100%" }}
              showSearch={false}
              maxTagCount={3}
              maxTagTextLength={20}
              placeholder="Select one or more models..."
            >
              {groupedModelOptions.map((group) => (
                <Select.OptGroup key={group.label} label={group.label}>
                  {group.options.map((option) => (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  ))}
                </Select.OptGroup>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="system_prompt_id"
            label="System Prompt"
            rules={[
              { required: true, message: "Please select a system prompt" },
            ]}
          >
            <Select placeholder="Select a system prompt">
              {promptOptions.map((prompt) => (
                <Select.Option key={prompt.id} value={prompt.id}>
                  {prompt.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="required_to_show"
            valuePropName="checked"
            label={
              modal.open && modal.type === "evaluation"
                ? "Activate"
                : "Required to Show"
            }
          >
            <Switch />
          </Form.Item>

          {modal.open && modal.type === "evaluation" ? (
            <Form.Item
              name="weight"
              initialValue={1}
              label="Weight (Number of evaluation runs)"
              rules={[
                { required: true, message: "Please set weight" },
                {
                  type: "number",
                  min: 1,
                  max: 10,
                  message: "Weight must be between 1 and 10",
                },
              ]}
            >
              <InputNumber
                min={1}
                max={10}
                style={{ width: "100%" }}
                placeholder="Enter weight (1-10)"
              />
            </Form.Item>
          ) : null}
        </Form>
      </Modal>
    </div>
  );
}
