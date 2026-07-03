export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

// Invariant: every OpenRouter call uses the models fallback array —
// never a single model string (see context/architecture.md).
const OPENROUTER_MODELS = ['deepseek/deepseek-v4-flash', 'minimax/minimax-m2.5'];

export async function generateCompletion(
  messages: ChatMessage[],
  maxTokens: number,
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENROUTER_API_KEY');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'X-Title': 'Nura',
    },
    body: JSON.stringify({
      models: OPENROUTER_MODELS,
      route: 'fallback',
      max_tokens: maxTokens,
      messages,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter error: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() ?? '';
}
