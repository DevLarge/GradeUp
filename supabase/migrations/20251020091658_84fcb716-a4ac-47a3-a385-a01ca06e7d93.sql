-- Create practice_tests table
CREATE TABLE public.practice_tests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  subject text NOT NULL,
  title text NOT NULL,
  topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  questions jsonb NOT NULL,
  time_limit_minutes integer NOT NULL DEFAULT 45,
  difficulty_level text DEFAULT 'medium',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  score integer,
  total_questions integer NOT NULL,
  answers jsonb,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create explanations table
CREATE TABLE public.explanations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  activity_type text NOT NULL, -- 'quiz', 'test', 'practice_test'
  activity_id uuid NOT NULL,
  subject text NOT NULL,
  question_text text NOT NULL,
  user_answer text NOT NULL,
  correct_answer text NOT NULL,
  explanation text NOT NULL,
  examples text,
  understood boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.practice_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.explanations ENABLE ROW LEVEL SECURITY;

-- RLS policies for practice_tests
CREATE POLICY "Users can view their own practice tests"
ON public.practice_tests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own practice tests"
ON public.practice_tests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own practice tests"
ON public.practice_tests FOR UPDATE
USING (auth.uid() = user_id);

-- RLS policies for explanations
CREATE POLICY "Users can view their own explanations"
ON public.explanations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own explanations"
ON public.explanations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own explanations"
ON public.explanations FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger for explanations updated_at
CREATE TRIGGER update_explanations_updated_at
BEFORE UPDATE ON public.explanations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();