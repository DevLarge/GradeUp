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
    const { content, subject, count = 20 } = await req.json();

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
          content: `Basert på dette SPESIFIKKE innholdet for faget ${subject}, analyser innholdet nøye og identifiser 3-5 hovedtemaer fra det faktiske innholdet.

${content}

For hvert hovedtema fra innholdet:
- Lag en SPESIFIKK tittel basert på innholdet (ikke generiske titler)
- Skriv en kort beskrivelse (1-2 setninger) som viser hva dette temaet handler om
- Generer 10-15 SPESIFIKKE flervalgsspørsmål basert på faktisk informasjon fra innholdet
- Hvert spørsmål skal teste kunnskap om konkrete fakta, konsepter eller sammenhenger fra teksten
- Hvert spørsmål skal ha 4 svaralternativer hvor kun ett er riktig
- Indiker hvilket alternativ som er riktig (0-3)

KRITISK VIKTIG:
- Spørsmålene MÅ være basert på KONKRET innhold fra teksten
- IKKE lag generiske spørsmål som "Hva er viktig for..."
- LAG spørsmål som "Hva skjedde i 1789?" eller "Hvilken filosof mente at...?" eller "Hva var konsekvensen av...?"
- Bruk navn, datoer, hendelser og konsepter fra det faktiske innholdet

Format som JSON (kun JSON, ingen annen tekst):
[
  {
    "title": "Spesifikk tema tittel fra innholdet",
    "description": "Beskrivelse av dette spesifikke temaet",
    "questions": [
      {
        "question": "Konkret spørsmål basert på innholdet",
        "options": ["Riktig svar fra innholdet", "Feil alternativ", "Feil alternativ", "Feil alternativ"],
        "correct": 0
      }
    ]
  }
]

Skriv alt på norsk. Svar KUN med JSON, ingen annen tekst.`
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
    const quizzes = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

    return new Response(JSON.stringify({ quizzes }), {
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
