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
    const { content, subject, type, count } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'tests') {
      systemPrompt = 'Du er en ekspert på å lage varierte og unike testspørsmål for studenter organisert etter temaer.';
      userPrompt = `Basert på dette innholdet for faget ${subject}, lag ${count} HELT FORSKJELLIGE åpne testspørsmål med svarforslag.

${content}

KRITISK VIKTIG - TEMA-BASERT ORGANISERING:
- Identifiser 3-6 hovedtemaer/undertemaer i innholdet
- MINIMUM 10 spørsmål per tema (ikke færre!)
- Hvert spørsmål må være 5-10 poeng
- Totalt ${count} spørsmål fordelt over temaene
- Hvert spørsmål MÅ være 100% unikt og dekke forskjellige aspekter innen temaet
- IKKE gjenbruk begreper eller formuleringer mellom spørsmål
- Variasjoner: Bruk forskjellige spørsmålstyper (forklar, analyser, sammenlign, diskuter, beskriv, definer, gi eksempel)
- Vanskelighetsgrad: Bland enkle, middels og vanskelige spørsmål innen hvert tema

For hvert spørsmål:
- Lag et HELT unikt åpent spørsmål som krever forståelse
- Gi et kortfattet svarforslag (2-3 setninger)
- Angi poenggivning (5-10 poeng basert på vanskelighetsgrad)
- Tildel til riktig tema

Returner BARE et JSON-array uten ekstra tekst:
[
  {
    "question": "Spørsmål her",
    "answer": "Detaljert svar her",
    "points": 8,
    "theme": "Temanavn"
  }
]`;
    } else if (type === 'flashcards') {
      systemPrompt = 'Du er en ekspert på å lage konkrete flashkort basert på faktisk innhold.';
      userPrompt = `Basert på dette SPESIFIKKE innholdet for faget ${subject}, lag ${count} FORSKJELLIGE og KONKRETE flashkort:

${content}

KRITISK VIKTIG - GRUPPERING:
- Flashkortene MÅ være basert på FAKTISK innhold fra teksten
- FORSIDE skal være korte, spesifikke spørsmål
- BAKSIDE skal gi konkrete svar fra innholdet
- Dekk FORSKJELLIGE emner og konsepter
- Gi hver flashcard en passende kategori basert på tema/kapittel
- VIKTIG: Bruk 6-10 hovedkategorier og fordel kortene jevnt mellom dem (8-12 kort per kategori)
- Kategorier skal være KONKRETE hovedtemaer fra innholdet (ikke "Generelt" eller "Diverse")
- Eksempel kategorier: "Tidslinje og hendelser", "Viktige personer", "Begreper og definisjoner", "Årsak og virkning", etc.

Returner BARE et JSON-array uten ekstra tekst:
[
  {
    "front": "Kort spørsmål",
    "back": "Detaljert svar",
    "category": "Spesifikt tema navn"
  }
]`;
    } else if (type === 'quiz') {
      systemPrompt = 'Du er en ekspert på å lage varierte flervalgsquizer med gode forklaringer.';
      userPrompt = `Basert på dette innholdet for faget ${subject}, lag ${count} HELT FORSKJELLIGE flervalgsspørsmål:

${content}

KRITISK VIKTIG:
- Hvert spørsmål må være UNIKT og dekke forskjellige deler av innholdet
- Lag 4 svaralternativer per spørsmål
- BARE ett svar skal være korrekt
- De andre alternativene skal være plausible men feil
- Gi hver quiz en passende kategori basert på tema/kapittel
- Lag en pedagogisk forklaring som vises etter at eleven har svart

FORKLARING:
- Hvis riktig svar: Forklar HVORFOR dette er riktig
- Hvis feil svar: Forklar hva riktig svar er og HVORFOR
- Hold forklaringen kort (1-2 setninger)
- Bruk konkrete eksempler fra innholdet

Returner BARE et JSON-array uten ekstra tekst:
[
  {
    "question": "Spørsmål her",
    "options": ["Alternativ 1", "Alternativ 2", "Alternativ 3", "Alternativ 4"],
    "correctAnswer": 0,
    "category": "Tema navn",
    "explanation": "Forklaring på hvorfor dette er riktig svar"
  }
]`;
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Kunne ikke finne JSON i AI-respons');
    }

    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-test-content:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
