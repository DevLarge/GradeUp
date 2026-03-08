import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    
    if (!anthropicApiKey) throw new Error('ANTHROPIC_API_KEY is not configured');

    const anthropicMessages = (messages || []).map((message: { role?: string; content?: string }) => {
      const role = message.role === 'assistant' ? 'assistant' : 'user';
      return { role, content: message.content || '' };
    });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: "POST",
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1800,
        system: 'Du er en hjelpsom AI-studieassistent på norsk. Du hjelper elever med å forstå fagstoff, gi studietips, forklare konsepter og svare på spørsmål om skolefag. Du er vennlig, tålmodig og gir klare forklaringer. Du snakker alltid på norsk.',
        messages: anthropicMessages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits overskredet, vennligst prøv igjen senere." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error('Anthropic API error:', response.status, t);
      return new Response(JSON.stringify({ error: 'AI API error' }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || '';

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        const openAiLikeChunk = {
          choices: [{ delta: { content } }],
        };

        controller.enqueue(encoder.encode(`data: ${JSON.stringify(openAiLikeChunk)}\n\n`));
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Ukjent feil" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
