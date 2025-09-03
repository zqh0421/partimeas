import React, { useState, useEffect } from "react";
import "@ant-design/v5-patch-for-react-19";
import {
  Card,
  Button,
  Typography,
  Space,
  Row,
  Col,
  Input,
  Switch,
  Select,
  Modal,
  Form,
  Table,
  InputNumber,
  App,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import {
  Assistant,
  ModelConfig,
  PromptConfig,
  ConfigValue,
} from "../../types/admin";
import { MAIN_SETTINGS_PRESETS } from "../../constants/presets";

const { Title, Text } = Typography;
const { Option } = Select;

interface AssistantsSectionProps {
  assistants: Assistant[];
  modelConfigs: ModelConfig[];
  promptConfigs: PromptConfig[];
  configValues: ConfigValue[];
  onAddAssistant: (
    assistant: Omit<Assistant, "id" | "created_at" | "updated_at">
  ) => void;
  onUpdateAssistant: (id: number, updates: Partial<Assistant>) => void;
  onRemoveAssistant: (id: number) => void;
  onSaveAssistants: () => void;
  onConfigChange: (configs: ConfigValue[]) => void;
  hasAssistantChanges?: boolean;
}

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
}: AssistantsSectionProps) {
  const { message } = App.useApp();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAssistant, setEditingAssistant] =
    useState<Partial<Assistant> | null>(null);
  const [form] = Form.useForm();
  const [selectedPreset, setSelectedPreset] = useState<string>("custom");

  // Debug logging for props changes
  useEffect(() => {
    console.log("AssistantsSection props updated:", {
      modelConfigs,
      promptConfigs,
      assistants,
    });
  }, [modelConfigs, promptConfigs, assistants]);

  // Ensure form is properly initialized when modal opens
  useEffect(() => {
    if (isModalVisible && editingAssistant) {
      console.log(
        "Modal is visible, ensuring form is initialized with:",
        editingAssistant
      );
      form.setFieldsValue(editingAssistant);
    }
  }, [isModalVisible, editingAssistant, form]);

  const handleAddAssistant = (type: "output_generation" | "evaluation") => {
    const newAssistant = {
      name: "",
      model_ids: [] as string[],
      system_prompt_id: "",
      required_to_show: false,
      type: type,
      weight: type === "evaluation" ? 1 : undefined,
    };
    console.log(
      "handleAddAssistant called with type:",
      type,
      "newAssistant:",
      newAssistant
    );
    setEditingAssistant(newAssistant);
    form.setFieldsValue(newAssistant);
    console.log("Form fields set to:", newAssistant);
    setIsModalVisible(true);
  };

  const handleEditAssistant = (assistant: Assistant) => {
    console.log("handleEditAssistant called with:", assistant);
    setEditingAssistant(assistant);
    setEditingId(assistant.id);
    form.setFieldsValue(assistant);
    console.log("Form fields set to:", assistant);
    setIsModalVisible(true);
  };

  const handleSaveAssistant = async () => {
    try {
      console.log("handleSaveAssistant called, validating form...");
      const values = await form.validateFields();
      console.log("Form validation passed, values:", values);

      if (editingId) {
        // Update existing assistant
        console.log("Updating existing assistant with ID:", editingId);
        onUpdateAssistant(editingId, values);
        message.success("Assistant updated successfully");
      } else {
        // Create new assistant
        console.log("Creating new assistant");
        onAddAssistant(values);
        message.success("Assistant created successfully");
      }

      setIsModalVisible(false);
      setEditingId(null);
      setEditingAssistant(null);
      form.resetFields();
    } catch (error) {
      console.error("Validation failed:", error);
    }
  };

  // Validate evaluation assistants (now allows multiple)
  const validateEvaluationAssistants = () => {
    // Multiple evaluation assistants are now allowed
    return true;
  };

  // Wrapper function to update assistant
  const handleUpdateAssistant = (id: number, updates: Partial<Assistant>) => {
    const target = assistants.find((a) => a.id === id);
    if (!target) {
      return;
    }

    // Multiple evaluation assistants are now allowed
    onUpdateAssistant(id, updates);
  };

  const handleCancel = () => {
    console.log("handleCancel called, resetting form");
    setIsModalVisible(false);
    setEditingId(null);
    setEditingAssistant(null);
    form.resetFields();
    console.log("Form reset, current values:", form.getFieldsValue());
  };

  const isUuid = (value: string | undefined | null) => {
    if (!value) return false;
    // For now, accept any non-empty string to debug the issue
    // TODO: Restore strict UUID validation once we confirm models are working
    return value.length > 0;
    // return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(value);
  };

  const getModelNames = (modelIds: string[]) => {
    if (!Array.isArray(modelIds) || modelIds.length === 0) return "No Models";
    return modelIds
      .map((modelId) => {
        const model = modelConfigs.find((m) => m.id === modelId);
        return model ? `${model.provider}/${model.model}` : "Unknown Model";
      })
      .join(", ");
  };

  // Group models by provider for better organization
  const getGroupedModelOptions = () => {
    console.log(
      "getGroupedModelOptions called with modelConfigs:",
      modelConfigs
    );

    const grouped: {
      [key: string]: {
        label: string;
        options: { value: string; label: string }[];
      };
    } = {};

    const validModels = modelConfigs.filter((model) => {
      const isValid = isUuid(model.id);
      console.log(
        `Model ${model.provider}/${model.model} (ID: ${model.id}) - isValid: ${isValid}`
      );
      return isValid;
    });

    console.log("Valid models after filtering:", validModels);

    validModels.forEach((model) => {
      const provider = model.provider;
      if (!grouped[provider]) {
        grouped[provider] = {
          label: provider.charAt(0).toUpperCase() + provider.slice(1),
          options: [],
        };
      }
      grouped[provider].options.push({
        value: model.id,
        label: `${provider}/${model.model}`,
      });
    });

    console.log("Final grouped options:", grouped);
    return Object.values(grouped);
  };

  const getPromptName = (promptId: string) => {
    const prompt = promptConfigs.find((p) => p.id === promptId);
    return prompt ? prompt.name : "Unknown Prompt";
  };

  const applyPreset = (presetId: string) => {
    const preset = MAIN_SETTINGS_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    // Don't apply anything for custom preset
    if (presetId === "custom") {
      message.info("Custom preset selected - no changes applied");
      return;
    }

    // Apply configuration values
    const updatedConfigs = [...configValues];

    // Update numOutputsToRun
    const outputsToRunIndex = updatedConfigs.findIndex(
      (c) => c.name === "numOutputsToRun"
    );
    if (outputsToRunIndex >= 0) {
      updatedConfigs[outputsToRunIndex] = {
        ...updatedConfigs[outputsToRunIndex],
        value: preset.config.numOutputsToRun.toString(),
      };
    }

    // Update numOutputsToShow
    const outputsToShowIndex = updatedConfigs.findIndex(
      (c) => c.name === "numOutputsToShow"
    );
    if (outputsToShowIndex >= 0) {
      updatedConfigs[outputsToShowIndex] = {
        ...updatedConfigs[outputsToShowIndex],
        value: preset.config.numOutputsToShow.toString(),
      };
    }

    // Update assistantModelAlgorithm
    const algorithmIndex = updatedConfigs.findIndex(
      (c) => c.name === "assistantModelAlgorithm"
    );
    if (algorithmIndex >= 0) {
      updatedConfigs[algorithmIndex] = {
        ...updatedConfigs[algorithmIndex],
        value: preset.config.assistantModelAlgorithm,
      };
    }

    onConfigChange(updatedConfigs);

    // Apply assistant settings for output generation assistants only
    const outputGenAssistants = assistants.filter(
      (a) => a.type === "output_generation"
    );
    outputGenAssistants.forEach((assistant) => {
      if (
        preset.assistantSettings.outputGenerationAssistants.requiredToShow ===
        "all"
      ) {
        // Set all output generation assistants as required
        onUpdateAssistant(assistant.id, { required_to_show: true });
      } else if (
        preset.assistantSettings.outputGenerationAssistants.requiredToShow ===
        "none"
      ) {
        // Set all as not required
        onUpdateAssistant(assistant.id, { required_to_show: false });
      } else if (
        preset.assistantSettings.outputGenerationAssistants.requiredToShow ===
        "better_ideal_only"
      ) {
        // Only set assistants with "Ideal" in their name as required, all others not required
        const isIdealAssistant = assistant.name.toLowerCase().includes("ideal");
        onUpdateAssistant(assistant.id, { required_to_show: isIdealAssistant });
      }
    });

    message.success(`Applied "${preset.name}" preset`);
  };

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

        {/* Output Generation Assistants Section */}
        <Card
          title={
            <Row justify="space-between" align="middle">
              <Col>
                <Space align="center">
                  <Title level={4} style={{ margin: 0 }}>
                    Output Generation Assistants
                  </Title>
                  <Select
                    style={{ width: 200 }}
                    value={selectedPreset}
                    onChange={(value) => {
                      setSelectedPreset(value);
                      applyPreset(value);
                    }}
                    placeholder="Select preset"
                    size="small"
                  >
                    {MAIN_SETTINGS_PRESETS.map((preset) => (
                      <Option key={preset.id} value={preset.id}>
                        {preset.name}
                      </Option>
                    ))}
                  </Select>
                </Space>
              </Col>
              <Col>
                <Space>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={() => {
                      if (validateEvaluationAssistants()) {
                        onSaveAssistants();
                      }
                    }}
                    disabled={!hasAssistantChanges}
                    size="small"
                  >
                    Save Assistants
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleAddAssistant("output_generation")}
                    size="small"
                    disabled={selectedPreset !== "custom"}
                  >
                    Add Assistant
                  </Button>
                </Space>
              </Col>
            </Row>
          }
          className="shadow-sm"
        >
          {/* Configuration Settings */}
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
                      disabled={selectedPreset !== "custom"}
                      value={parseInt(
                        configValues.find((c) => c.name === "numOutputsToRun")
                          ?.value || "3"
                      )}
                      onChange={(value) => {
                        if (value !== null) {
                          const updatedConfigs = configValues.map((config) =>
                            config.name === "numOutputsToRun"
                              ? { ...config, value: value.toString() }
                              : config
                          );
                          // Auto-adjust numOutputsToShow if needed
                          const currentNumOutputsToShow = parseInt(
                            configValues.find(
                              (c) => c.name === "numOutputsToShow"
                            )?.value || "2"
                          );
                          if (currentNumOutputsToShow > value) {
                            const finalConfigs = updatedConfigs.map((config) =>
                              config.name === "numOutputsToShow"
                                ? { ...config, value: value.toString() }
                                : config
                            );
                            onConfigChange(finalConfigs);
                          } else {
                            onConfigChange(updatedConfigs);
                          }
                        }
                      }}
                    />
                  </div>
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    This controls the maximum number of different model
                    responses that can be generated for each test case (1-10).
                    The actual number will be the minimum of this value and the
                    number of available assistants.
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
                      disabled={selectedPreset !== "custom"}
                      value={parseInt(
                        configValues.find((c) => c.name === "numOutputsToShow")
                          ?.value || "2"
                      )}
                      onChange={(value) => {
                        if (value !== null) {
                          const numOutputsToRun = parseInt(
                            configValues.find(
                              (c) => c.name === "numOutputsToRun"
                            )?.value || "3"
                          );
                          if (value > numOutputsToRun) {
                            message.error(
                              `Cannot be greater than Maximum Outputs to Generate (${numOutputsToRun})`
                            );
                            return;
                          }
                          const updatedConfigs = configValues.map((config) =>
                            config.name === "numOutputsToShow"
                              ? { ...config, value: value.toString() }
                              : config
                          );
                          onConfigChange(updatedConfigs);
                        }
                      }}
                    />
                  </div>
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    This controls the maximum number of responses that can be
                    displayed in the user interface (1-4, ≤ maximum outputs to
                    generate).
                  </Text>
                </div>
              </Col>
            </Row>

            {/* Algorithm Selection Row */}
            <Row gutter={[24, 0]} style={{ marginTop: 16 }}>
              <Col span={24}>
                <div style={{ marginBottom: 16 }}>
                  <Text strong>Model Selection Algorithm</Text>
                  <div style={{ marginTop: 4 }}>
                    <Select
                      style={{ width: "100%" }}
                      disabled={selectedPreset !== "custom"}
                      value={
                        configValues.find(
                          (c) => c.name === "assistantModelAlgorithm"
                        )?.value || "random_selection"
                      }
                      onChange={(value) => {
                        const updatedConfigs = configValues.map((config) =>
                          config.name === "assistantModelAlgorithm"
                            ? { ...config, value: value }
                            : config
                        );
                        onConfigChange(updatedConfigs);
                      }}
                      placeholder="Select algorithm"
                    >
                      <Select.Option value="random_selection">
                        Random Selection - Each assistant randomly selects one
                        model independently
                      </Select.Option>
                      <Select.Option value="unique_model">
                        Unique Model - All assistants use different models to
                        ensure variety
                      </Select.Option>
                    </Select>
                  </div>
                  <Text type="secondary" style={{ fontSize: "12px" }}>
                    Choose how models are selected for assistants during output
                    generation. Random Selection allows each assistant to
                    independently choose models, while Unique Model ensures all
                    assistants use different models for variety.
                  </Text>
                </div>
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={12}>
                <div>
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
                      checked={
                        configValues.find((c) => c.name === "useCacheSession")
                          ?.value === "true"
                      }
                      onChange={(checked) => {
                        console.log("Toggle changed to:", checked);
                        const updatedConfigs = [...configValues];
                        const existingIndex = updatedConfigs.findIndex(
                          (c) => c.name === "useCacheSession"
                        );
                        
                        if (existingIndex >= 0) {
                          updatedConfigs[existingIndex] = {
                            ...updatedConfigs[existingIndex],
                            value: checked ? "true" : "false"
                          };
                        } else {
                          updatedConfigs.push({
                            name: "useCacheSession",
                            value: checked ? "true" : "false",
                            scope: "global",
                          });
                        }
                        
                        // Also ensure referenceSessionIds exists
                        if (!updatedConfigs.find(c => c.name === "referenceSessionIds")) {
                          updatedConfigs.push({
                            name: "referenceSessionIds",
                            value: "95533a6c-00e5-4ffc-9135-772b3e98ddde,a7e53502-73cd-480c-95e7-0e8eab98fa82,1796c058-e0f9-4286-afde-efa606473956,3b741acf-9d1b-4e27-aa14-89645fc413cc,a86c108d-9f15-4c6f-ba75-97cb0bdc7cf8,b2981e3b-1038-43e9-8ce7-e3c9325903b8,6f7fb887-9be9-4a86-850a-825bee8d9a64,f950b796-fae4-410e-9dd8-7bdc117dffc2,ae588e80-4715-4523-a923-277009cb580a,b07909cb-086b-44c8-a13a-132e3b9c8610,3070692e-bf47-4c22-a62b-b476130c2562,56b24acf-8776-42ed-904e-0a848ed06b05,73fd0fb8-2c4f-495c-9c43-49b0a9875266,73d25944-9895-4d7e-b723-528cd756fb5f,b908e48f-4348-44c7-b37d-83c1f4742da9,4a64b32e-c315-44fa-a414-d10a76034c28",
                            scope: "global",
                          });
                        }
                        
                        console.log("Updated configs:", updatedConfigs);
                        onConfigChange(updatedConfigs);
                      }}
                    />
                    <Text type="secondary">
                      {configValues.find((c) => c.name === "useCacheSession")
                        ?.value === "true"
                        ? "Enabled"
                        : "Disabled"}
                    </Text>
                  </div>
                  <Text
                    type="secondary"
                    style={{ fontSize: "12px", marginTop: 4, display: "block" }}
                  >
                    When enabled, reuses model responses from reference sessions.
                  </Text>
                </div>
              </Col>
              
              <Col span={12}>
                <div>
                  <Text strong>Reference Session IDs</Text>
                  <Input.TextArea
                    style={{ marginTop: 8 }}
                    rows={2}
                    placeholder="Enter session IDs (comma-separated or range with dash)&#10;e.g., session1,session2 or session1-session10"
                    value={
                      configValues.find((c) => c.name === "referenceSessionIds")
                        ?.value || "95533a6c-00e5-4ffc-9135-772b3e98ddde,a7e53502-73cd-480c-95e7-0e8eab98fa82,1796c058-e0f9-4286-afde-efa606473956,3b741acf-9d1b-4e27-aa14-89645fc413cc,a86c108d-9f15-4c6f-ba75-97cb0bdc7cf8,b2981e3b-1038-43e9-8ce7-e3c9325903b8,6f7fb887-9be9-4a86-850a-825bee8d9a64,f950b796-fae4-410e-9dd8-7bdc117dffc2,ae588e80-4715-4523-a923-277009cb580a,b07909cb-086b-44c8-a13a-132e3b9c8610,3070692e-bf47-4c22-a62b-b476130c2562,56b24acf-8776-42ed-904e-0a848ed06b05,73fd0fb8-2c4f-495c-9c43-49b0a9875266,73d25944-9895-4d7e-b723-528cd756fb5f,b908e48f-4348-44c7-b37d-83c1f4742da9,4a64b32e-c315-44fa-a414-d10a76034c28"
                    }
                    onChange={(e) => {
                      const updatedConfigs = [...configValues];
                      const existingIndex = updatedConfigs.findIndex(
                        (c) => c.name === "referenceSessionIds"
                      );
                      
                      if (existingIndex >= 0) {
                        updatedConfigs[existingIndex] = {
                          ...updatedConfigs[existingIndex],
                          value: e.target.value
                        };
                      } else {
                        updatedConfigs.push({
                          name: "referenceSessionIds",
                          value: e.target.value,
                          scope: "global",
                        });
                      }
                      onConfigChange(updatedConfigs);
                    }}
                    disabled={
                      configValues.find((c) => c.name === "useCacheSession")
                        ?.value !== "true"
                    }
                  />
                  <Text
                    type="secondary"
                    style={{ fontSize: "12px", marginTop: 4, display: "block" }}
                  >
                    Specify session IDs to use as reference for cached responses.
                    Leave empty to use the most recent matching session.
                  </Text>
                </div>
              </Col>
            </Row>
          </div>
          <Table
            dataSource={assistants.filter(
              (a) => a.type === "output_generation"
            )}
            pagination={false}
            rowKey="id"
            locale={{ emptyText: "No output generation assistants configured" }}
            columns={[
              {
                title: "Name",
                dataIndex: "name",
                key: "name",
              },
              {
                title: "Models",
                dataIndex: "model_ids",
                key: "model_ids",
                render: (modelIds: string[]) => getModelNames(modelIds),
              },
              {
                title: "System Prompt",
                dataIndex: "system_prompt_id",
                key: "system_prompt_id",
                render: (systemPromptId: string) =>
                  getPromptName(systemPromptId),
              },
              {
                title: "Required to Show",
                dataIndex: "required_to_show",
                key: "required_to_show",
                render: (requiredToShow: boolean, record: Assistant) => (
                  <Switch
                    checked={requiredToShow}
                    disabled={selectedPreset !== "custom"}
                    onChange={(checked) =>
                      handleUpdateAssistant(record.id, {
                        required_to_show: checked,
                      })
                    }
                    size="small"
                  />
                ),
              },
              {
                title: "Actions",
                key: "actions",
                render: (_, record: Assistant) => (
                  <Space>
                    <Button
                      type="default"
                      icon={<EditOutlined />}
                      onClick={() => handleEditAssistant(record)}
                      size="small"
                      disabled={selectedPreset !== "custom"}
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => onRemoveAssistant(record.id)}
                      size="small"
                      disabled={selectedPreset !== "custom"}
                    />
                  </Space>
                ),
              },
            ]}
          />
        </Card>

        {/* Evaluation Assistants Section */}
        <Card
          style={{ marginTop: "20px" }}
          title={
            <Row justify="space-between" align="middle">
              <Col>
                <Title level={4} style={{ margin: 0 }}>
                  Evaluation Assistants
                </Title>
              </Col>
              <Col>
                <Space>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    onClick={() => {
                      if (validateEvaluationAssistants()) {
                        onSaveAssistants();
                      }
                    }}
                    disabled={!hasAssistantChanges}
                    size="small"
                  >
                    Save Assistants
                  </Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => handleAddAssistant("evaluation")}
                    size="small"
                  >
                    Add Assistant
                  </Button>
                </Space>
              </Col>
            </Row>
          }
          className="shadow-sm"
        >
          <Table
            dataSource={assistants.filter((a) => a.type === "evaluation")}
            pagination={false}
            rowKey="id"
            locale={{ emptyText: "No evaluation assistants configured" }}
            columns={[
              {
                title: "Name",
                dataIndex: "name",
                key: "name",
              },
              {
                title: "Models",
                dataIndex: "model_ids",
                key: "model_ids",
                render: (modelIds: string[]) => getModelNames(modelIds),
              },
              {
                title: "System Prompt",
                dataIndex: "system_prompt_id",
                key: "system_prompt_id",
                render: (systemPromptId: string) =>
                  getPromptName(systemPromptId),
              },
              {
                title: "Weight",
                dataIndex: "weight",
                key: "weight",
                render: (weight: number | undefined, record: Assistant) => (
                  <InputNumber
                    min={1}
                    max={10}
                    value={weight || 1}
                    onChange={(value) =>
                      handleUpdateAssistant(record.id, {
                        weight: value || 1,
                      })
                    }
                    size="small"
                    style={{ width: 60 }}
                  />
                ),
              },
              {
                title: "Activate",
                dataIndex: "required_to_show",
                key: "required_to_show",
                render: (requiredToShow: boolean, record: Assistant) => (
                  <Switch
                    checked={requiredToShow}
                    onChange={(checked) =>
                      handleUpdateAssistant(record.id, {
                        required_to_show: checked,
                      })
                    }
                    size="small"
                  />
                ),
              },
              {
                title: "Actions",
                key: "actions",
                render: (_, record: Assistant) => (
                  <Space>
                    <Button
                      type="default"
                      icon={<EditOutlined />}
                      onClick={() => handleEditAssistant(record)}
                      size="small"
                    />
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => onRemoveAssistant(record.id)}
                      size="small"
                    />
                  </Space>
                ),
              },
            ]}
          />
          <div style={{ marginTop: 12 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Text type="secondary">
                  Multiple evaluation assistants can now be activated
                  simultaneously. Each assistant will run according to its
                  weight (1-10) and results will be aggregated using the
                  selected judgment strategy.
                </Text>
              </Col>
              <Col span={12}>
                <div>
                  <Text strong>Judgment Strategy</Text>
                  <Select
                    style={{ width: "100%", marginTop: 8 }}
                    value={
                      configValues.find((c) => c.name === "judgmentStrategy")
                        ?.value || "majority_voting"
                    }
                    onChange={(value) => {
                      const updatedConfigs = configValues.map((config) =>
                        config.name === "judgmentStrategy"
                          ? { ...config, value }
                          : config
                      );
                      // Check if config exists, if not add it
                      if (
                        !configValues.find((c) => c.name === "judgmentStrategy")
                      ) {
                        updatedConfigs.push({
                          name: "judgmentStrategy",
                          value,
                          scope: "evaluation",
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                        });
                      }
                      onConfigChange(updatedConfigs);
                    }}
                  >
                    <Option value="majority_voting">Majority Voting</Option>
                    <Option value="highest_score">Highest Score</Option>
                    <Option value="lowest_score">Lowest Score</Option>
                  </Select>
                  <Text
                    type="secondary"
                    style={{ fontSize: "12px", display: "block", marginTop: 4 }}
                  >
                    How to aggregate scores when multiple evaluation runs are
                    performed
                  </Text>
                </div>
              </Col>
            </Row>
          </div>
        </Card>
      </div>

      {/* Add/Edit Assistant Modal */}
      <Modal
        title={editingId ? "Edit Assistant" : "Add Assistant"}
        open={isModalVisible}
        onOk={handleSaveAssistant}
        onCancel={handleCancel}
        okText={editingId ? "Update" : "Create"}
        cancelText="Cancel"
        width={600}
        forceRender
        afterOpenChange={(open) => {
          if (open) {
            console.log(
              "Modal opened, current form values:",
              form.getFieldsValue()
            );
            console.log("Current modelConfigs:", modelConfigs);
            console.log("Grouped model options:", getGroupedModelOptions());
            console.log(
              "Form field model_ids value:",
              form.getFieldValue("model_ids")
            );
            console.log("editingAssistant:", editingAssistant);
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
            <Select
              placeholder="Select assistant type"
              disabled={true} // Type is pre-selected based on button clicked
            >
              <Option value="output_generation">Output Generation</Option>
              <Option value="evaluation">Evaluation</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="model_ids"
            label="Models"
            rules={[
              {
                required: true,
                message: "Please select at least one model",
              },
              {
                validator: (_, value) => {
                  if (!Array.isArray(value) || value.length === 0) {
                    return Promise.reject(
                      new Error("Please select at least one model")
                    );
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Select one or more models..."
              style={{ width: "100%" }}
              showSearch={false}
              maxTagCount={3}
              maxTagTextLength={20}
            >
              {getGroupedModelOptions().map((group) => (
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

          <div style={{ marginTop: -16, marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              You can select multiple models. The assistant will use all
              selected models for generation/evaluation.
            </Text>
          </div>

          <Form.Item
            name="system_prompt_id"
            label="System Prompt"
            rules={[
              { required: true, message: "Please select a system prompt" },
            ]}
          >
            <Select placeholder="Select a system prompt">
              {promptConfigs
                .filter((prompt) => {
                  if (editingAssistant?.type === "evaluation")
                    return prompt.type === "evaluation";
                  // Default to 'system' for output_generation or when type is not set yet
                  return prompt.type === "system";
                })
                .filter((prompt) => isUuid(prompt.id))
                .map((prompt) => (
                  <Option key={prompt.id} value={prompt.id}>
                    {prompt.name}
                  </Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="required_to_show"
            label={
              editingAssistant?.type === "evaluation"
                ? "Activate"
                : "Required to Show"
            }
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          {editingAssistant?.type === "evaluation" && (
            <Form.Item
              name="weight"
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
              initialValue={1}
            >
              <InputNumber
                min={1}
                max={10}
                style={{ width: "100%" }}
                placeholder="Enter weight (1-10)"
              />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
