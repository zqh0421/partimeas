import { NextResponse } from "next/server";
import { sql } from "@/app/config/database";

export async function GET() {
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
      return NextResponse.json({
        success: true,
        assistant: {
          assistantId: row.assistant_id as number,
          name: row.name as string,
          provider: row.provider as string,
          model: row.model as string,
          systemPrompt:
            (row.system_prompt as string) ||
            "You are an expert evaluator of AI responses. Provide thorough, fair, and constructive evaluations based on the given criteria.",
        },
      });
    }

    return NextResponse.json({ success: true, assistant: null });
  } catch (e) {
    console.error("[GET /api/evaluation-assistant] DB error:", e);
    return NextResponse.json(
      { success: false, error: "Failed to load evaluation assistant" },
      { status: 500 }
    );
  }
}
