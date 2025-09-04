import { useState, useMemo } from "react";
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
  CheckCircle
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUserData } from "@/hooks/use-user-data";
import { MedicationScreen } from "./medication-screen";
import { AppointmentScreen } from "./appointment-screen";
import { ProfileScreen } from "./profile-screen";
import { AddScheduleDialog } from "./add-schedule-dialog";
import { AddScheduleForm } from "./add-schedule-form";
import { BottomNavigation } from "./bottom-navigation";

export const MainDashboard = () => {
  const [activeScreen, setActiveScreen] = useState<"dashboard" | "medications" | "appointments" | "profile">("dashboard");
  const { signOut, user } = useAuth();
  const { profile, medications, appointments, loading, refetchData } = useUserData();

  // Calculate health metrics based on real data
  const healthMetrics = useMemo(() => {
    const activeMedications = medications.filter(med => med.is_active).length;
    const upcomingAppointments = appointments.filter(apt => 
      new Date(apt.appointment_date) >= new Date()
    ).length;
    
    // Simple health score calculation (you can make this more sophisticated)
    let score = 70; // Base score
    
    // Add points for having medications (indicates care management)
    if (activeMedications > 0) score += 10;
    
    // Add points for having upcoming appointments
    if (upcomingAppointments > 0) score += 15;
    
    // Add points for complete profile
    if (profile?.full_name && profile?.phone) score += 5;
    
    return {
      healthScore: Math.min(score, 100),
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
            <h1 className="text-xl font-semibold">Good Morning,</h1>
            <p className="text-blue-100">
              {profile?.full_name || user?.email?.split('@')[0] || 'User'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <Bell className="h-5 w-5" />
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

        <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Today's Health Score</p>
              <p className="text-2xl font-bold">{healthMetrics.healthScore}%</p>
              <p className="text-xs text-blue-200">
                Based on medications, appointments & profile
              </p>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Heart className="h-6 w-6 text-red-300" />
            </div>
          </div>
        </Card>
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

                  const isTakenToday = () => {
                    if (!medication.last_taken) return false;
                    const takenDate = new Date(medication.last_taken);
                    const today = new Date();
                    return takenDate.toDateString() === today.toDateString();
                  };

                  const taken = isTakenToday();
                  const statusColor = taken ? 'border-l-care-green' : 'border-l-care-orange';
                  const statusBg = taken ? 'bg-care-green/5' : 'bg-care-orange/5';
                  
                  return (
                    <Card key={medication.id} className={`p-4 border-l-4 ${statusColor} ${statusBg} transition-all duration-300`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            taken ? 'bg-care-green text-white' : 'bg-care-orange text-white animate-pulse'
                          }`}>
                            {taken ? <CheckCircle className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-lg">{medication.name}</p>
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                taken ? 'bg-care-green text-white' : 'bg-care-orange text-white animate-pulse'
                              }`}>
                                {taken ? '✓ TAKEN' : 'PENDING'}
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
                          <Button
                            size="sm" 
                            variant="outline"
                            className={`h-7 text-xs ${
                              taken 
                                ? 'border-care-orange text-care-orange hover:bg-care-orange hover:text-white' 
                                : 'border-care-green text-care-green hover:bg-care-green hover:text-white'
                            }`}
                            onClick={() => setActiveScreen("medications")}
                          >
                            {taken ? 'View' : 'Mark Taken'}
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

                  return (
                    <Card key={appointment.id} className="p-4 border-l-4 border-l-care-blue bg-care-blue/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-care-blue text-white rounded-full flex items-center justify-center">
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-lg">Dr. {appointment.doctor_name}</p>
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
                          <Button
                            size="sm" 
                            variant="outline"
                            className="h-7 text-xs border-care-blue text-care-blue hover:bg-care-blue hover:text-white"
                            onClick={() => setActiveScreen("appointments")}
                          >
                            View Details
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
    </MobileContainer>
  );
};