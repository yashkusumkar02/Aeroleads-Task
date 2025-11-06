import { NextRequest, NextResponse } from 'next/server';
import { smartParseInput } from '@/lib/smartParser';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, defaults, apiKey } = body;

    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: 'Input is required' },
        { status: 400 }
      );
    }

    // Use user's API key if provided, otherwise server key
    const keyToUse = apiKey || process.env.GEMINI_API_KEY;

    if (!keyToUse) {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    const result = await smartParseInput(input, keyToUse, defaults);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to parse input',
        // Fallback to simple parsing
        fallback: true
      },
      { status: 500 }
    );
  }
}

