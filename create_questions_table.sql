-- SQL script to create questions table in Supabase
-- You can run this directly in the Supabase SQL Editor

-- Create the questions table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.questions (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add row level security policies
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Allow service role to access the table (your application)
CREATE POLICY "Allow service role full access" 
  ON public.questions 
  FOR ALL 
  TO service_role 
  USING (true);

-- Create an index on question text for faster lookups
CREATE INDEX IF NOT EXISTS idx_questions_question 
  ON public.questions 
  USING GIN (to_tsvector('english', question));

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.questions_id_seq TO authenticated;

-- Optional: Add function to check if table exists
CREATE OR REPLACE FUNCTION public.table_exists(table_name text)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name = $1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Add function to create the questions table
CREATE OR REPLACE FUNCTION public.create_questions_table()
RETURNS VOID AS $$
BEGIN
  IF NOT public.table_exists('questions') THEN
    CREATE TABLE public.questions (
      id SERIAL PRIMARY KEY,
      question TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "Allow service role full access" 
      ON public.questions 
      FOR ALL 
      TO service_role 
      USING (true);
      
    GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
    GRANT USAGE, SELECT ON SEQUENCE public.questions_id_seq TO authenticated;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 