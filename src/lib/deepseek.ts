const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface DeepSeekChatRequest {
  model: string;
  messages: DeepSeekMessage[];
  max_tokens?: number;
  temperature?: number;
}

export interface DeepSeekChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: DeepSeekMessage;
    finish_reason: string;
  }[];
}

export function createDeepSeekClient() {
  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    console.warn('DEEPSEEK_API_KEY bulunamadı. DeepSeek özellikleri çalışmayacak.');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  return {
    async chat(request: DeepSeekChatRequest): Promise<DeepSeekChatResponse> {
      const response = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API hatası (${response.status}): ${errorText}`);
      }

      return response.json();
    },

    async generateQuote(): Promise<string> {
      if (!apiKey) {
        return 'Sağlıklı adımlar, mutlu yarınlar!';
      }

      try {
        const data = await this.chat({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content:
                'Sen bir motivasyon koçusun. Kısa, etkili, spor ve sağlık odaklı Türkçe motivasyon sözleri üretiyorsun. Yanıtın sadece söz olsun, başka hiçbir şey ekleme. Max 15 kelime.',
            },
            {
              role: 'user',
              content: 'Bugün için kısa bir motivasyon sözü üret.',
            },
          ],
          max_tokens: 60,
          temperature: 0.8,
        });

        return data.choices[0]?.message?.content?.trim() || 'Sağlıklı adımlar, mutlu yarınlar!';
      } catch (error) {
        console.error('Quote üretme hatası:', error);
        return 'Sağlıklı adımlar, mutlu yarınlar!';
      }
    },
  };
}
