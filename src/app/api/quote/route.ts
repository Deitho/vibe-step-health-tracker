import { NextResponse } from 'next/server';
import { createDeepSeekClient } from '@/lib/deepseek';

export async function GET() {
  try {
    const client = createDeepSeekClient();
    const quote = await client.generateQuote();
    return NextResponse.json({ quote });
  } catch (error) {
    console.error('Quote API hatası:', error);
    return NextResponse.json({ quote: 'Sağlıklı adımlar, mutlu yarınlar!' });
  }
}
