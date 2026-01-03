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
    scheduledTime?: string;
    audio?: HTMLAudioElement;
  } | null>(null);
  
  const alarmIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  
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

  // Trigger device vibration if supported
  const triggerVibration = useCallback(() => {
    if ('vibrate' in navigator) {
      // Vibration pattern: vibrate 500ms, pause 200ms, vibrate 500ms
      navigator.vibrate([500, 200, 500, 200, 500]);
    }
  }, []);

  // Stop all alarm sounds and intervals
  const stopAlarmSounds = useCallback(() => {
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    if (alarmAudioRef.current) {
      alarmAudioRef.current.pause();
      alarmAudioRef.current.currentTime = 0;
      alarmAudioRef.current = null;
    }
    // Stop vibration
    if ('vibrate' in navigator) {
      navigator.vibrate(0);
    }
    // Stop any ongoing speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Fallback bell sound - more urgent and attention-grabbing
  const playBellSound = useCallback((repeat = false) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      const playBellRing = (startTime: number, frequency = 800, volume = 0.6) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // More urgent alternating frequencies
        oscillator.frequency.setValueAtTime(frequency, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.75, startTime + 0.15);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.4);
      };

      const now = audioContext.currentTime;
      // More urgent pattern: alternating high-low frequencies
      for (let i = 0; i < 8; i++) {
        const ringTime = now + (i * 0.45);
        const freq = i % 2 === 0 ? 880 : 660;
        playBellRing(ringTime, freq, 0.7);
      }

      // Trigger vibration with each bell sound
      triggerVibration();

      setTimeout(() => {
        audioContext.close();
      }, 5000);

      // If repeat is enabled, set up interval to keep playing
      if (repeat && !alarmIntervalRef.current) {
        alarmIntervalRef.current = setInterval(() => {
          playBellSound(false); // Play without setting up another interval
          triggerVibration();
        }, 6000);
      }
    } catch (error) {
      console.error('Error playing bell sound:', error);
    }
  }, [triggerVibration]);

  // Browser TTS fallback (no external API)
  const speakWithBrowserTTS = useCallback(async (text: string) => {
    if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
      return false;
    }

    try {
      // Stop any ongoing speech to avoid stacking
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      await new Promise<void>((resolve, reject) => {
        utterance.onend = () => resolve();
        utterance.onerror = () => reject(new Error('Browser TTS failed'));
        window.speechSynthesis.speak(utterance);
      });

      return true;
    } catch (e) {
      console.error('Browser TTS error:', e);
      return false;
    }
  }, []);

  // Play voice alert using ElevenLabs TTS (with browser TTS fallback)
  const playVoiceAlert = useCallback(async (text: string, medicationId?: string, medicationType?: 'medication' | 'appointment', scheduledTime?: string) => {
    try {
      console.log("Playing voice alert for:", text);

      // Stop any existing alarm sounds first
      stopAlarmSounds();

      // Trigger vibration immediately
      triggerVibration();

      // Set active alarm state first
      if (medicationId) {
        setActiveAlarm({
          id: medicationId,
          type: medicationType || 'medication',
          title: medicationType === 'appointment' ? 'Appointment Reminder' : 'Medication Reminder',
          message: text,
          scheduledTime,
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
        console.error(`TTS request failed (${response.status}), falling back to browser TTS / bell`);

        const spoken = await speakWithBrowserTTS(text);
        if (!spoken) playBellSound(true); // Enable repeating

        // Set up repeating voice reminder if TTS worked
        if (spoken) {
          alarmIntervalRef.current = setInterval(async () => {
            await speakWithBrowserTTS(text);
            triggerVibration();
          }, 8000);
        }

        return;
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      alarmAudioRef.current = audio;

      // Update active alarm with audio reference
      if (medicationId) {
        setActiveAlarm((prev) => (prev ? { ...prev, audio } : null));
      }

      // Set up repeating audio
      audio.onended = () => {
        // Repeat after a short pause
        setTimeout(() => {
          if (alarmAudioRef.current === audio) {
            audio.currentTime = 0;
            audio.play().catch(() => {});
          }
        }, 2000);
      };

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
      console.log("Voice alert played successfully (will repeat)");
    } catch (error) {
      console.error('Error playing voice alert:', error);

      const spoken = await speakWithBrowserTTS(text);
      if (!spoken) playBellSound(true);
    }
  }, [playBellSound, speakWithBrowserTTS, stopAlarmSounds, triggerVibration]);
  // Dismiss active alarm
  const dismissAlarm = useCallback(() => {
    stopAlarmSounds();
    if (activeAlarm?.audio) {
      activeAlarm.audio.pause();
      activeAlarm.audio.currentTime = 0;
    }
    setActiveAlarm(null);
  }, [activeAlarm, stopAlarmSounds]);

  // Snooze alarm for specified minutes
  const snoozeAlarm = useCallback((minutes: number = 5) => {
    if (!activeAlarm) return;
    
    const snoozedAlarm = { ...activeAlarm };
    
    // Stop all alarm sounds
    stopAlarmSounds();
    
    // Stop current audio
    if (activeAlarm.audio) {
      activeAlarm.audio.pause();
      activeAlarm.audio.currentTime = 0;
    }
    setActiveAlarm(null);

    // Schedule snooze timeout
    const snoozeKey = `snooze-${snoozedAlarm.id}`;
    const timeout = setTimeout(async () => {
      const snoozeMessage = `Snooze reminder. ${snoozedAlarm.message}`;
      await playVoiceAlert(snoozeMessage, snoozedAlarm.id, snoozedAlarm.type);
      scheduledTimeoutsRef.current.delete(snoozeKey);
    }, minutes * 60 * 1000);
    
    scheduledTimeoutsRef.current.set(snoozeKey, timeout);
    
    return timeout;
  }, [activeAlarm, playVoiceAlert, stopAlarmSounds]);

  // Show notification with voice alert
  // NOTE: We still play in-app alerts (voice/bell + toast) even if browser notifications are not granted.
  const showNotification = useCallback(async (
    title: string,
    message: string,
    soundAlert = true,
    itemId?: string,
    type: 'medication' | 'appointment' = 'medication',
    customVoiceMessage?: string,
    scheduledTime?: string
  ) => {
    console.log('[notifications] showNotification', { title, type, soundAlert, itemId });

    // Browser Notification (optional)
    let notification: Notification | undefined;
    if (permission.granted) {
      notification = new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'carenest-notification',
        requireInteraction: true,
      });

      // Auto close after 15 seconds
      setTimeout(() => {
        notification?.close();
      }, 15000);
    }

    // Always show toast (in-app)
    toast.info(`${title}: ${message}`, {
      duration: 15000,
    });

    // Always play alert sound/voice if enabled
    if (soundAlert && itemId) {
      const voiceText = customVoiceMessage || (type === 'medication'
        ? `It's time to take your medication. ${message}`
        : `Reminder: ${message}`);
      await playVoiceAlert(voiceText, itemId, type, scheduledTime);
    }

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
      if (!medication.enable_notifications || !medication.reminder_times || medication.reminder_times.length === 0 || !medication.is_active) {
        console.log('[notifications] skipping medication:', medication.name, { 
          notifications: medication.enable_notifications, 
          times: medication.reminder_times?.length,
          active: medication.is_active 
        });
        return;
      }

      medication.reminder_times.forEach((timeString, index) => {
        const now = new Date();
        // Handle both "HH:MM" and "HH:MM:SS" formats
        const timeParts = timeString.split(':').map(Number);
        const hours = timeParts[0];
        const minutes = timeParts[1];
        
        const notificationTime = new Date();
        notificationTime.setHours(hours, minutes, 0, 0);
        
        // If time has passed today, schedule for tomorrow
        if (notificationTime <= now) {
          notificationTime.setDate(notificationTime.getDate() + 1);
        }

        const timeUntilNotification = notificationTime.getTime() - now.getTime();
        const timeoutKey = `med-${medication.id}-${index}`;

        console.log('[notifications] scheduling medication:', medication.name, {
          scheduledFor: notificationTime.toLocaleString(),
          timeUntilMs: timeUntilNotification,
          timeUntilMins: Math.round(timeUntilNotification / 60000)
        });

        if (timeUntilNotification > 0 && timeUntilNotification < 24 * 60 * 60 * 1000) {
          const timeout = setTimeout(async () => {
            console.log('[notifications] FIRING medication reminder for:', medication.name);
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
              voiceMessage,
              timeString // Pass scheduled time
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
  // IMPORTANT: We schedule timers regardless of browser Notification permission so that in-app voice/bell alerts still work.
  useEffect(() => {
    console.log('[notifications] scheduling reminders', {
      meds: medications?.length || 0,
      appts: appointments?.length || 0,
      browserPermission: permission.granted ? 'granted' : permission.denied ? 'denied' : 'default',
    });

    scheduleMedicationReminders();
    scheduleAppointmentReminders();

    // Cleanup on unmount
    return () => {
      scheduledTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      scheduledTimeoutsRef.current.clear();
    };
  }, [permission.granted, permission.denied, medications, appointments, scheduleMedicationReminders, scheduleAppointmentReminders]);
  return {
    permission,
    requestPermission,
    showNotification,
    playVoiceAlert,
    playBellSound,
    dismissAlarm,
    snoozeAlarm,
    activeAlarm,
    scheduledNotifications,
  };
};
