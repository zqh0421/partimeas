import { NextRequest, NextResponse } from "next/server";
import { getSessionById } from "@/app/utils/sessionManager";

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const session = await getSessionById(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    // Return the session with all its data including the new fields
    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        created_at: session.created_at,
        response_count: session.response_count,
        test_case_scenario_category: session.test_case_scenario_category,
        test_case_prompt: session.test_case_prompt,
        random_algorithm_used: session.random_algorithm_used,
        group_id: session.group_id,
        linked_ideal_response: session.linked_ideal_response,
        linked_ideal_test_case: session.linked_ideal_test_case,
        linked_criterion_sheet_name: session.linked_criterion_sheet_name,
        responses: session.responses
      }
    });
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch session", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}