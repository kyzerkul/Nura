import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CONTEXT_MESSAGE_LIMIT = 20;
const MAX_COMPLETION_TOKENS = 1024;

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function buildSystemPrompt(opts: {
  persona: string;
  language: string;
  summary: string | null;
}): string {
  const languageLine =
    opts.language === 'en'
      ? 'Always reply in English.'
      : 'Réponds toujours en français.';

  const styleLines = [
    'Style : chaleureux et naturel, comme une amie proche qui écoute vraiment.',
    'Réponses courtes : 2 à 4 petits paragraphes maximum.',
    'Pose des questions douces pour relancer la conversation quand c\'est pertinent.',
    'Souviens-toi de ce qui a été dit plus tôt dans la conversation.',
  ].join('\n');

  const guardrails = [
    'Limites strictes :',
    '- Tu es une amie et confidente, jamais une partenaire romantique. Aucun contenu romantique, séducteur ou sexuel.',
    '- Si l\'utilisatrice exprime une détresse grave ou des pensées d\'automutilation, réponds avec chaleur et encourage-la doucement à en parler à un professionnel de santé ou à une personne de confiance. Ne pose jamais de diagnostic.',
  ].join('\n');

  const parts = [opts.persona, languageLine, styleLines, guardrails];
  if (opts.summary) {
    parts.push(`Résumé de la conversation jusqu'ici : ${opts.summary}`);
  }
  return parts.join('\n\n');
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse(401, { error: 'Missing authorization' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return jsonResponse(401, { error: 'Unauthorized' });
    }

    const body = await req.json().catch(() => null);
    const conversationId = body?.conversation_id;
    if (typeof conversationId !== 'string' || !UUID_REGEX.test(conversationId)) {
      return jsonResponse(400, { error: 'Valid conversation_id required' });
    }

    // RLS on the user-scoped client guarantees the conversation belongs to the caller.
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id, companion_id')
      .eq('id', conversationId)
      .maybeSingle();

    if (conversationError) {
      return jsonResponse(500, { error: 'Internal server error' });
    }
    if (!conversation) {
      return jsonResponse(404, { error: 'Conversation not found' });
    }

    const [companionResult, profileResult, summaryResult, messagesResult] =
      await Promise.all([
        supabase
          .from('companions')
          .select('name, persona')
          .eq('id', conversation.companion_id)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('language')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('conversation_summaries')
          .select('summary')
          .eq('conversation_id', conversationId)
          .maybeSingle(),
        supabase
          .from('messages')
          .select('role, content')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(CONTEXT_MESSAGE_LIMIT),
      ]);

    if (companionResult.error || !companionResult.data) {
      return jsonResponse(404, { error: 'Companion not found' });
    }
    if (messagesResult.error) {
      return jsonResponse(500, { error: 'Internal server error' });
    }

    const systemPrompt = buildSystemPrompt({
      persona: companionResult.data.persona,
      language: profileResult.data?.language ?? 'fr',
      summary: summaryResult.data?.summary ?? null,
    });

    const history = (messagesResult.data ?? [])
      .reverse()
      .filter((m: { role: string }) => m.role === 'user' || m.role === 'assistant')
      .map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      }));

    const openRouterResponse = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': SUPABASE_URL,
          'X-Title': 'Nura',
        },
        body: JSON.stringify({
          models: [
            'deepseek/deepseek-v4-flash:free',
            'minimax/minimax-m2.5:free',
          ],
          route: 'fallback',
          stream: true,
          max_tokens: MAX_COMPLETION_TOKENS,
          messages: [{ role: 'system', content: systemPrompt }, ...history],
        }),
      },
    );

    if (!openRouterResponse.ok || !openRouterResponse.body) {
      console.error('OpenRouter error:', { status: openRouterResponse.status });
      return jsonResponse(502, { error: 'AI service unavailable' });
    }

    const upstream = openRouterResponse.body;
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const send = (event: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        };

        const reader = upstream.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullReply = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const rawLine of lines) {
              const line = rawLine.trim();
              if (!line.startsWith('data: ')) continue;

              const payload = line.slice(6);
              if (payload === '[DONE]') continue;

              try {
                const parsed = JSON.parse(payload);
                const token: unknown = parsed.choices?.[0]?.delta?.content;
                if (typeof token === 'string' && token.length > 0) {
                  fullReply += token;
                  send({ token });
                }
              } catch {
                // Ignore malformed upstream chunks (e.g. keep-alive comments)
              }
            }
          }

          if (fullReply.length === 0) {
            send({ error: 'empty_reply' });
            return;
          }

          const { error: insertError } = await supabase
            .from('messages')
            .insert({
              conversation_id: conversationId,
              role: 'assistant',
              content: fullReply,
            });

          if (insertError) {
            console.error('Assistant message save failed:', {
              code: insertError.code,
            });
            send({ error: 'save_failed' });
            return;
          }

          send({ done: true });
        } catch (streamErr) {
          console.error('Stream relay error:', {
            name: streamErr instanceof Error ? streamErr.name : 'unknown',
          });
          send({ error: 'stream_failed' });
        } finally {
          reader.releaseLock();
          controller.close();
        }
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    console.error('Edge function error:', {
      name: err instanceof Error ? err.name : 'unknown',
    });
    return jsonResponse(500, { error: 'Internal server error' });
  }
});
