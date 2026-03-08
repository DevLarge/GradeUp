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
    const { userId, subject, topics } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's question attempts to analyze weak areas
    const { data: attempts } = await supabase
      .from('question_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('subject', subject)
      .order('created_at', { ascending: false })
      .limit(20);

    // Analyze weak areas from attempts
    const weakTopics: string[] = [];
    const incorrectAttempts = attempts?.filter(a => !a.is_correct) || [];
    const topicCounts: { [key: string]: number } = {};
    
    incorrectAttempts.forEach(attempt => {
      if (attempt.topic) {
        topicCounts[attempt.topic] = (topicCounts[attempt.topic] || 0) + 1;
      }
    });

    // Get topics with most incorrect answers
    Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .forEach(([topic]) => weakTopics.push(topic));

    const correctCount = attempts?.filter(a => a.is_correct).length || 0;
    const totalAttempts = attempts?.length || 0;
    const avgScore = totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 50;
    const difficulty = avgScore > 80 ? 'hard' : avgScore > 60 ? 'medium' : 'easy';

    const systemPrompt = `Du er en ekspertlærer som lager realistiske øveprøver for elever.
Lag en fullstendig øveprøve i ${subject} med følgende krav:

1. FOKUSOMRÅDER: ${topics.length > 0 ? topics.join(', ') : 'generelle emner'}
2. SVAKE OMRÅDER: ${weakTopics.length > 0 ? weakTopics.join(', ') : 'ingen spesifikke'}
3. VANSKELIGHETSGRAD: ${difficulty}
4. ANTALL SPØRSMÅL: 10-15 spørsmål

SPØRSMÅLSTYPER (variert fordeling):
- Flervalg (multiple choice med 4 alternativer)
- Kortsvar (ett avsnitt)
- Forklaring (2-3 avsnitt)
- Begrepsforklaring
- Analyse/drøfting (for vanskelige prøver)

VIKTIG:
- Fokuser ekstra på de svake områdene
- Spørsmålene skal ligne på ekte eksamensoppgaver
- Vanskelighetsgraden skal matche elevens nivå
- Inkluder varierte oppgavetyper

Returner JSON i dette formatet:
{
  "title": "Øveprøve i [fag] - [tema]",
  "timeLimit": 45,
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice | short_answer | explanation | concept | analysis",
      "question": "Spørsmålstekst",
      "points": 2-10,
      "topic": "emne",
      "options": ["A", "B", "C", "D"], // kun for multiple_choice
      "correctAnswer": "svar",
      "explanation": "hvorfor dette er riktig"
    }
  ]
}`;

    console.log('Generating practice test for user:', userId, 'subject:', subject);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [
          { role: 'user', content: systemPrompt + '\n\nLag en øveprøve basert på disse kravene.' }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.content[0].text;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }
    
    const practiceTest = JSON.parse(jsonMatch[0]);

    // Return the generated test
    return new Response(JSON.stringify({
      success: true,
      test: practiceTest,
      metadata: {
        subject,
        topics: topics || [],
        difficulty: difficulty,
        generatedAt: new Date().toISOString(),
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-practice-test:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});