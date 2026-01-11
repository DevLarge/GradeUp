-- Add new columns to user_preferences for onboarding
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS target_grade text,
ADD COLUMN IF NOT EXISTS average_study_time_minutes integer,
ADD COLUMN IF NOT EXISTS optimal_study_time text,
ADD COLUMN IF NOT EXISTS preferred_subjects jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS preferred_learning_methods jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS learning_style text,
ADD COLUMN IF NOT EXISTS preparation_habits jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamp with time zone;