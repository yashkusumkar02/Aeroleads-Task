import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey || typeof apiKey !== 'string') {
      return NextResponse.json(
        { error: 'API key is required' },
        { status: 400 }
      );
    }

    // Test the API key with a simple request
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Say "API key verified" if you receive this message.' }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid API key. Please check your key and try again.' 
        },
        { status: 400 }
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid response from API. Please try again.' 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'API key connected successfully!' 
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to verify API key' 
      },
      { status: 500 }
    );
  }
}

