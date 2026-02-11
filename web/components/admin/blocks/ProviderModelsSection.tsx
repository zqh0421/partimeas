"use client";
import React, { useRef, useState } from "react";
import { Select, Typography, Space, Tag, Input, Button, Divider } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { ModelConfig } from "@/types/admin";
import type { InputRef } from "antd";

const { Title, Text } = Typography;

interface ProviderModelsSectionProps {
  provider: "openai" | "anthropic" | "google";
  models: ModelConfig[];
  onAddModels: (
    provider: "openai" | "anthropic" | "google",
    modelNames: string[],
  ) => void;
  onUpdateModel: (id: string, updates: Partial<ModelConfig>) => void;
  onRemoveModel: (id: string) => void;
}

const PROVIDER_CONFIG = {
  openai: {
    name: "OpenAI",
  },
  anthropic: {
    name: "Anthropic",
  },
  google: {
    name: "Google",
  },
};

export const ProviderModelsSection: React.FC<ProviderModelsSectionProps> = ({
  provider,
  models,
  onAddModels,
  onRemoveModel,
}) => {
  const [customModelName, setCustomModelName] = useState("");
  const inputRef = useRef<InputRef>(null);

  const config = PROVIDER_CONFIG[provider];
  const existingModelNames = Array.from(
    new Set(
      models
        .map((m) => m.model)
        .filter((model) => model && model.trim() !== ""), // Filter out empty/undefined values
    ),
  );

  const handleModelRemove = (modelName: string) => {
    const modelToRemove = models.find((m) => m.model === modelName);
    if (modelToRemove) {
      onRemoveModel(modelToRemove.id);
    }
  };

  // Filter out models that already exist in the current provider's models
  const availableModelsForSelection = models
    .filter((model) => !existingModelNames.includes(model.model))
    .map((model) => ({
      value: model,
      label: model,
    }));

  const addCustomModel = () => {
    if (customModelName.trim()) {
      onAddModels(provider, [customModelName.trim()]);
      setCustomModelName("");
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  };

  return (
    <div key={`${provider}-models-section`}>
      <Text strong style={{ display: "block", marginBottom: 8 }}>
        {config.name} Models
      </Text>
      <Select
        mode="multiple"
        style={{ width: "100%" }}
        placeholder={`Add ${config.name} models...`}
        value={existingModelNames}
        onChange={(next) => {
          // Ensure next is an array and filter out duplicates
          const uniqueNext = Array.from(new Set(next));

          // Filter out models that are already in the database for this provider
          const validNext = uniqueNext.filter((m: string) => {
            // Only allow models that are either already selected or available to add
            return existingModelNames.includes(m);
          });

          const added = validNext.filter(
            (m: string) => !existingModelNames.includes(m),
          );
          const removed = existingModelNames.filter(
            (m) => !validNext.includes(m as string),
          );

          if (added.length > 0) {
            onAddModels(provider, added);
          }

          if (removed.length > 0) {
            // Handle removals
            removed.forEach((modelName) => handleModelRemove(modelName));
          }
        }}
        options={availableModelsForSelection}
        showSearch={false}
        popupRender={(menu) => (
          <>
            {menu}
            <Divider style={{ margin: "8px 0" }} />
            <Space style={{ padding: "0 8px 4px" }}>
              <Input
                placeholder={`Enter other model name`}
                ref={inputRef}
                value={customModelName}
                onChange={(e) => setCustomModelName(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                onPressEnter={addCustomModel}
              />
              <Button
                type="text"
                icon={<PlusOutlined />}
                onClick={addCustomModel}
              >
                Add
              </Button>
            </Space>
          </>
        )}
      />
    </div>
  );
};
