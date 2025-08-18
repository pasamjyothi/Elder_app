import { useState, useEffect } from 'react';
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

export const useUserData = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      setProfile(null);
      setMedications([]);
      setAppointments([]);
      setLoading(false);
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch user profile
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

      // Fetch medications
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

      // Fetch upcoming appointments
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

      setMedications(prev => [data, ...prev]);
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

      setAppointments(prev => [...prev, data].sort((a, b) => 
        new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
      ));
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

      setMedications(prev => prev.filter(med => med.id !== medicationId));
      return { error: null };
    } catch (error) {
      console.error('Error deleting medication:', error);
      return { error };
    }
  };

  const markMedicationTaken = async (medicationId: string, taken: boolean) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('medications')
        .update({ 
          last_taken: taken ? new Date().toISOString() : null 
        } as any) // Type assertion to bypass TypeScript checking
        .eq('id', medicationId)
        .eq('user_id', user.id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Error updating medication:', error);
        return { error };
      }

      if (data) {
        setMedications(prev => prev.map(med => 
          med.id === medicationId ? { ...med, last_taken: (data as any).last_taken } : med
        ));
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('Error updating medication:', error);
      return { error };
    }
  };

  return {
    profile,
    medications,
    appointments,
    loading,
    addMedication,
    addAppointment,
    updateProfile,
    deleteMedication,
    markMedicationTaken,
    refetchData: fetchUserData,
  };
};