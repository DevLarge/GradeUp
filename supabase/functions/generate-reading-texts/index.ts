import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, subject, count = 8 } = await req.json();

    if (!content || !subject) {
      throw new Error('Missing required fields: content and subject');
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 6000,
        messages: [{
          role: 'user',
          content: `Basert på dette innholdet for ${subject}, lag ${count} lesetekster som dekker ulike aspekter.

${content}

Lag ${count} unike lesetekster som:
- Dekker ulike deler/aspekter av emnet
- Er 300-500 ord hver
- Er skrevet på et nivå passende for studenter
- Inneholder interessante detaljer og eksempler
- Kan brukes som referansemateriale og for dypere læring

Returner som JSON:
[
  {
    "id": "text1",
    "title": "Tekst tittel",
    "content": "Selve teksten her...",
    "topic": "Emne",
    "difficulty": "beginner|intermediate|advanced"
  }
]

Svar KUN med JSON.`
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const content_text = data.content[0].type === 'text' ? data.content[0].text : '';
    
    // Extract JSON
    const jsonMatch = content_text.match(/\[[\s\S]*\]/);
    const texts = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return new Response(JSON.stringify({ texts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
