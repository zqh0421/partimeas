import { NextRequest } from "next/server";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import {
  getOutputGenerationAssistants,
  getAssistantsWithLinkedModels,
  shuffleArray,
  getModelInstance,
  matchProvider,
} from "@/app/api/model-evaluation/utils";
import type { OutputAssistant } from "@/app/api/model-evaluation/utils";
import { sql } from "@/app/config/database";

interface StreamMessage {
  type: "modelOutput" | "modelChunk" | "complete" | "error";
  modelId?: string;
  output?: string;
  chunk?: string;
  isLastChunk?: boolean;
  sessionId?: string;
  timestamp: string;
  error?: string;
}

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
    console.log(
      `🚀 Starting streaming generation for model: ${provider}/${modelId}`
    );

    // Provider correction logic (same as original)
    let finalProvider = matchProvider(modelId);

    const model = await getModelInstance(finalProvider, modelId);

    const useCaseType = useCaseTypeOverride || testCase?.useCase || "";
    const systemPrompt = systemPromptOverride || "";

    const prompt = await ChatPromptTemplate.fromMessages([
      ["system", `${systemPrompt}`],
      ["human", "{query}"],
    ]);

    let output: string;

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
    if (sendChunk && chainWithConfig.stream && modelId.length < 0) {
      try {
        console.log(
          `🌊 Using native streaming for ${finalProvider}/${modelId}`
        );
        let accumulatedContent = "";

        const stream = await chainWithConfig.stream({
          query: `${testCase.input}`,
        });

        for await (const chunk of stream) {
          const chunkContent = (chunk as any).content || "";
          if (chunkContent) {
            accumulatedContent += chunkContent;
            // Send each chunk as it arrives from the model
            sendChunk(chunkContent, `${finalProvider}/${modelId}`, false);
          }
        }

        // Send final marker
        sendChunk("", `${finalProvider}/${modelId}`, true);
        output = accumulatedContent;
      } catch (streamError) {
        console.warn(
          `⚠️ Streaming failed for ${finalProvider}/${modelId}, falling back to regular invoke:`,
          streamError
        );
        // Fallback to regular invoke if streaming fails
        try {
          const response = await chainWithConfig.invoke({
            query: `${testCase.input}`,
          });

          // Handle different response structures
          if (typeof response === "string") {
            output = response;
          } else if (response && typeof response === "object") {
            // Try common response patterns
            if ("content" in response) {
              output = (response as any).content as string;
            } else if ("text" in response) {
              output = (response as any).text as string;
            } else if ("output" in response) {
              output = (response as any).output as string;
            } else {
              // Log the response structure for debugging
              console.error(
                `Unexpected response structure from ${finalProvider}/${modelId}:`,
                response
              );
              throw new Error(
                `Unexpected response structure from model ${modelId}`
              );
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
          console.error(
            `❌ Regular invoke also failed for ${finalProvider}/${modelId}:`,
            invokeError
          );
          throw invokeError;
        }
      }
    } else {
      // Regular non-streaming invoke
      const response = await chainWithConfig.invoke({
        query: `${testCase.input}`,
      });

      // Handle different response structures
      if (typeof response === "string") {
        output = response;
      } else if (response && typeof response === "object") {
        // Try common response patterns
        if ("content" in response) {
          output = (response as any).content as string;
        } else if ("text" in response) {
          output = (response as any).text as string;
        } else if ("output" in response) {
          output = (response as any).output as string;
        } else {
          // Log the response structure for debugging
          console.error(
            `Unexpected response structure from ${finalProvider}/${modelId}:`,
            response
          );
          throw new Error(
            `Unexpected response structure from model ${modelId}`
          );
        }
      } else {
        throw new Error(`Invalid response from model ${modelId}`);
      }
    }

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
    console.error(
      `Error generating output for model ${provider}/${modelId}:`,
      error
    );
    throw error;
  }
};

export async function POST(request: NextRequest) {
  try {
    const { testCase, groupId, idealResponse, criteriaSheetName } =
      await request.json();

    console.log(`🚀 Streaming model evaluation request received`);
    // console.log("Test case:", testCase);
    console.log("Group ID:", groupId);

    // Log warning if criteria or ideal response are missing (but don't block)
    if (!criteriaSheetName || !idealResponse?.id) {
      console.warn(
        "⚠️ Session being created without complete evaluation data:",
        {
          criteriaSheetName: criteriaSheetName || "missing",
          idealResponseId: idealResponse?.id || "missing",
          note: "Response scoring section will not be available for this session",
        }
      );
    }

    // Fetch configuration from database (same logic as original)
    let numOutputsToRun = 2;
    let assistantModelAlgorithm = "random_selection";
    let useCacheSession = false;

    try {
      const configQuery = `
        SELECT name, value 
        FROM partimeas_configs 
        WHERE name IN ('numOutputsToRun', 'assistantModelAlgorithm', 'useCacheSession')
      `;
      const configResult = await sql.query(configQuery);

      configResult.forEach((row: any) => {
        if (row.name === "numOutputsToRun") {
          numOutputsToRun = parseInt(row.value) || 2;
        } else if (row.name === "assistantModelAlgorithm") {
          assistantModelAlgorithm = row.value || "unique_model";
        } else if (row.name === "useCacheSession") {
          useCacheSession = row.value === "true";
        }
      });
    } catch (error) {
      console.warn(
        "Failed to fetch configuration from database, using defaults:",
        error
      );
    }

    // Check if we should use cached session
    let referenceSessionId: string | null = null;
    let cachedResponses: any[] = [];
    let referenceSessionIds: string[] = [];
    
    if (useCacheSession) {
      console.log("🔄 Cache session enabled, looking for recent session to reuse...");
      
      try {
        // Get reference session IDs from config
        const refSessionsConfig = await sql`
          SELECT value FROM partimeas_configs 
          WHERE name = 'referenceSessionIds'
          LIMIT 1
        `;
        
        if (refSessionsConfig && refSessionsConfig.length > 0 && refSessionsConfig[0].value) {
          // Parse the reference session IDs (comma-separated)
          referenceSessionIds = refSessionsConfig[0].value.split(',').map((id: string) => id.trim()).filter((id: string) => id);
          console.log(`📋 Reference session IDs configured: ${referenceSessionIds.join(', ')}`);
        }
        
        // If specific reference sessions are provided, try them first
        if (referenceSessionIds.length > 0) {
          for (const sessionId of referenceSessionIds) {
            const sessionCheck = await sql.query(
              `SELECT id FROM partimeas_sessions WHERE id = $1 LIMIT 1`,
              [sessionId]
            );
            
            if (sessionCheck && sessionCheck.length > 0) {
              referenceSessionId = sessionId;
              console.log(`✅ Using configured reference session: ${referenceSessionId}`);
              break;
            }
          }
        }
        
        // If no configured session found, get the most recent session with same test case
        if (!referenceSessionId) {
          const recentSessionQuery = `
            SELECT id, response_count, test_case_prompt
            FROM partimeas_sessions
            WHERE test_case_prompt = $1
            AND reference_session_id IS NULL
            AND response_count > 0
            ORDER BY created_at DESC
            LIMIT 1
          `;
          
          const recentSession = await sql.query(recentSessionQuery, [testCase.input]);
          
          if (recentSession && recentSession.length > 0) {
            referenceSessionId = recentSession[0].id;
            console.log(`✅ Found recent reference session: ${referenceSessionId}`);
          }
        }
        
        // Fetch cached responses if we have a reference session
        if (referenceSessionId) {
          const cachedResponsesQuery = `
            SELECT provider, model, system_prompt, response_content, display_order
            FROM partimeas_responses
            WHERE session_id = $1
            ORDER BY display_order
          `;
          
          const cachedResponsesResult = await sql.query(cachedResponsesQuery, [referenceSessionId]);
          
          if (cachedResponsesResult && cachedResponsesResult.length > 0) {
            cachedResponses = cachedResponsesResult.map((row: any) => ({
              modelId: `${row.provider}/${row.model}`,
              output: row.response_content,
              systemPrompt: row.system_prompt,
              provider: row.provider,
              model: row.model,
              displayOrder: row.display_order,
              timestamp: new Date().toISOString(),
              cached: true
            }));
            
            console.log(`📦 Loaded ${cachedResponses.length} cached responses from session ${referenceSessionId}`);
          }
        } else {
          console.log("⚠️ No reference session found, will generate new responses");
        }
      } catch (error) {
        console.error("Error fetching cached session:", error);
        // Continue with normal flow if cache lookup fails
      }
    }

    // Select assistants (same logic as original)
    const allOutputAssistantsWithModels = await getOutputGenerationAssistants();
    const desiredOutputs = Math.min(
      numOutputsToRun,
      allOutputAssistantsWithModels.length
    );

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
            const randomIndex = Math.floor(
              Math.random() * availableModels.length
            );
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
        ...validAssistants
          .filter((a) => a.requiredToShow)
          .sort(() => Math.random() - 0.5),
        ...validAssistants
          .filter((a) => !a.requiredToShow)
          .sort(() => Math.random() - 0.5),
      ];

      selectedAssistants = randomizedAssistants.slice(0, desiredOutputs);
    } else {
      const requiredAssistants = allOutputAssistantsWithModels.filter(
        (a) => a.requiredToShow
      );
      const optionalAssistants = allOutputAssistantsWithModels.filter(
        (a) => !a.requiredToShow
      );

      const requiredCount = Math.min(desiredOutputs, requiredAssistants.length);
      const optionalCount = Math.min(
        desiredOutputs - requiredCount,
        optionalAssistants.length
      );

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
    }

    selectedAssistants = shuffleArray(selectedAssistants);

    console.log(
      `🔧 Selected ${selectedAssistants.length} assistants for streaming`
    );

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

          // Use cached responses if available
          if (cachedResponses.length > 0 && useCacheSession) {
            console.log("📦 Using cached responses, streaming them to client...");
            
            // Stream cached responses
            for (const cachedResponse of cachedResponses) {
              // Send model chunks (simulate streaming for cached data)
              const chunks = cachedResponse.output.match(/.{1,100}/g) || [cachedResponse.output];
              
              for (let i = 0; i < chunks.length; i++) {
                sendMessage({
                  type: "modelChunk",
                  modelId: cachedResponse.modelId,
                  chunk: chunks[i],
                  isLastChunk: i === chunks.length - 1,
                  timestamp: new Date().toISOString(),
                });
                
                // Add small delay to simulate streaming
                await new Promise(resolve => setTimeout(resolve, 10));
              }
              
              // Send complete model output
              sendMessage({
                type: "modelOutput",
                modelId: cachedResponse.modelId,
                output: cachedResponse.output,
                timestamp: cachedResponse.timestamp,
              });
              
              outputs.push(cachedResponse);
            }
            
            // Set selectedAssistants for session storage
            selectedAssistants = cachedResponses.map(cr => ({
              assistantId: 0,
              name: cr.model,
              provider: cr.provider,
              model: cr.model.split('/').pop() || cr.model,
              systemPrompt: cr.systemPrompt,
              requiredToShow: false,
              linkedModels: [],
              updatedAt: new Date().toISOString()
            }));
          } else {
            // Original generation logic
            // Create promises for all model generations to run in parallel
            const generationPromises = selectedAssistants.map(
            async (assistant, i) => {
              try {
                console.log(
                  `🔄 Starting parallel streaming generation ${i + 1}/${
                    selectedAssistants.length
                  }: ${assistant.name}`
                );

                // Track accumulated chunks for this model
                let accumulatedOutput = "";

                const result = await generateModelOutputStreaming(
                  assistant.provider,
                  assistant.model,
                  testCase,
                  testCase.useCase,
                  assistant.systemPrompt,
                  // Chunk sender callback
                  (chunk: string, modelId: string, isLastChunk: boolean) => {
                    accumulatedOutput += chunk + (isLastChunk ? "" : " ");

                    // Send chunk message
                    sendMessage({
                      type: "modelChunk",
                      modelId: modelId,
                      chunk: chunk,
                      isLastChunk: isLastChunk,
                      timestamp: new Date().toISOString(),
                    });
                  }
                );

                // Send the complete output message after all chunks
                sendMessage({
                  type: "modelOutput",
                  modelId: result.modelId,
                  output: result.output,
                  timestamp: result.timestamp,
                });

                console.log(`✅ Streamed result for: ${assistant.name}`);
                return { success: true, result, assistant };
              } catch (error) {
                const errorMessage =
                  error instanceof Error ? error.message : "Unknown error";
                console.error(
                  `❌ Assistant ${assistant.name} failed: ${errorMessage}`
                );

                // Stream the error
                sendMessage({
                  type: "error",
                  modelId: `${assistant.provider}/${assistant.model}`,
                  error: errorMessage,
                  timestamp: new Date().toISOString(),
                });

                return { success: false, error: errorMessage, assistant };
              }
            }
            );

            // Wait for all generations to complete
            const results = await Promise.allSettled(generationPromises);

            // Process results
            results.forEach((result) => {
              if (result.status === "fulfilled" && result.value.success) {
                outputs.push(result.value.result);
              } else if (result.status === "fulfilled" && !result.value.success) {
                errors.push({
                  assistantId: result.value.assistant.assistantId,
                  error: result.value.error,
                });
              } else if (result.status === "rejected") {
                console.error("Promise rejected:", result.reason);
              }
            });
          } // End of else block for cached responses

          // Store session data in database BEFORE sending completion
          let sessionId: string | null = null;
          try {
            console.log("📊 Uploading session data to database...");

            const sessionQuery = `
              INSERT INTO partimeas_sessions 
              (response_count, test_case_scenario_category, test_case_prompt, random_algorithm_used, group_id,
               linked_ideal_response, linked_ideal_test_case, linked_criterion_sheet_name, reference_session_id)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
              RETURNING id
            `;

            const sessionResult = await sql.query(sessionQuery, [
              outputs.length,
              testCase.scenarioCategory || testCase.context || "General",
              testCase.input,
              assistantModelAlgorithm,
              groupId || null,
              idealResponse?.id || null,
              idealResponse?.idealTestCase ||
                idealResponse?.testCaseInput ||
                null,
              criteriaSheetName || null,
              referenceSessionId || null,
            ]);

            sessionId = sessionResult[0]?.id;

            if (!sessionId) {
              console.error(
                `❌ Failed to get session ID from database. Result:`,
                sessionResult
              );
              console.error(`❌ Session creation FAILED - No ID returned`);
              console.error(`   Query: ${sessionQuery}`);
              console.error(`   Parameters:`, [
                outputs.length,
                testCase.scenarioCategory || testCase.context || "General",
                testCase.input,
                assistantModelAlgorithm,
                groupId || null,
              ]);
              throw new Error(
                "Failed to create session - no ID returned from database"
              );
            }

            console.log(
              `✅ Session created SUCCESSFULLY with ID: ${sessionId}`
            );
            console.log(`   📝 Session details:`);
            console.log(`      - ID: ${sessionId}`);
            console.log(`      - Response count: ${outputs.length}`);
            console.log(
              `      - Test case category: ${
                testCase.scenarioCategory || testCase.context || "General"
              }`
            );
            console.log(`      - Group ID: ${groupId || "null"}`);
            console.log(`      - Algorithm: ${assistantModelAlgorithm}`);

            if (sessionId && outputs.length > 0) {
              for (let i = 0; i < outputs.length; i++) {
                const output = outputs[i];
                const [provider, model] = output.modelId.split("/");
                const correctProvider = output.correctProvider || provider;

                await sql.query(
                  `
                  INSERT INTO partimeas_responses 
                  (session_id, display_order, provider, model, system_prompt, response_content)
                  VALUES ($1, $2, $3, $4, $5, $6)
                `,
                  [
                    sessionId,
                    i + 1,
                    correctProvider,
                    model,
                    selectedAssistants[i]?.systemPrompt || "",
                    output.output,
                  ]
                );
              }

              console.log(
                `✅ ${outputs.length} responses stored for session ${sessionId}`
              );
            }
          } catch (dbError) {
            console.error(
              "❌ Failed to upload session data to database:",
              dbError
            );
            console.error("❌ Session creation FAILED with error");
            console.error("Database error details:", {
              message:
                dbError instanceof Error ? dbError.message : "Unknown error",
              stack: dbError instanceof Error ? dbError.stack : undefined,
            });
            // Set sessionId to null if database operation failed
            sessionId = null;
          }

          // Log final session ID status
          if (!sessionId) {
            console.error(
              "⚠️ WARNING: Sending completion WITHOUT session ID - evaluation upload will fail!"
            );
            console.error(
              "   Database session creation failed or returned null"
            );
          } else {
            console.log(
              `✅ Streaming completion will include session ID: ${sessionId}`
            );
          }

          // Send completion message with sessionId
          sendMessage({
            type: "complete",
            sessionId: sessionId || undefined,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error("❌ Streaming error:", error);
          sendMessage({
            type: "error",
            error:
              error instanceof Error
                ? error.message
                : "Unknown streaming error",
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
        Connection: "keep-alive",
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
