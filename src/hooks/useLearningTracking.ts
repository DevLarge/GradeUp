import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TrackActivityParams {
  activityType: 'quiz' | 'test' | 'flashcard' | 'note' | 'ai_chat' | 'reading';
  subject: string;
  topic?: string;
  score?: number;
  totalQuestions?: number;
  difficultyLevel?: 'easy' | 'medium' | 'hard';
  metadata?: Record<string, any>;
}

const ACTIVITIES_BEFORE_ANALYSIS = 5;

export const useLearningTracking = () => {
  const sessionStartTime = useRef<Date>(new Date());

  useEffect(() => {
    // Reset session start time when component mounts
    sessionStartTime.current = new Date();
  }, []);

  const checkAndTriggerAnalysis = async (userId: string) => {
    try {
      // Get last analysis time
      const { data: patterns } = await supabase
        .from('learning_patterns')
        .select('last_analyzed_at')
        .eq('user_id', userId)
        .single();

      const lastAnalyzed = patterns?.last_analyzed_at ? new Date(patterns.last_analyzed_at) : null;

      // Count activities since last analysis
      const query = supabase
        .from('learning_activities')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (lastAnalyzed) {
        query.gt('created_at', lastAnalyzed.toISOString());
      }

      const { count } = await query;

      // Trigger analysis if enough new activities
      if (count && count >= ACTIVITIES_BEFORE_ANALYSIS) {
        console.log(`Triggering automatic analysis after ${count} activities`);
        
        // Call analysis function in background (don't await)
        supabase.functions.invoke('analyze-learning-patterns', {
          body: { userId }
        }).then(({ data, error }) => {
          if (error) {
            console.error('Auto-analysis error:', error);
          } else {
            console.log('Auto-analysis completed successfully');
          }
        });
      }
    } catch (error) {
      console.error('Error checking for analysis trigger:', error);
    }
  };

  const trackActivity = async (params: TrackActivityParams) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const timeSpentSeconds = Math.floor((new Date().getTime() - sessionStartTime.current.getTime()) / 1000);

      const { error } = await supabase.from('learning_activities').insert({
        user_id: user.id,
        activity_type: params.activityType,
        subject: params.subject,
        topic: params.topic,
        score: params.score,
        total_questions: params.totalQuestions,
        time_spent_seconds: timeSpentSeconds,
        difficulty_level: params.difficultyLevel,
        metadata: params.metadata,
      });

      if (error) {
        console.error('Error tracking activity:', error);
        return;
      }

      // Check if we should trigger analysis
      await checkAndTriggerAnalysis(user.id);

      // Reset session start time after tracking
      sessionStartTime.current = new Date();
    } catch (error) {
      console.error('Error in trackActivity:', error);
    }
  };

  return { trackActivity };
};
