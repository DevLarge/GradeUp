-- Create learning activities table to track all user interactions
CREATE TABLE public.learning_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL, -- 'quiz', 'test', 'flashcard', 'note', 'ai_chat', 'reading'
  subject TEXT NOT NULL,
  topic TEXT,
  score INTEGER, -- for scored activities
  total_questions INTEGER, -- for tests/quizzes
  time_spent_seconds INTEGER,
  difficulty_level TEXT, -- 'easy', 'medium', 'hard'
  completed BOOLEAN DEFAULT true,
  metadata JSONB, -- flexible field for additional data
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create learning patterns table for aggregated insights
CREATE TABLE public.learning_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  preferred_learning_methods JSONB, -- {"quiz": 45, "flashcards": 30, "notes": 25}
  subject_strengths JSONB, -- {"Matte": 85, "Historie": 72, "Engelsk": 90}
  subject_weaknesses JSONB, -- {"Naturfag": 45}
  optimal_study_time TEXT, -- 'morning', 'afternoon', 'evening'
  average_session_duration INTEGER, -- in minutes
  total_study_time INTEGER, -- in minutes
  learning_style TEXT, -- 'visual', 'reading', 'practice', 'mixed'
  consistency_score INTEGER, -- 0-100
  last_analyzed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user preferences table
CREATE TABLE public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  preferred_explanation_style TEXT DEFAULT 'detailed', -- 'simple', 'detailed', 'examples'
  preferred_difficulty TEXT DEFAULT 'medium', -- 'easy', 'medium', 'hard', 'adaptive'
  wants_hints BOOLEAN DEFAULT true,
  wants_step_by_step BOOLEAN DEFAULT true,
  notification_preferences JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.learning_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learning_activities
CREATE POLICY "Users can view their own activities"
ON public.learning_activities
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities"
ON public.learning_activities
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for learning_patterns
CREATE POLICY "Users can view their own patterns"
ON public.learning_patterns
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own patterns"
ON public.learning_patterns
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own patterns"
ON public.learning_patterns
FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for user_preferences
CREATE POLICY "Users can view their own preferences"
ON public.user_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
ON public.user_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.user_preferences
FOR UPDATE
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_learning_activities_user_id ON public.learning_activities(user_id);
CREATE INDEX idx_learning_activities_subject ON public.learning_activities(subject);
CREATE INDEX idx_learning_activities_created_at ON public.learning_activities(created_at DESC);

-- Create trigger for updating learning_patterns timestamp
CREATE TRIGGER update_learning_patterns_updated_at
BEFORE UPDATE ON public.learning_patterns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();