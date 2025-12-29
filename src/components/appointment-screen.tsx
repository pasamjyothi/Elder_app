import { useState } from "react";
import { MobileContainer } from "@/components/ui/mobile-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Plus, 
  Calendar, 
  Clock, 
  MapPin,
  Phone,
  Video,
  Volume2,
  Trash2,
  Pencil
} from "lucide-react";
import { useUserData } from "@/hooks/use-user-data";
import { useNotifications } from "@/hooks/use-notifications";
import { AddAppointmentDialog } from "./add-appointment-dialog";
import { EditAppointmentDialog } from "./edit-appointment-dialog";
import { AddScheduleDialog } from "./add-schedule-dialog";
import { AddScheduleForm } from "./add-schedule-form";
import { BottomNavigation } from "./bottom-navigation";
import { toast } from "sonner";
import { Appointment } from "@/hooks/use-user-data";

interface AppointmentScreenProps {
  onBack: () => void;
  onNavigate: (screen: "dashboard" | "medications" | "appointments" | "profile") => void;
  activeScreen: "dashboard" | "medications" | "appointments" | "profile";
}

export const AppointmentScreen = ({ onBack, onNavigate, activeScreen }: AppointmentScreenProps) => {
  const { appointments, loading, deleteAppointment, updateAppointment } = useUserData();
  const { playVoiceAlert } = useNotifications();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [filterType, setFilterType] = useState<"all" | "virtual" | "in-person">("all");
  const [testingVoice, setTestingVoice] = useState<string | null>(null);

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowEditDialog(true);
  };

  const handleTestVoiceAlert = async (apt: typeof appointments[0]) => {
    setTestingVoice(apt.id);
    try {
      const appointmentDate = new Date(apt.appointment_date);
      const formattedTime = appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const formattedDate = appointmentDate.toLocaleDateString();
      const voiceMessage = `You have an appointment with Doctor ${apt.doctor_name} for ${apt.appointment_type} on ${formattedDate} at ${formattedTime}${apt.notes ? `. Notes: ${apt.notes}` : ''}`;
      await playVoiceAlert(voiceMessage);
      toast.success("Voice alert played successfully");
    } catch (error) {
      console.error("Voice test failed:", error);
      toast.error("Voice alert failed - check console");
    } finally {
      setTestingVoice(null);
    }
  };

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

  const filteredAppointments = appointments.filter(apt => {
    if (filterType === "virtual") return apt.is_virtual;
    if (filterType === "in-person") return !apt.is_virtual;
    return true;
  });

  return (
    <MobileContainer>
      {/* Header */}
      <div className="bg-care-blue text-white p-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 mr-3" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Appointments</h1>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <p className="text-blue-100">
              {filterType === "virtual" ? "Virtual" : filterType === "in-person" ? "In-person" : "Upcoming"}
            </p>
            <p className="text-2xl font-bold">{filteredAppointments.length} appointments</p>
          </div>
          <div className="flex gap-2">
            <AddScheduleDialog onScheduleAdded={() => {}} />
            <Button className="bg-white/20 hover:bg-white/30 text-white" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Book
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-6 pb-4">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setFilterType("all")}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              filterType === "all"
                ? "bg-white text-care-blue shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType("virtual")}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              filterType === "virtual"
                ? "bg-white text-care-blue shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Virtual
          </button>
          <button
            onClick={() => setFilterType("in-person")}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              filterType === "in-person"
                ? "bg-white text-care-blue shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            In-person
          </button>
        </div>
      </div>

      {/* Appointments List */}
      <div className="px-6 pb-24">
        {/* Add to Schedule Form */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Add to Schedule</h2>
          <AddScheduleForm onScheduleAdded={() => {}} />
        </div>

        {loading ? (
          <p className="text-care-gray">Loading appointments...</p>
        ) : filteredAppointments.length === 0 ? (
          <Card className="p-6 text-center">
            <Calendar className="h-12 w-12 text-care-gray mx-auto mb-4" />
            <p className="text-care-gray font-medium mb-2">
              {filterType === "virtual" 
                ? "No virtual appointments scheduled" 
                : filterType === "in-person"
                ? "No in-person appointments scheduled"
                : "No appointments scheduled"}
            </p>
            <p className="text-sm text-care-gray mb-4">Book your first appointment to get started</p>
            <Button className="bg-care-blue hover:bg-care-blue-dark text-white" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Book Appointment
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((apt) => {
              const appointmentDate = new Date(apt.appointment_date);
              const today = new Date();
              const isToday = appointmentDate.toDateString() === today.toDateString();
              
              return (
                <Card key={apt.id} className={`p-4 ${
                  isToday ? 'border-care-orange/50 bg-care-orange/5' : 'border-care-blue/20'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-medium text-lg">{apt.doctor_name}</p>
                      <p className="text-care-gray text-sm">{apt.appointment_type}</p>
                    </div>
                    {isToday && (
                      <div className="bg-care-orange text-white text-xs px-2 py-1 rounded-full">
                        Today
                      </div>
                    )}
                    <div className={`text-xs px-2 py-1 rounded-full ${
                      apt.status === 'scheduled' ? 'bg-care-blue/20 text-care-blue' :
                      apt.status === 'completed' ? 'bg-care-green/20 text-care-green' :
                      'bg-care-gray/20 text-care-gray'
                    }`}>
                      {apt.status}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 text-care-gray mr-2" />
                      <span>{appointmentDate.toLocaleDateString()} at {appointmentDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      {apt.is_virtual ? (
                        <Video className="h-4 w-4 text-care-blue mr-2" />
                      ) : (
                        <MapPin className="h-4 w-4 text-care-gray mr-2" />
                      )}
                      <span className="text-care-gray">{apt.is_virtual ? 'Virtual Appointment' : 'In-person'}</span>
                    </div>
                    
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 text-care-gray mr-2" />
                      <span className="text-care-gray">{apt.duration_minutes} minutes</span>
                    </div>
                    
                    {apt.notes && (
                      <p className="text-sm text-care-gray mt-2">{apt.notes}</p>
                    )}
                  </div>

                  <div className="flex space-x-2 flex-wrap gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0 text-care-blue hover:bg-care-blue/10"
                      onClick={() => handleTestVoiceAlert(apt)}
                      disabled={testingVoice === apt.id}
                      title="Test voice alert"
                    >
                      <Volume2 className={`h-3.5 w-3.5 ${testingVoice === apt.id ? 'animate-pulse' : ''}`} />
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0 text-care-blue hover:bg-care-blue/10"
                      onClick={() => handleEditAppointment(apt)}
                      title="Edit appointment"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-destructive hover:bg-destructive/20"
                      onClick={() => handleDeleteAppointment(apt.id, apt.doctor_name)}
                      title="Delete appointment"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>

                    {apt.is_virtual ? (
                      <Button size="sm" className="flex-1 h-7 text-xs bg-care-blue hover:bg-care-blue-dark text-white">
                        <Video className="h-3.5 w-3.5 mr-1" />
                        Join
                      </Button>
                    ) : (
                      <Button size="sm" className="flex-1 h-7 text-xs bg-care-blue hover:bg-care-blue-dark text-white">
                        <MapPin className="h-3.5 w-3.5 mr-1" />
                        Details
                      </Button>
                    )}
                    
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0 border-care-blue/20">
                      <Phone className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            className="h-16 flex-col space-y-2 border-care-blue/20"
            onClick={() => setShowAddDialog(true)}
          >
            <Calendar className="h-6 w-6 text-care-blue" />
            <span className="text-sm">Schedule</span>
          </Button>
          <Button 
            variant="outline" 
            className={`h-16 flex-col space-y-2 border-care-blue/20 ${
              filterType === "virtual" ? "bg-care-blue/10 border-care-blue" : ""
            }`}
            onClick={() => setFilterType("virtual")}
          >
            <Video className="h-6 w-6 text-care-blue" />
            <span className="text-sm">Telemedicine</span>
          </Button>
        </div>
      </div>
      
      <AddAppointmentDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      <EditAppointmentDialog 
        open={showEditDialog} 
        onOpenChange={setShowEditDialog} 
        appointment={editingAppointment}
        onUpdate={updateAppointment}
      />
      
      <BottomNavigation activeScreen={activeScreen} onNavigate={onNavigate} />
    </MobileContainer>
  );
};