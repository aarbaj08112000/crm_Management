import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { message, history } = body;

    // Use environment variable for API key
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured.' }, { status: 500 });
    }

    // Format history and current message for Gemini
    // For a simple implementation, we can just send the current text.
    // If you want full conversational history, you'd format it according to Gemini's API.
    // Since the user provided a simple generateContent structure, we will use that.
    
    // Concatenate history for context
    const fullContext = history 
      ? history.map(m => `${m.role === 'user' ? 'User' : 'Bot'}: ${m.content}`).join('\n') + `\nUser: ${message}\nBot:`
      : message;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: fullContext,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error:', data);
      return NextResponse.json({ error: data.error?.message || 'Failed to fetch from Gemini' }, { status: response.status });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
