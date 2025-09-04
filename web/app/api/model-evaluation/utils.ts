import { sql } from "@/app/config/database";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatAnthropic } from "@langchain/anthropic";

export type ModelInstance = any; // LangChain models return RunnableBinding types

export type OutputAssistant = {
  assistantId: number;
  name: string;
  provider: string; // 'openai' | 'anthropic' | 'google' | 'openrouter'
  model: string; // provider model id, e.g., 'gpt-4o-mini'
  systemPrompt: string; // prompt text
  requiredToShow: boolean;
  updatedAt: string;
};

export const matchProvider = (modelId: string) => {
  if (modelId.startsWith("claude-")) return "anthropic";
  else if (
    modelId.startsWith("gpt-") ||
    modelId.startsWith("o1") ||
    modelId.startsWith("o3") ||
    modelId.startsWith("o4")
  )
    return "openai";
  else if (modelId.startsWith("gemini-") || modelId.startsWith("gemma"))
    return "google";
  else if (modelId.startsWith("google/")) return "openrouter";
  else return "invalid model id!";
};

// Read all output-generation assistants with flags and prompts
export const getOutputGenerationAssistants = async (): Promise<
  OutputAssistant[]
> => {
  const rows = await sql`
    SELECT 
      a.id AS assistant_id, 
      a.name, 
      a.required_to_show, 
      a.updated_at, 
      m.provider AS provider, 
      m.model_id AS model, 
      sp.prompt AS system_prompt,
      a.system_prompt_id
    FROM partimeas_assistants a
    JOIN partimeas_assistant_models am ON am.assistant_id = a.id
    JOIN partimeas_models m ON m.id = am.model_id
    LEFT JOIN partimeas_system_prompts sp ON sp.id = a.system_prompt_id
    WHERE a.type = 'output_generation'
    ORDER BY a.required_to_show DESC, a.updated_at DESC
  `;

  return rows.map((r: any) => ({
    assistantId: r.assistant_id as number,
    name: r.name as string,
    provider: r.provider as string,
    model: r.model as string,
    systemPrompt: r.system_prompt as string,
    requiredToShow: Boolean(r.required_to_show),
    updatedAt: (r.updated_at || new Date().toISOString()) as string,
  }));
};

// Get assistants with all their linked models for unique model algorithm
export const getAssistantsWithLinkedModels = async (): Promise<
  Array<OutputAssistant & { linkedModels: string[] }>
> => {
  const rows = await sql`
    SELECT 
      a.id AS assistant_id, 
      a.name, 
      a.required_to_show, 
      a.updated_at, 
      sp.prompt AS system_prompt,
      ARRAY_AGG(m.model_id) AS linked_models,
      ARRAY_AGG(m.provider) AS providers,
      a.system_prompt_id
    FROM partimeas_assistants a
    JOIN partimeas_assistant_models am ON am.assistant_id = a.id
    JOIN partimeas_models m ON m.id = am.model_id
    LEFT JOIN partimeas_system_prompts sp ON sp.id = a.system_prompt_id
    WHERE a.type = 'output_generation'
    GROUP BY a.id, a.name, a.required_to_show, a.updated_at, sp.prompt, a.system_prompt_id
    ORDER BY a.required_to_show DESC, a.updated_at DESC
  `;

  return rows.map((r: any) => ({
    assistantId: r.assistant_id as number,
    name: r.name as string,
    provider: r.providers[0] as string, // Use first provider as default
    model: r.linked_models[0] as string, // Use first model as default
    systemPrompt: r.system_prompt as string,
    requiredToShow: Boolean(r.required_to_show),
    updatedAt: (r.updated_at || new Date().toISOString()) as string,
    linkedModels: r.linked_models as string[],
  }));
};

// Read active evaluation assistant with system prompt (kept for backward compatibility)
export const getActiveEvaluationAssistant = async (): Promise<{
  provider: string;
  model: string;
  systemPrompt: string;
  assistantId: number;
  name: string;
} | null> => {
  try {
    const rows = await sql`
      SELECT 
        a.id as assistant_id,
        a.name,
        m.provider as provider, 
        m.model_id as model,
        sp.prompt as system_prompt
      FROM partimeas_assistants a
      JOIN partimeas_assistant_models am ON am.assistant_id = a.id
      JOIN partimeas_models m ON m.id = am.model_id
      LEFT JOIN partimeas_system_prompts sp ON sp.id = a.system_prompt_id
      WHERE a.type = 'evaluation' AND a.required_to_show = true
      ORDER BY a.updated_at DESC
      LIMIT 1
    `;

    if (rows && rows.length > 0) {
      const row = rows[0];
      return {
        assistantId: row.assistant_id as number,
        name: row.name as string,
        provider: row.provider as string,
        model: row.model as string,
        systemPrompt:
          (row.system_prompt as string) ||
          "You are an expert evaluator of AI responses. Provide thorough, fair, and constructive evaluations based on the given criteria.",
      };
    }
    return null;
  } catch (e) {
    console.error("Failed to query active evaluation assistant from DB:", e);
    return null;
  }
};

// Get all active evaluation assistants with weights for parallel evaluation
export const getAllActiveEvaluationAssistants = async (): Promise<
  Array<{
    assistantId: number;
    name: string;
    provider: string;
    model: string;
    systemPrompt: string;
    weight: number;
  }>
> => {
  try {
    const rows = await sql`
      SELECT 
        a.id as assistant_id,
        a.name,
        a.weight,
        m.provider as provider, 
        m.model_id as model,
        sp.prompt as system_prompt
      FROM partimeas_assistants a
      JOIN partimeas_assistant_models am ON am.assistant_id = a.id
      JOIN partimeas_models m ON m.id = am.model_id
      LEFT JOIN partimeas_system_prompts sp ON sp.id = a.system_prompt_id
      WHERE a.type = 'evaluation' AND a.required_to_show = true
      ORDER BY a.updated_at DESC
    `;

    return rows.map((row: any) => ({
      assistantId: row.assistant_id as number,
      name: row.name as string,
      provider: row.provider as string,
      model: row.model as string,
      systemPrompt:
        (row.system_prompt as string) ||
        "You are an expert evaluator of AI responses. Provide thorough, fair, and constructive evaluations based on the given criteria.",
      weight: row.weight || 1, // Default weight to 1 if not set
    }));
  } catch (e) {
    console.error("Failed to query active evaluation assistants from DB:", e);
    return [];
  }
};

// Utility: Fisher-Yates shuffle
export const shuffleArray = <T>(items: T[]): T[] => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Initialize model instances with dynamic imports using DB provider+model
export const getModelInstance = async (
  provider: string,
  modelName: string
): Promise<ModelInstance> => {
  try {
    switch (provider) {
      case "openai":
        if (!process.env.OPENAI_API_KEY) {
          throw new Error("OPENAI_API_KEY not configured");
        }
        return new ChatOpenAI({
          modelName: modelName,
          openAIApiKey: process.env.OPENAI_API_KEY,
        });
      case "anthropic":
        if (!process.env.ANTHROPIC_API_KEY) {
          throw new Error("ANTHROPIC_API_KEY not configured");
        }

        return new ChatAnthropic({
          modelName: modelName,
          anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        });
      case "google":
        if (!process.env.GOOGLE_API_KEY) {
          throw new Error("GOOGLE_API_KEY not configured");
        }
        return new ChatGoogleGenerativeAI({
          modelName: modelName,
          apiKey: process.env.GOOGLE_API_KEY,
        });
      case "openrouter":
        if (!process.env.OPENROUTER_API_KEY) {
          throw new Error("OPENROUTER_API_KEY not configured");
        }
        return new ChatOpenAI(
          {
            openAIApiKey: process.env.OPENROUTER_API_KEY,
            modelName: modelName,
          },
          {
            baseURL: "https://openrouter.ai/api/v1",
          }
        );
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (importError) {
    console.error("Failed to import LangChain modules:", importError);
    throw new Error(
      `Failed to load model provider ${provider}. Please ensure LangChain dependencies are installed.`
    );
  }
};
