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

interface UserDataContextType {
  profile: UserProfile | null;
  medications: Medication[];
  appointments: Appointment[];
  medicationHistory: MedicationHistoryEntry[];
  loading: boolean;
  addMedication: (medication: Omit<Medication, 'id' | 'user_id'>) => Promise<{ data?: Medication; error: any } | undefined>;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'user_id'>) => Promise<{ data?: Appointment; error: any } | undefined>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ data?: UserProfile; error: any } | undefined>;
  deleteMedication: (medicationId: string) => Promise<{ error: any } | undefined>;
  deleteAppointment: (appointmentId: string) => Promise<{ error: any } | undefined>;
  updateMedication: (medicationId: string, updates: Partial<Omit<Medication, 'id' | 'user_id'>>) => Promise<{ data?: Medication; error: any } | undefined>;
  updateAppointment: (appointmentId: string, updates: Partial<Omit<Appointment, 'id' | 'user_id'>>) => Promise<{ data?: Appointment; error: any } | undefined>;
  markMedicationTaken: (medicationId: string, taken: boolean, scheduledTime?: string) => Promise<{ data?: any; error: any } | undefined>;
  fetchMedicationHistory: () => Promise<void>;
  refetchData: () => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const UserDataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicationHistory, setMedicationHistory] = useState<MedicationHistoryEntry[]>([]);
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
        .gte('appointment_date', new Date().toISOString())
        .order('appointment_date', { ascending: true });

      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError);
      } else {
        setAppointments(appointmentsData || []);
      }

      await fetchMedicationHistory();
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMedication = async (medication: Omit<Medication, 'id' | 'user_id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('medications')
        .insert([{ ...medication, user_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error('Error adding medication:', error);
        return { error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error adding medication:', error);
      return { error };
    }
  };

  const addAppointment = async (appointment: Omit<Appointment, 'id' | 'user_id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([{ ...appointment, user_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error('Error adding appointment:', error);
        return { error };
      }

      return { data, error: null };
    } catch (error) {
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

    try {
      const { error } = await supabase
        .from('medications')
        .delete()
        .eq('id', medicationId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting medication:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Error deleting medication:', error);
      return { error };
    }
  };

  const deleteAppointment = async (appointmentId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting appointment:', error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Error deleting appointment:', error);
      return { error };
    }
  };

  const updateMedication = async (medicationId: string, updates: Partial<Omit<Medication, 'id' | 'user_id'>>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('medications')
        .update(updates as any)
        .eq('id', medicationId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating medication:', error);
        return { error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error updating medication:', error);
      return { error };
    }
  };

  const updateAppointment = async (appointmentId: string, updates: Partial<Omit<Appointment, 'id' | 'user_id'>>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates as any)
        .eq('id', appointmentId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating appointment:', error);
        return { error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error updating appointment:', error);
      return { error };
    }
  };

  const markMedicationTaken = async (medicationId: string, taken: boolean, scheduledTime?: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('medications')
        .update({ 
          last_taken: taken ? new Date().toISOString() : null 
        } as any)
        .eq('id', medicationId)
        .eq('user_id', user.id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error updating medication:', error);
        return { error };
      }

      if (taken) {
        const { error: historyError } = await supabase
          .from('medication_history')
          .insert({
            medication_id: medicationId,
            user_id: user.id,
            taken_at: new Date().toISOString(),
            scheduled_time: scheduledTime || null,
          } as any);

        if (historyError) {
          console.error('Error adding to medication history:', historyError);
        }
      }
      
      return { data, error: null };
    } catch (error) {
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

  return (
    <UserDataContext.Provider value={{
      profile,
      medications,
      appointments,
      medicationHistory,
      loading,
      addMedication,
      addAppointment,
      updateProfile,
      deleteMedication,
      deleteAppointment,
      updateMedication,
      updateAppointment,
      markMedicationTaken,
      fetchMedicationHistory,
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
