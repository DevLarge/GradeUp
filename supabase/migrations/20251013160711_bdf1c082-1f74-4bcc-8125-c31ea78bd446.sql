-- Create quiz_results table to track user progress
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  quiz_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  percentage INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  test_id TEXT,
  theme_id TEXT
);

-- Enable RLS
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own quiz results"
  ON public.quiz_results
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz results"
  ON public.quiz_results
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create user_progress table to track overall readiness
CREATE TABLE IF NOT EXISTS public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  total_quizzes INTEGER NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  average_percentage INTEGER NOT NULL DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  readiness_level TEXT NOT NULL DEFAULT 'not_ready',
  UNIQUE(user_id, subject)
);

-- Enable RLS
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own progress"
  ON public.user_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.user_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.user_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to update user progress after quiz completion
CREATE OR REPLACE FUNCTION public.update_user_progress()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_progress (user_id, subject, total_quizzes, total_score, average_percentage, last_activity, readiness_level)
  VALUES (
    NEW.user_id,
    NEW.subject,
    1,
    NEW.score,
    NEW.percentage,
    NEW.completed_at,
    CASE
      WHEN NEW.percentage >= 80 THEN 'ready'
      WHEN NEW.percentage >= 60 THEN 'almost_ready'
      ELSE 'not_ready'
    END
  )
  ON CONFLICT (user_id, subject)
  DO UPDATE SET
    total_quizzes = user_progress.total_quizzes + 1,
    total_score = user_progress.total_score + NEW.score,
    average_percentage = ROUND((user_progress.total_score::numeric + NEW.score::numeric) / (user_progress.total_quizzes + 1)),
    last_activity = NEW.completed_at,
    readiness_level = CASE
      WHEN ROUND((user_progress.total_score::numeric + NEW.score::numeric) / (user_progress.total_quizzes + 1)) >= 80 THEN 'ready'
      WHEN ROUND((user_progress.total_score::numeric + NEW.score::numeric) / (user_progress.total_quizzes + 1)) >= 60 THEN 'almost_ready'
      ELSE 'not_ready'
    END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to automatically update progress
CREATE TRIGGER on_quiz_completed
  AFTER INSERT ON public.quiz_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_progress();