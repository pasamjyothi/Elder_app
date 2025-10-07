import { useState, useEffect, useCallback } from 'react';
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

export const useNotifications = () => {
  const { user } = useAuth();
  const { medications, appointments } = useUserData();
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
    audioContext?: AudioContext;
  } | null>(null);

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

  // Play bell ring sound with dismiss capability
  const playNotificationSound = useCallback((medicationId?: string, medicationName?: string) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Set active alarm state
      if (medicationId && medicationName) {
        setActiveAlarm({
          id: medicationId,
          type: 'medication',
          title: 'Medication Reminder',
          message: `Time to take ${medicationName}`,
          audioContext
        });
      }
      
      // Create bell ring sound sequence
      const playBellRing = (startTime: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Bell-like frequency (higher pitched, clean tone)
        oscillator.frequency.setValueAtTime(800, startTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, startTime + 0.1);
        oscillator.type = 'sine'; // Sine wave for cleaner bell sound
        
        // Bell envelope (quick attack, gradual decay)
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.5, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.5);
      };
      
      // Play bell ring pattern: 3 rings, pause, repeat
      const now = audioContext.currentTime;
      for (let i = 0; i < 6; i++) {
        const ringTime = now + (i * 0.6);
        playBellRing(ringTime);
        // Second harmonic for richer bell sound
        playBellRing(ringTime + 0.05);
      }
      
      // Auto dismiss after 4 seconds
      setTimeout(() => {
        setActiveAlarm(null);
        audioContext.close();
      }, 4000);
      
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, []);

  // Dismiss active alarm
  const dismissAlarm = useCallback(() => {
    if (activeAlarm?.audioContext) {
      activeAlarm.audioContext.close();
    }
    setActiveAlarm(null);
  }, [activeAlarm]);

  // Show notification with enhanced alarm
  const showNotification = useCallback((title: string, message: string, soundAlert = true, medicationId?: string) => {
    if (!permission.granted) return;

    const notification = new Notification(title, {
      body: message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'carenest-notification',
      requireInteraction: true,
    });

    if (soundAlert && medicationId) {
      const medicationName = message.match(/take (.+?) \(/)?.[1] || 'your medication';
      playNotificationSound(medicationId, medicationName);
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
  }, [permission.granted, playNotificationSound]);

  // Schedule medication reminders
  const scheduleMedicationReminders = useCallback(() => {
    if (!medications || !user) return;

    medications.forEach(medication => {
      if (!medication.enable_notifications || !medication.reminder_times) return;

      medication.reminder_times.forEach(timeString => {
        const now = new Date();
        const [hours, minutes] = timeString.split(':').map(Number);
        
        // Create notification time for today
        const notificationTime = new Date();
        notificationTime.setHours(hours, minutes, 0, 0);
        
        // If time has passed today, schedule for tomorrow
        if (notificationTime <= now) {
          notificationTime.setDate(notificationTime.getDate() + 1);
        }

        const timeUntilNotification = notificationTime.getTime() - now.getTime();

        if (timeUntilNotification > 0) {
          setTimeout(() => {
            showNotification(
              'Medication Reminder',
              `Time to take ${medication.name} (${medication.dosage})`,
              medication.sound_alert,
              medication.id
            );
          }, timeUntilNotification);
        }
      });
    });
  }, [medications, user, showNotification]);

  // Schedule appointment reminders
  const scheduleAppointmentReminders = useCallback(() => {
    if (!appointments || !user) return;

    appointments.forEach(appointment => {
      if (!appointment.enable_notifications || appointment.notification_sent) return;

      const appointmentTime = new Date(appointment.appointment_date);
      const reminderTime = new Date(appointmentTime.getTime() - (appointment.reminder_minutes || 30) * 60000);
      const now = new Date();

      const timeUntilReminder = reminderTime.getTime() - now.getTime();

      if (timeUntilReminder > 0) {
        setTimeout(() => {
          showNotification(
            'Appointment Reminder',
            `You have an appointment with Dr. ${appointment.doctor_name} in ${appointment.reminder_minutes || 30} minutes`,
            true
          );
        }, timeUntilReminder);
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

  // Schedule notifications when data changes
  useEffect(() => {
    if (permission.granted) {
      scheduleMedicationReminders();
      scheduleAppointmentReminders();
    }
  }, [permission.granted, scheduleMedicationReminders, scheduleAppointmentReminders]);

  return {
    permission,
    requestPermission,
    showNotification,
    playNotificationSound,
    dismissAlarm,
    activeAlarm,
    scheduledNotifications,
  };
};