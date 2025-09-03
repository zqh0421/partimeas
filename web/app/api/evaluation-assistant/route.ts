import { NextResponse } from "next/server";
import { sql } from "@/app/config/database";

export async function GET() {
  try {
    // Get all active evaluation assistants with weights
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

    if (rows && rows.length > 0) {
      // Return all active evaluation assistants
      const assistants = rows.map((row: any) => ({
        assistantId: row.assistant_id as number,
        name: row.name as string,
        provider: row.provider as string,
        model: row.model as string,
        weight: row.weight || 1,
        systemPrompt:
          (row.system_prompt as string) ||
          "You are an expert evaluator of AI responses. Provide thorough, fair, and constructive evaluations based on the given criteria.",
      }));

      // For backward compatibility, also include a single assistant field
      return NextResponse.json({
        success: true,
        assistant: assistants[0], // First assistant for backward compatibility
        assistants: assistants, // All assistants for new functionality
      });
    }

    return NextResponse.json({ 
      success: true, 
      assistant: null,
      assistants: []
    });
  } catch (e) {
    console.error("[GET /api/evaluation-assistant] DB error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to load evaluation assistants" },
      { status: 500 }
    );
  }
}
