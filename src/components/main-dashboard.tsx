import { useState, useMemo, useEffect } from "react";
import { MobileContainer } from "@/components/ui/mobile-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Bell, 
  Calendar, 
  Heart, 
  User, 
  Pill, 
  Activity,
  Clock,
  Plus,
  LogOut,
  CheckCircle,
  Volume2,
  Pencil,
  Trash2
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUserData, Medication, Appointment } from "@/hooks/use-user-data";
import { useNotifications } from "@/hooks/use-notifications";
import { MedicationScreen } from "./medication-screen";
import { AppointmentScreen } from "./appointment-screen";
import { ProfileScreen } from "./profile-screen";
import { AddScheduleDialog } from "./add-schedule-dialog";
import { AddScheduleForm } from "./add-schedule-form";
import { BottomNavigation } from "./bottom-navigation";
import { MedicationAlarmOverlay } from "./medication-alarm-overlay";
import { EditMedicationDialog } from "./edit-medication-dialog";
import { EditAppointmentDialog } from "./edit-appointment-dialog";
import { toast } from "sonner";

export const MainDashboard = () => {
  const [activeScreen, setActiveScreen] = useState<"dashboard" | "medications" | "appointments" | "profile">("dashboard");
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [testingAlert, setTestingAlert] = useState(false);
  const [testingMedVoice, setTestingMedVoice] = useState<string | null>(null);
  const [testingAptVoice, setTestingAptVoice] = useState<string | null>(null);
  const [showEditMedDialog, setShowEditMedDialog] = useState(false);
  const [showEditAptDialog, setShowEditAptDialog] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const { signOut, user } = useAuth();
  const { profile, medications, appointments, loading, refetchData, markMedicationTaken, deleteMedication, deleteAppointment, updateMedication, updateAppointment } = useUserData();
  const { permission, requestPermission, playVoiceAlert, activeAlarm, dismissAlarm, snoozeAlarm } = useNotifications();

  // Request notification permission on mount
  useEffect(() => {
    if (permission.default) {
      toast.info('Enable notifications to get medication reminders with voice alerts', {
        action: {
          label: 'Enable',
          onClick: requestPermission,
        },
        duration: 10000,
      });
    }
  }, [permission.default, requestPermission]);

  // Test voice alert function
  const handleTestAlert = async () => {
    setTestingAlert(true);
    try {
      const testMed = medications[0];
      const testMessage = testMed 
        ? `Test alert. It's time to take your medication. ${testMed.name}, ${testMed.dosage}${testMed.instructions ? `. Instructions: ${testMed.instructions}` : ''}`
        : "Test alert. It's time to take your medication. This is a test of the voice alert system.";
      
      await playVoiceAlert(testMessage, 'test-alert', 'medication');
      toast.success("Voice alert test completed!");
    } catch (error) {
      console.error("Test alert failed:", error);
      toast.error("Voice alert test failed - check console");
    } finally {
      setTestingAlert(false);
    }
  };

  // Test medication voice alert
  const handleTestMedVoice = async (medication: Medication) => {
    setTestingMedVoice(medication.id);
    try {
      const instructionText = medication.instructions 
        ? `. Instructions: ${medication.instructions}` 
        : '';
      const voiceMessage = `It's time to take your medication. ${medication.name}, ${medication.dosage}${instructionText}`;
      await playVoiceAlert(voiceMessage);
      toast.success("Voice alert played successfully");
    } catch (error) {
      console.error("Voice test failed:", error);
      toast.error("Voice alert failed");
    } finally {
      setTestingMedVoice(null);
    }
  };

  // Test appointment voice alert
  const handleTestAptVoice = async (apt: Appointment) => {
    setTestingAptVoice(apt.id);
    try {
      const appointmentDate = new Date(apt.appointment_date);
      const formattedTime = appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const formattedDate = appointmentDate.toLocaleDateString();
      const voiceMessage = `You have an appointment with Doctor ${apt.doctor_name} for ${apt.appointment_type} on ${formattedDate} at ${formattedTime}`;
      await playVoiceAlert(voiceMessage);
      toast.success("Voice alert played successfully");
    } catch (error) {
      console.error("Voice test failed:", error);
      toast.error("Voice alert failed");
    } finally {
      setTestingAptVoice(null);
    }
  };

  // Edit medication
  const handleEditMedication = (medication: Medication) => {
    setEditingMedication(medication);
    setShowEditMedDialog(true);
  };

  // Edit appointment
  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowEditAptDialog(true);
  };

  // Delete medication
  const handleDeleteMedication = async (medicationId: string, medicationName: string) => {
    if (window.confirm(`Are you sure you want to delete ${medicationName}?`)) {
      const result = await deleteMedication(medicationId);
      if (!result?.error) {
        toast.success("Medication deleted successfully");
      } else {
        toast.error("Failed to delete medication");
      }
    }
  };

  // Delete appointment
  const handleDeleteAppointment = async (appointmentId: string, doctorName: string) => {
    if (window.confirm(`Are you sure you want to delete the appointment with Dr. ${doctorName}?`)) {
      const result = await deleteAppointment(appointmentId);
      if (!result?.error) {
        toast.success("Appointment deleted successfully");
      } else {
        toast.error("Failed to delete appointment");
      }
    }
  };

  const handleMarkComplete = async (itemId: string, itemType: 'medication' | 'appointment') => {
    if (itemType === 'medication') {
      const isCurrentlyTaken = isMedicationTakenToday(itemId) || completedItems.has(itemId);
      if (!isCurrentlyTaken) {
        setCompletedItems(prev => new Set([...prev, itemId]));
        // Also update in the database
        await markMedicationTaken(itemId, true);
      }
    } else {
      setCompletedItems(prev => new Set([...prev, itemId]));
    }
  };

  const isMedicationTakenToday = (medicationId: string) => {
    const medication = medications.find(m => m.id === medicationId);
    if (!medication?.last_taken) return false;
    const takenDate = new Date(medication.last_taken);
    const today = new Date();
    return takenDate.toDateString() === today.toDateString();
  };


  // Calculate health metrics and medication adherence
  const healthMetrics = useMemo(() => {
    const activeMedications = medications.filter(med => med.is_active).length;
    const upcomingAppointments = appointments.filter(apt => 
      new Date(apt.appointment_date) >= new Date()
    ).length;
    
    // Calculate medication adherence for today
    const today = new Date();
    const medicationsScheduledToday = medications.filter(med => {
      if (!med.is_active || !med.reminder_times || med.reminder_times.length === 0) return false;
      const startDate = new Date(med.start_date);
      return startDate <= today;
    });
    
    const medicationsTakenToday = medicationsScheduledToday.filter(med => {
      if (!med.last_taken) return false;
      const takenDate = new Date(med.last_taken);
      return takenDate.toDateString() === today.toDateString();
    }).length;
    
    const totalScheduledToday = medicationsScheduledToday.length;
    const adherencePercentage = totalScheduledToday > 0 
      ? Math.round((medicationsTakenToday / totalScheduledToday) * 100)
      : 100;
    
    // Calculate health score with adherence weight
    let score = 50; // Base score
    
    // Adherence is the most important factor
    score += adherencePercentage * 0.3; // Up to 30 points
    
    // Add points for having medications (indicates care management)
    if (activeMedications > 0) score += 10;
    
    // Add points for having upcoming appointments
    if (upcomingAppointments > 0) score += 10;
    
    // Add points for complete profile
    if (profile?.full_name && profile?.phone) score += 5;
    
    return {
      healthScore: Math.min(Math.round(score), 100),
      adherencePercentage,
      medicationsTakenToday,
      totalScheduledToday,
      steps: Math.floor(Math.random() * 5000) + 5000, // Simulated steps
      heartRate: Math.floor(Math.random() * 20) + 60, // Simulated heart rate
    };
  }, [medications, appointments, profile]);

  if (activeScreen === "medications") {
    return (
      <MedicationScreen 
        onBack={() => setActiveScreen("dashboard")} 
        onNavigate={setActiveScreen}
        activeScreen={activeScreen}
      />
    );
  }

  if (activeScreen === "appointments") {
    return (
      <AppointmentScreen 
        onBack={() => setActiveScreen("dashboard")} 
        onNavigate={setActiveScreen}
        activeScreen={activeScreen}
      />
    );
  }

  if (activeScreen === "profile") {
    return (
      <ProfileScreen 
        onBack={() => setActiveScreen("dashboard")} 
        onNavigate={setActiveScreen}
        activeScreen={activeScreen}
      />
    );
  }
  return (
    <MobileContainer>
      {/* Header */}
      <div className="bg-gradient-to-br from-care-blue to-care-blue-dark text-white p-6 pb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-xl font-semibold">Welcome back,</h1>
            <p className="text-blue-100">
              {profile?.full_name || user?.email?.split('@')[0] || 'User'}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20"
              onClick={handleTestAlert}
              disabled={testingAlert}
              title="Test voice alert"
            >
              <Volume2 className={`h-5 w-5 ${testingAlert ? 'animate-pulse' : ''}`} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`text-white hover:bg-white/20 relative ${!permission.granted ? 'animate-pulse' : ''}`}
              onClick={!permission.granted ? requestPermission : undefined}
              title={permission.granted ? 'Notifications enabled' : 'Click to enable notifications'}
            >
              <Bell className="h-5 w-5" />
              {permission.granted && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-care-green rounded-full border-2 border-care-blue"></span>
              )}
              {!permission.granted && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-care-orange rounded-full border-2 border-care-blue"></span>
              )}
            </Button>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-10 h-10 bg-white/20 rounded-full text-white hover:bg-white/30"
              onClick={() => setActiveScreen("profile")}
            >
              <User className="h-6 w-6" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Today's Health Score</p>
                <p className="text-2xl font-bold">{healthMetrics.healthScore}%</p>
                <p className="text-xs text-blue-200">
                  Based on adherence & care management
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Heart className="h-6 w-6 text-red-300" />
              </div>
            </div>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Medication Adherence</p>
                <p className="text-2xl font-bold">{healthMetrics.adherencePercentage}%</p>
                <p className="text-xs text-blue-200">
                  {healthMetrics.medicationsTakenToday} of {healthMetrics.totalScheduledToday} taken today
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Pill className="h-6 w-6 text-green-300" />
              </div>
            </div>
            <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-2 bg-green-300 rounded-full transition-all duration-500" 
                style={{ width: `${healthMetrics.adherencePercentage}%` }}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-6 -mt-4">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button 
            variant="outline" 
            className="h-20 flex-col space-y-2 border-care-blue/20"
            onClick={() => setActiveScreen("medications")}
          >
            <Pill className="h-6 w-6 text-care-blue" />
            <span className="text-sm">Medications</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex-col space-y-2 border-care-blue/20"
            onClick={() => setActiveScreen("appointments")}
          >
            <Calendar className="h-6 w-6 text-care-blue" />
            <span className="text-sm">Appointments</span>
          </Button>
        </div>

        {/* Add to Schedule Form */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Add to Schedule</h2>
          <AddScheduleForm onScheduleAdded={refetchData} />
        </div>

        {/* Today's Schedule */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Today's Schedule</h2>
          </div>

          <div className="space-y-3">
            {loading ? (
              <p className="text-care-gray">Loading...</p>
            ) : (
              <>
                {medications.slice(0, 3).map((medication) => {
                  const formatTime = (time: string) => {
                    const [hours, minutes] = time.split(':');
                    const hour24 = parseInt(hours);
                    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                    const ampm = hour24 >= 12 ? 'PM' : 'AM';
                    return `${hour12}:${minutes} ${ampm}`;
                  };

                  const taken = isMedicationTakenToday(medication.id) || completedItems.has(medication.id);
                  const statusColor = taken ? 'border-l-green-500' : 'border-l-care-orange';
                  const statusBg = taken ? 'bg-green-50' : 'bg-care-orange/5';
                  
                  return (
                    <Card key={medication.id} className={`p-4 border-l-4 ${statusColor} ${statusBg} transition-all duration-300`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            taken ? 'bg-green-500 text-white' : 'bg-care-orange text-white animate-pulse'
                          }`}>
                            {taken ? <CheckCircle className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-lg">{medication.name}</p>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                taken ? 'bg-green-500 text-white' : 'bg-care-orange text-white animate-pulse'
                              }`}>
                                {taken ? '✓ COMPLETED' : 'PENDING'}
                              </span>
                            </div>
                            <p className="text-sm text-care-gray font-medium">{medication.dosage} • {medication.frequency}</p>
                            {medication.reminder_times && medication.reminder_times.length > 0 && (
                              <div className="flex items-center text-sm text-care-blue mt-1 font-medium">
                                <Clock className="h-4 w-4 mr-1" />
                                <span className="font-bold">
                                  {medication.reminder_times.map(time => formatTime(time)).join(', ')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          {medication.enable_notifications && (
                            <div className="flex items-center text-xs text-care-blue">
                              <Bell className="h-3 w-3 mr-1" />
                              {medication.sound_alert ? 'Sound Alert' : 'Silent'}
                            </div>
                          )}
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0 text-care-blue hover:bg-care-blue/10"
                              onClick={() => handleTestMedVoice(medication)}
                              disabled={testingMedVoice === medication.id}
                              title="Test voice alert"
                            >
                              <Volume2 className={`h-3.5 w-3.5 ${testingMedVoice === medication.id ? 'animate-pulse' : ''}`} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0 text-care-blue hover:bg-care-blue/10"
                              onClick={() => handleEditMedication(medication)}
                              title="Edit medication"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/20"
                              onClick={() => handleDeleteMedication(medication.id, medication.name)}
                              title="Delete medication"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <Button
                            size="sm" 
                            variant="outline"
                            className={`h-7 text-xs ${
                              taken 
                                ? 'border-green-500 text-green-500 bg-green-50' 
                                : 'border-care-green text-care-green hover:bg-care-green hover:text-white'
                            }`}
                            onClick={() => taken ? setActiveScreen("medications") : handleMarkComplete(medication.id, 'medication')}
                          >
                            {taken ? 'View Details' : 'Mark Complete'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
                
                {appointments.slice(0, 1).map((appointment) => {
                  const appointmentDate = new Date(appointment.appointment_date);
                  const formatAppointmentTime = (date: Date) => {
                    const hours = date.getHours();
                    const minutes = date.getMinutes();
                    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
                  };

                  const isCompleted = completedItems.has(appointment.id);
                  const statusColor = isCompleted ? 'border-l-green-500' : 'border-l-care-blue';
                  const statusBg = isCompleted ? 'bg-green-50' : 'bg-care-blue/5';

                  return (
                    <Card key={appointment.id} className={`p-4 border-l-4 ${statusColor} ${statusBg} transition-all duration-300`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            isCompleted ? 'bg-green-500 text-white' : 'bg-care-blue text-white'
                          }`}>
                            {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Calendar className="h-5 w-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-lg">Dr. {appointment.doctor_name}</p>
                              {isCompleted && (
                                <span className="text-xs px-2 py-1 rounded-full font-medium bg-green-500 text-white">
                                  ✓ COMPLETED
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-care-gray font-medium">{appointment.appointment_type}</p>
                            <div className="flex items-center text-sm text-care-blue mt-1">
                              <Clock className="h-4 w-4 mr-1" />
                              <span className="font-bold">
                                {appointmentDate.toLocaleDateString()} at {formatAppointmentTime(appointmentDate)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            appointment.is_virtual 
                              ? 'bg-care-green text-white' 
                              : 'bg-care-blue text-white'
                          }`}>
                            {appointment.is_virtual ? 'Virtual' : 'In-Person'}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0 text-care-blue hover:bg-care-blue/10"
                              onClick={() => handleTestAptVoice(appointment)}
                              disabled={testingAptVoice === appointment.id}
                              title="Test voice alert"
                            >
                              <Volume2 className={`h-3.5 w-3.5 ${testingAptVoice === appointment.id ? 'animate-pulse' : ''}`} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 w-7 p-0 text-care-blue hover:bg-care-blue/10"
                              onClick={() => handleEditAppointment(appointment)}
                              title="Edit appointment"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/20"
                              onClick={() => handleDeleteAppointment(appointment.id, appointment.doctor_name)}
                              title="Delete appointment"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <Button
                            size="sm" 
                            variant="outline"
                            className={`h-7 text-xs ${
                              isCompleted
                                ? 'border-green-500 text-green-500 bg-green-50'
                                : 'border-care-blue text-care-blue hover:bg-care-blue hover:text-white'
                            }`}
                            onClick={() => isCompleted ? setActiveScreen("appointments") : handleMarkComplete(appointment.id, 'appointment')}
                          >
                            {isCompleted ? 'View Details' : 'Mark Complete'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
                
                {medications.length === 0 && appointments.length === 0 && (
                  <Card className="p-6 text-center bg-care-gray-light">
                    <div className="w-16 h-16 bg-care-gray/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="h-8 w-8 text-care-gray" />
                    </div>
                    <p className="text-care-gray font-medium mb-2">No scheduled items today</p>
                    <p className="text-sm text-care-gray mb-4">Add medications or appointments to get started</p>
                    <AddScheduleDialog onScheduleAdded={refetchData} />
                  </Card>
                )}
              </>
            )}
          </div>
        </div>

        {/* Health Metrics */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Health Metrics</h2>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-6 text-center bg-gradient-to-br from-care-blue-light to-white border-care-blue/20">
              <Activity className="h-10 w-10 text-care-blue mx-auto mb-3" />
              <p className="text-3xl font-bold text-care-blue">{healthMetrics.steps.toLocaleString()}</p>
              <p className="text-sm text-care-gray font-medium">Steps Today</p>
              <div className="mt-2 h-2 bg-care-gray-light rounded-full">
                <div className="h-2 bg-care-blue rounded-full" style={{ width: `${Math.min((healthMetrics.steps / 10000) * 100, 100)}%` }}></div>
              </div>
            </Card>
            <Card className="p-6 text-center bg-gradient-to-br from-care-red-light to-white border-care-red/20">
              <Heart className="h-10 w-10 text-care-red mx-auto mb-3" />
              <p className="text-3xl font-bold text-care-red">{healthMetrics.heartRate}</p>
              <p className="text-sm text-care-gray font-medium">Heart Rate (BPM)</p>
              <div className="mt-2 flex justify-center">
                <div className="w-2 h-2 bg-care-red rounded-full animate-pulse"></div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeScreen={activeScreen} onNavigate={setActiveScreen} />
      
      {/* Medication Alarm Overlay */}
      <MedicationAlarmOverlay 
        activeAlarm={activeAlarm}
        onDismiss={dismissAlarm}
        onSnooze={snoozeAlarm}
        onMarkTaken={async (id) => {
          await markMedicationTaken(id, true);
        }}
      />
      
      {/* Edit Dialogs */}
      <EditMedicationDialog 
        open={showEditMedDialog} 
        onOpenChange={setShowEditMedDialog} 
        medication={editingMedication}
        onUpdate={updateMedication}
      />
      <EditAppointmentDialog 
        open={showEditAptDialog} 
        onOpenChange={setShowEditAptDialog} 
        appointment={editingAppointment}
        onUpdate={updateAppointment}
      />
    </MobileContainer>
  );
};