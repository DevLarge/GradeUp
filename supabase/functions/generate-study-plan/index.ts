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
    const { content, subject, testDate, readingTexts } = await req.json();

    if (!content || !subject || !testDate) {
      throw new Error('Missing required fields: content, subject, testDate');
    }

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const daysUntilTest = Math.ceil((new Date(testDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `Lag en detaljert studieplan for ${subject} med ${daysUntilTest} dager til prøve.

Emneinnhold:
${content}

Læringstekster som dekkes:
${readingTexts?.map((t: any) => `- ${t.title}`).join('\n') || 'Ingen tekster'}

Lag en realistisk studieplan som:
- Fordeler læringstoffet over ${daysUntilTest} dager
- Inkluderer konkrete aktiviteter hver dag (lesing, øvelser, repetisjon)
- Fokuserer på de viktigste emnene først
- Inneholder revisjondager før prøven
- Er oppnåelig og ikke overveldende

Returner som JSON:
{
  "title": "Studieplan tittel",
  "subject": "${subject}",
  "startDate": "YYYY-MM-DD",
  "testDate": "${testDate}",
  "phases": [
    {
      "phase": 1,
      "name": "Fase navn",
      "duration": "X dager",
      "activities": ["Aktivitet 1", "Aktivitet 2"],
      "focus": "Fokusområde"
    }
  ],
  "tips": ["Tips for god læring"],
  "estimatedHours": 30
}

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
    const jsonMatch = content_text.match(/\{[\s\S]*\}/);
    const plan = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return new Response(JSON.stringify({ plan }), {
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
