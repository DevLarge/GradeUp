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

    // Get user's learning patterns and activities
    const { data: patterns } = await supabase
      .from('learning_patterns')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: activities } = await supabase
      .from('learning_activities')
      .select('*')
      .eq('user_id', userId)
      .eq('subject', subject)
      .order('created_at', { ascending: false })
      .limit(10);

    // Analyze weak areas
    const weakTopics = patterns?.subject_weaknesses?.[subject] || [];
    const recentScores = activities?.map(a => a.score) || [];
    const avgScore = recentScores.length > 0 
      ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length 
      : 50;

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

    const aiData = await resontent[0].tex
    const content = aiData.choices[0].message.content;
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }
    
    const practiceTest = JSON.parse(jsonMatch[0]);

    // Save to database
    const { data: savedTest, error: saveError } = await supabase
      .from('practice_tests')
      .insert({
        user_id: userId,
        subject,
        title: practiceTest.title,
        topics,
        questions: practiceTest.questions,
        time_limit_minutes: practiceTest.timeLimit,
        total_questions: practiceTest.questions.length,
        difficulty_level: difficulty,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving practice test:', saveError);
      throw saveError;
    }

    return new Response(JSON.stringify(savedTest), {
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