export interface MainSettingsPreset {
  id: string;
  name: string;
  description: string;
  config: {
    numOutputsToRun: number;
    numOutputsToShow: number;
    assistantModelAlgorithm: "random_selection" | "unique_model";
  };
  assistantSettings: {
    outputGenerationAssistants: {
      requiredToShow: "all" | "none" | "better_ideal_only";
    };
  };
}

export const MAIN_SETTINGS_PRESETS: MainSettingsPreset[] = [
  {
    id: "evaluation_focus",
    name: "2 Response Mode",
    description: "2 outputs, unique model, only Better (Ideal) required",
    config: {
      numOutputsToRun: 2,
      numOutputsToShow: 2,
      assistantModelAlgorithm: "unique_model",
    },
    assistantSettings: {
      outputGenerationAssistants: {
        requiredToShow: "better_ideal_only",
      },
    },
  },
  {
    id: "generation_focus",
    name: "3 Response Mode",
    description: "3 outputs, unique model, all assistants required",
    config: {
      numOutputsToRun: 3,
      numOutputsToShow: 3,
      assistantModelAlgorithm: "unique_model",
    },
    assistantSettings: {
      outputGenerationAssistants: {
        requiredToShow: "all",
      },
    },
  },
  {
    id: "custom",
    name: "Custom",
    description: "Keep current configuration",
    config: {
      numOutputsToRun: 2, // Sentinel value to indicate no change
      numOutputsToShow: 2,
      assistantModelAlgorithm: "unique_model",
    },
    assistantSettings: {
      outputGenerationAssistants: {
        requiredToShow: "none",
      },
    },
  },
];
