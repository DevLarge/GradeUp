/// <reference lib="deno.window" />
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
    const { userId, planId, activityResults } = await req.json();
    
    if (!userId || !planId) {
      throw new Error('Missing required fields');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // Get the study plan
    const { data: plan } = await supabase
      .from('study_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (!plan) throw new Error('Study plan not found');

    // Get recent activities for this subject
    const { data: activities } = await supabase
      .from('learning_activities')
      .select('*')
      .eq('user_id', userId)
      .eq('subject', plan.subject)
      .order('created_at', { ascending: false })
      .limit(10);

    // Calculate performance metrics
    const recentScores = activities
      ?.filter(a => a.score !== null && a.total_questions !== null)
      .map(a => (a.score! / a.total_questions!) * 100) || [];

    const avgScore = recentScores.length > 0 
      ? recentScores.reduce((sum, score) => sum + score, 0) / recentScores.length 
      : 0;

    const needsMorePractice = avgScore < 60;
    const isExcelling = avgScore > 85;

    const systemPrompt = `Du er en pedagogisk AI som tilpasser studieplaner basert på elevens prestasjon.

CURRENT PLAN: ${JSON.stringify(plan.phases)}
RECENT PERFORMANCE:
- Average score: ${avgScore.toFixed(1)}%
- Activities completed: ${activities?.length || 0}
- Current phase: ${plan.current_phase}
- Adapted ${plan.adapted_count} times

ADAPTATION RULES:
1. If average < 60%: Add more practice activities in current phase
2. If average > 85% consistently: Reduce redundant activities, skip to next phase faster
3. If specific topic shows weakness: Add targeted activities for that topic
4. Always maintain the 3-phase structure (learn → practice → test)

Return JSON with updated phases:
{
  "phases": [...updated phases...],
  "adaptationReason": "Brief explanation of what was changed and why",
  "recommendedNextAction": "What the student should do next"
}`;

    const userPrompt = `Based on the recent performance, adapt this study plan:
- Current average score: ${avgScore.toFixed(1)}%
- Needs more practice: ${needsMorePractice}
- Is excelling: ${isExcelling}

Recent activity results: ${JSON.stringify(activityResults || {})}

Please optimize the plan while keeping it realistic and achievable.`;

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
        messages: [
          { role: 'user', content: systemPrompt + '\n\n' + userPrompt }
        ]
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const adaptedData = JSON.parse(aiData.content[0].text);

    // Update the study plan
    const { data: updatedPlan, error: updateError } = await supabase
      .from('study_plans')
      .update({
        phases: adaptedData.phases,
        adapted_count: plan.adapted_count + 1,
        metadata: {
          ...plan.metadata,
          lastAdaptation: new Date().toISOString(),
          adaptationReason: adaptedData.adaptationReason,
          avgScoreAtAdaptation: avgScore
        }
      })
      .eq('id', planId)
      .select()
      .single();

    if (updateError) throw updateError;

    console.log(`✅ Study plan adapted (${plan.adapted_count + 1} times)`);

    return new Response(JSON.stringify({ 
      success: true, 
      plan: updatedPlan,
      adaptationReason: adaptedData.adaptationReason,
      recommendedNextAction: adaptedData.recommendedNextAction
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error adapting study plan:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});