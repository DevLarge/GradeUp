import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QuizAnswer {
  question: string;
  userAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  topic?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, subject, answers, score, totalQuestions } = await req.json();
    
    if (!userId || !answers || !subject) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!anthropicApiKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Prepare answers summary for AI
    const answersText = answers.map((a: QuizAnswer, idx: number) => 
      `Spørsmål ${idx + 1}: ${a.question}
Brukerens svar: ${a.isCorrect ? 'Riktig' : 'Feil'}
${a.topic ? `Tema: ${a.topic}` : ''}`
    ).join('\n\n');

    const percentage = Math.round((score / totalQuestions) * 100);

    // Get user's learning patterns for context
    const { data: patterns } = await supabase
      .from('learning_patterns')
      .select('subject_strengths, subject_weaknesses, learning_style')
      .eq('user_id', userId)
      .single();

    const contextInfo = patterns ? `
Brukerens tidligere mønster:
- Læringsstil: ${patterns.learning_style || 'ukjent'}
- Kjente styrker: ${JSON.stringify(patterns.subject_strengths || {})}
- Kjente svakheter: ${JSON.stringify(patterns.subject_weaknesses || {})}
` : '';

    const aiPrompt = `Du er en pedagogisk AI-assistent som analyserer quiz-resultater.

Fag: ${subject}
Score: ${score}/${totalQuestions} (${percentage}%)

${contextInfo}

Svar:
${answersText}

Analyser brukerens prestasjoner og gi en detaljert tilbakemelding i JSON-format:

{
  "overallPerformance": "Kort oppsummering av hvordan det gikk",
  "strengths": [
    "Konkret styrke 1 med eksempel fra quizzen",
    "Konkret styrke 2 med eksempel fra quizzen"
  ],
  "weaknesses": [
    "Konkret svakhet 1 med eksempel fra quizzen",
    "Konkret svakhet 2 med eksempel fra quizzen"
  ],
  "nextSteps": [
    "Konkret handling 1 for forbedring",
    "Konkret handling 2 for forbedring",
    "Konkret handling 3 for forbedring"
  ],
  "topicsToReview": [
    "Spesifikt tema 1 som bør repeteres",
    "Spesifikt tema 2 som bør repeteres"
  ],
  "motivationalMessage": "En oppmuntrende melding tilpasset resultatet",
  "masteryLevel": "beginner/intermediate/advanced"
}

Svar kun med gyldig JSON, ingen ekstra tekst.`;

    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: 'Du er en pedagogisk ekspert som gir konstruktiv og personlig tilbakemelding på norsk. Svar kun med gyldig JSON.',
        messages: [{ role: 'user', content: aiPrompt }],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'AI analysis failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.content?.[0]?.text || '';
    if (!aiContent) {
      return new Response(JSON.stringify({ error: 'Empty AI analysis response' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Extract JSON from response
    let analysis;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiContent);
    } catch (e) {
      console.error('Failed to parse AI response:', aiContent);
      return new Response(JSON.stringify({ error: 'Failed to parse AI analysis' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update learning patterns with insights
    const { data: existingPatterns } = await supabase
      .from('learning_patterns')
      .select('*')
      .eq('user_id', userId)
      .single();

    const subjectStrengths = existingPatterns?.subject_strengths || {};
    const subjectWeaknesses = existingPatterns?.subject_weaknesses || {};
    
    // Update subject performance
    if (percentage >= 70) {
      subjectStrengths[subject] = percentage;
      delete subjectWeaknesses[subject];
    } else {
      subjectWeaknesses[subject] = percentage;
    }

    await supabase
      .from('learning_patterns')
      .upsert({
        user_id: userId,
        subject_strengths: subjectStrengths,
        subject_weaknesses: subjectWeaknesses,
        updated_at: new Date().toISOString(),
      });

    return new Response(JSON.stringify({
      success: true,
      analysis: {
        ...analysis,
        score,
        totalQuestions,
        percentage
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-quiz-results:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
