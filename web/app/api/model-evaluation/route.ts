import { NextRequest, NextResponse } from "next/server";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { JsonOutputParser } from "@langchain/core/output_parsers";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatAnthropic } from "@langchain/anthropic";
import Anthropic from "@anthropic-ai/sdk";
import { sql } from "@/app/config/database";
import { traceable } from "langsmith/traceable";
// No constant-based model configs or prompts: use DB only

// Assistants-aware helpers
type OutputAssistant = {
  assistantId: number;
  name: string;
  provider: string; // 'openai' | 'anthropic' | 'google' | 'openrouter'
  model: string; // provider model id, e.g., 'gpt-4o-mini'
  systemPrompt: string; // prompt text
  requiredToShow: boolean;
  updatedAt: string;
};

// Read all output-generation assistants with flags and prompts
const getOutputGenerationAssistants = async (): Promise<OutputAssistant[]> => {
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

  // Debug logging for database results
  console.log(`🔧 Database query results for assistants:`);
  rows.forEach((r: any, index: number) => {
    console.log(`  ${index + 1}. ${r.name}:`);
    console.log(`    - system_prompt_id: ${r.system_prompt_id}`);
    console.log(
      `    - system_prompt: ${
        r.system_prompt ? `"${r.system_prompt.substring(0, 100)}..."` : "NULL"
      }`
    );
    console.log(`    - system_prompt length: ${r.system_prompt?.length || 0}`);
  });

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
const getAssistantsWithLinkedModels = async (): Promise<
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

  // Debug logging for database results
  console.log(`🔧 Database query results for assistants with linked models:`);
  rows.forEach((r: any, index: number) => {
    console.log(`  ${index + 1}. ${r.name}:`);
    console.log(`    - system_prompt_id: ${r.system_prompt_id}`);
    console.log(
      `    - system_prompt: ${
        r.system_prompt ? `"${r.system_prompt.substring(0, 100)}..."` : "NULL"
      }`
    );
    console.log(`    - system_prompt length: ${r.system_prompt?.length || 0}`);
  });

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

// Get model configurations for the selected models
const getModelConfigs = async (): Promise<
  Array<{ id: string; provider: string; model: string }>
> => {
  const rows = await sql`
    SELECT id, provider, model_id as model
    FROM partimeas_models
    WHERE is_active = true
  `;

  return rows.map((row: any) => ({
    id: row.id,
    provider: row.provider,
    model: row.model,
  }));
};

// Utility: Fisher-Yates shuffle
const shuffleArray = <T>(items: T[]): T[] => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// Define proper types for model instances
type ModelInstance =
  | any // LangChain models return RunnableBinding types
  | { type: "direct_anthropic"; modelName: string; anthropicApiKey: string };

// Initialize model instances with dynamic imports using DB provider+model
const getModelInstance = async (
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
        }).withConfig({
          runName: "ChatOpenAI",
          tags: ["output-generation"],
          metadata: {
            source: "PartiMeas",
            run_type: "llm",
            ls_provider: provider,
            ls_model_name: modelName,
          },
        });
      case "anthropic":
        if (!process.env.ANTHROPIC_API_KEY) {
          throw new Error("ANTHROPIC_API_KEY not configured");
        }

        // Special handling for claude-opus-4-1-20250805 which is not yet supported by LangChain
        if (modelName === "claude-opus-4-1-20250805") {
          // Return a special object that indicates this should use direct API calls
          return {
            type: "direct_anthropic",
            modelName: modelName,
            anthropicApiKey: process.env.ANTHROPIC_API_KEY,
          };
        }

        // Use LangChain for other Claude models
        return new ChatAnthropic({
          modelName: modelName,
          anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        }).withConfig({
          runName: "ChatAnthropic",
          tags: ["output-generation"],
          metadata: {
            source: "PartiMeas",
            run_type: "llm",
            ls_provider: provider,
            ls_model_name: modelName,
          },
        });
      case "google":
        if (!process.env.GOOGLE_API_KEY) {
          throw new Error("GOOGLE_API_KEY not configured");
        }
        return new ChatGoogleGenerativeAI({
          modelName: modelName,
          apiKey: process.env.GOOGLE_API_KEY,
        }).withConfig({
          runName: "ChatGoogleGenerativeAI",
          tags: ["output-generation"],
          metadata: {
            source: "PartiMeas",
            run_type: "llm",
            ls_provider: provider,
            ls_model_name: modelName,
          },
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
        ).withConfig({
          runName: "OpenRouter",
          tags: ["output-generation", "openrouter"],
          metadata: {
            source: "PartiMeas",
            run_type: "llm",
            ls_provider: provider,
            ls_model_name: modelName,
          },
        });
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

// Read active evaluation assistant with system prompt
const getActiveEvaluationAssistant = async (): Promise<{
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

// Helper function to generate output from a single model
const generateModelOutput = async (
  provider: string,
  modelId: string,
  testCase: any,
  useCaseTypeOverride?: string,
  systemPromptOverride?: string
) => {
  try {
    console.log(`🚀 Starting generation for model: ${provider}/${modelId}`);

    // Get model instance

    let finalProvider = provider;
    if (modelId.startsWith("claude-") && provider !== "anthropic") {
      console.warn(
        `⚠️ Warning: Claude model ${modelId} has provider ${provider}, expected 'anthropic'`
      );
      finalProvider = "anthropic";
    } else if (
      (modelId.startsWith("gpt-") ||
        modelId.startsWith("o1") ||
        modelId.startsWith("o3") ||
        modelId.startsWith("o4")) &&
      provider !== "openai"
    ) {
      console.warn(
        `⚠️ Warning: GPT/o-series model ${modelId} has provider ${provider}, expected 'openai'`
      );
      finalProvider = "openai";
    } else if (modelId.startsWith("gemini-") && provider !== "google") {
      console.warn(
        `⚠️ Warning: Gemini model ${modelId} has provider ${provider}, expected 'google'`
      );
      finalProvider = "google";
    } else if (modelId.startsWith("gemma") && provider !== "openrouter") {
      console.warn(
        `⚠️ Warning: Gemini model ${modelId} has provider ${provider}, expected 'google'`
      );
      finalProvider = "google";
    } else if (modelId.startsWith("google/") && provider !== "openrouter") {
      console.warn(
        `⚠️ Warning: OpenRouter model ${modelId} has provider ${provider}, expected 'openrouter'`
      );
      finalProvider = "openrouter";
    }
    const model = await getModelInstance(finalProvider, modelId);
    console.log(
      `✅ Model instance created successfully for: ${provider}/${modelId}`
    );

    // Use provided use case label as metadata only
    const useCaseType = useCaseTypeOverride || testCase?.useCase || "";
    // console.log(`🔧 Using use case label: ${useCaseType} (override: ${useCaseTypeOverride || 'none'}) for model: ${provider}/${modelId}`);
    // console.log(`🔧 Test case object:`, JSON.stringify(testCase, null, 2));
    // console.log(`🔧 Test case use_case_description:`, testCase?.use_case_description);
    // console.log(`🔧 Test case useCase:`, testCase?.useCase);

    // Debug logging for system prompts
    // console.log(`🔧 System prompt debug for ${provider}/${modelId}:`);
    // console.log(`  - systemPromptOverride: ${systemPromptOverride ? `"${systemPromptOverride.substring(0, 100)}..."` : 'undefined/null'}`);
    // console.log(`  - systemPromptOverride length: ${systemPromptOverride?.length || 0}`);

    // Use provided system prompt or fallback to a default one
    const systemPrompt =
      systemPromptOverride ||
      "You are a helpful AI assistant. Please provide thoughtful, accurate, and helpful responses to the user's questions.";

    if (!systemPromptOverride) {
      console.warn(
        `⚠️ Warning: No system prompt provided for ${provider}/${modelId}. Using fallback prompt.`
      );
    }

    // Build prompt template (do not pre-format to string for LangChain tracing)
    const prompt = await ChatPromptTemplate.fromMessages([
      ["system", `${systemPrompt}`],
      ["human", "{query}"],
    ]);

    let output: string;

    // Handle direct Anthropic separately (cannot pipe via LangChain)
    if (
      model &&
      typeof model === "object" &&
      "type" in model &&
      model.type === "direct_anthropic"
    ) {
      const anthropic = new Anthropic({
        apiKey: model.anthropicApiKey,
      });

      // For direct API, format the full string
      const formattedQuery = await prompt.format({
        query: `${testCase.input}`,
      });

      const response = await anthropic.messages.create({
        model: model.modelName,
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: formattedQuery,
          },
        ],
      });

      if (response.content && response.content.length > 0) {
        const content = response.content[0];
        if (content.type === "text") {
          output = content.text;
        } else if (content.type === "thinking") {
          throw new Error(
            "Thinking blocks not supported for output generation"
          );
        } else {
          throw new Error("No valid text content received from Anthropic API");
        }
      } else {
        throw new Error("No valid text content received from Anthropic API");
      }
    } else {
      // Use LangChain chain for other models to preserve message roles in tracing
      const chain = prompt.pipe(model);
      const chainWithConfig = chain.withConfig({
        runName: `output-${finalProvider}-${modelId}`,
        tags: ["output-generation"],
        metadata: {
          source: "PartiMeas",
          run_type: "llm",
          ls_provider: finalProvider,
          ls_model_name: modelId,
          use_case: useCaseType,
          test_case_id: testCase.id || "unknown",
          system_prompt: systemPrompt,
        },
      });
      const response = await chainWithConfig.invoke({
        query: `${testCase.input}`,
      });
      output = (response as any).content as string;
    }

    // Validate and potentially fix structural issues
    output = validateAndFixStructure(output, useCaseType);

    // Log the actual provider and modelId for debugging
    console.log(
      `🔍 generateModelOutput debug - provider: ${provider}, modelId: ${modelId}`
    );

    // Use the provider from database (which should be correct)
    // Only override if there's a clear mismatch that needs fixing
    finalProvider = provider;

    // Add validation logging
    console.log(`🔍 modelId: ${modelId}`);
    console.log(`🔍 provider: ${provider}`);
    if (modelId.startsWith("claude-") && provider !== "anthropic") {
      console.warn(
        `⚠️ Warning: Claude model ${modelId} has provider ${provider}, expected 'anthropic'`
      );
      finalProvider = "anthropic";
    } else if (
      (modelId.startsWith("gpt-") ||
        modelId.startsWith("o1") ||
        modelId.startsWith("o3") ||
        modelId.startsWith("o4")) &&
      provider !== "openai"
    ) {
      console.warn(
        `⚠️ Warning: GPT/o-series model ${modelId} has provider ${provider}, expected 'openai'`
      );
      finalProvider = "openai";
    } else if (modelId.startsWith("gemini-") && provider !== "google") {
      console.warn(
        `⚠️ Warning: Gemini model ${modelId} has provider ${provider}, expected 'google'`
      );
      finalProvider = "google";
    } else if (modelId.startsWith("google/") && provider !== "openrouter") {
      console.warn(
        `⚠️ Warning: OpenRouter model ${modelId} has provider ${provider}, expected 'openrouter'`
      );
      finalProvider = "openrouter";
    }

    // Final processor update
    console.log(`🔄 Final processor update for: ${finalProvider}/${modelId}`);

    return {
      modelId: `${finalProvider}/${modelId}`,
      output,
      timestamp: new Date().toISOString(),
      useCaseType, // Include the detected use case type in the response
      correctProvider: finalProvider, // Include the provider for debugging
    };
  } catch (error) {
    console.error(
      `Error generating output for model ${provider}/${modelId}:`,
      error
    );
    throw error;
  }
};

// Helper function to validate and fix structural issues in output
const validateAndFixStructure = (
  output: string,
  useCaseType: string = "original_system123_instructions"
): string => {
  // Define required sections based on use case type
  const getSectionsByUseCase = (type: string): string[] => {
    switch (type) {
      case "identify_magic_moments":
        return [
          "===== SECTION 1: MAGIC MOMENTS IDENTIFIED =====",
          "===== SECTION 2: DEVELOPMENTAL STRENGTHS ANALYSIS =====",
          "===== SECTION 3: BUILDING ON THESE MOMENTS =====",
          "===== SECTION 4: CURIOSITIES FOR EXPLORATION =====",
          "===== SECTION 5: NEXT STEPS & RESOURCES =====",
        ];
      case "original_system123_instructions":
        return [];
      case "general_analysis":
      default:
        return [];
    }
  };

  const requiredSections = getSectionsByUseCase(useCaseType);
  let fixedOutput = output;

  // Check if all required sections are present
  const missingSections = requiredSections.filter(
    (section) => !output.includes(section)
  );

  if (missingSections.length > 0) {
    // console.log(`⚠️ Missing sections in output for ${useCaseType}:`, missingSections);
    // // Add missing sections at the end
    // missingSections.forEach(section => {
    //   const sectionName = section.replace('===== SECTION ', '').replace(' =====', '');
    //   fixedOutput += `\n\n${section}\n[Content for ${sectionName} to be added]`;
    // });
  }

  return fixedOutput;
};

// Helper function to evaluate model outputs
const evaluateModelOutputs = async (
  outputs: any[],
  testCase: any,
  criteria: any[]
) => {
  try {
    console.log("🔍 Starting evaluation of model outputs...");

    // Use the active evaluation assistant with system prompt
    const activeEvaluationAssistant = await getActiveEvaluationAssistant();
    if (!activeEvaluationAssistant) {
      console.warn(
        "⚠️ No active evaluation assistant. Returning mock evaluation results."
      );
      const mockEvaluations = outputs.map((output) => {
        const criteriaScores = criteria.reduce((acc: any, c: any) => {
          const score = Math.floor(Math.random() * 3); // 0-2
          acc[c.id] = { score, reasoning: "Mock score (no evaluator active)" };
          return acc;
        }, {} as any);
        const scoreValues = Object.values(criteriaScores).map(
          (s: any) => s.score as number
        );
        const overallScore =
          scoreValues.length > 0
            ? scoreValues.reduce((a: number, b: number) => a + b, 0) /
              scoreValues.length
            : 0;
        return {
          modelId: output.modelId,
          overallScore,
          criteriaScores,
          feedback: "Mock evaluation (no evaluator assistant is active).",
          timestamp: new Date().toISOString(),
        };
      });
      return { evaluations: mockEvaluations, evaluationModelId: "mock" };
    }

    const evaluationModelId = `${activeEvaluationAssistant.provider}/${activeEvaluationAssistant.model}`;
    const evaluationModel = await getModelInstance(
      activeEvaluationAssistant.provider,
      activeEvaluationAssistant.model
    );
    console.log(
      `✅ Evaluation model instance created successfully: ${evaluationModelId}`
    );
    console.log(
      `🔧 Using evaluation assistant: ${activeEvaluationAssistant.name}`
    );
    console.log(
      `🔧 System prompt length: ${
        activeEvaluationAssistant.systemPrompt?.length || 0
      }`
    );

    const evaluations = [];

    // Define the expected evaluation structure
    interface EvaluationResult {
      overallScore: number;
      criteriaScores: Record<string, { score: number; reasoning: string }>;
      feedback: string;
      timestamp: string;
    }

    // Set up the JSON output parser
    const parser = new JsonOutputParser<EvaluationResult>();

    for (const output of outputs) {
      console.log(`🔍 Evaluating output from model: ${output.modelId}`);

      // Build user prompt with model response + rubric + test case
      const userQuery = `
        **Test Case User Input:**
        ${testCase.input}

        **AI Model Response to Evaluate:**
        ${output.output}

        **Evaluation Rubric:**
        ${criteria
          .map(
            (c, index) =>
              `${index + 1}. **${c.name}**: ${c.description}
              Score Range: ${c.scoreRange} (Use whole numbers only)
              Positive Examples: ${c.positive}
              Negative Examples: ${c.negative}`
          )
          .join("\n")}`;

      // Create format instructions for the JSON structure
      const formatInstructions = `
        Respond with a valid JSON object containing:
        - "criteriaScores": object with keys "${criteria
          .map((c) => c.id)
          .join('", "')}" each having {"score": number, "reasoning": string}`;

      // Create prompt template with format instructions
      const prompt = ChatPromptTemplate.fromTemplate(`
        {system_prompt}
        {format_instructions}

        {query}
      `);

      const partialedPrompt = await prompt.partial({
        format_instructions: formatInstructions,
        system_prompt: activeEvaluationAssistant.systemPrompt,
      });

      try {
        // For direct Anthropic API calls, we need to handle them differently
        if (
          evaluationModel &&
          typeof evaluationModel === "object" &&
          "type" in evaluationModel &&
          evaluationModel.type === "direct_anthropic"
        ) {
          // Direct Anthropic API doesn't support LangChain's JsonOutputParser
          // So we'll use the old approach for direct API calls
          const anthropic = new Anthropic({
            apiKey: evaluationModel.anthropicApiKey,
          });

          const formattedQuery = await partialedPrompt.format({
            query: userQuery,
          });

          const response = await anthropic.messages.create({
            model: evaluationModel.modelName,
            max_tokens: 4096,
            messages: [
              {
                role: "user",
                content: formattedQuery,
              },
            ],
          });

          if (response.content && response.content.length > 0) {
            const content = response.content[0];
            if (content.type === "text") {
              // Parse JSON manually for direct API calls
              let responseContent = content.text.trim();

              // Extract JSON if it's wrapped in markdown code blocks
              const jsonMatch = responseContent.match(
                /```(?:json)?\s*([\s\S]*?)\s*```/
              );
              if (jsonMatch) {
                responseContent = jsonMatch[1].trim();
              }

              // Remove any text before the first { and after the last }
              const startIndex = responseContent.indexOf("{");
              const lastIndex = responseContent.lastIndexOf("}");
              if (
                startIndex !== -1 &&
                lastIndex !== -1 &&
                startIndex <= lastIndex
              ) {
                responseContent = responseContent.substring(
                  startIndex,
                  lastIndex + 1
                );
              }

              const evaluation = JSON.parse(responseContent);
              evaluation.modelId = output.modelId;
              evaluation.timestamp = new Date().toISOString();
              evaluations.push(evaluation);
              console.log(
                `✅ Evaluation completed for model: ${output.modelId} (Direct API)`
              );
            }
          } else {
            throw new Error(
              "No valid text content received from Anthropic API"
            );
          }
        } else {
          // Use LangChain JsonOutputParser for other models
          const chain = partialedPrompt.pipe(evaluationModel).pipe(parser);
          console.log("🔍 Chain:", partialedPrompt);
          // Create a traceable wrapper for the chain invocation
          const tracedChain = traceable(
            async (query: string) => {
              return await chain.invoke({ query });
            },
            {
              name: `evaluation-${activeEvaluationAssistant.provider}-${activeEvaluationAssistant.model}`,
              tags: ["evaluation"],
              metadata: {
                source: "PartiMeas",
                run_type: "evaluation",
                ls_provider: activeEvaluationAssistant.provider,
                ls_model_name: activeEvaluationAssistant.model,
                assistant_id: activeEvaluationAssistant.assistantId,
                assistant_name: activeEvaluationAssistant.name,
                test_case_id: testCase.id || "unknown",
                model_being_evaluated: output.modelId,
                system_prompt: activeEvaluationAssistant.systemPrompt,
              },
            }
          );

          const evaluation = await tracedChain(userQuery);

          // Debug: Log the raw evaluation before adding modelId
          console.log(
            `🔍 Raw LLM evaluation for ${output.modelId}:`,
            JSON.stringify(evaluation, null, 2)
          );

          // Check if the LLM returned the expected structure
          if (evaluation.criteriaScores) {
            console.log(
              `🔍 Criteria scores keys:`,
              Object.keys(evaluation.criteriaScores)
            );
            console.log(
              `🔍 Expected criteria IDs:`,
              criteria.map((c) => c.id)
            );
          }

          // Add modelId and timestamp to the evaluation
          const evaluationWithMetadata = {
            ...evaluation,
            modelId: output.modelId,
            timestamp: new Date().toISOString(),
          };

          evaluations.push(evaluationWithMetadata);
          console.log(
            `✅ Evaluation completed for model: ${output.modelId} (LangChain)`
          );
        }
      } catch (error) {
        console.error(`❌ Failed to evaluate model ${output.modelId}:`, error);

        // Create a fallback evaluation
        evaluations.push({
          modelId: output.modelId,
          overallScore: 0,
          criteriaScores: criteria.reduce((acc, c) => {
            acc[c.id] = {
              score: 0,
              reasoning:
                "Evaluation failed - " +
                (error instanceof Error ? error.message : "Unknown error"),
            };
            return acc;
          }, {} as any),
          feedback: "Evaluation failed",
          timestamp: new Date().toISOString(),
        });
      }
    }

    console.log(`✅ All evaluations completed. Total: ${evaluations.length}`);
    return { evaluations, evaluationModelId };
  } catch (error) {
    console.error("❌ Error during evaluation:", error);
    throw error;
  }
};

// Main API route handler
export async function POST(request: NextRequest) {
  try {
    const { phase, testCase, criteria, outputs, groupId } =
      await request.json();

    console.log(`🚀 Model evaluation request received - Phase: ${phase}`);
    console.log("Test case:", testCase);
    console.log("Group ID:", groupId);

    if (phase === "generate") {
      console.log(
        "Phase 1: Generating outputs from assistants with prioritization..."
      );

      const { numOutputs } = typeof testCase === "object" ? testCase : {};

      // Fetch configuration from database
      let numOutputsToRun = 2; // Default fallback
      let numOutputsToShow = 2; // Default fallback
      let assistantModelAlgorithm = "random_selection"; // Default fallback

      try {
        const configQuery = `
          SELECT name, value 
          FROM partimeas_configs 
          WHERE name IN ('numOutputsToRun', 'numOutputsToShow', 'assistantModelAlgorithm')
        `;
        const configResult = await sql.query(configQuery);

        configResult.forEach((row: any) => {
          if (row.name === "numOutputsToRun") {
            numOutputsToRun = parseInt(row.value) || 2;
          } else if (row.name === "numOutputsToShow") {
            numOutputsToShow = parseInt(row.value) || 2;
          } else if (row.name === "assistantModelAlgorithm") {
            assistantModelAlgorithm = row.value || "unique_model";
          }
        });

        console.log(
          `📊 Configuration loaded - numOutputsToRun: ${numOutputsToRun}, numOutputsToShow: ${numOutputsToShow}, algorithm: ${assistantModelAlgorithm}`
        );

        // Note: The assistantModelAlgorithm configuration is now available for use
        // - 'random_selection': Each assistant randomly selects one model independently
        // - 'unique_model': All assistants use different models to ensure variety
        // This can be used in future implementations to control model selection behavior
      } catch (error) {
        console.warn(
          "Failed to fetch configuration from database, using defaults:",
          error
        );
      }

      // Fetch all output-generation assistants with their model configurations
      const allOutputAssistantsWithModels =
        await getOutputGenerationAssistants();
      const requiredAssistants = allOutputAssistantsWithModels.filter(
        (a) => a.requiredToShow
      );
      const optionalAssistants = allOutputAssistantsWithModels.filter(
        (a) => !a.requiredToShow
      );

      if ((numOutputs ?? 0) < 0) {
        return NextResponse.json(
          { error: "numOutputs must be a positive integer" },
          { status: 400 }
        );
      }

      // Determine how many outputs to generate. If not provided, use database config or default
      const desiredOutputs =
        typeof numOutputs === "number"
          ? numOutputs
          : Math.min(numOutputsToRun, allOutputAssistantsWithModels.length);

      // Also limit numOutputsToShow by the actual number of outputs that can be generated
      const actualNumOutputsToShow = Math.min(numOutputsToShow, desiredOutputs);

      let selectedAssistants: OutputAssistant[] = [];
      if (desiredOutputs === 0) {
        return NextResponse.json({
          success: true,
          phase: "generate",
          outputs: [],
          errors: [],
          totalAssistants: allOutputAssistantsWithModels.length,
          selectedAssistants: 0,
          timestamp: new Date().toISOString(),
          message: "No outputs requested (numOutputs=0)",
        });
      }

      // Apply model selection algorithm
      if (assistantModelAlgorithm === "unique_model") {
        console.log("🔧 Using Unique Model algorithm to ensure model variety");

        // Step 1: Get assistants with all their linked models and randomly select unique models
        const assistantsWithLinkedModels =
          await getAssistantsWithLinkedModels();
        const availableModels = new Set<string>();
        const assistantModelMap = new Map<number, string[]>();

        const assignedModels = new Set<string>();
        const uniqueModelAssistants: OutputAssistant[] = [];

        // Collect all available models and map assistants to their linked models
        for (const assistant of assistantsWithLinkedModels) {
          if (assistant.linkedModels && assistant.linkedModels.length > 0) {
            assistantModelMap.set(
              assistant.assistantId,
              assistant.linkedModels
            );
            assistant.linkedModels.forEach((model: string) =>
              availableModels.add(model)
            );
          }
        }
        console.log("assistantsWithLinkedModels");
        console.log(assistantsWithLinkedModels);
        // FIXED: Process assistants in random order for better model distribution
        for (const assistant of assistantsWithLinkedModels) {
          const linkedModels = assistantModelMap.get(assistant.assistantId);
          if (linkedModels && linkedModels.length > 0) {
            // Find available models that haven't been assigned yet
            const availableModels = linkedModels.filter(
              (model: string) => !assignedModels.has(model)
            );
            console.log("available & assigned:");
            console.log(availableModels);
            console.log(assignedModels);

            if (availableModels.length > 0) {
              // FIXED: Randomly select from available models instead of always taking the first
              const randomIndex = Math.floor(
                Math.random() * availableModels.length
              );
              const selectedModel = availableModels[randomIndex];

              assignedModels.add(selectedModel);
              uniqueModelAssistants.push({
                ...assistant,
                model: selectedModel,
              });

              console.log(
                `  🎯 Assistant ${assistant.name}: Assigned unique model ${selectedModel}`
              );
            } else {
              // Fallback: use any available model if no unique ones left
              const fallbackModel = linkedModels[0];
              assignedModels.add(fallbackModel);
              uniqueModelAssistants.push({
                ...assistant,
                model: fallbackModel,
              });

              console.log(
                `  🔄 Assistant ${assistant.name}: Fallback to model ${fallbackModel} (no unique models available)`
              );
            }
          }
        }

        // Step 2: Get the list of assistants with (1) linked system prompt and (2) linked unique model
        const validAssistants = uniqueModelAssistants.filter(
          (assistant) => assistant.systemPrompt && assistant.model
        );

        // Step 3: Randomize the list of assistants to randomize response order
        const randomizedAssistants = [
          ...validAssistants
            .filter((a) => a.requiredToShow)
            .sort(() => Math.random() - 0.5),
          ...validAssistants
            .filter((a) => !a.requiredToShow)
            .sort(() => Math.random() - 0.5),
        ];

        // Step 4: Use the randomized list of assistants to generate outputs
        selectedAssistants = randomizedAssistants.slice(0, desiredOutputs);

        console.log(
          `🔧 Unique Model Algorithm: ${validAssistants.length} assistants with unique models`
        );
        console.log(
          `  Assigned models: ${Array.from(assignedModels).join(", ")}`
        );
        console.log(
          `  Randomized order: ${randomizedAssistants
            .map((a) => a.name)
            .join(" → ")}`
        );
      } else {
        // Default random selection algorithm
        console.log("🔧 Using Random Selection algorithm");

        // FIXED: Improved random selection - ensure true randomness for each assistant
        const allAssistants = [...requiredAssistants, ...optionalAssistants];

        if (allAssistants.length === 0) {
          console.log("⚠️ No assistants available for random selection");
          selectedAssistants = [];
        } else {
          // FIXED: Use proper random selection instead of just taking first N
          const shuffledAssistants = allAssistants.sort(
            () => Math.random() - 0.5
          );

          // Prioritize required assistants but still maintain randomness
          const requiredCount = Math.min(
            desiredOutputs,
            requiredAssistants.length
          );
          const optionalCount = Math.min(
            desiredOutputs - requiredCount,
            optionalAssistants.length
          );

          // Take required assistants first (but in random order)
          const shuffledRequired = requiredAssistants.sort(
            () => Math.random() - 0.5
          );
          const shuffledOptional = optionalAssistants.sort(
            () => Math.random() - 0.5
          );

          selectedAssistants = [
            ...shuffledRequired.slice(0, requiredCount),
            ...shuffledOptional.slice(0, optionalCount),
          ];

          console.log(
            `  🎲 Random Selection: ${requiredCount} required + ${optionalCount} optional assistants selected`
          );
          console.log(
            `  Selected: ${selectedAssistants.map((a) => a.name).join(", ")}`
          );
        }
      }

      if (selectedAssistants.length === 0) {
        return NextResponse.json(
          {
            error:
              "No assistants selected. Ensure at least one output-generation assistant is marked as Required to Show, or set numOutputs to sample from optional assistants.",
          },
          { status: 400 }
        );
      }

      // Shuffle display order of selected assistants so Response 1..N is randomized
      selectedAssistants = shuffleArray(selectedAssistants);

      // Log selected assistants and their models for debugging
      console.log(
        `🔧 Final selected assistants for ${assistantModelAlgorithm} algorithm:`
      );
      selectedAssistants.forEach((assistant, index) => {
        console.log(
          `  ${index + 1}. ${assistant.name} (${assistant.provider}/${
            assistant.model
          }) - Required: ${assistant.requiredToShow}`
        );
      });

      // Debug: Log system prompts for selected assistants
      console.log(`🔧 System prompt debug for selected assistants:`);
      selectedAssistants.forEach((assistant, index) => {
        console.log(`  ${index + 1}. ${assistant.name}:`);
        console.log(
          `    - systemPrompt: ${
            assistant.systemPrompt
              ? `"${assistant.systemPrompt.substring(0, 100)}..."`
              : "undefined/null"
          }`
        );
        console.log(
          `    - systemPrompt length: ${assistant.systemPrompt?.length || 0}`
        );
      });

      // Debug: Log the actual provider and model values before calling generateModelOutput
      console.log(`🔍 Debug: selectedAssistants before generateModelOutput:`);
      selectedAssistants.forEach((assistant, index) => {
        console.log(`  ${index + 1}. ${assistant.name}:`);
        console.log(`    - provider: ${assistant.provider}`);
        console.log(`    - model: ${assistant.model}`);
        console.log(`    - provider type: ${typeof assistant.provider}`);
        console.log(`    - model type: ${typeof assistant.model}`);
      });

      // Generate outputs from selected assistants in parallel
      const outputGenerations = await Promise.allSettled(
        selectedAssistants.map((a) =>
          generateModelOutput(
            a.provider,
            a.model,
            testCase,
            testCase.useCase,
            a.systemPrompt
          )
        )
      );

      const outputs: any[] = [];
      const errors: any[] = [];

      // Process results
      for (let i = 0; i < outputGenerations.length; i++) {
        const result = outputGenerations[i];
        const assistant = selectedAssistants[i];

        if (result.status === "fulfilled") {
          console.log(
            `✅ Assistant ${assistant.name} generated output successfully`
          );
          outputs.push(result.value);
        } else {
          const errorMessage =
            result.reason instanceof Error
              ? result.reason.message
              : "Unknown error";
          console.error(
            `❌ Assistant ${assistant.name} failed: ${errorMessage}`
          );
          errors.push({
            assistantId: assistant.assistantId,
            error: errorMessage,
          });
        }
      }

      // Upload session data to database after successful generation
      let sessionId: string | null = null;
      try {
        console.log("📊 Uploading session data to database...");

        // Create session record
        const sessionQuery = `
          INSERT INTO partimeas_sessions 
          (response_count, test_case_scenario_category, test_case_prompt, random_algorithm_used, group_id)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `;

        const sessionResult = await sql.query(sessionQuery, [
          outputs.length,
          testCase.scenarioCategory || testCase.context || "General",
          testCase.input,
          assistantModelAlgorithm,
          groupId || null, // Include group_id from request body
        ]);

        sessionId = sessionResult[0]?.id;
        console.log(`✅ Session created with ID: ${sessionId}`);

        // Store all responses
        if (sessionId && outputs.length > 0) {
          console.log(
            `🔍 Debug: Processing ${outputs.length} outputs for database insertion:`
          );
          outputs.forEach((output, index) => {
            console.log(
              `  Output ${index}: modelId="${output.modelId}", correctProvider="${output.correctProvider}"`
            );
          });

          const responseQueries = outputs.map((output, index) => {
            // Ensure modelId is properly formatted and handle edge cases
            if (!output.modelId || typeof output.modelId !== "string") {
              console.error(
                `❌ Invalid modelId for output ${index}:`,
                output.modelId
              );
              throw new Error(
                `Invalid modelId for output ${index}: ${output.modelId}`
              );
            }

            const [provider, model] = output.modelId.split("/");

            // Validate that we have both provider and model after splitting
            if (!provider || !model) {
              console.error(
                `❌ Invalid modelId format for output ${index}: ${output.modelId}. Expected format: provider/modelId`
              );
              throw new Error(
                `Invalid modelId format for output ${index}: ${output.modelId}. Expected format: provider/modelId`
              );
            }

            // Use the correct provider from the output if available, otherwise fall back to the split result
            const correctProvider = output.correctProvider || provider;
            return {
              query: `
                INSERT INTO partimeas_responses 
                (session_id, display_order, provider, model, system_prompt, response_content)
                VALUES ($1, $2, $3, $4, $5, $6)
              `,
              params: [
                sessionId,
                index + 1,
                correctProvider,
                model,
                selectedAssistants[index]?.systemPrompt || "",
                output.output,
              ],
            };
          });

          // Execute all response insertions
          for (const { query, params } of responseQueries) {
            await sql.query(query, params);
          }

          console.log(
            `✅ ${outputs.length} responses stored for session ${sessionId}`
          );
        }
      } catch (dbError) {
        console.error("❌ Failed to upload session data to database:", dbError);
        // Don't fail the entire request if database upload fails
        // The outputs are still generated successfully
      }

      return NextResponse.json({
        success: true,
        phase: "generate",
        outputs,
        errors,
        totalAssistants: allOutputAssistantsWithModels.length,
        selectedAssistants: selectedAssistants.length,
        // Expose the actual model ids selected for this generation run so the UI can reflect accurate loading state
        selectedAssistantsModels: selectedAssistants.map((a) => a.model),
        successfulModels: outputs.length,
        failedModels: errors.length,
        // Configuration information for the frontend
        numOutputsToShow: actualNumOutputsToShow,
        // Algorithm information for debugging and verification
        algorithmUsed: assistantModelAlgorithm,
        algorithmDescription:
          assistantModelAlgorithm === "unique_model"
            ? "Unique Model - Ensured different models for variety"
            : "Random Selection - Each assistant independently selected models",
        timestamp: new Date().toISOString(),
        message:
          "Output generation completed. Ready to proceed to review page.",
        // Return session ID for tracking
        sessionId: sessionId,
      });
    }

    // Phase 2: Evaluate the outputs
    if (phase === "evaluate") {
      console.log("Phase 2: Evaluating outputs...");

      if (!criteria || !Array.isArray(criteria) || criteria.length === 0) {
        return NextResponse.json(
          {
            error:
              "Missing required field: criteria. Please provide evaluation criteria.",
          },
          { status: 400 }
        );
      }

      if (!outputs || !Array.isArray(outputs) || outputs.length === 0) {
        return NextResponse.json(
          {
            error:
              "Missing required field: outputs. Please provide model outputs to evaluate.",
          },
          { status: 400 }
        );
      }

      // Evaluate all outputs using the evaluation model
      const { evaluations, evaluationModelId } = await evaluateModelOutputs(
        outputs,
        testCase,
        criteria
      );

      return NextResponse.json({
        success: true,
        phase: "evaluate",
        evaluations,
        evaluationModel: evaluationModelId,
        timestamp: new Date().toISOString(),
        message: "Evaluation completed.",
      });
    }

    return NextResponse.json(
      { error: 'Invalid phase. Use "generate" or "evaluate".' },
      { status: 400 }
    );
  } catch (error) {
    console.error("Model evaluation error:", error);

    // Provide more specific error messages
    let errorMessage = "Failed to evaluate model";
    let errorDetails = error instanceof Error ? error.message : "Unknown error";

    if (errorDetails.includes("OPENAI_API_KEY not configured")) {
      errorMessage =
        "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.";
    } else if (errorDetails.includes("ANTHROPIC_API_KEY not configured")) {
      errorMessage =
        "Anthropic API key not configured. Please add ANTHROPIC_API_KEY to your environment variables.";
    } else if (errorDetails.includes("GOOGLE_API_KEY not configured")) {
      errorMessage =
        "Google API key not configured. Please add GOOGLE_API_KEY to your environment variables.";
    } else if (errorDetails.includes("OPENROUTER_API_KEY not configured")) {
      errorMessage =
        "OpenRouter API key not configured. Please add OPENROUTER_API_KEY to your environment variables.";
    } else if (errorDetails.includes("Unsupported model")) {
      errorMessage =
        "One or more models are not supported or not available in your account.";
    } else if (
      errorDetails.includes("401") ||
      errorDetails.includes("Unauthorized")
    ) {
      errorMessage =
        "Invalid API key. Please check your API key configuration.";
    } else if (
      errorDetails.includes("404") ||
      errorDetails.includes("Not Found")
    ) {
      errorMessage =
        "One or more models not found. They may not be available in your account.";
    } else if (
      errorDetails.includes("429") ||
      errorDetails.includes("Rate limit")
    ) {
      errorMessage = "Rate limit exceeded. Please try again later.";
    } else if (
      errorDetails.includes("500") ||
      errorDetails.includes("Internal Server Error")
    ) {
      errorMessage = "OpenAI service error. Please try again later.";
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 }
    );
  }
}
