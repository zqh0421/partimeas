import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'Missing OPENAI_API_KEY on server' },
      { status: 500 }
    );
  }

  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { success: false, error: `OpenAI models fetch failed: ${res.status} ${res.statusText} ${text}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const models: Array<{ id: string; owned_by?: string }> = data?.data || [];

    // Map to a simple UI-friendly shape; keep provider as 'OpenAI'.
    const simplified = models
      .map((m) => ({ id: m.id as string, name: m.id as string, provider: 'OpenAI' }))
      // Optional: prioritize more commonly used chat models first
      .sort((a, b) => a.id.localeCompare(b.id));

    return NextResponse.json({ success: true, models: simplified });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: `Failed to load models: ${err?.message || String(err)}` },
      { status: 500 }
    );
  }
}

