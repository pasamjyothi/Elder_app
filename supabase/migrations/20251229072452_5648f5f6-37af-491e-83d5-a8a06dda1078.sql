-- Create medication history table to track when medications are taken
CREATE TABLE public.medication_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  taken_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scheduled_time TIME WITHOUT TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.medication_history ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own medication history" 
ON public.medication_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own medication history" 
ON public.medication_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medication history" 
ON public.medication_history 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_medication_history_user_id ON public.medication_history(user_id);
CREATE INDEX idx_medication_history_medication_id ON public.medication_history(medication_id);
CREATE INDEX idx_medication_history_taken_at ON public.medication_history(taken_at DESC);