-- Add time fields to medications table for scheduling alerts
ALTER TABLE public.medications 
ADD COLUMN reminder_times TIME[] DEFAULT ARRAY[]::TIME[],
ADD COLUMN enable_notifications BOOLEAN DEFAULT true,
ADD COLUMN sound_alert BOOLEAN DEFAULT true;

-- Add notification fields to appointments table
ALTER TABLE public.appointments
ADD COLUMN reminder_minutes INTEGER DEFAULT 30,
ADD COLUMN enable_notifications BOOLEAN DEFAULT true,
ADD COLUMN notification_sent BOOLEAN DEFAULT false;