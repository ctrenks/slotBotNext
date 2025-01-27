import { NextRequest, NextResponse } from 'next/server';
import { InnerTextLinksEngine } from './InnerTextLinksEngine';

export async function POST(request: NextRequest) {
  try {
    const { text, currentUrl } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const engine = new InnerTextLinksEngine(text, currentUrl || "");
    const processedText = await engine.process();

    return NextResponse.json({ 
      text: processedText 
    });

  } catch (error) {
    console.error('Error processing interlinks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 