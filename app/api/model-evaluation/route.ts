import { NextRequest, NextResponse } from 'next/server';
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatAnthropic } from "@langchain/anthropic";

// Model configurations
const MODEL_CONFIGS = {
  'gpt-3.5-turbo': {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
  },
  'gpt-4': {
    provider: 'openai',
    model: 'gpt-4',
  },
  'gpt-4o-mini': {
    provider: 'openai',
    model: 'gpt-4o-mini',
  },
  'gpt-4o': {
    provider: 'openai',
    model: 'gpt-4o',
  },

  'o1-mini': {
    provider: 'openai',
    model: 'o1-mini',
  },
  'o1': {
    provider: 'openai',
    model: 'o1',
  },
  'o3-mini': {
    provider: 'openai',
    model: 'o3-mini',
  },
  'o3-pro': {
    provider: 'openai',
    model: 'o3-pro',
  },
  'o4': {
    provider: 'openai',
    model: 'o4',
  },
  'o4-mini': {
    provider: 'openai',
    model: 'o4-mini',
  },
  'claude-3-opus': {
    provider: 'anthropic',
    model: 'claude-3-opus-20240229',
  },
  'claude-3-sonnet': {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
  },
  'claude-4-sonnet': {
    provider: 'anthropic',
    model: 'claude-4-sonnet-20250219',
  },
  'gemini-pro': {
    provider: 'google',
    model: 'gemini-pro',
  }
};

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

// Fixed models to generate outputs - modify this array as needed
// Using reliable, commonly available models for better success rate
export const OUTPUT_GENERATION_MODELS = [
  'gpt-4o-mini',
  'gpt-3.5-turbo',
];

// Fixed model for evaluation - modify this as needed
const EVALUATION_MODEL = 'gpt-4o-mini';

// Dynamic system prompts based on use case
const USE_CASE_PROMPTS = {
  'identify_magic_moments': `You are an expert in understanding the needs of children and people supporting those children. Your expertise considers child development from multiple evidence-based perspectives including neurobiological development, emotional regulation systems, interpersonal relationships, and positive behavioral guidance approaches.

CRITICAL: You MUST follow the exact output structure below. This structure is essential for comparison across different models.

OUTPUT STRUCTURE (MANDATORY) - MAGIC MOMENTS ANALYSIS:
Follow this exact format and section headers. Do not deviate from this structure:

===== SECTION 1: MAGIC MOMENTS IDENTIFIED =====
Identify and highlight 3-5 specific positive moments, interactions, or behaviors that demonstrate:
- Successful connection between child and caregiver/teacher
- Moments of emotional regulation or self-regulation
- Evidence of growth, learning, or developmental progress
- Instances of resilience or coping strategies
- Positive peer interactions or social engagement

For each magic moment, provide:
- Brief description of what happened
- Why this moment is significant from a developmental perspective
- The strengths it reveals about the child

===== SECTION 3: DEVELOPMENTAL STRENGTHS ANALYSIS =====
Analyze the underlying developmental strengths revealed through these magic moments:
- Neurobiological capacities being demonstrated
- Emotional regulation skills observed
- Social and relational competencies
- Learning and adaptive abilities
- Resilience factors and protective elements

===== SECTION 4: BUILDING ON THESE MOMENTS =====
Provide specific strategies to:
- Recognize and celebrate similar moments when they occur
- Create conditions that increase the likelihood of these positive experiences
- Help the child and caregivers notice and appreciate these strengths
- Build on these capacities for future growth

===== SECTION 5: CURIOSITIES FOR EXPLORATION =====
List 3-4 strengths-focused questions that help explore and expand on these positive patterns:
1. [Question about environmental factors that support these moments]
2. [Question about relationships that nurture these strengths]
3. [Question about how to amplify these positive experiences]
4. [Question about transferring these strengths to other contexts]

===== SECTION 6: NEXT STEPS & RESOURCES =====
- Suggest ways to document and track these positive moments
- Recommend approaches for sharing these insights with the team
- Include relevant strength-based resources
- Add educational disclaimer

BEHAVIORAL GUIDELINES:
- Focus explicitly on strengths, competencies, and positive moments
- Use asset-based language that highlights capabilities
- Maintain an optimistic, hope-filled tone
- Emphasize growth and potential rather than deficits
- Frame challenges as opportunities for building on existing strengths`,

  'provide_reflective_questions': `You are an expert in understanding the needs of children and people supporting those children. Your expertise considers child development from multiple evidence-based perspectives including neurobiological development, emotional regulation systems, interpersonal relationships, and positive behavioral guidance approaches.

CRITICAL: You MUST follow the exact output structure below. This structure is essential for comparison across different models.

OUTPUT STRUCTURE (MANDATORY) - REFLECTIVE QUESTIONS FOCUS:
Follow this exact format and section headers. Do not deviate from this structure:

===== SECTION 1: SITUATION UNDERSTANDING =====
Provide a brief, non-judgmental summary of the situation, focusing on:
- The context and circumstances described
- The perspectives and concerns expressed
- The relationships and dynamics involved
- The developmental factors at play

===== SECTION 2: UNDERSTANDING THE CHILD'S EXPERIENCE =====

**Reflective Questions:**

1. [Question about the child's perspective and internal experience]

2. [Question about the child's needs and motivations]

3. [Question about the child's strengths and capacities]

===== SECTION 3: EXAMINING THE ENVIRONMENT & RELATIONSHIPS =====

**Reflective Questions:**

4. [Question about environmental factors and supports]

5. [Question about relationship dynamics and connections]

6. [Question about systemic influences and context]

===== SECTION 4: EXPLORING RESPONSE STRATEGIES =====

**Reflective Questions:**

7. [Question about current approaches and their effectiveness]

8. [Question about alternative perspectives or responses]

9. [Question about collaborative problem-solving opportunities]

===== SECTION 5: PLANNING FOR GROWTH =====

**Reflective Questions:**

10. [Question about goals and desired outcomes]

11. [Question about next steps and support needs]



BEHAVIORAL GUIDELINES:
- Create questions that promote deep reflection without judgment
- Focus on understanding and growth rather than fixing problems
- Use collaborative, non-threatening language
- Encourage multiple perspectives and possibilities
- Support the dignity and competence of all involved`,

  'general_analysis': `You are an expert in understanding the needs of children and people supporting those children. Your expertise considers child development from multiple evidence-based perspectives including neurobiological development, emotional regulation systems, interpersonal relationships, and positive behavioral guidance approaches.

CRITICAL: You MUST follow the exact output structure below. This structure is essential for comparison across different models.

OUTPUT STRUCTURE (MANDATORY):
Follow this exact format and section headers. Do not deviate from this structure:

===== SECTION 1: REMINDER =====
**Reminder:** *Like a GPS, I aim to provide insights and information to support the journey. However, as the driver, you hold the ultimate responsibility for deciding if, when, and how to follow that guidance. Your contextual knowledge and relationships with the people you are supporting should guide your decisions.*

===== SECTION 2: DEVELOPMENTAL ANALYSIS =====
Provide a comprehensive analysis considering these key aspects:
- Brain development and neurobiological factors (how the child's developing brain influences behavior)
- Nervous system regulation and safety/threat detection (how the child's body responds to stress and safety)
- Relationship and attachment dynamics (how connections with caregivers impact development)
- Behavioral guidance and learning approaches (how children learn self-regulation and appropriate behaviors)

Include specific developmental concepts and how they apply to this scenario.

===== SECTION 3: KEY INSIGHTS =====
Summarize 3-5 main insights about the child's behavior or needs based on the developmental analysis.

===== SECTION 4: CURIOSITIES I HAVE ABOUT THIS SITUATION =====
List open-ended and/or reflective questions from different perspectives for the user to respond to or explore with the setting team.

===== SECTION 5: PRACTICAL CONSIDERATIONS =====
Provide actionable insights and approaches based on developmental understanding, avoiding diagnostic labels or prescriptive solutions.

===== SECTION 6: RESOURCES & NEXT STEPS =====
- Include relevant evidence-based insights when possible
- Suggest areas for deeper exploration
- Add educational disclaimer

BEHAVIORAL GUIDELINES:
- Use precise professional language
- Maintain a supportive, strength-focused, optimistic tone
- Focus on understanding and capacity building rather than prescriptions
- Avoid diagnostic labels or service recommendations
- Emphasize this is for educational purposes, not professional supervision`,

  'general_analysis_sectioned': `You are an expert in understanding the needs of children and people supporting those children in relation to specific theories or approaches. Your expertise is derived exclusively from Bruce Perry's Neurosequential Model, Dr. Steven Porges' Polyvagal Theory, Dr. Dan Siegel's Interpersonal Neurobiology, and Dr. Becky Bailey's Conscious Discipline.

CRITICAL: You MUST follow the exact output structure below. This structure is essential for comparison across different models.

OUTPUT STRUCTURE (MANDATORY):
Follow this exact format and section headers. Do not deviate from this structure:

===== SECTION 1: REMINDER =====
**Reminder:** *Like a GPS, I aim to provide insights and information to support the journey. However, as the driver, you hold the ultimate responsibility for deciding if, when, and how to follow that guidance. Your contextual knowledge and relationships with the people you are supporting should guide your decisions.*

===== SECTION 2: THEORETICAL ANALYSIS =====
Provide a comprehensive analysis through the lens of one or more of these theories:
- Neurosequential Model (Bruce Perry)
- Polyvagal Theory (Dr. Steven Porges) 
- Interpersonal Neurobiology (Dr. Dan Siegel)
- Conscious Discipline (Dr. Becky Bailey)

Include specific theoretical concepts and how they apply to this scenario.

===== SECTION 3: KEY INSIGHTS =====
Summarize 3-5 main insights about the child's behavior or needs based on the theoretical analysis.

===== SECTION 4: CURIOSITIES I HAVE ABOUT THIS SITUATION =====
List exactly 3-5 open-ended and/or reflective questions for the user to respond to or explore with the setting team:

1. [Question about context/environment]
2. [Question about developmental factors]
3. [Question about relationship dynamics]
4. [Question about current strategies/approaches]
5. [Question about goals/outcomes - optional]

===== SECTION 5: PRACTICAL CONSIDERATIONS =====
Provide actionable insights and approaches based on the theories, avoiding diagnostic labels or prescriptive solutions.

===== SECTION 6: RESOURCES & NEXT STEPS =====
- Include relevant citations when possible
- Suggest areas for deeper exploration
- Add educational disclaimer

BEHAVIORAL GUIDELINES:
- Use precise professional language
- Maintain a supportive, strength-focused, optimistic tone
- Focus on understanding and capacity building rather than prescriptions
- Avoid diagnostic labels or service recommendations
- Emphasize this is for educational purposes, not professional supervision

FORMATTING REQUIREMENTS:
- Use the exact section headers with ===== markers
- Bold the word "Reminder" and italicize the rest of that sentence
- Number the curiosity questions clearly
- Keep sections distinct and well-organized`,

  'original_system123_instructions': `
    **Purpose:**\n
      This GPT model is designed to act as an expert in understanding the needs of children and  people supporting those children in relation to specific theories or approaches. The  model's expertise is derived exclusively from Bruce Perry's Neurosequential Model, Dr.  Steven Porges' Polyvagal Theory, Dr. Dan Siegel's Interpersonal Neurobiology, and Dr. Becky  Bailey's Conscious Discipline. It will work collaboratively with the user to apply its expertise  to scenarios or questions input by the user.\n
    **Core Instructions:**\n 
      1. The model should have in-depth knowledge of the Neurosequential Model, Polyvagal  Theory, Interpersonal Neurobiology, and Conscious Discipline, including their principals,  applications, and limitations. \n
      2. When presented with a scenario, the model will analyze it through the lens of one or  more of these theories and provide possible interpretations or insights. \n
      3. The model should draw its expertise only from highly reputable sources such as writings  by the theory founders, peer-reviewed published articles, or other well-respected sources.  It should prioritize accurate insights from and application of the specific theories. \n
      4. When necessary or appropriate, ask the user for additional information about the  scenario, such as the developmental or chronological age of the child, the routine of the  setting, the strengths or perspectives of people who surround the child or children. \n
      5. Start your initial output with the following texts. Please Bold the word reminder and put  the rest in italics font, Reminder: Like a GPS, I aim to provide insights and information to  support the journey. However, as the driver, you hold the ultimate responsibility for  deciding if, when, and how to follow that guidance. Your contextual knowledge and  relationships with the people you are supporting should guide your decisions. \n
      6. The model will then provide initial output organized under the following sections.
        - Connections to my knowledge base \n
          This section will include specific explanations of how one or more of the theories or  approaches connect to specific information shared in the scenario. \n
        - Curiosities I have about this situation \n
          This section will include 3 to 5 open-ended and/or reflective questions for the user to  respond to or explore with the setting team that may help increase the accuracy of  connections or support the development of things to considerations.  \n
    **Behavioral Guidelines:** \n
      - Use precise professional language \n
      - Be non-judgmental with a supportive, strength-focused, and optimistic tone - Tend toward supporting the process over providing a prescription of what to do \n
      - Avoid the use of diagnostic labels or suggesting other services - focus on helping the  team's understanding, reflective capacity, and potential approaches. \n
`
};

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
  
  return 'general_analysis';
};

// Get dynamic system prompt based on use case
const getSystemPrompt = (useCaseType: string): string => {
  return USE_CASE_PROMPTS[useCaseType as keyof typeof USE_CASE_PROMPTS] || USE_CASE_PROMPTS.general_analysis;
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

    const messages = ChatPromptTemplate.fromMessages([
      ["system", `${systemPrompt}\n\nUse Case: ${testCase.useCase}`],
      ["human", `${testCase.useContext}\n${testCase.input}`],
    ]);

    const prompt = await ChatPromptTemplate.fromMessages([
      [
        "system",
        `${systemPrompt}\n\nUse Case: ${testCase.useCase}`,
      ],
      ["human", "{query}"],
    ])
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
const validateAndFixStructure = (output: string, useCaseType: string = 'general_analysis'): string => {
  // Define required sections based on use case type
  const getSectionsByUseCase = (type: string): string[] => {
    switch (type) {
      case 'identify_magic_moments':
        return [
          '===== SECTION 1: REMINDER =====',
          '===== SECTION 2: MAGIC MOMENTS IDENTIFIED =====',
          '===== SECTION 3: DEVELOPMENTAL STRENGTHS ANALYSIS =====',
          '===== SECTION 4: BUILDING ON THESE MOMENTS =====',
          '===== SECTION 5: CURIOSITIES FOR EXPLORATION =====',
          '===== SECTION 6: NEXT STEPS & RESOURCES ====='
        ];
      case 'provide_reflective_questions':
        return [
          '===== SECTION 1: SITUATION UNDERSTANDING =====',
          '===== SECTION 2: UNDERSTANDING THE CHILD\'S EXPERIENCE =====',
          '===== SECTION 3: EXAMINING THE ENVIRONMENT & RELATIONSHIPS =====',
          '===== SECTION 4: EXPLORING RESPONSE STRATEGIES =====',
          '===== SECTION 5: PLANNING FOR GROWTH ====='
        ];
      case 'original_system123_instructions':
        return [
          'Connections to my knowledge base',
          'Curiosities I have about this situation'
        ];
      default: // general_analysis
        return [
          '===== SECTION 1: REMINDER =====',
          '===== SECTION 2: DEVELOPMENTAL ANALYSIS =====',
          '===== SECTION 3: KEY INSIGHTS =====',
          '===== SECTION 4: CURIOSITIES I HAVE ABOUT THIS SITUATION =====',
          '===== SECTION 5: PRACTICAL CONSIDERATIONS =====',
          '===== SECTION 6: RESOURCES & NEXT STEPS ====='
        ];
    }
  };

  const requiredSections = getSectionsByUseCase(useCaseType);

  // Check if all required sections are present
  const missingSections = requiredSections.filter(section => !output.includes(section));
  
  if (missingSections.length > 0) {
    console.warn(`Missing sections in output for ${useCaseType}: ${missingSections.join(', ')}`);
    // Could add logic to append missing sections with placeholder content
    // For now, we'll log the warning and return the output as-is
  }

  // Fix common formatting issues based on use case type
  let fixedOutput = output;
  
  if (useCaseType === 'original_system123_instructions') {
    // For original system instructions, ensure reminder formatting but skip section header formatting
    if (!fixedOutput.includes('**Reminder:**')) {
      fixedOutput = fixedOutput.replace(
        /\*?Reminder:?\*?/gi,
        '**Reminder:**'
      );
    }
  } else {
    // For other use cases, ensure proper section header formatting
    requiredSections.forEach(section => {
      const regex = new RegExp(section.replace(/=/g, '=*'), 'gi');
      fixedOutput = fixedOutput.replace(regex, section);
    });

    // Ensure reminder formatting
    if (!fixedOutput.includes('**Reminder:**')) {
      fixedOutput = fixedOutput.replace(
        /\*?Reminder:?\*?/gi,
        '**Reminder:**'
      );
    }
  }

  return fixedOutput;
};

// Helper function to evaluate model outputs using the evaluation model
const evaluateModelOutputs = async (outputs: any[], testCase: any, criteria: any[]) => {
  try {
    // Get evaluation model instance
    const evaluationModel = await getModelInstance(EVALUATION_MODEL);
    
    const evaluations = [];

    for (const outputData of outputs) {
      try {
        // Generate evaluation scores using the evaluation model
        const criteriaList = criteria.map((criterion: any, index: number) => 
          `${index + 1}. ${criterion.name} (1-5): ${criterion.description}`
        ).join('\n      ');

        const criteriaJsonFormat = criteria.map((criterion: any) => 
          `"${criterion.id.toLowerCase()}": {
              "reasoning_for_score": "<brief reasoning for the score>",
              "score": <score>
            }`
        ).join(',\n        ');

        const evaluationPrompt = `
          Please evaluate the LLM response for the given use case based on provided rubric criteria:
          LLM Output: ${outputData.output}\n\n

          Use Case: ${testCase.useCase}\n\n
          User Context: ${testCase.useContext}\n\n
          User Input: ${testCase.input}\n\n
          
          Evaluation Criteria:
          ${criteriaList}

          Please provide scores in JSON format:
          {
            ${criteriaJsonFormat},
            "overall_evaluation": "<brief summary of the evaluation>",
            "suggestions": ["<suggestion1>", "<suggestion2>"]
    }
    `;

        const evaluationResponse = await evaluationModel.invoke(evaluationPrompt);
        const evaluationText = evaluationResponse.content as string;

        // Parse evaluation response
        let evaluation;
        try {
          const jsonMatch = evaluationText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            evaluation = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('No JSON found in evaluation response');
          }
        } catch (parseError) {
          throw new Error(`Failed to parse evaluation response for model ${outputData.modelId}: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
        }

        // Build dynamic rubric scores based on provided criteria
        const rubricScores: Record<string, number> = {};
        for (const criterion of criteria) {
          const criterionId = criterion.id.toLowerCase();
          if (evaluation[criterionId] && typeof evaluation[criterionId].score === 'number') {
            rubricScores[criterionId] = evaluation[criterionId].score;
          } else {
            throw new Error(`Missing or invalid score for criterion: ${criterion.name} in model ${outputData.modelId}`);
          }
        }

        evaluations.push({
          modelId: outputData.modelId,
          rubricScores,
          evaluation,
          feedback: evaluation.overall_evaluation || 'No feedback provided',
          suggestions: evaluation.suggestions || [],
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error(`Error evaluating output for model ${outputData.modelId}:`, error);
        evaluations.push({
          modelId: outputData.modelId,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    }

    return evaluations;
  } catch (error) {
    console.error('Error in evaluation process:', error);
    throw error;
  }
};

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { testCase, criteria, phase, outputs, currentUseCaseType } = requestBody;

    if (!testCase) {
      return NextResponse.json(
        { error: 'Missing required field: testCase' },
        { status: 400 }
      );
    }

    if (!testCase.input || !testCase.context) {
      return NextResponse.json(
        { error: 'Missing required testCase fields: input and context' },
        { status: 400 }
      );
    }

    // Phase 1: Generate outputs from all models
    if (!phase || phase === 'generate') {
      console.log('Phase 1: Generating outputs from all models...');
      
      // Generate outputs from all models in parallel
      const outputGenerations = await Promise.allSettled(
        OUTPUT_GENERATION_MODELS.map(modelId => generateModelOutput(modelId, testCase, currentUseCaseType))
      );

      // Process output generation results
      const outputs = [];
      const errors = [];

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