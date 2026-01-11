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
    const { 
      userId, 
      testId,
      testSubject,
      testTitle,
      testDate,
      howItWent, 
      feltPrepared, 
      stressLevel, 
      whatHelped, 
      whatCouldBeBetter,
      wouldChange
    } = await req.json();
    
    if (!userId || !testId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Save reflection first
    const { error: reflectionError } = await supabase
      .from('test_reflections')
      .insert({
        user_id: userId,
        test_id: testId,
        test_subject: testSubject,
        test_title: testTitle,
        test_date: testDate,
        how_it_went: howItWent,
        felt_prepared: feltPrepared,
        stress_level: stressLevel,
        what_helped: whatHelped,
        what_could_be_better: whatCouldBeBetter,
        would_change: wouldChange
      });

    if (reflectionError) {
      console.error('Error saving reflection:', reflectionError);
    }

    // Get all previous reflections for context
    const { data: allReflections } = await supabase
      .from('test_reflections')
      .select('*')
      .eq('user_id', userId)
      .order('test_date', { ascending: false })
      .limit(10);

    // Get current learning patterns
    const { data: patterns } = await supabase
      .from('learning_patterns')
      .select('*')
      .eq('user_id', userId)
      .single();

    const reflectionSummary = `
Siste refleksjon:
- Hvordan det gikk: ${howItWent}
- Følte seg forberedt: ${feltPrepared ? 'Ja' : 'Nei'}
- Stressnivå (1-5): ${stressLevel}
- Hva som hjalp: ${whatHelped || 'Ikke oppgitt'}
- Hva som kunne vært bedre: ${whatCouldBeBetter || 'Ikke oppgitt'}
- Ville endret: ${wouldChange || 'Ikke oppgitt'}

Tidligere refleksjoner (${allReflections?.length || 0} totalt):
${allReflections?.slice(0, 3).map(r => 
  `- ${r.test_subject}: Følte seg ${r.felt_prepared ? 'forberedt' : 'uforberedt'}, stress ${r.stress_level}/5`
).join('\n') || 'Ingen tidligere refleksjoner'}
`;

    const aiPrompt = `Du er en pedagogisk AI som analyserer elevens refleksjoner etter prøver.

${reflectionSummary}

Nåværende læringsprofil:
- Læringsstil: ${patterns?.learning_style || 'ukjent'}
- Konsistens: ${patterns?.consistency_score || 0}%

Analyser refleksjonene og returner JSON med anbefalinger:

{
  "preparationInsights": {
    "needsMoreTime": boolean (om eleven trenger mer forberedelsetid),
    "needsEarlierStart": boolean (om forberedelsene bør starte tidligere),
    "optimalStartDays": number (anbefalt antall dager før prøve å starte),
    "preferredStudyApproach": "gradual/intensive/mixed"
  },
  "stressManagement": {
    "stressPattern": "low/medium/high",
    "needsStressSupport": boolean,
    "recommendations": ["konkret anbefaling 1", "anbefaling 2"]
  },
  "learningAdjustments": {
    "needsEasierExplanations": boolean,
    "needsMorePractice": boolean,
    "needsMoreExamples": boolean,
    "effectiveMethods": ["metode som funket"],
    "ineffectiveMethods": ["metode som ikke funket"]
  },
  "motivationalMessage": "Personlig oppmuntrende melding basert på refleksjonen",
  "nextSteps": [
    "Konkret handling for neste prøve",
    "Konkret handling 2"
  ]
}

Svar kun med gyldig JSON.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Du er en ekspert på læringspsykologi og personlig tilpasset undervisning. Svar kun med gyldig JSON.' },
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.7,
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
    const aiContent = aiData.choices[0].message.content;
    
    // Extract JSON from response
    let insights;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      insights = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiContent);
    } catch (e) {
      console.error('Failed to parse AI response:', aiContent);
      return new Response(JSON.stringify({ error: 'Failed to parse AI analysis' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update learning patterns with insights
    const metadata = patterns?.metadata || {};
    metadata.preparationInsights = insights.preparationInsights;
    metadata.stressManagement = insights.stressManagement;
    metadata.learningAdjustments = insights.learningAdjustments;
    metadata.lastReflectionAnalysis = new Date().toISOString();

    await supabase
      .from('learning_patterns')
      .upsert({
        user_id: userId,
        metadata: metadata,
        updated_at: new Date().toISOString(),
      });

    return new Response(JSON.stringify({
      success: true,
      insights
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-test-reflection:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
