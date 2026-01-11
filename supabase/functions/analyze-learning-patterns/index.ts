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
    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user's learning activities
    const { data: activities, error: activitiesError } = await supabase
      .from('learning_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch activities' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!activities || activities.length === 0) {
      return new Response(JSON.stringify({ 
        message: 'Not enough data yet',
        patterns: null 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare data summary for AI analysis
    const dataSummary = {
      totalActivities: activities.length,
      activityTypes: activities.reduce((acc: any, a) => {
        acc[a.activity_type] = (acc[a.activity_type] || 0) + 1;
        return acc;
      }, {}),
      subjects: activities.reduce((acc: any, a) => {
        acc[a.subject] = acc[a.subject] || { count: 0, totalScore: 0, activities: [] };
        acc[a.subject].count++;
        if (a.score !== null) {
          acc[a.subject].totalScore += a.score;
          acc[a.subject].activities.push({ score: a.score, total: a.total_questions });
        }
        return acc;
      }, {}),
      recentActivities: activities.slice(0, 20).map(a => ({
        type: a.activity_type,
        subject: a.subject,
        score: a.score,
        timeSpent: a.time_spent_seconds,
        date: a.created_at
      }))
    };

    // Call Lovable AI to analyze patterns
    const aiPrompt = `Du er en AI-læringsassistent som analyserer elevers læringsmønstre. 
    
Analyser følgende data om en elev:

Total antall aktiviteter: ${dataSummary.totalActivities}

Aktivitetsfordeling:
${Object.entries(dataSummary.activityTypes).map(([type, count]) => `- ${type}: ${count}`).join('\n')}

Fagresultater:
${Object.entries(dataSummary.subjects).map(([subject, data]: [string, any]) => {
  const avgScore = data.activities.length > 0 
    ? data.activities.reduce((sum: number, a: any) => sum + (a.score / a.total * 100), 0) / data.activities.length 
    : 0;
  return `- ${subject}: ${data.count} aktiviteter, gjennomsnitt ${avgScore.toFixed(0)}%`;
}).join('\n')}

Siste aktiviteter:
${dataSummary.recentActivities.slice(0, 10).map(a => 
  `${a.type} i ${a.subject}${a.score ? ` (${a.score}%)` : ''}`
).join('\n')}

Analyser og returner JSON med følgende struktur (kun JSON, ingen ekstra tekst):
{
  "preferredLearningMethods": {"quiz": 30, "flashcards": 40, "notes": 20, "test": 10},
  "subjectStrengths": {"Fag": score},
  "subjectWeaknesses": {"Fag": score},
  "learningStyle": "visual/reading/practice/mixed",
  "consistencyScore": 0-100,
  "recommendations": [
    "Spesifikk anbefaling basert på data",
    "Anbefaling 2"
  ],
  "insights": {
    "strongestSubject": "Fagnavn",
    "needsImprovement": ["Fag1", "Fag2"],
    "preferredMethod": "metode",
    "studyPattern": "beskrivelse av mønstre"
  }
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Du er en ekspert på læringsanalyse. Svar kun med gyldig JSON.' },
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

    // Calculate total study time
    const totalStudyTime = activities.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0) / 60;

    // Update or insert learning patterns
    const { error: updateError } = await supabase
      .from('learning_patterns')
      .upsert({
        user_id: userId,
        preferred_learning_methods: analysis.preferredLearningMethods,
        subject_strengths: analysis.subjectStrengths,
        subject_weaknesses: analysis.subjectWeaknesses,
        learning_style: analysis.learningStyle,
        consistency_score: analysis.consistencyScore,
        total_study_time: Math.round(totalStudyTime),
        last_analyzed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (updateError) {
      console.error('Error updating patterns:', updateError);
    }

    return new Response(JSON.stringify({
      success: true,
      patterns: analysis,
      totalStudyTime: Math.round(totalStudyTime),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-learning-patterns:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
