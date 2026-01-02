import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useAuth } from './use-auth';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_conditions?: string[];
  allergies?: string[];
}

export interface Medication {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  frequency: string;
  instructions?: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
  reminder_times?: string[];
  enable_notifications?: boolean;
  sound_alert?: boolean;
  last_taken?: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  doctor_name: string;
  appointment_type: string;
  appointment_date: string;
  duration_minutes: number;
  notes?: string;
  status: string;
  is_virtual: boolean;
  reminder_minutes?: number;
  enable_notifications?: boolean;
  notification_sent?: boolean;
}

export interface MedicationHistoryEntry {
  id: string;
  medication_id: string;
  user_id: string;
  taken_at: string;
  scheduled_time?: string;
  notes?: string;
  medication_name?: string;
}

export interface AppointmentHistoryEntry {
  id: string;
  appointment_id: string;
  user_id: string;
  action_type: 'reminder_sent' | 'completed' | 'snoozed' | 'dismissed';
  action_at: string;
  scheduled_reminder_time?: string;
  notes?: string;
  doctor_name?: string;
  appointment_type?: string;
}

interface UserDataContextType {
  profile: UserProfile | null;
  medications: Medication[];
  appointments: Appointment[];
  medicationHistory: MedicationHistoryEntry[];
  appointmentHistory: AppointmentHistoryEntry[];
  loading: boolean;
  addMedication: (medication: Omit<Medication, 'id' | 'user_id'>) => Promise<{ data?: Medication; error: any } | undefined>;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'user_id'>) => Promise<{ data?: Appointment; error: any } | undefined>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ data?: UserProfile; error: any } | undefined>;
  deleteMedication: (medicationId: string) => Promise<{ error: any } | undefined>;
  deleteAppointment: (appointmentId: string) => Promise<{ error: any } | undefined>;
  updateMedication: (medicationId: string, updates: Partial<Omit<Medication, 'id' | 'user_id'>>) => Promise<{ data?: Medication; error: any } | undefined>;
  updateAppointment: (appointmentId: string, updates: Partial<Omit<Appointment, 'id' | 'user_id'>>) => Promise<{ data?: Appointment; error: any } | undefined>;
  markMedicationTaken: (medicationId: string, taken: boolean, scheduledTime?: string) => Promise<{ data?: any; error: any } | undefined>;
  markAppointmentComplete: (appointmentId: string, scheduledReminderTime?: string) => Promise<{ data?: any; error: any } | undefined>;
  fetchMedicationHistory: () => Promise<void>;
  fetchAppointmentHistory: () => Promise<void>;
  refetchData: () => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const UserDataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicationHistory, setMedicationHistory] = useState<MedicationHistoryEntry[]>([]);
  const [appointmentHistory, setAppointmentHistory] = useState<AppointmentHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();

      // Set up real-time subscription for medications
      const medicationsChannel = supabase
        .channel('medications-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'medications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Medication change detected:', payload);
            
            if (payload.eventType === 'INSERT') {
              setMedications(prev => [payload.new as Medication, ...prev]);
            } else if (payload.eventType === 'UPDATE') {
              setMedications(prev => 
                prev.map(med => 
                  med.id === payload.new.id ? payload.new as Medication : med
                )
              );
            } else if (payload.eventType === 'DELETE') {
              setMedications(prev => 
                prev.filter(med => med.id !== payload.old.id)
              );
            }
          }
        )
        .subscribe();

      // Set up real-time subscription for appointments
      const appointmentsChannel = supabase
        .channel('appointments-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'appointments',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Appointment change detected:', payload);
            
            if (payload.eventType === 'INSERT') {
              setAppointments(prev => 
                [...prev, payload.new as Appointment].sort((a, b) => 
                  new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
                )
              );
            } else if (payload.eventType === 'UPDATE') {
              setAppointments(prev => 
                prev.map(apt => 
                  apt.id === payload.new.id ? payload.new as Appointment : apt
                )
              );
            } else if (payload.eventType === 'DELETE') {
              setAppointments(prev => 
                prev.filter(apt => apt.id !== payload.old.id)
              );
            }
          }
        )
        .subscribe();

      // Set up real-time subscription for medication history
      const historyChannel = supabase
        .channel('medication-history-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'medication_history',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            // Refetch history on new entries
            fetchMedicationHistory();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(medicationsChannel);
        supabase.removeChannel(appointmentsChannel);
        supabase.removeChannel(historyChannel);
      };
    } else {
      setProfile(null);
      setMedications([]);
      setAppointments([]);
      setMedicationHistory([]);
      setAppointmentHistory([]);
      setLoading(false);
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      } else {
        setProfile(profileData);
      }

      const { data: medicationsData, error: medicationsError } = await supabase
        .from('medications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (medicationsError) {
        console.error('Error fetching medications:', medicationsError);
      } else {
        setMedications(medicationsData || []);
      }

      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('appointment_date', { ascending: true });

      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError);
      } else {
        setAppointments(appointmentsData || []);
      }

      await fetchMedicationHistory();
      await fetchAppointmentHistory();
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMedication = async (medication: Omit<Medication, 'id' | 'user_id'>) => {
    if (!user) return;

    // Optimistic update - add temp item immediately
    const tempId = `temp-${Date.now()}`;
    const tempMedication = { ...medication, id: tempId, user_id: user.id } as Medication;
    setMedications(prev => [tempMedication, ...prev]);

    try {
      const { data, error } = await supabase
        .from('medications')
        .insert([{ ...medication, user_id: user.id }])
        .select()
        .single();

      if (error) {
        // Rollback on error
        setMedications(prev => prev.filter(m => m.id !== tempId));
        console.error('Error adding medication:', error);
        return { error };
      }

      // Replace temp with real data
      setMedications(prev => prev.map(m => m.id === tempId ? data : m));
      return { data, error: null };
    } catch (error) {
      setMedications(prev => prev.filter(m => m.id !== tempId));
      console.error('Error adding medication:', error);
      return { error };
    }
  };

  const addAppointment = async (appointment: Omit<Appointment, 'id' | 'user_id'>) => {
    if (!user) return;

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const tempAppointment = { ...appointment, id: tempId, user_id: user.id } as Appointment;
    setAppointments(prev => 
      [...prev, tempAppointment].sort((a, b) => 
        new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
      )
    );

    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([{ ...appointment, user_id: user.id }])
        .select()
        .single();

      if (error) {
        setAppointments(prev => prev.filter(a => a.id !== tempId));
        console.error('Error adding appointment:', error);
        return { error };
      }

      setAppointments(prev => prev.map(a => a.id === tempId ? data : a));
      return { data, error: null };
    } catch (error) {
      setAppointments(prev => prev.filter(a => a.id !== tempId));
      console.error('Error adding appointment:', error);
      return { error };
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return { error };
      }

      setProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error };
    }
  };

  const deleteMedication = async (medicationId: string) => {
    if (!user) return;

    // Optimistic delete
    const previousMedications = medications;
    setMedications(prev => prev.filter(m => m.id !== medicationId));

    try {
      const { error } = await supabase
        .from('medications')
        .delete()
        .eq('id', medicationId)
        .eq('user_id', user.id);

      if (error) {
        setMedications(previousMedications);
        console.error('Error deleting medication:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      setMedications(previousMedications);
      console.error('Error deleting medication:', error);
      return { error };
    }
  };

  const deleteAppointment = async (appointmentId: string) => {
    if (!user) return;

    // Optimistic delete
    const previousAppointments = appointments;
    setAppointments(prev => prev.filter(a => a.id !== appointmentId));

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId)
        .eq('user_id', user.id);

      if (error) {
        setAppointments(previousAppointments);
        console.error('Error deleting appointment:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      setAppointments(previousAppointments);
      console.error('Error deleting appointment:', error);
      return { error };
    }
  };

  const updateMedication = async (medicationId: string, updates: Partial<Omit<Medication, 'id' | 'user_id'>>) => {
    if (!user) return;

    // Optimistic update
    const previousMedications = medications;
    setMedications(prev => prev.map(m => m.id === medicationId ? { ...m, ...updates } : m));

    try {
      const { data, error } = await supabase
        .from('medications')
        .update(updates as any)
        .eq('id', medicationId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        setMedications(previousMedications);
        console.error('Error updating medication:', error);
        return { error };
      }

      setMedications(prev => prev.map(m => m.id === medicationId ? data : m));
      return { data, error: null };
    } catch (error) {
      setMedications(previousMedications);
      console.error('Error updating medication:', error);
      return { error };
    }
  };

  const updateAppointment = async (appointmentId: string, updates: Partial<Omit<Appointment, 'id' | 'user_id'>>) => {
    if (!user) return;

    // Optimistic update
    const previousAppointments = appointments;
    setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, ...updates } : a));

    try {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates as any)
        .eq('id', appointmentId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        setAppointments(previousAppointments);
        console.error('Error updating appointment:', error);
        return { error };
      }

      setAppointments(prev => prev.map(a => a.id === appointmentId ? data : a));
      return { data, error: null };
    } catch (error) {
      setAppointments(previousAppointments);
      console.error('Error updating appointment:', error);
      return { error };
    }
  };

  const markMedicationTaken = async (medicationId: string, taken: boolean, scheduledTime?: string) => {
    if (!user) return;

    // Optimistic update so dashboard/screen updates immediately
    const previousMedications = medications;
    const previousHistory = medicationHistory;

    const nowIso = new Date().toISOString();
    setMedications(prev => prev.map(m => m.id === medicationId ? { ...m, last_taken: taken ? nowIso : null } : m));

    if (taken) {
      const medicationName = medications.find(m => m.id === medicationId)?.name;
      const optimisticHistory: MedicationHistoryEntry = {
        id: `temp-${Date.now()}`,
        medication_id: medicationId,
        user_id: user.id,
        taken_at: nowIso,
        scheduled_time: scheduledTime || null,
        notes: null,
        medication_name: medicationName,
      } as any;

      setMedicationHistory(prev => [optimisticHistory, ...prev].slice(0, 100));
    }

    try {
      const { data, error } = await supabase
        .from('medications')
        .update({
          last_taken: taken ? nowIso : null,
        } as any)
        .eq('id', medicationId)
        .eq('user_id', user.id)
        .select()
        .maybeSingle();

      if (error) {
        setMedications(previousMedications);
        setMedicationHistory(previousHistory);
        console.error('Error updating medication:', error);
        return { error };
      }

      if (taken) {
        const { error: historyError } = await supabase
          .from('medication_history')
          .insert({
            medication_id: medicationId,
            user_id: user.id,
            taken_at: nowIso,
            scheduled_time: scheduledTime || null,
          } as any);

        if (historyError) {
          // Roll back history only; keep last_taken because it's the main UX indicator
          setMedicationHistory(previousHistory);
          console.error('Error adding to medication history:', historyError);
        } else {
          // Replace optimistic history by refetching (ensures correct IDs and join name)
          fetchMedicationHistory();
        }
      }

      return { data, error: null };
    } catch (error) {
      setMedications(previousMedications);
      setMedicationHistory(previousHistory);
      console.error('Error updating medication:', error);
      return { error };
    }
  };

  const fetchMedicationHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('medication_history')
        .select('*, medications(name)')
        .eq('user_id', user.id)
        .order('taken_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching medication history:', error);
        return;
      }

      const historyWithNames = (data || []).map((entry: any) => ({
        ...entry,
        medication_name: entry.medications?.name || 'Unknown',
      }));

      setMedicationHistory(historyWithNames);
    } catch (error) {
      console.error('Error fetching medication history:', error);
    }
  };

  const fetchAppointmentHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('appointment_history')
        .select('*, appointments(doctor_name, appointment_type)')
        .eq('user_id', user.id)
        .order('action_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching appointment history:', error);
        return;
      }

      const historyWithDetails = (data || []).map((entry: any) => ({
        ...entry,
        doctor_name: entry.appointments?.doctor_name || 'Unknown',
        appointment_type: entry.appointments?.appointment_type || 'Unknown',
      }));

      setAppointmentHistory(historyWithDetails);
    } catch (error) {
      console.error('Error fetching appointment history:', error);
    }
  };

  const markAppointmentComplete = async (appointmentId: string, scheduledReminderTime?: string) => {
    if (!user) return;

    // Optimistic update
    const previousAppointments = appointments;
    const previousHistory = appointmentHistory;

    const nowIso = new Date().toISOString();
    setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status: 'completed' } : a));

    const appointment = appointments.find(a => a.id === appointmentId);
    const optimisticHistory: AppointmentHistoryEntry = {
      id: `temp-${Date.now()}`,
      appointment_id: appointmentId,
      user_id: user.id,
      action_type: 'completed',
      action_at: nowIso,
      scheduled_reminder_time: scheduledReminderTime || null,
      notes: null,
      doctor_name: appointment?.doctor_name,
      appointment_type: appointment?.appointment_type,
    } as any;

    setAppointmentHistory(prev => [optimisticHistory, ...prev].slice(0, 100));

    try {
      // Update appointment status
      const { data, error } = await supabase
        .from('appointments')
        .update({ status: 'completed' } as any)
        .eq('id', appointmentId)
        .eq('user_id', user.id)
        .select()
        .maybeSingle();

      if (error) {
        setAppointments(previousAppointments);
        setAppointmentHistory(previousHistory);
        console.error('Error updating appointment:', error);
        return { error };
      }

      // Add to appointment history
      const { error: historyError } = await supabase
        .from('appointment_history')
        .insert({
          appointment_id: appointmentId,
          user_id: user.id,
          action_type: 'completed',
          action_at: nowIso,
          scheduled_reminder_time: scheduledReminderTime || null,
        } as any);

      if (historyError) {
        setAppointmentHistory(previousHistory);
        console.error('Error adding to appointment history:', historyError);
      } else {
        fetchAppointmentHistory();
      }

      return { data, error: null };
    } catch (error) {
      setAppointments(previousAppointments);
      setAppointmentHistory(previousHistory);
      console.error('Error updating appointment:', error);
      return { error };
    }
  };

  return (
    <UserDataContext.Provider value={{
      profile,
      medications,
      appointments,
      medicationHistory,
      appointmentHistory,
      loading,
      addMedication,
      addAppointment,
      updateProfile,
      deleteMedication,
      deleteAppointment,
      updateMedication,
      updateAppointment,
      markMedicationTaken,
      markAppointmentComplete,
      fetchMedicationHistory,
      fetchAppointmentHistory,
      refetchData: fetchUserData,
    }}>
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};
