import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, activityId, activityType, subject, wrongAnswers } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Analyzing answers for user:', userId, 'activity:', activityId);

    const explanations = [];

    // Generate explanation for each wrong answer
    for (const wrong of wrongAnswers) {
      const systemPrompt = `Du er en pedagogisk ekspert som forklarer feil svar på en klar og hjelpsomme måte.

OPPGAVE: Analyser et feil svar og lag en detaljert forklaring.

VIKTIG:
1. Forklar HVA som var feil med svaret
2. Forklar HVORFOR det var feil
3. Gi en KLAR forklaring av det riktige svaret
4. Gi KONKRETE eksempler på hvordan det kan løses riktig neste gang
5. Bruk ENKELT språk som en elev kan forstå

Returner JSON i dette formatet:
{
  "explanation": "Detaljert forklaring av hva som var feil og hvorfor",
  "correctUnderstanding": "Forklaring av hvordan man skal forstå det riktige svaret",
  "examples": "Konkrete eksempler og tips for neste gang"
}`;

      const userPrompt = `Fag: ${subject}
Spørsmål: ${wrong.question}
Elevens svar: ${wrong.userAnswer}
Riktig svar: ${wrong.correctAnswer}

Lag en pedagogisk forklaring som hjelper eleven å forstå hvor feilen ligger.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': anthropicApiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1200,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });

      if (!response.ok) {
        console.error('AI API error:', response.status);
        continue;
      }

      const aiData = await response.json();
      const content = aiData.content?.[0]?.text || '';
      if (!content) {
        console.error('Empty Anthropic response for wrong answer analysis');
        continue;
      }
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        const fullExplanation = `${parsed.explanation}\n\n**Riktig forståelse:**\n${parsed.correctUnderstanding}\n\n**Eksempler og tips:**\n${parsed.examples}`;

        // Save to database
        const { data: explanation } = await supabase
          .from('explanations')
          .insert({
            user_id: userId,
            activity_type: activityType,
            activity_id: activityId,
            subject,
            question_text: wrong.question,
            user_answer: wrong.userAnswer,
            correct_answer: wrong.correctAnswer,
            explanation: fullExplanation,
            examples: parsed.examples,
          })
          .select()
          .single();

        if (explanation) {
          explanations.push(explanation);
        }
      }
    }

    return new Response(JSON.stringify({ explanations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in analyze-answers:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});