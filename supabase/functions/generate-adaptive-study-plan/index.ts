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
    const { userId, testId, subject, testDate, topics } = await req.json();
    
    if (!userId || !testId || !subject || !testDate) {
      throw new Error('Missing required fields');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // Fetch user preferences
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Fetch learning patterns
    const { data: patterns } = await supabase
      .from('learning_patterns')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // Fetch recent activities
    const { data: activities } = await supabase
      .from('learning_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    // Calculate days until test
    const daysUntil = Math.ceil((new Date(testDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    const userContext = `
USER PREFERENCES (what they SAID):
- Learning methods: ${prefs?.preferred_learning_methods?.join(', ') || 'ikke spesifisert'}
- Learning style: ${prefs?.learning_style || 'ikke spesifisert'}
- Study time: ${prefs?.average_study_time_minutes || 30} minutes
- Optimal time: ${prefs?.optimal_study_time || 'ikke spesifisert'}
- Target grade: ${prefs?.target_grade || 'ikke spesifisert'}
- Preparation methods: ${prefs?.preparation_habits?.methods?.join(', ') || 'ikke spesifisert'}

ACTUAL BEHAVIOR (what they DO - VEKT DETTE MER):
${patterns ? `
- Learning style detected: ${patterns.learning_style || 'ingen data'}
- Strengths: ${JSON.stringify(patterns.subject_strengths) || 'ingen data'}
- Weaknesses: ${JSON.stringify(patterns.subject_weaknesses) || 'ingen data'}
- Preferred methods detected: ${JSON.stringify(patterns.preferred_learning_methods) || 'ingen data'}
` : 'Ingen læringsmønstre ennå'}

RECENT ACTIVITIES (siste ${activities?.length || 0} aktiviteter):
${activities?.map(a => `- ${a.activity_type} i ${a.subject}: ${a.score || 0}/${a.total_questions || 0} (${a.difficulty_level || 'ukjent'})`).join('\n') || 'ingen aktiviteter'}

DAYS UNTIL TEST: ${daysUntil}
`;

    const systemPrompt = `Du er en pedagogisk AI som lager personlige studieplaner for norske elever.

KRITISK VIKTIG:
- Hvis brukerens FAKTISKE ATFERD (fra aktiviteter og mønstre) ikke matcher deres PREFERANSER → vekt atferden MER
- Jo mer data vi har, desto mer spesifikk skal planen være
- Tilpass antall aktiviteter til antall dager (${daysUntil} dager)

PLANEN MÅ HA 3 FASER:

1. LÆRE-FASE (første 40% av tiden):
   - Forklaringer, lesing, videoer, grunnleggende forståelse
   - Basert på deres læringsstil: ${prefs?.learning_style || 'blandet'}
   - Minimum 3 aktiviteter før neste fase

2. REPETERE-FASE (neste 40% av tiden):
   - Quiz, flashcards, øvingsoppgaver
   - Basert på hva de faktisk gjør bra med: ${patterns?.preferred_learning_methods?.join(', ') || 'varierende metoder'}
   - Minimum 5 aktiviteter med >70% snitt før øveprøve

3. ØVEPRØVE-FASE (siste 20%):
   - Realistisk prøve i prøvelignende setting
   - Kun tilgjengelig når fase 1 og 2 er fullført

Returner JSON:
{
  "phases": [
    {
      "id": "learn",
      "name": "Lære",
      "description": "...",
      "daysAllocated": X,
      "activities": [
        {
          "id": "activity-1",
          "type": "reading|video|explanation",
          "title": "...",
          "description": "...",
          "estimatedMinutes": 30,
          "topic": "..."
        }
      ],
      "unlockRequirements": { "minActivities": 3, "minAverageScore": 0 }
    },
    {
      "id": "practice",
      "name": "Repetere",
      "description": "...",
      "daysAllocated": Y,
      "activities": [...],
      "unlockRequirements": { "minActivities": 5, "minAverageScore": 70 }
    },
    {
      "id": "test",
      "name": "Øveprøve",
      "description": "...",
      "daysAllocated": Z,
      "activities": [{
        "id": "practice-test",
        "type": "practice_test",
        "title": "Fullstendig øveprøve",
        "description": "Realistisk prøve i ${subject}",
        "estimatedMinutes": 90,
        "topic": "Alle tema"
      }],
      "unlockRequirements": { "previousPhaseComplete": true }
    }
  ],
  "totalDays": ${daysUntil},
  "adaptability": "medium|high (basert på hvor mye data vi har)"
}`;

    const userPrompt = `Lag en komplett studieplan for:
- Fag: ${subject}
- Tema: ${topics?.join(', ') || 'Generelt'}
- Prøvedato: ${testDate}
- Dager igjen: ${daysUntil}

Brukerens kontekst:
${userContext}

Husk: Tilpass til deres faktiske atferd mer enn deres preferanser!`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: 'json_object' }
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    
    // Clean the response content - remove markdown code blocks if present
    let content = aiData.choices[0].message.content;
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const planData = JSON.parse(content);

    // Save the study plan
    const { data: savedPlan, error: saveError } = await supabase
      .from('study_plans')
      .insert({
        user_id: userId,
        test_id: testId,
        subject: subject,
        test_date: testDate,
        phases: planData.phases,
        current_phase: 'learn',
        completed_phases: [],
        adapted_count: 0,
        metadata: {
          topics: topics,
          totalDays: planData.totalDays,
          adaptability: planData.adaptability
        }
      })
      .select()
      .single();

    if (saveError) throw saveError;

    console.log(`✅ Study plan created for test ${testId}`);

    return new Response(JSON.stringify({ 
      success: true, 
      plan: savedPlan 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating study plan:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});