import { NextRequest, NextResponse } from 'next/server';
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatAnthropic } from "@langchain/anthropic";
import { sql } from '@/app/config/database';
import { traceable } from "langsmith/traceable";

// Types for evaluation request
interface EvaluationRequest {
  testCase: {
    input: string;
    context: string;
    useCase: string;
    useContext: string;
  };
  modelOutputs: Array<{
    modelId: string;
    output: string;
    useCaseType?: string;
  }>;
  criteria?: Array<{
    id: string;
    name: string;
    description: string;
    category?: string;
    criterion?: string;
    subcriteria?: string;
  }>;
}

// Types for evaluation response
interface EvaluationResult {
  modelId: string;
  overallScore: number;
  criteriaScores: {
    [criteriaId: string]: {
      score: number;
      reasoning: string;
    };
  };
  feedback: string;
  timestamp: string;
}

// Get active evaluation assistant with provider, model, and system prompt
const getActiveEvaluationAssistant = async (): Promise<{
  provider: string;
  model: string;
  systemPrompt: string;
  assistantId: number;
  name: string;
} | null> => {
  const queryStartTime = Date.now();
  try {
    console.log(`   🔍 [EVALUATION] Querying database for active evaluation assistant...`);
    
    const rows = await sql`
      SELECT 
        a.id AS assistant_id,
        a.name,
        m.provider,
        m.model_id AS model,
        sp.prompt AS system_prompt
      FROM partimeas_assistants a
      JOIN partimeas_assistant_models am ON am.assistant_id = a.id
      JOIN partimeas_models m ON m.id = am.model_id
      JOIN partimeas_system_prompts sp ON sp.id = a.system_prompt_id
      WHERE a.type = 'evaluation' AND a.required_to_show = true
      ORDER BY a.updated_at DESC
      LIMIT 1
    `;
    
    const queryTime = Date.now() - queryStartTime;
    
    if (rows && rows.length > 0) {
      console.log(`   ✅ [EVALUATION] Database query completed in ${queryTime}ms`);
      console.log(`   📊 [EVALUATION] Found active assistant: ${rows[0].name}`);
      return {
        assistantId: rows[0].assistant_id as number,
        name: rows[0].name as string,
        provider: rows[0].provider as string,
        model: rows[0].model as string,
        systemPrompt: rows[0].system_prompt as string,
      };
    }
    
    console.log(`   ⚠️ [EVALUATION] No active evaluation assistant found after ${queryTime}ms`);
    return null;
  } catch (e) {
    const queryTime = Date.now() - queryStartTime;
    console.error(`   ❌ [EVALUATION] Database query failed after ${queryTime}ms:`, e);
    return null;
  }
};

// Initialize model instances with dynamic imports using DB provider+model
const getModelInstance = async (provider: string, modelName: string) => {
  const modelStartTime = Date.now();
  try {
    console.log(`   🔧 [EVALUATION] Initializing ${provider} model: ${modelName}...`);
    
    switch (provider) {
      case 'openai':
        if (!process.env.OPENAI_API_KEY) {
          throw new Error('OPENAI_API_KEY not configured');
        }
        console.log(`   🔑 [EVALUATION] Using OpenAI API key (length: ${process.env.OPENAI_API_KEY.length})`);
        const openaiModel = new ChatOpenAI({
          modelName: modelName,
          openAIApiKey: process.env.OPENAI_API_KEY,
        }).withConfig({
          runName: `evaluation-openai-${modelName}`,
          tags: ["evaluation"],
          metadata: {
            source: "PartiMeas",
            run_type: "llm",
            ls_provider: "openai",
            ls_model_name: modelName,
          }
        });
        const openaiTime = Date.now() - modelStartTime;
        console.log(`   ✅ [EVALUATION] OpenAI model initialized in ${openaiTime}ms`);
        return openaiModel;
        
      case 'anthropic':
        if (!process.env.ANTHROPIC_API_KEY) {
          throw new Error('ANTHROPIC_API_KEY not configured');
        }
        console.log(`   🔑 [EVALUATION] Using Anthropic API key (length: ${process.env.ANTHROPIC_API_KEY.length})`);
        const anthropicModel = new ChatAnthropic({
          modelName: modelName,
          anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        }).withConfig({
          runName: `evaluation-anthropic-${modelName}`,
          tags: ["evaluation"],
          metadata: {
            source: "PartiMeas",
            run_type: "llm",
            ls_provider: "anthropic",
            ls_model_name: modelName,
          }
        });
        const anthropicTime = Date.now() - modelStartTime;
        console.log(`   ✅ [EVALUATION] Anthropic model initialized in ${anthropicTime}ms`);
        return anthropicModel;
        
      case 'google':
        if (!process.env.GOOGLE_API_KEY) {
          throw new Error('GOOGLE_API_KEY not configured');
        }
        console.log(`   🔑 [EVALUATION] Using Google API key (length: ${process.env.GOOGLE_API_KEY.length})`);
        const googleModel = new ChatGoogleGenerativeAI({
          modelName: modelName,
          apiKey: process.env.GOOGLE_API_KEY,
        }).withConfig({
          runName: `evaluation-google-${modelName}`,
          tags: ["evaluation"],
          metadata: {
            source: "PartiMeas",
            run_type: "llm",
            ls_provider: "google",
            ls_model_name: modelName,
          }
        });
        const googleTime = Date.now() - modelStartTime;
        console.log(`   ✅ [EVALUATION] Google model initialized in ${googleTime}ms`);
        return googleModel;
        
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (importError) {
    const modelTime = Date.now() - modelStartTime;
    console.error(`   ❌ [EVALUATION] Model initialization failed after ${modelTime}ms:`, importError);
    throw new Error(`Failed to load model provider ${provider}. Please ensure LangChain dependencies are installed.`);
  }
};

// Load evaluation criteria from the criteria API
const loadEvaluationCriteria = async (): Promise<Array<{
  id: string;
  name: string;
  description: string;
  category?: string;
  criterion?: string;
  subcriteria?: string;
}>> => {
  const criteriaStartTime = Date.now();
  try {
    console.log(`   📋 [EVALUATION] Fetching criteria from /api/criteria-data...`);
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/criteria-data`);
    
    if (!response.ok) {
      throw new Error(`Failed to load evaluation criteria: HTTP ${response.status}`);
    }
    
    const data = await response.json();
    const rawCriteria = data.criteria || [];
    
    console.log(`   📊 [EVALUATION] Raw criteria loaded: ${rawCriteria.length} categories`);
    
    // Flatten the hierarchical criteria structure for the evaluation API
    const evaluationCriteria = rawCriteria.flatMap((category: any) => 
      category.criteria?.flatMap((criterion: any) => 
        criterion.subcriteria?.map((subcriteria: any) => ({
          id: `${category.name}_${criterion.name}_${subcriteria.name}`.replace(/\s+/g, '_').toLowerCase(),
          name: `${criterion.name}: ${subcriteria.name}`,
          description: subcriteria.description || subcriteria.name,
          category: category.name,
          criterion: criterion.name,
          subcriteria: subcriteria.name
        })) || []
      ) || []
    );
    
    const criteriaLoadTime = Date.now() - criteriaStartTime;
    console.log(`   ✅ [EVALUATION] Criteria flattened in ${criteriaLoadTime}ms`);
    console.log(`   📋 [EVALUATION] Final criteria: ${evaluationCriteria.length} flattened items from ${rawCriteria.length} categories`);
    
    // Log sample criteria for debugging
    if (evaluationCriteria.length > 0) {
      console.log(`   📝 [EVALUATION] Sample criteria:`);
      evaluationCriteria.slice(0, 3).forEach((criteria: any, index: number) => {
        console.log(`      ${index + 1}. ${criteria.name} (${criteria.id})`);
      });
    }
    
    return evaluationCriteria;
  } catch (error) {
    const criteriaLoadTime = Date.now() - criteriaStartTime;
    console.error(`   ❌ [EVALUATION] Criteria loading failed after ${criteriaLoadTime}ms:`, error);
    
    // Return default criteria if loading fails
    const defaultCriteria = [
      {
        id: 'relevance',
        name: 'Relevance',
        description: 'How well the response addresses the specific question or scenario presented'
      },
      {
        id: 'accuracy',
        name: 'Accuracy',
        description: 'How factually correct and appropriate the information provided is'
      },
      {
        id: 'completeness',
        name: 'Completeness',
        description: 'How thoroughly the response covers all aspects of the question or scenario'
      }
    ];
    
    console.log(`   ⚠️ [EVALUATION] Using ${defaultCriteria.length} default criteria as fallback`);
    return defaultCriteria;
  }
};

// Evaluate a single model output using the evaluation assistant
const evaluateModelOutput = async (
  output: any,
  testCase: any,
  criteria: any[],
  evaluationModel: any,
  systemPrompt: string,
  provider: string,
  model: string
): Promise<EvaluationResult> => {
  const evalStartTime = Date.now();
  try {
    console.log(`   🔍 [EVALUATION] Starting evaluation for ${output.modelId}`);
    
    const evaluationPrompt = `
    You are an expert evaluator of AI responses in child development scenarios. Please evaluate the LLM response for the given use case based on provided rubric criteria.

    Please provide scores in JSON format with reasoning for each criterion.

    Evaluation Criteria:
    ${criteria.map(c => `- ${c.name}: ${c.description}`).join('\n')}

    Please provide your evaluation in the following JSON format:
    {
      "modelId": "${output.modelId}",
      "overallScore": <number between 0-2>,
      "criteriaScores": {
        ${criteria.map(c => `"${c.id}": {"score": <number between 0-2>, "reasoning": "<explanation>"}`).join(',\n    ')}
      },
      "feedback": "<overall feedback>",
      "timestamp": "${new Date().toISOString()}"
    }`;

    console.log(`   📝 [EVALUATION] Creating evaluation prompt...`);
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", evaluationPrompt],
      ["human", `
        Test Case Context: ${testCase.useContext}
        Test Case Input: ${testCase.input}
        Use Case: ${output.useCaseType || testCase.useCase}
        Model Output to Evaluate:
        ${output.output}`],
    ]);

    const formattedPrompt = await prompt.format({});
    console.log(`   📤 [EVALUATION] Sending prompt to ${evaluationModel.constructor.name}...`);
    
    // Wrap the evaluation call with traceable for proper tracking
    const tracedEvaluation = traceable(async (prompt: any) => {
      const response = await evaluationModel.invoke(prompt);
      return response;
    });
    
    const modelResponseStart = Date.now();
    const response = await tracedEvaluation(formattedPrompt);
    const modelResponseTime = Date.now() - modelResponseStart;
    
    console.log(`   📥 [EVALUATION] Model response received in ${modelResponseTime}ms`);
    console.log(`   📄 [EVALUATION] Response length: ${(response.content as string).length} characters`);
    
    try {
      const evaluation = JSON.parse(response.content as string);
      console.log(`   ✅ [EVALUATION] JSON parsing successful`);
      
      // Validate the evaluation structure
      if (!evaluation.modelId || typeof evaluation.overallScore !== 'number' || !evaluation.criteriaScores) {
        throw new Error('Invalid evaluation structure');
      }
      
      console.log(`   🎯 [EVALUATION] Overall score: ${evaluation.overallScore}`);
      console.log(`   📊 [EVALUATION] Criteria count: ${Object.keys(evaluation.criteriaScores).length}`);
      
      // Ensure scores are within valid range (0-2)
      const validatedCriteriaScores: { [key: string]: { score: number; reasoning: string } } = {};
      for (const [criteriaId, scoreData] of Object.entries(evaluation.criteriaScores)) {
        const data = scoreData as any;
        if (typeof data.score === 'number' && typeof data.reasoning === 'string') {
          const originalScore = data.score;
          const clampedScore = Math.max(0, Math.min(2, data.score)); // Clamp between 0-2
          validatedCriteriaScores[criteriaId] = {
            score: clampedScore,
            reasoning: data.reasoning
          };
          
          if (originalScore !== clampedScore) {
            console.log(`   ⚠️ [EVALUATION] Score clamped for ${criteriaId}: ${originalScore} → ${clampedScore}`);
          }
        }
      }
      
      const result: EvaluationResult = {
        modelId: evaluation.modelId,
        overallScore: Math.max(0, Math.min(2, evaluation.overallScore || 0)),
        criteriaScores: validatedCriteriaScores,
        feedback: evaluation.feedback || 'No feedback provided',
        timestamp: evaluation.timestamp || new Date().toISOString()
      };
      
      const totalEvalTime = Date.now() - evalStartTime;
      console.log(`   ✅ [EVALUATION] Evaluation completed successfully in ${totalEvalTime}ms`);
      return result;
      
    } catch (parseError) {
      console.error(`   ❌ [EVALUATION] JSON parsing failed:`, parseError);
      console.log(`   📄 [EVALUATION] Raw response: ${(response.content as string).substring(0, 200)}...`);
      
      // Create a fallback evaluation
      const fallbackResult: EvaluationResult = {
        modelId: output.modelId,
        overallScore: 0,
        criteriaScores: criteria.reduce((acc, c) => {
          acc[c.id] = { score: 0, reasoning: "Failed to parse evaluation response" };
          return acc;
        }, {} as any),
        feedback: "Evaluation parsing failed",
        timestamp: new Date().toISOString()
      };
      
      const totalEvalTime = Date.now() - evalStartTime;
      console.log(`   ⚠️ [EVALUATION] Using fallback evaluation after ${totalEvalTime}ms`);
      return fallbackResult;
    }
    
  } catch (error) {
    const totalEvalTime = Date.now() - evalStartTime;
    console.error(`   ❌ [EVALUATION] Evaluation failed after ${totalEvalTime}ms:`, error);
    throw error;
  }
};

// Main API route handler
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const { testCase, modelOutputs, criteria: customCriteria }: EvaluationRequest = await request.json();
    
    console.log(`🚀 [EVALUATION] Starting evaluation request at ${new Date().toISOString()}`);
    console.log(`📊 [EVALUATION] Test case: ${testCase.input?.substring(0, 100)}...`);
    console.log(`🔢 [EVALUATION] Model outputs to evaluate: ${modelOutputs?.length || 0}`);
    
    // Validate required fields
    if (!testCase || !modelOutputs || !Array.isArray(modelOutputs) || modelOutputs.length === 0) {
      console.error(`❌ [EVALUATION] Validation failed: Missing required fields`);
      return NextResponse.json(
        { error: 'Missing required fields: testCase and modelOutputs array' },
        { status: 400 }
      );
    }
    
    // Get active evaluation assistant
    console.log(`🔍 [EVALUATION] Looking for active evaluation assistant...`);
    const activeAssistant = await getActiveEvaluationAssistant();
    if (!activeAssistant) {
      console.error(`❌ [EVALUATION] No active evaluation assistant found`);
      return NextResponse.json(
        { error: 'No active evaluation assistant found. Please activate an evaluation assistant in the admin panel.' },
        { status: 400 }
      );
    }
    
    console.log(`✅ [EVALUATION] Using assistant: ${activeAssistant.name}`);
    console.log(`🤖 [EVALUATION] Model: ${activeAssistant.provider}/${activeAssistant.model}`);
    console.log(`📝 [EVALUATION] System prompt length: ${activeAssistant.systemPrompt.length} characters`);
    
    // Load evaluation criteria (use custom criteria if provided, otherwise load from API)
    let evaluationCriteria = customCriteria;
    if (!evaluationCriteria || evaluationCriteria.length === 0) {
      console.log(`📋 [EVALUATION] Loading evaluation criteria from API...`);
      evaluationCriteria = await loadEvaluationCriteria();
    } else {
      console.log(`📋 [EVALUATION] Using custom criteria: ${evaluationCriteria.length} items`);
    }
    
    if (!evaluationCriteria || evaluationCriteria.length === 0) {
      console.error(`❌ [EVALUATION] No evaluation criteria available`);
      return NextResponse.json(
        { error: 'No evaluation criteria available' },
        { status: 400 }
      );
    }
    
    console.log(`📋 [EVALUATION] Final criteria count: ${evaluationCriteria.length}`);
    
    // Get model instance for evaluation
    console.log(`🔧 [EVALUATION] Initializing evaluation model...`);
    const modelInitStart = Date.now();
    const evaluationModel = await getModelInstance(activeAssistant.provider, activeAssistant.model);
    const modelInitTime = Date.now() - modelInitStart;
    console.log(`✅ [EVALUATION] Model initialized in ${modelInitTime}ms`);
    
    // Evaluate all outputs
    console.log(`🎯 [EVALUATION] Starting evaluation of ${modelOutputs.length} outputs...`);
    const evaluations: EvaluationResult[] = [];
    const evaluationStartTime = Date.now();
    
    for (let i = 0; i < modelOutputs.length; i++) {
      const output = modelOutputs[i];
      const outputStartTime = Date.now();
      
      console.log(`\n📊 [EVALUATION] Output ${i + 1}/${modelOutputs.length}: ${output.modelId}`);
      console.log(`   📝 Content preview: ${output.output.substring(0, 100)}...`);
      
      try {
        const evaluation = await evaluateModelOutput(
          output,
          testCase,
          evaluationCriteria,
          evaluationModel,
          activeAssistant.systemPrompt,
          activeAssistant.provider,
          activeAssistant.model
        );
        
        const outputTime = Date.now() - outputStartTime;
        console.log(`   ✅ Evaluation completed in ${outputTime}ms`);
        console.log(`   🎯 Overall score: ${evaluation.overallScore}/2`);
        console.log(`   📊 Criteria scores: ${Object.keys(evaluation.criteriaScores).length} criteria`);
        
        evaluations.push(evaluation);
        
      } catch (error) {
        const outputTime = Date.now() - outputStartTime;
        console.error(`   ❌ Evaluation failed after ${outputTime}ms:`, error);
        
        // Continue with other evaluations
        evaluations.push({
          modelId: output.modelId,
          overallScore: 0,
          criteriaScores: {},
          feedback: `Evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    const totalEvaluationTime = Date.now() - evaluationStartTime;
    console.log(`\n🎉 [EVALUATION] All evaluations completed in ${totalEvaluationTime}ms`);
    console.log(`📊 [EVALUATION] Success rate: ${evaluations.filter(e => e.overallScore > 0).length}/${evaluations.length}`);
    
    // Calculate average scores for summary
    const successfulEvaluations = evaluations.filter(e => e.overallScore > 0);
    if (successfulEvaluations.length > 0) {
      const avgOverallScore = successfulEvaluations.reduce((sum, e) => sum + e.overallScore, 0) / successfulEvaluations.length;
      console.log(`📈 [EVALUATION] Average overall score: ${avgOverallScore.toFixed(2)}/2`);
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`⏱️ [EVALUATION] Total request time: ${totalTime}ms`);
    
    return NextResponse.json({
      success: true,
      evaluations,
      evaluationAssistant: {
        id: activeAssistant.assistantId,
        name: activeAssistant.name,
        provider: activeAssistant.provider,
        model: activeAssistant.model
      },
      criteria: evaluationCriteria,
      timestamp: new Date().toISOString(),
      message: 'Evaluation completed successfully',
      performance: {
        totalTime,
        modelInitTime,
        evaluationTime: totalEvaluationTime,
        outputsEvaluated: evaluations.length,
        successRate: successfulEvaluations.length / evaluations.length
      }
    });
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ [EVALUATION] Error after ${totalTime}ms:`, error);
    return NextResponse.json(
      { 
        error: 'Failed to perform evaluation',
        details: error instanceof Error ? error.message : 'Unknown error',
        performance: { totalTime }
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check if evaluation is available
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    console.log(`🔍 [EVALUATION] Checking evaluation availability...`);
    
    const activeAssistant = await getActiveEvaluationAssistant();
    
    if (!activeAssistant) {
      const totalTime = Date.now() - startTime;
      console.log(`❌ [EVALUATION] No active evaluation assistant found after ${totalTime}ms`);
      return NextResponse.json({
        success: false,
        available: false,
        message: 'No active evaluation assistant found'
      });
    }
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ [EVALUATION] Evaluation available after ${totalTime}ms`);
    console.log(`   🤖 [EVALUATION] Assistant: ${activeAssistant.name}`);
    console.log(`   🔧 [EVALUATION] Provider: ${activeAssistant.provider}`);
    console.log(`   📝 [EVALUATION] Model: ${activeAssistant.model}`);
    
    return NextResponse.json({
      success: true,
      available: true,
      assistant: {
        id: activeAssistant.assistantId,
        name: activeAssistant.name,
        provider: activeAssistant.provider,
        model: activeAssistant.model
      },
      message: 'Evaluation assistant is available'
    });
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ [EVALUATION] Error checking availability after ${totalTime}ms:`, error);
    return NextResponse.json({
      success: false,
      available: false,
      message: 'Failed to check evaluation availability'
    }, { status: 500 });
  }
} 