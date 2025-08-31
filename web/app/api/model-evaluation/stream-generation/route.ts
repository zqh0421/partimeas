import { NextRequest } from "next/server";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatAnthropic } from "@langchain/anthropic";
import Anthropic from "@anthropic-ai/sdk";
import { sql } from "@/app/config/database";

// Types
type OutputAssistant = {
  assistantId: number;
  name: string;
  provider: string;
  model: string;
  systemPrompt: string;
  requiredToShow: boolean;
  updatedAt: string;
};

type ModelInstance =
  | any // LangChain models
  | { type: "direct_anthropic"; modelName: string; anthropicApiKey: string };

interface StreamMessage {
  type: 'modelOutput' | 'modelChunk' | 'complete' | 'error';
  modelId?: string;
  output?: string;
  chunk?: string;
  isLastChunk?: boolean;
  sessionId?: string;
  timestamp: string;
  error?: string;
}

// Reuse existing functions from the main route
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

  return rows.map((r: any) => ({
    assistantId: r.assistant_id as number,
    name: r.name as string,
    provider: r.providers[0] as string,
    model: r.linked_models[0] as string,
    systemPrompt: r.system_prompt as string,
    requiredToShow: Boolean(r.required_to_show),
    updatedAt: (r.updated_at || new Date().toISOString()) as string,
    linkedModels: r.linked_models as string[],
  }));
};

const shuffleArray = <T>(items: T[]): T[] => {
  const array = [...items];
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

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

        if (modelName === "claude-opus-4-1-20250805") {
          return {
            type: "direct_anthropic",
            modelName: modelName,
            anthropicApiKey: process.env.ANTHROPIC_API_KEY,
          };
        }

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

const validateAndFixStructure = (
  output: string,
  useCaseType: string = "original_system123_instructions"
): string => {
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

  const missingSections = requiredSections.filter(
    (section) => !output.includes(section)
  );

  if (missingSections.length > 0) {
    // Could add missing sections handling here if needed
  }

  return fixedOutput;
};

// Helper function to chunk text into smaller pieces
const chunkText = (text: string, chunkSize: number = 50): string[] => {
  const chunks: string[] = [];
  const words = text.split(' ');
  let currentChunk = '';
  
  for (const word of words) {
    if ((currentChunk + ' ' + word).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = word;
    } else {
      currentChunk = currentChunk ? `${currentChunk} ${word}` : word;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
};

// Streaming generation function for individual models with chunked output
const generateModelOutputStreaming = async (
  provider: string,
  modelId: string,
  testCase: any,
  useCaseTypeOverride?: string,
  systemPromptOverride?: string,
  sendChunk?: (chunk: string, modelId: string, isComplete: boolean) => void
) => {
  try {
    console.log(`🚀 Starting streaming generation for model: ${provider}/${modelId}`);

    // Provider correction logic (same as original)
    let finalProvider = provider;
    if (modelId.startsWith("claude-") && provider !== "anthropic") {
      finalProvider = "anthropic";
    } else if (
      (modelId.startsWith("gpt-") ||
        modelId.startsWith("o1") ||
        modelId.startsWith("o3") ||
        modelId.startsWith("o4")) &&
      provider !== "openai"
    ) {
      finalProvider = "openai";
    } else if (modelId.startsWith("gemini-") && provider !== "google") {
      finalProvider = "google";
    } else if (modelId.startsWith("gemma") && provider !== "openrouter") {
      finalProvider = "google";
    } else if (modelId.startsWith("google/") && provider !== "openrouter") {
      finalProvider = "openrouter";
    }

    const model = await getModelInstance(finalProvider, modelId);
    
    const useCaseType = useCaseTypeOverride || testCase?.useCase || "";
    const systemPrompt = systemPromptOverride || 
      "You are a helpful AI assistant. Please provide thoughtful, accurate, and helpful responses to the user's questions.";

    const prompt = await ChatPromptTemplate.fromMessages([
      ["system", `${systemPrompt}`],
      ["human", "{query}"],
    ]);

    let output: string;

    // Handle direct Anthropic separately
    if (
      model &&
      typeof model === "object" &&
      "type" in model &&
      model.type === "direct_anthropic"
    ) {
      const anthropic = new Anthropic({
        apiKey: model.anthropicApiKey,
      });

      const formattedQuery = await prompt.format({
        query: `${testCase.input}`,
      });

      // Use streaming for Anthropic if sendChunk is provided
      if (sendChunk) {
        try {
          console.log(`🌊 Using native streaming for Anthropic ${model.modelName}`);
          let accumulatedContent = '';
          
          const stream = await anthropic.messages.create({
            model: model.modelName,
            max_tokens: 4096,
            messages: [
              {
                role: "user",
                content: formattedQuery,
              },
            ],
            stream: true,
          });
          
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const chunkContent = chunk.delta.text;
              accumulatedContent += chunkContent;
              // Send each chunk as it arrives
              sendChunk(chunkContent, `${finalProvider}/${modelId}`, false);
            }
          }
          
          // Send final marker
          sendChunk('', `${finalProvider}/${modelId}`, true);
          output = accumulatedContent;
          
        } catch (streamError) {
          console.warn(`⚠️ Streaming failed for Anthropic, falling back to regular API:`, streamError);
          // Fallback to regular API call
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
            if (content && content.type === "text") {
              output = content.text;
            } else {
              throw new Error("No valid text content received from Anthropic API");
            }
          } else {
            throw new Error("No valid text content received from Anthropic API");
          }
        }
      } else {
        // Non-streaming regular API call
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
          if (content && content.type === "text") {
            output = content.text;
          } else {
            throw new Error("No valid text content received from Anthropic API");
          }
        } else {
          throw new Error("No valid text content received from Anthropic API");
        }
      }
    } else {
      // Use LangChain chain for other models with streaming
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
      
      // Try to use streaming if available
      if (sendChunk && chainWithConfig.stream) {
        try {
          console.log(`🌊 Using native streaming for ${finalProvider}/${modelId}`);
          let accumulatedContent = '';
          
          const stream = await chainWithConfig.stream({
            query: `${testCase.input}`,
          });
          
          for await (const chunk of stream) {
            const chunkContent = (chunk as any).content || '';
            if (chunkContent) {
              accumulatedContent += chunkContent;
              // Send each chunk as it arrives from the model
              sendChunk(chunkContent, `${finalProvider}/${modelId}`, false);
            }
          }
          
          // Send final marker
          sendChunk('', `${finalProvider}/${modelId}`, true);
          output = accumulatedContent;
          
        } catch (streamError) {
          console.warn(`⚠️ Streaming failed for ${finalProvider}/${modelId}, falling back to regular invoke:`, streamError);
          // Fallback to regular invoke if streaming fails
          try {
            const response = await chainWithConfig.invoke({
              query: `${testCase.input}`,
            });
            
            // Handle different response structures
            if (typeof response === 'string') {
              output = response;
            } else if (response && typeof response === 'object') {
              // Try common response patterns
              if ('content' in response) {
                output = (response as any).content as string;
              } else if ('text' in response) {
                output = (response as any).text as string;
              } else if ('output' in response) {
                output = (response as any).output as string;
              } else {
                // Log the response structure for debugging
                console.error(`Unexpected response structure from ${finalProvider}/${modelId}:`, response);
                throw new Error(`Unexpected response structure from model ${modelId}`);
              }
            } else {
              throw new Error(`Invalid response from model ${modelId}`);
            }
            
            // Send the complete output when fallback succeeds (simulating chunks for UI consistency)
            if (sendChunk && output) {
              // Send the entire output as a single chunk since streaming failed
              sendChunk(output, `${finalProvider}/${modelId}`, true);
            }
          } catch (invokeError) {
            console.error(`❌ Regular invoke also failed for ${finalProvider}/${modelId}:`, invokeError);
            throw invokeError;
          }
        }
      } else {
        // Regular non-streaming invoke
        const response = await chainWithConfig.invoke({
          query: `${testCase.input}`,
        });
        
        // Handle different response structures
        if (typeof response === 'string') {
          output = response;
        } else if (response && typeof response === 'object') {
          // Try common response patterns
          if ('content' in response) {
            output = (response as any).content as string;
          } else if ('text' in response) {
            output = (response as any).text as string;
          } else if ('output' in response) {
            output = (response as any).output as string;
          } else {
            // Log the response structure for debugging
            console.error(`Unexpected response structure from ${finalProvider}/${modelId}:`, response);
            throw new Error(`Unexpected response structure from model ${modelId}`);
          }
        } else {
          throw new Error(`Invalid response from model ${modelId}`);
        }
      }
    }

    output = validateAndFixStructure(output, useCaseType);
    finalProvider = provider; // Use the provider from database

    // Note: We're now using native streaming from the models themselves,
    // so no need for artificial chunking here. The chunks are sent
    // directly as they arrive from the model's stream.

    return {
      modelId: `${finalProvider}/${modelId}`,
      output,
      timestamp: new Date().toISOString(),
      useCaseType,
      correctProvider: finalProvider,
    };
  } catch (error) {
    console.error(`Error generating output for model ${provider}/${modelId}:`, error);
    throw error;
  }
};

export async function POST(request: NextRequest) {
  try {
    const { testCase, groupId, idealResponse, criteriaSheetName } = await request.json();

    console.log(`🚀 Streaming model evaluation request received`);
    console.log("Test case:", testCase);
    console.log("Group ID:", groupId);
    
    // Log warning if criteria or ideal response are missing (but don't block)
    if (!criteriaSheetName || !idealResponse?.id) {
      console.warn("⚠️ Session being created without complete evaluation data:", {
        criteriaSheetName: criteriaSheetName || "missing",
        idealResponseId: idealResponse?.id || "missing",
        note: "Response scoring section will not be available for this session"
      });
    }

    // Fetch configuration from database (same logic as original)
    let numOutputsToRun = 2;
    let assistantModelAlgorithm = "random_selection";

    try {
      const configQuery = `
        SELECT name, value 
        FROM partimeas_configs 
        WHERE name IN ('numOutputsToRun', 'assistantModelAlgorithm')
      `;
      const configResult = await sql.query(configQuery);

      configResult.forEach((row: any) => {
        if (row.name === "numOutputsToRun") {
          numOutputsToRun = parseInt(row.value) || 2;
        } else if (row.name === "assistantModelAlgorithm") {
          assistantModelAlgorithm = row.value || "unique_model";
        }
      });
    } catch (error) {
      console.warn("Failed to fetch configuration from database, using defaults:", error);
    }

    // Select assistants (same logic as original)
    const allOutputAssistantsWithModels = await getOutputGenerationAssistants();
    const desiredOutputs = Math.min(numOutputsToRun, allOutputAssistantsWithModels.length);
    
    let selectedAssistants: OutputAssistant[] = [];

    if (assistantModelAlgorithm === "unique_model") {
      const assistantsWithLinkedModels = await getAssistantsWithLinkedModels();
      const assignedModels = new Set<string>();
      const uniqueModelAssistants: OutputAssistant[] = [];

      for (const assistant of assistantsWithLinkedModels) {
        const linkedModels = assistant.linkedModels || [];
        if (linkedModels.length > 0) {
          const availableModels = linkedModels.filter(
            (model: string) => !assignedModels.has(model)
          );

          if (availableModels.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableModels.length);
            const selectedModel = availableModels[randomIndex];

            assignedModels.add(selectedModel);
            uniqueModelAssistants.push({
              ...assistant,
              model: selectedModel,
            });
          } else {
            const fallbackModel = linkedModels[0];
            assignedModels.add(fallbackModel);
            uniqueModelAssistants.push({
              ...assistant,
              model: fallbackModel,
            });
          }
        }
      }

      const validAssistants = uniqueModelAssistants.filter(
        (assistant) => assistant.systemPrompt && assistant.model
      );

      const randomizedAssistants = [
        ...validAssistants.filter((a) => a.requiredToShow).sort(() => Math.random() - 0.5),
        ...validAssistants.filter((a) => !a.requiredToShow).sort(() => Math.random() - 0.5),
      ];

      selectedAssistants = randomizedAssistants.slice(0, desiredOutputs);
    } else {
      const requiredAssistants = allOutputAssistantsWithModels.filter((a) => a.requiredToShow);
      const optionalAssistants = allOutputAssistantsWithModels.filter((a) => !a.requiredToShow);

      const requiredCount = Math.min(desiredOutputs, requiredAssistants.length);
      const optionalCount = Math.min(desiredOutputs - requiredCount, optionalAssistants.length);

      const shuffledRequired = requiredAssistants.sort(() => Math.random() - 0.5);
      const shuffledOptional = optionalAssistants.sort(() => Math.random() - 0.5);

      selectedAssistants = [
        ...shuffledRequired.slice(0, requiredCount),
        ...shuffledOptional.slice(0, optionalCount),
      ];
    }

    selectedAssistants = shuffleArray(selectedAssistants);

    console.log(`🔧 Selected ${selectedAssistants.length} assistants for streaming`);

    // Create readable stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const sendMessage = (message: StreamMessage) => {
          const data = `data: ${JSON.stringify(message)}\n\n`;
          controller.enqueue(encoder.encode(data));
        };

        try {
          // Generate outputs in parallel and stream them
          const outputs: any[] = [];
          const errors: any[] = [];

          // Create promises for all model generations to run in parallel
          const generationPromises = selectedAssistants.map(async (assistant, i) => {
            try {
              console.log(`🔄 Starting parallel streaming generation ${i + 1}/${selectedAssistants.length}: ${assistant.name}`);
              
              // Track accumulated chunks for this model
              let accumulatedOutput = '';
              
              const result = await generateModelOutputStreaming(
                assistant.provider,
                assistant.model,
                testCase,
                testCase.useCase,
                assistant.systemPrompt,
                // Chunk sender callback
                (chunk: string, modelId: string, isLastChunk: boolean) => {
                  accumulatedOutput += chunk + (isLastChunk ? '' : ' ');
                  
                  // Send chunk message
                  sendMessage({
                    type: 'modelChunk',
                    modelId: modelId,
                    chunk: chunk,
                    isLastChunk: isLastChunk,
                    timestamp: new Date().toISOString(),
                  });
                }
              );

              // Send the complete output message after all chunks
              sendMessage({
                type: 'modelOutput',
                modelId: result.modelId,
                output: result.output,
                timestamp: result.timestamp,
              });

              console.log(`✅ Streamed result for: ${assistant.name}`);
              return { success: true, result, assistant };

            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : "Unknown error";
              console.error(`❌ Assistant ${assistant.name} failed: ${errorMessage}`);
              
              // Stream the error
              sendMessage({
                type: 'error',
                modelId: `${assistant.provider}/${assistant.model}`,
                error: errorMessage,
                timestamp: new Date().toISOString(),
              });

              return { success: false, error: errorMessage, assistant };
            }
          });

          // Wait for all generations to complete
          const results = await Promise.allSettled(generationPromises);
          
          // Process results
          results.forEach((result) => {
            if (result.status === 'fulfilled' && result.value.success) {
              outputs.push(result.value.result);
            } else if (result.status === 'fulfilled' && !result.value.success) {
              errors.push({
                assistantId: result.value.assistant.assistantId,
                error: result.value.error,
              });
            } else if (result.status === 'rejected') {
              console.error('Promise rejected:', result.reason);
            }
          });

          // Store session data in database BEFORE sending completion
          let sessionId: string | null = null;
          try {
            console.log("📊 Uploading session data to database...");

            const sessionQuery = `
              INSERT INTO partimeas_sessions 
              (response_count, test_case_scenario_category, test_case_prompt, random_algorithm_used, group_id,
               linked_ideal_response, linked_ideal_test_case, linked_criterion_sheet_name)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              RETURNING id
            `;

            const sessionResult = await sql.query(sessionQuery, [
              outputs.length,
              testCase.scenarioCategory || testCase.context || "General",
              testCase.input,
              assistantModelAlgorithm,
              groupId || null,
              idealResponse?.id || null,
              idealResponse?.idealTestCase || idealResponse?.testCaseInput || null,
              criteriaSheetName || null,
            ]);

            sessionId = sessionResult[0]?.id;
            
            if (!sessionId) {
              console.error(`❌ Failed to get session ID from database. Result:`, sessionResult);
              console.error(`❌ Session creation FAILED - No ID returned`);
              console.error(`   Query: ${sessionQuery}`);
              console.error(`   Parameters:`, [
                outputs.length,
                testCase.scenarioCategory || testCase.context || "General",
                testCase.input,
                assistantModelAlgorithm,
                groupId || null,
              ]);
              throw new Error("Failed to create session - no ID returned from database");
            }
            
            console.log(`✅ Session created SUCCESSFULLY with ID: ${sessionId}`);
            console.log(`   📝 Session details:`);
            console.log(`      - ID: ${sessionId}`);
            console.log(`      - Response count: ${outputs.length}`);
            console.log(`      - Test case category: ${testCase.scenarioCategory || testCase.context || "General"}`);
            console.log(`      - Group ID: ${groupId || "null"}`);
            console.log(`      - Algorithm: ${assistantModelAlgorithm}`);

            if (sessionId && outputs.length > 0) {
              for (let i = 0; i < outputs.length; i++) {
                const output = outputs[i];
                const [provider, model] = output.modelId.split("/");
                const correctProvider = output.correctProvider || provider;

                await sql.query(`
                  INSERT INTO partimeas_responses 
                  (session_id, display_order, provider, model, system_prompt, response_content)
                  VALUES ($1, $2, $3, $4, $5, $6)
                `, [
                  sessionId,
                  i + 1,
                  correctProvider,
                  model,
                  selectedAssistants[i]?.systemPrompt || "",
                  output.output,
                ]);
              }

              console.log(`✅ ${outputs.length} responses stored for session ${sessionId}`);
            }
          } catch (dbError) {
            console.error("❌ Failed to upload session data to database:", dbError);
            console.error("❌ Session creation FAILED with error");
            console.error("Database error details:", {
              message: dbError instanceof Error ? dbError.message : "Unknown error",
              stack: dbError instanceof Error ? dbError.stack : undefined,
            });
            // Set sessionId to null if database operation failed
            sessionId = null;
          }

          // Log final session ID status
          if (!sessionId) {
            console.error("⚠️ WARNING: Sending completion WITHOUT session ID - evaluation upload will fail!");
            console.error("   Database session creation failed or returned null");
          } else {
            console.log(`✅ Streaming completion will include session ID: ${sessionId}`);
          }

          // Send completion message with sessionId
          sendMessage({
            type: 'complete',
            sessionId: sessionId || undefined,
            timestamp: new Date().toISOString(),
          });

        } catch (error) {
          console.error("❌ Streaming error:", error);
          sendMessage({
            type: 'error',
            error: error instanceof Error ? error.message : "Unknown streaming error",
            timestamp: new Date().toISOString(),
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("Model evaluation streaming error:", error);
    
    const errorResponse = {
      error: "Failed to start streaming evaluation",
      details: error instanceof Error ? error.message : "Unknown error",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}