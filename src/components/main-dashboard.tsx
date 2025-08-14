import { useState } from "react";
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

export const MainDashboard = () => {
  const [activeScreen, setActiveScreen] = useState<"dashboard" | "medications" | "appointments">("dashboard");
  const { signOut, user } = useAuth();
  const { profile, medications, appointments, loading } = useUserData();

  if (activeScreen === "medications") {
    return <MedicationScreen onBack={() => setActiveScreen("dashboard")} />;
  }

  if (activeScreen === "appointments") {
    return <AppointmentScreen onBack={() => setActiveScreen("dashboard")} />;
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
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <User className="h-6 w-6" />
            </div>
          </div>
        </div>

        <Card className="bg-white/10 backdrop-blur-sm border-white/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Today's Health Score</p>
              <p className="text-2xl font-bold">85%</p>
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
            <Button variant="ghost" size="sm" className="text-care-blue">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          <div className="space-y-3">
            {loading ? (
              <p className="text-care-gray">Loading...</p>
            ) : (
              <>
                {medications.slice(0, 2).map((medication) => (
                  <Card key={medication.id} className="p-4 border-l-4 border-l-care-green">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{medication.name}</p>
                        <p className="text-sm text-care-gray">{medication.dosage} - {medication.frequency}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Active</p>
                        <div className="flex items-center text-xs text-care-green">
                          <Clock className="h-3 w-3 mr-1" />
                          Daily
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                
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
            <Card className="p-4 text-center">
              <Activity className="h-8 w-8 text-care-blue mx-auto mb-2" />
              <p className="text-2xl font-bold">7,245</p>
              <p className="text-sm text-care-gray">Steps Today</p>
            </Card>
            <Card className="p-4 text-center">
              <Heart className="h-8 w-8 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">72</p>
              <p className="text-sm text-care-gray">Heart Rate</p>
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
          <Button variant="ghost" size="sm" className="flex-col space-y-1 text-care-gray">
            <User className="h-5 w-5" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </div>
    </MobileContainer>
  );
};