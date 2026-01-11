-- Create table for tracking individual question attempts
CREATE TABLE public.question_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_text TEXT NOT NULL,
  question_id TEXT,
  user_answer TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1,
  mastered BOOLEAN NOT NULL DEFAULT false,
  subject TEXT NOT NULL,
  topic TEXT,
  quiz_type TEXT NOT NULL,
  quiz_session_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own question attempts"
ON public.question_attempts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own question attempts"
ON public.question_attempts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own question attempts"
ON public.question_attempts
FOR UPDATE
USING (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX idx_question_attempts_user_mastered ON public.question_attempts(user_id, mastered);
CREATE INDEX idx_question_attempts_session ON public.question_attempts(quiz_session_id);