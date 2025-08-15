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

interface AppointmentScreenProps {
  onBack: () => void;
}

export const AppointmentScreen = ({ onBack }: AppointmentScreenProps) => {
  const { appointments, loading } = useUserData();

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
            <p className="text-blue-100">Upcoming</p>
            <p className="text-2xl font-bold">{appointments.length} appointments</p>
          </div>
          <Button className="bg-white/20 hover:bg-white/30 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Book
          </Button>
        </div>
      </div>

      {/* Appointments List */}
      <div className="p-6">
        {loading ? (
          <p className="text-care-gray">Loading appointments...</p>
        ) : appointments.length === 0 ? (
          <Card className="p-6 text-center">
            <Calendar className="h-12 w-12 text-care-gray mx-auto mb-4" />
            <p className="text-care-gray font-medium mb-2">No appointments scheduled</p>
            <p className="text-sm text-care-gray mb-4">Book your first appointment to get started</p>
            <Button className="bg-care-blue hover:bg-care-blue-dark text-white">
              <Plus className="h-4 w-4 mr-2" />
              Book Appointment
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((apt) => {
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
          <Button variant="outline" className="h-16 flex-col space-y-2 border-care-blue/20">
            <Calendar className="h-6 w-6 text-care-blue" />
            <span className="text-sm">Schedule</span>
          </Button>
          <Button variant="outline" className="h-16 flex-col space-y-2 border-care-blue/20">
            <Video className="h-6 w-6 text-care-blue" />
            <span className="text-sm">Telemedicine</span>
          </Button>
        </div>
      </div>
    </MobileContainer>
  );
};