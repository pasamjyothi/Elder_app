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

  // Play continuous alarm sound
  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create continuous alarm with multiple frequencies
      const playBuzzSequence = (startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Alarm-like frequency pattern
        oscillator.frequency.setValueAtTime(200, startTime);
        oscillator.frequency.setValueAtTime(150, startTime + 0.1);
        oscillator.frequency.setValueAtTime(200, startTime + 0.2);
        oscillator.type = 'square';
        
        // Volume envelope for buzzing effect
        gainNode.gain.setValueAtTime(0.4, startTime);
        gainNode.gain.setValueAtTime(0.1, startTime + 0.1);
        gainNode.gain.setValueAtTime(0.4, startTime + 0.2);
        gainNode.gain.setValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      // Play continuous alarm for 5 seconds
      const now = audioContext.currentTime;
      for (let i = 0; i < 10; i++) {
        playBuzzSequence(now + (i * 0.5), 0.4);
      }
      
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, []);

  // Show notification
  const showNotification = useCallback((title: string, message: string, soundAlert = true) => {
    if (!permission.granted) return;

    const notification = new Notification(title, {
      body: message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'carenest-notification',
      requireInteraction: true,
    });

    if (soundAlert) {
      playNotificationSound();
    }

    // Auto close after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);

    // Also show toast
    toast.info(`${title}: ${message}`, {
      duration: 10000,
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
              medication.sound_alert
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
    scheduledNotifications,
  };
};