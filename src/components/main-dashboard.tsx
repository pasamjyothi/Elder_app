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
  LogOut
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUserData } from "@/hooks/use-user-data";
import { MedicationScreen } from "./medication-screen";
import { AppointmentScreen } from "./appointment-screen";
import { ProfileScreen } from "./profile-screen";
import { AddScheduleDialog } from "./add-schedule-dialog";

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
    return <MedicationScreen onBack={() => setActiveScreen("dashboard")} />;
  }

  if (activeScreen === "appointments") {
    return <AppointmentScreen onBack={() => setActiveScreen("dashboard")} />;
  }

  if (activeScreen === "profile") {
    return <ProfileScreen onBack={() => setActiveScreen("dashboard")} />;
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

        {/* Today's Schedule */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Today's Schedule</h2>
            <AddScheduleDialog onScheduleAdded={refetchData} />
          </div>

          <div className="space-y-3">
            {loading ? (
              <p className="text-care-gray">Loading...</p>
            ) : (
              <>
                {medications.slice(0, 2).map((medication) => {
                  const formatTime = (time: string) => {
                    const [hours, minutes] = time.split(':');
                    const hour24 = parseInt(hours);
                    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                    const ampm = hour24 >= 12 ? 'PM' : 'AM';
                    return `${hour12}:${minutes} ${ampm}`;
                  };
                  
                  return (
                    <Card key={medication.id} className="p-4 border-l-4 border-l-care-green">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{medication.name}</p>
                          <p className="text-sm text-care-gray">{medication.dosage} - {medication.frequency}</p>
                          {medication.reminder_times && medication.reminder_times.length > 0 && (
                            <div className="flex items-center text-xs text-care-blue mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              {medication.reminder_times.map(time => formatTime(time)).join(', ')}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-care-green">Active</p>
                          <div className="flex items-center text-xs text-care-green">
                            <Bell className="h-3 w-3 mr-1" />
                            {medication.enable_notifications ? 'Alerts On' : 'Silent'}
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
                
                {appointments.slice(0, 1).map((appointment) => (
                  <Card key={appointment.id} className="p-4 border-l-4 border-l-care-orange">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{appointment.doctor_name}</p>
                        <p className="text-sm text-care-gray">{appointment.appointment_type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {new Date(appointment.appointment_date).toLocaleDateString()}
                        </p>
                        <div className="flex items-center text-xs text-care-orange">
                          <Clock className="h-3 w-3 mr-1" />
                          {appointment.is_virtual ? "Virtual" : "In-person"}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {medications.length === 0 && appointments.length === 0 && (
                  <Card className="p-4 text-center">
                    <p className="text-care-gray">No scheduled items today</p>
                    <p className="text-sm text-care-gray mt-2">Add medications or appointments to get started</p>
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
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="flex justify-around">
          <Button variant="ghost" size="sm" className="flex-col space-y-1 text-care-blue">
            <Activity className="h-5 w-5" />
            <span className="text-xs">Dashboard</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-col space-y-1 text-care-gray"
            onClick={() => setActiveScreen("appointments")}
          >
            <Calendar className="h-5 w-5" />
            <span className="text-xs">Schedule</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-col space-y-1 text-care-gray"
            onClick={() => setActiveScreen("medications")}
          >
            <Pill className="h-5 w-5" />
            <span className="text-xs">Meds</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-col space-y-1 text-care-gray"
            onClick={() => setActiveScreen("profile")}
          >
            <User className="h-5 w-5" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </div>
    </MobileContainer>
  );
};