import { NextRequest, NextResponse } from 'next/server';
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatAnthropic } from "@langchain/anthropic";
import { MODEL_CONFIGS, OUTPUT_GENERATION_MODELS, USE_CASE_PROMPTS } from '@/app/api/shared/constants';

// Re-export for backward compatibility
export { MODEL_CONFIGS, OUTPUT_GENERATION_MODELS, USE_CASE_PROMPTS };

// Initialize model instances with dynamic imports
const getModelInstance = async (modelId: string) => {
  const config = MODEL_CONFIGS[modelId as keyof typeof MODEL_CONFIGS];
  if (!config) {
    throw new Error(`Unsupported model: ${modelId}`);
  }

  try {
    switch (config.provider) {
      case 'openai':
        if (!process.env.OPENAI_API_KEY) {
          throw new Error('OPENAI_API_KEY not configured');
        }
        return new ChatOpenAI({
          modelName: config.model,
          openAIApiKey: process.env.OPENAI_API_KEY,
        });
      case 'anthropic':
        if (!process.env.ANTHROPIC_API_KEY) {
          throw new Error('ANTHROPIC_API_KEY not configured');
        }
        return new ChatAnthropic({
          modelName: config.model,
          anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        });
      case 'google':
        if (!process.env.GOOGLE_API_KEY) {
          throw new Error('GOOGLE_API_KEY not configured');
        }
        return new ChatGoogleGenerativeAI({
          modelName: config.model,
          apiKey: process.env.GOOGLE_API_KEY,
        });
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  } catch (importError) {
    console.error('Failed to import LangChain modules:', importError);
    throw new Error(`Failed to load model provider ${config.provider}. Please ensure LangChain dependencies are installed.`);
  }
};

// Fixed model for evaluation - modify this as needed
const EVALUATION_MODEL = 'gpt-4o-mini';

// Helper function to determine use case from test case input
const determineUseCase = (testCase: any): string => {
  const input = testCase.input?.toLowerCase() || '';
  const useCase = testCase.useCase?.toLowerCase() || '';
  const description = testCase.description?.toLowerCase() || '';
  
  // Check for original system 123 instructions keywords
  if (input.includes('original system') || input.includes('system123') || input.includes('original_system123') ||
      useCase.includes('original system') || useCase.includes('system123') || useCase.includes('original_system123') ||
      description.includes('original system') || description.includes('system123') || description.includes('original_system123')) {
    return 'original_system123_instructions';
  }
  
  // Check for magic moments keywords
  if (input.includes('magic moment') || input.includes('positive moment') || input.includes('strength') || 
      input.includes('celebrate') || input.includes('highlight positive') ||
      useCase.includes('magic') || description.includes('magic')) {
    return 'identify_magic_moments';
  }
  
  // Check for reflective questions keywords
  if (input.includes('reflective question') || input.includes('question') || input.includes('reflect') ||
      input.includes('explore') || input.includes('discussion') || input.includes('meeting') ||
      useCase.includes('reflective') || useCase.includes('question') ||
      description.includes('reflective') || description.includes('question')) {
    return 'provide_reflective_questions';
  }
  
  return 'provide_reflective_questions';
};

// Get dynamic system prompt based on use case
const getSystemPrompt = (useCaseType: string): string => {
  return USE_CASE_PROMPTS[useCaseType as keyof typeof USE_CASE_PROMPTS] || USE_CASE_PROMPTS.provide_reflective_questions;
};

// Helper function to generate output from a single model
const generateModelOutput = async (modelId: string, testCase: any, useCaseTypeOverride?: string) => {
  try {
    console.log(`🚀 Starting generation for model: ${modelId}`);
    
    // Get model instance
    const model = await getModelInstance(modelId);
    console.log(`✅ Model instance created successfully for: ${modelId}`);

    // Use the provided use case type, or fall back to auto-detection
    const useCaseType = useCaseTypeOverride || determineUseCase(testCase);
    console.log(`🔧 Using use case type: ${useCaseType} (override: ${useCaseTypeOverride || 'none'}) for model: ${modelId}`);
    const systemPrompt = getSystemPrompt(useCaseType);

    const prompt = await ChatPromptTemplate.fromMessages([
      [
        "system",
        `${systemPrompt}\n\nUse Case: ${testCase.useCase}`,
      ],
      ["human", "{query}"],
    ]);
    
    const formattedPrompt = await prompt.format({ query: `${testCase.useContext}\n${testCase.input}` });
    const response = await model.invoke(formattedPrompt);
    let output = response.content as string;

    // Validate and potentially fix structural issues
    output = validateAndFixStructure(output, useCaseType);

    return {
      modelId,
      output,
      timestamp: new Date().toISOString(),
      useCaseType // Include the detected use case type in the response
    };
  } catch (error) {
    console.error(`Error generating output for model ${modelId}:`, error);
    throw error;
  }
};

// Helper function to validate and fix structural issues in output
const validateAndFixStructure = (output: string, useCaseType: string = 'provide_reflective_questions'): string => {
  // Define required sections based on use case type
  const getSectionsByUseCase = (type: string): string[] => {
    switch (type) {
      case 'identify_magic_moments':
        return [
          '===== SECTION 1: MAGIC MOMENTS IDENTIFIED =====',
          '===== SECTION 2: DEVELOPMENTAL STRENGTHS ANALYSIS =====',
          '===== SECTION 3: BUILDING ON THESE MOMENTS =====',
          '===== SECTION 4: CURIOSITIES FOR EXPLORATION =====',
          '===== SECTION 5: NEXT STEPS & RESOURCES ====='
        ];
      case 'provide_reflective_questions':
        return [];
      case 'general_analysis':
      default:
        return [];
    }
  };

  const requiredSections = getSectionsByUseCase(useCaseType);
  let fixedOutput = output;

  // Check if all required sections are present
  const missingSections = requiredSections.filter(section => !output.includes(section));
  
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
const evaluateModelOutputs = async (outputs: any[], testCase: any, criteria: any[]) => {
  try {
    console.log('🔍 Starting evaluation of model outputs...');
    
    // Get evaluation model instance
    const evaluationModel = await getModelInstance(EVALUATION_MODEL);
    console.log(`✅ Evaluation model instance created successfully: ${EVALUATION_MODEL}`);

    const evaluations = [];
    
    for (const output of outputs) {
      console.log(`🔍 Evaluating output from model: ${output.modelId}`);
      
      const evaluationPrompt = `You are an expert evaluator of AI responses in child development scenarios. Please evaluate the LLM response for the given use case based on provided rubric criteria.

Please provide scores in JSON format with reasoning for each criterion.

Test Case Context: ${testCase.useContext}
Test Case Input: ${testCase.input}
Use Case: ${output.useCaseType}

Model Output to Evaluate:
${output.output}

Evaluation Criteria:
${criteria.map(c => `- ${c.name}: ${c.description}`).join('\n')}

Please provide your evaluation in the following JSON format:
{
  "modelId": "${output.modelId}",
  "overallScore": <number>,
  "criteriaScores": {
    ${criteria.map(c => `"${c.id}": {"score": <number>, "reasoning": "<explanation>"}`).join(',\n    ')}
  },
  "feedback": "<overall feedback>",
  "timestamp": "${new Date().toISOString()}"
}`;

      const prompt = ChatPromptTemplate.fromMessages([
        ["system", "You are an expert evaluator. Provide evaluations in the exact JSON format requested."],
        ["human", evaluationPrompt],
      ]);

      const formattedPrompt = await prompt.format({});
      const response = await evaluationModel.invoke(formattedPrompt);
      
      try {
        const evaluation = JSON.parse(response.content as string);
        evaluations.push(evaluation);
        console.log(`✅ Evaluation completed for model: ${output.modelId}`);
      } catch (parseError) {
        console.error(`❌ Failed to parse evaluation for model ${output.modelId}:`, parseError);
        // Create a fallback evaluation
        evaluations.push({
          modelId: output.modelId,
          overallScore: 0,
          criteriaScores: criteria.reduce((acc, c) => {
            acc[c.id] = { score: 0, reasoning: "Failed to parse evaluation response" };
            return acc;
          }, {} as any),
          feedback: "Evaluation parsing failed",
          timestamp: new Date().toISOString()
        });
      }
    }

    console.log(`✅ All evaluations completed. Total: ${evaluations.length}`);
    return evaluations;
    
  } catch (error) {
    console.error('❌ Error during evaluation:', error);
    throw error;
  }
};

// Main API route handler
export async function POST(request: NextRequest) {
  try {
    const { phase, testCase, criteria, outputs } = await request.json();
    
    console.log(`🚀 Model evaluation request received - Phase: ${phase}`);
    console.log('Test case:', testCase);
    
    if (phase === 'generate') {
      console.log('Phase 1: Generating outputs from all models...');
      
      // Generate outputs from all models in parallel
      const outputGenerations = await Promise.allSettled(
        OUTPUT_GENERATION_MODELS.map(modelId => generateModelOutput(modelId, testCase, testCase.useCase))
      );
      
      const outputs: any[] = [];
      const errors: any[] = [];
      
      // Process results
      for (let i = 0; i < outputGenerations.length; i++) {
        const result = outputGenerations[i];
        const modelId = OUTPUT_GENERATION_MODELS[i];
        
        if (result.status === 'fulfilled') {
          console.log(`✅ Model ${modelId} generated output successfully`);
          outputs.push(result.value);
        } else {
          const errorMessage = result.reason instanceof Error ? result.reason.message : 'Unknown error';
          console.error(`❌ Model ${modelId} failed: ${errorMessage}`);
          errors.push({
            modelId,
            error: errorMessage
          });
        }
      }

      return NextResponse.json({
        success: true,
        phase: 'generate',
        outputs,
        errors,
        totalModels: OUTPUT_GENERATION_MODELS.length,
        successfulModels: outputs.length,
        failedModels: errors.length,
        timestamp: new Date().toISOString(),
        message: 'Output generation completed. Ready to proceed to review page.'
      });
    }

    // Phase 2: Evaluate the outputs
    if (phase === 'evaluate') {
      console.log('Phase 2: Evaluating outputs...');
      
      if (!criteria || !Array.isArray(criteria) || criteria.length === 0) {
        return NextResponse.json(
          { error: 'Missing required field: criteria. Please provide evaluation criteria.' },
          { status: 400 }
        );
      }
      
      if (!outputs || !Array.isArray(outputs) || outputs.length === 0) {
        return NextResponse.json(
          { error: 'Missing required field: outputs. Please provide model outputs to evaluate.' },
          { status: 400 }
        );
      }

      // Evaluate all outputs using the evaluation model
      const evaluations = await evaluateModelOutputs(outputs, testCase, criteria);

      return NextResponse.json({
        success: true,
        phase: 'evaluate',
        evaluations,
        evaluationModel: EVALUATION_MODEL,
        timestamp: new Date().toISOString(),
        message: 'Evaluation completed.'
      });
    }

    return NextResponse.json(
      { error: 'Invalid phase. Use "generate" or "evaluate".' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Model evaluation error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to evaluate model';
    let errorDetails = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorDetails.includes('OPENAI_API_KEY not configured')) {
      errorMessage = 'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.';
    } else if (errorDetails.includes('ANTHROPIC_API_KEY not configured')) {
      errorMessage = 'Anthropic API key not configured. Please add ANTHROPIC_API_KEY to your environment variables.';
    } else if (errorDetails.includes('GOOGLE_API_KEY not configured')) {
      errorMessage = 'Google API key not configured. Please add GOOGLE_API_KEY to your environment variables.';
    } else if (errorDetails.includes('Unsupported model')) {
      errorMessage = 'One or more models are not supported or not available in your account.';
    } else if (errorDetails.includes('401') || errorDetails.includes('Unauthorized')) {
      errorMessage = 'Invalid API key. Please check your API key configuration.';
    } else if (errorDetails.includes('404') || errorDetails.includes('Not Found')) {
      errorMessage = 'One or more models not found. They may not be available in your account.';
    } else if (errorDetails.includes('429') || errorDetails.includes('Rate limit')) {
      errorMessage = 'Rate limit exceeded. Please try again later.';
    } else if (errorDetails.includes('500') || errorDetails.includes('Internal Server Error')) {
      errorMessage = 'OpenAI service error. Please try again later.';
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    );
  }
} 