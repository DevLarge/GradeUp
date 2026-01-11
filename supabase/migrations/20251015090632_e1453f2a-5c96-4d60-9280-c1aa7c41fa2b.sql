-- Create test reflections table
CREATE TABLE public.test_reflections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  test_id TEXT NOT NULL,
  test_subject TEXT NOT NULL,
  test_title TEXT NOT NULL,
  test_date DATE NOT NULL,
  how_it_went TEXT, -- 'very_well', 'well', 'okay', 'poorly', 'very_poorly'
  felt_prepared BOOLEAN,
  stress_level INTEGER, -- 1-5
  what_helped TEXT,
  what_could_be_better TEXT,
  would_change TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.test_reflections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own reflections"
ON public.test_reflections
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reflections"
ON public.test_reflections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reflections"
ON public.test_reflections
FOR UPDATE
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_test_reflections_user_id ON public.test_reflections(user_id);
CREATE INDEX idx_test_reflections_test_date ON public.test_reflections(test_date DESC);