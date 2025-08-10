import { NextRequest, NextResponse } from 'next/server';
import { USE_CASE_PROMPTS } from '@/app/api/shared/constants';
import { systemPromptUtils } from '../../../../utils/database';

// Get current prompt configurations
export async function GET() {
  try {
    // First try to load prompts from database
    let promptConfigs = [];
    
    try {
      const dbPromptsResult = await systemPromptUtils.getAll(false); // Get all prompts, including inactive
      const dbPrompts = dbPromptsResult.data || [];
      
      if (dbPrompts.length > 0) {
        // Convert database prompts to admin format
        promptConfigs = dbPrompts.map(prompt => ({
          id: prompt.id,
          name: prompt.name,
          content: prompt.prompt,
          type: prompt.category === 'evaluation' ? 'evaluation' as const : 'system' as const,
          isDefault: prompt.metadata?.isDefault || false
        }));
      } else {
        // Fallback to constants if no prompts in database
        const useCaseEntries = Object.entries(USE_CASE_PROMPTS);
        
        promptConfigs = [
          // System prompts - dynamically generate from USE_CASE_PROMPTS
          ...useCaseEntries.map(([useCase, content], index) => ({
            id: `system-${useCase}`,
            name: `${useCase.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
            content: content as string,
            type: 'system' as const,
            isDefault: index === 0 // First prompt becomes default
          })),
          
          // Evaluation prompt (default)
          {
            id: 'evaluation-default',
            name: 'Default Evaluation Prompt',
            content: `You are an expert evaluator of AI responses in child development scenarios. Please evaluate the LLM response for the given use case based on provided rubric criteria.

Please provide scores in JSON format with reasoning for each criterion.`,
            type: 'evaluation' as const,
            isDefault: true
          }
        ];
      }
    } catch (dbError) {
      console.error('Error loading prompts from database, falling back to constants:', dbError);
      
      // Fallback to constants if database fails
      const useCaseEntries = Object.entries(USE_CASE_PROMPTS);
      
      promptConfigs = [
        // System prompts - dynamically generate from USE_CASE_PROMPTS
        ...useCaseEntries.map(([useCase, content], index) => ({
          id: `system-${useCase}`,
          name: `${useCase.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
          content: content as string,
          type: 'system' as const,
          isDefault: index === 0 // First prompt becomes default
        })),
        
        // Evaluation prompt (default)
        {
          id: 'evaluation-default',
          name: 'Default Evaluation Prompt',
          content: `You are an expert evaluator of AI responses in child development scenarios. Please evaluate the LLM response for the given use case based on provided rubric criteria.

Please provide scores in JSON format with reasoning for each criterion.`,
          type: 'evaluation' as const,
          isDefault: true
        }
      ];
    }

    return NextResponse.json({
      success: true,
      prompts: promptConfigs
    });
  } catch (error) {
    console.error('Error loading prompt configurations:', error);
    return NextResponse.json(
      { error: 'Failed to load prompt configurations' },
      { status: 500 }
    );
  }
} 