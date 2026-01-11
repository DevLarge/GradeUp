import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, testId, subject, topics } = await req.json();
    
    if (!userId || !subject) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user's learning profile
    const { data: patterns } = await supabase
      .from('learning_patterns')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get recent activities to understand current level
    const { data: recentActivities } = await supabase
      .from('learning_activities')
      .select('*')
      .eq('user_id', userId)
      .eq('subject', subject)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get test reflections for insights
    const { data: reflections } = await supabase
      .from('test_reflections')
      .select('*')
      .eq('user_id', userId)
      .eq('test_subject', subject)
      .order('test_date', { ascending: false })
      .limit(3);

    const reflectionInsights = reflections && reflections.length > 0 ? `
Tidligere prøveerfaringer:
${reflections.map(r => `
- Følte seg ${r.felt_prepared ? 'forberedt' : 'uforberedt'}, stress ${r.stress_level}/5
- Hva som hjalp: ${r.what_helped || 'Ikke oppgitt'}
- Ville endret: ${r.would_change || 'Ikke oppgitt'}
`).join('\n')}
` : '';

    const userContext = patterns ? `
Brukerens læringsprofil:
- Læringsstil: ${patterns.learning_style || 'ukjent'}
- Foretrukne metoder: ${JSON.stringify(patterns.preferred_learning_methods || {})}
- Styrker i ${subject}: ${patterns.subject_strengths?.[subject] || 'ukjent'}
- Svakheter i ${subject}: ${patterns.subject_weaknesses?.[subject] || 'ukjent'}
- Siste aktiviteter: ${recentActivities?.length || 0} økter
${reflectionInsights}
${patterns.metadata?.preparationInsights ? `
- Trenger å starte ${patterns.metadata.preparationInsights.optimalStartDays} dager før prøve
- Foretrukket tilnærming: ${patterns.metadata.preparationInsights.preferredStudyApproach}
` : ''}
` : 'Ny bruker - tilpass for nybegynnere';

    const topicsText = topics && topics.length > 0 ? topics.join(', ') : 'generelle emner';

    const aiPrompt = `Du er en pedagogisk AI som designer personlige læringsøkter.

Fag: ${subject}
Tema: ${topicsText}

${userContext}

Lag en strukturert læringsøkt tilpasset brukerens nivå og læringsstil. 

Økten skal ha 3 faser:
1. FORKLARING - Introduksjon til konseptene
2. ØVING - Praktiske oppgaver med gradvis vanskelighetsgrad
3. TEST - Sjekk forståelsen

Returner JSON i dette formatet:

{
  "learningGoals": [
    "Konkret læringsmål 1 som starter med 'Etter denne økten skal du kunne...'",
    "Konkret læringsmål 2",
    "Konkret læringsmål 3"
  ],
  "estimatedDuration": "20-30 minutter",
  "difficulty": "beginner/intermediate/advanced",
  "phases": [
    {
      "phase": "forklaring",
      "title": "Forståelse av konseptene",
      "duration": "5-10 min",
      "content": [
        {
          "type": "text",
          "title": "Overskrift",
          "content": "Detaljert forklaring tilpasset brukerens nivå"
        },
        {
          "type": "example",
          "title": "Eksempel",
          "content": "Konkret eksempel med utregning/forklaring"
        },
        {
          "type": "key_points",
          "points": ["Viktig punkt 1", "Viktig punkt 2"]
        }
      ]
    },
    {
      "phase": "øving",
      "title": "Praktisk øving",
      "duration": "10-15 min",
      "content": [
        {
          "type": "practice",
          "difficulty": "easy",
          "question": "Enkel øvingsoppgave",
          "hint": "Hint hvis de sitter fast",
          "answer": "Svar med forklaring"
        },
        {
          "type": "practice",
          "difficulty": "medium",
          "question": "Middels vanskelig oppgave",
          "hint": "Hint",
          "answer": "Svar med forklaring"
        },
        {
          "type": "practice",
          "difficulty": "hard",
          "question": "Utfordrende oppgave",
          "hint": "Hint",
          "answer": "Svar med forklaring"
        }
      ]
    },
    {
      "phase": "test",
      "title": "Test deg selv",
      "duration": "5 min",
      "content": [
        {
          "type": "quiz",
          "question": "Testspørsmål 1",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": 0,
          "explanation": "Hvorfor dette er riktig"
        },
        {
          "type": "quiz",
          "question": "Testspørsmål 2",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": 1,
          "explanation": "Hvorfor dette er riktig"
        }
      ]
    }
  ],
  "nextSteps": [
    "Anbefaling for hva brukeren bør gjøre videre",
    "Forslag til repetisjon"
  ]
}

Tilpass vanskelighetsgraden og mengden forklaring basert på brukerens profil.
Svar KUN med gyldig JSON.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Du er en ekspert på pedagogikk og personlig tilpasset læring. Svar kun med gyldig JSON.' },
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.8,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'AI generation failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    // Extract JSON from response
    let session;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      session = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiContent);
    } catch (e) {
      console.error('Failed to parse AI response:', aiContent);
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      session
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-study-session:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
