import { ChatOpenAI } from "@langchain/openai";
import { traceable } from "langsmith/traceable";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json();

    const selectedModel: string = model || "google/gemma-3n-e2b-it";

    if (!process.env.OPENROUTER_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OPENROUTER_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const llm = new ChatOpenAI(
      {
        openAIApiKey: process.env.OPENROUTER_API_KEY!,
        modelName: selectedModel,
      },
      {
        baseURL: "https://openrouter.ai/api/v1",
      }
    ).withConfig({
      runName: "ChatOpenAI-OpenRouter",
      tags: ["chat", "openrouter"],
      metadata: {
        source: "PartiMeas",
        run_type: "llm",
        ls_provider: "openrouter",
        ls_model_name: selectedModel,
      },
    });

    const runTraced = traceable(async (msgs: any) => {
      return llm.invoke(msgs);
    });

    const res = await runTraced(messages);
    return new Response(JSON.stringify(res), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error?.message || "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

