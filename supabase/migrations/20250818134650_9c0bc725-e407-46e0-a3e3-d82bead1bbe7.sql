-- Add last_taken column to medications table for tracking when medication was taken
ALTER TABLE public.medications 
ADD COLUMN last_taken TIMESTAMP WITH TIME ZONE;