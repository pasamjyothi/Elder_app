-- Create appointment_history table to track appointment reminders and completions
CREATE TABLE public.appointment_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- 'reminder_sent', 'completed', 'snoozed', 'dismissed'
  action_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scheduled_reminder_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.appointment_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own appointment history"
ON public.appointment_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own appointment history"
ON public.appointment_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointment history"
ON public.appointment_history
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_appointment_history_user_id ON public.appointment_history(user_id);
CREATE INDEX idx_appointment_history_appointment_id ON public.appointment_history(appointment_id);