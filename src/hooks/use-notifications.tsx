import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './use-auth';
import { useUserData } from './use-user-data';
import { toast } from 'sonner';

interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

interface ScheduledNotification {
  id: string;
  type: 'medication' | 'appointment';
  title: string;
  message: string;
  scheduledTime: Date;
  soundAlert: boolean;
}

const SUPABASE_URL = "https://arstaaeqmdnpgooxnyra.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFyc3RhYWVxbWRucGdvb3hueXJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNjUzODAsImV4cCI6MjA3MDc0MTM4MH0.ai0OLe3l1qd-9dpFHJDClAGmjFcGjvMdzCzwuzAE6tg";

export const useNotifications = () => {
  const { user } = useAuth();
  const { medications, appointments, markMedicationTaken } = useUserData();
  const [permission, setPermission] = useState<NotificationPermission>({
    granted: false,
    denied: false,
    default: true
  });
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
  const [activeAlarm, setActiveAlarm] = useState<{
    id: string;
    type: 'medication' | 'appointment';
    title: string;
    message: string;
    audio?: HTMLAudioElement;
  } | null>(null);
  
  const scheduledTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      toast.error('This browser does not support notifications');
      return false;
    }

    const result = await Notification.requestPermission();
    
    setPermission({
      granted: result === 'granted',
      denied: result === 'denied',
      default: result === 'default'
    });

    if (result === 'granted') {
      toast.success('Notifications enabled');
      return true;
    } else {
      toast.error('Notifications denied');
      return false;
    }
  }, []);

  // Play voice alert using ElevenLabs TTS
  const playVoiceAlert = useCallback(async (text: string, medicationId?: string, medicationType?: 'medication' | 'appointment') => {
    try {
      console.log("Playing voice alert for:", text);
      
      // Set active alarm state first
      if (medicationId) {
        setActiveAlarm({
          id: medicationId,
          type: medicationType || 'medication',
          title: medicationType === 'appointment' ? 'Appointment Reminder' : 'Medication Reminder',
          message: text,
        });
      }

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/elevenlabs-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ text }),
        }
      );

      if (!response.ok) {
        console.error("TTS request failed, falling back to bell sound");
        playBellSound();
        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Update active alarm with audio reference
      if (medicationId) {
        setActiveAlarm(prev => prev ? { ...prev, audio } : null);
      }
      
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
      console.log("Voice alert played successfully");
      
    } catch (error) {
      console.error('Error playing voice alert:', error);
      // Fallback to bell sound
      playBellSound();
    }
  }, []);

  // Fallback bell sound
  const playBellSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const playBellRing = (startTime: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, startTime + 0.1);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.5);
      };
      
      const now = audioContext.currentTime;
      for (let i = 0; i < 6; i++) {
        const ringTime = now + (i * 0.6);
        playBellRing(ringTime);
        playBellRing(ringTime + 0.05);
      }
      
      setTimeout(() => {
        audioContext.close();
      }, 4000);
      
    } catch (error) {
      console.error('Error playing bell sound:', error);
    }
  }, []);

  // Dismiss active alarm
  const dismissAlarm = useCallback(() => {
    if (activeAlarm?.audio) {
      activeAlarm.audio.pause();
      activeAlarm.audio.currentTime = 0;
    }
    setActiveAlarm(null);
  }, [activeAlarm]);

  // Show notification with voice alert
  const showNotification = useCallback(async (
    title: string, 
    message: string, 
    soundAlert = true, 
    itemId?: string,
    type: 'medication' | 'appointment' = 'medication',
    customVoiceMessage?: string
  ) => {
    if (!permission.granted) return;

    const notification = new Notification(title, {
      body: message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'carenest-notification',
      requireInteraction: true,
    });

    if (soundAlert && itemId) {
      // Use custom voice message if provided, otherwise build default
      const voiceText = customVoiceMessage || (type === 'medication' 
        ? `It's time to take your medication. ${message}`
        : `Reminder: ${message}`);
      await playVoiceAlert(voiceText, itemId, type);
    }

    // Auto close after 15 seconds
    setTimeout(() => {
      notification.close();
    }, 15000);

    // Also show toast
    toast.info(`${title}: ${message}`, {
      duration: 15000,
    });

    return notification;
  }, [permission.granted, playVoiceAlert]);

  // Schedule medication reminders with auto-update
  const scheduleMedicationReminders = useCallback(() => {
    if (!medications || !user) return;

    // Clear existing scheduled timeouts for medications
    scheduledTimeoutsRef.current.forEach((timeout, key) => {
      if (key.startsWith('med-')) {
        clearTimeout(timeout);
        scheduledTimeoutsRef.current.delete(key);
      }
    });

    medications.forEach(medication => {
      if (!medication.enable_notifications || !medication.reminder_times || !medication.is_active) return;

      medication.reminder_times.forEach((timeString, index) => {
        const now = new Date();
        const [hours, minutes] = timeString.split(':').map(Number);
        
        const notificationTime = new Date();
        notificationTime.setHours(hours, minutes, 0, 0);
        
        // If time has passed today, schedule for tomorrow
        if (notificationTime <= now) {
          notificationTime.setDate(notificationTime.getDate() + 1);
        }

        const timeUntilNotification = notificationTime.getTime() - now.getTime();
        const timeoutKey = `med-${medication.id}-${index}`;

        if (timeUntilNotification > 0) {
          const timeout = setTimeout(async () => {
            // Build voice message with instructions
            const instructionText = medication.instructions 
              ? `. Instructions: ${medication.instructions}` 
              : '';
            const voiceMessage = `It's time to take your medication. ${medication.name}, ${medication.dosage}${instructionText}`;
            
            await showNotification(
              'Medication Reminder',
              `Time to take ${medication.name} - ${medication.dosage}${medication.instructions ? ` (${medication.instructions})` : ''}`,
              medication.sound_alert,
              medication.id,
              'medication',
              voiceMessage
            );
          }, timeUntilNotification);
          
          scheduledTimeoutsRef.current.set(timeoutKey, timeout);
        }
      });
    });
  }, [medications, user, showNotification]);

  // Schedule appointment reminders with auto-update
  const scheduleAppointmentReminders = useCallback(() => {
    if (!appointments || !user) return;

    // Clear existing scheduled timeouts for appointments
    scheduledTimeoutsRef.current.forEach((timeout, key) => {
      if (key.startsWith('apt-')) {
        clearTimeout(timeout);
        scheduledTimeoutsRef.current.delete(key);
      }
    });

    appointments.forEach(appointment => {
      if (!appointment.enable_notifications || appointment.notification_sent) return;

      const appointmentTime = new Date(appointment.appointment_date);
      const reminderTime = new Date(appointmentTime.getTime() - (appointment.reminder_minutes || 30) * 60000);
      const now = new Date();

      const timeUntilReminder = reminderTime.getTime() - now.getTime();
      const timeoutKey = `apt-${appointment.id}`;

      if (timeUntilReminder > 0) {
        const timeout = setTimeout(async () => {
          const appointmentNotes = appointment.notes ? `. Notes: ${appointment.notes}` : '';
          const voiceMessage = `You have an appointment with Doctor ${appointment.doctor_name} for ${appointment.appointment_type} in ${appointment.reminder_minutes || 30} minutes${appointmentNotes}`;
          
          await showNotification(
            'Appointment Reminder',
            `You have an appointment with Dr. ${appointment.doctor_name} in ${appointment.reminder_minutes || 30} minutes`,
            true,
            appointment.id,
            'appointment',
            voiceMessage
          );
        }, timeUntilReminder);
        
        scheduledTimeoutsRef.current.set(timeoutKey, timeout);
      }
    });
  }, [appointments, user, showNotification]);

  // Check current permissions on mount
  useEffect(() => {
    if ('Notification' in window) {
      const currentPermission = Notification.permission;
      setPermission({
        granted: currentPermission === 'granted',
        denied: currentPermission === 'denied',
        default: currentPermission === 'default'
      });
    }
  }, []);

  // Schedule notifications when data changes (real-time updates)
  useEffect(() => {
    if (permission.granted) {
      scheduleMedicationReminders();
      scheduleAppointmentReminders();
    }

    // Cleanup on unmount
    return () => {
      scheduledTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      scheduledTimeoutsRef.current.clear();
    };
  }, [permission.granted, scheduleMedicationReminders, scheduleAppointmentReminders]);

  return {
    permission,
    requestPermission,
    showNotification,
    playVoiceAlert,
    playBellSound,
    dismissAlarm,
    activeAlarm,
    scheduledNotifications,
  };
};
