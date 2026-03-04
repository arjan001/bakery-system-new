import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key);
}

interface GeminiSettings {
  apiKey: string;
  model: string;
  enabled: boolean;
  maxTokens: number;
  temperature: number;
}

async function getGeminiSettings(): Promise<GeminiSettings | null> {
  const defaults: GeminiSettings = {
    apiKey: '',
    model: 'gemini-2.0-flash',
    enabled: true,
    maxTokens: 2048,
    temperature: 0.7,
  };

  // Check environment variable first
  if (process.env.GEMINI_API_KEY) {
    return { ...defaults, apiKey: process.env.GEMINI_API_KEY };
  }

  // Fall back to database
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  try {
    const { data } = await supabase
      .from('business_settings')
      .select('value')
      .eq('key', 'geminiAi')
      .single();

    if (data?.value) {
      const settings = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
      return {
        apiKey: settings.apiKey || '',
        model: settings.model || defaults.model,
        enabled: settings.enabled !== false,
        maxTokens: settings.maxTokens || defaults.maxTokens,
        temperature: settings.temperature ?? defaults.temperature,
      };
    }
  } catch {
    // ignore
  }

  return null;
}

// POST: Proxy requests to Gemini API (keeps API key server-side)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, maxOutputTokens, temperature, action } = body as {
      prompt: string;
      maxOutputTokens?: number;
      temperature?: number;
      action?: string;
    };

    // Handle test connection
    if (action === 'test') {
      const settings = await getGeminiSettings();
      if (!settings || !settings.apiKey) {
        return NextResponse.json({
          success: false,
          message: 'Gemini API key not configured. Set GEMINI_API_KEY environment variable or configure it in Settings > Gemini AI.',
        }, { status: 503 });
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:generateContent?key=${settings.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Say "Connection successful" in one sentence.' }] }],
            generationConfig: { maxOutputTokens: 50 },
          }),
        }
      );

      if (res.ok) {
        return NextResponse.json({ success: true, message: 'Gemini AI connection successful! API key is valid.' });
      } else {
        const err = await res.json();
        return NextResponse.json({
          success: false,
          message: err?.error?.message || `API error: ${res.status}`,
        }, { status: 502 });
      }
    }

    // Regular content generation
    if (!prompt) {
      return NextResponse.json({ success: false, message: 'Prompt is required' }, { status: 400 });
    }

    const settings = await getGeminiSettings();
    if (!settings || !settings.apiKey) {
      return NextResponse.json({
        success: false,
        message: 'Gemini API key not configured. Set GEMINI_API_KEY environment variable or configure it in Settings > Gemini AI.',
      }, { status: 503 });
    }

    if (!settings.enabled) {
      return NextResponse.json({
        success: false,
        message: 'Gemini AI is disabled. Enable it in Settings > Gemini AI.',
      }, { status: 403 });
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:generateContent?key=${settings.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: maxOutputTokens || settings.maxTokens,
            temperature: temperature ?? settings.temperature,
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({
        success: false,
        message: err?.error?.message || `Gemini API error: ${res.status}`,
      }, { status: 502 });
    }

    const result = await res.json();
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return NextResponse.json({ success: true, text });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
