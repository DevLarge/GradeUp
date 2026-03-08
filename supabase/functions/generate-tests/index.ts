/// <reference lib="deno.window" />
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
    const { content, subject } = await req.json();

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
        max_tokens: 8000,
        messages: [{
          role: 'user',
          content: `Basert på dette innholdet, lag egnet eksamensoppgaver/tester for faget ${subject}.

${content}

Lag 3-5 fullstendige testoppgaver som:
- Tester dypere forståelse enn flervalgsspørsmål
- Inkluderer variete av oppgavetyper (essay, kort svar, beregning, analyse)
- Er realistiske og lignende ekte eksamensoppgaver
- Har poengvekt for hver oppgave

Returner som JSON:
[
  {
    "id": "test1",
    "title": "Oppgavetittel",
    "description": "Kort beskrivelse",
    "questions": [
      {
        "question": "Spørsmål",
        "type": "essay|short_answer|calculation|analysis",
        "points": 10,
        "instructions": "Spesifikke instruksjoner"
      }
    ],
    "totalPoints": 10
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
    const tests = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return new Response(JSON.stringify({ tests }), {
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
