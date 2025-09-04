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
  Video
} from "lucide-react";
import { useUserData } from "@/hooks/use-user-data";
import { AddAppointmentDialog } from "./add-appointment-dialog";
import { AddScheduleDialog } from "./add-schedule-dialog";
import { AddScheduleForm } from "./add-schedule-form";
import { BottomNavigation } from "./bottom-navigation";

interface AppointmentScreenProps {
  onBack: () => void;
  onNavigate: (screen: "dashboard" | "medications" | "appointments" | "profile") => void;
  activeScreen: "dashboard" | "medications" | "appointments" | "profile";
}

export const AppointmentScreen = ({ onBack, onNavigate, activeScreen }: AppointmentScreenProps) => {
  const { appointments, loading } = useUserData();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "virtual" | "in-person">("all");

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

                  <div className="flex space-x-2">
                    {apt.is_virtual ? (
                      <Button size="sm" className="flex-1 bg-care-blue hover:bg-care-blue-dark text-white">
                        <Video className="h-4 w-4 mr-2" />
                        Join Call
                      </Button>
                    ) : (
                      <Button size="sm" className="flex-1 bg-care-blue hover:bg-care-blue-dark text-white">
                        <MapPin className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    )}
                    
                    <Button variant="outline" size="sm" className="border-care-blue/20">
                      <Phone className="h-4 w-4" />
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
      
      <BottomNavigation activeScreen={activeScreen} onNavigate={onNavigate} />
    </MobileContainer>
  );
};