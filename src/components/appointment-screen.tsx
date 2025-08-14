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

interface AppointmentScreenProps {
  onBack: () => void;
}

export const AppointmentScreen = ({ onBack }: AppointmentScreenProps) => {
  const appointments = [
    {
      doctor: "Dr. Sarah Smith",
      specialty: "Cardiologist",
      date: "Today",
      time: "2:30 PM",
      type: "In-person",
      location: "Medical Center, Room 205",
      status: "upcoming"
    },
    {
      doctor: "Dr. Michael Chen",
      specialty: "General Practitioner",
      date: "Tomorrow",
      time: "10:00 AM",
      type: "Telemedicine",
      location: "Video Call",
      status: "scheduled"
    },
    {
      doctor: "Dr. Lisa Johnson",
      specialty: "Dermatologist",
      date: "Dec 20",
      time: "3:15 PM",
      type: "In-person",
      location: "Skin Clinic, Floor 3",
      status: "scheduled"
    }
  ];

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
            <p className="text-2xl font-bold">3 appointments</p>
          </div>
          <Button className="bg-white/20 hover:bg-white/30 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Book
          </Button>
        </div>
      </div>

      {/* Appointments List */}
      <div className="p-6">
        <div className="space-y-4">
          {appointments.map((apt, index) => (
            <Card key={index} className={`p-4 ${
              apt.status === 'upcoming' ? 'border-care-orange/50 bg-care-orange/5' : 'border-care-blue/20'
            }`}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-medium text-lg">{apt.doctor}</p>
                  <p className="text-care-gray text-sm">{apt.specialty}</p>
                </div>
                {apt.status === 'upcoming' && (
                  <div className="bg-care-orange text-white text-xs px-2 py-1 rounded-full">
                    Today
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 text-care-gray mr-2" />
                  <span>{apt.date} at {apt.time}</span>
                </div>
                
                <div className="flex items-center text-sm">
                  {apt.type === 'Telemedicine' ? (
                    <Video className="h-4 w-4 text-care-blue mr-2" />
                  ) : (
                    <MapPin className="h-4 w-4 text-care-gray mr-2" />
                  )}
                  <span className="text-care-gray">{apt.location}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                {apt.type === 'Telemedicine' ? (
                  <Button size="sm" className="flex-1 bg-care-blue hover:bg-care-blue-dark text-white">
                    <Video className="h-4 w-4 mr-2" />
                    Join Call
                  </Button>
                ) : (
                  <Button size="sm" className="flex-1 bg-care-blue hover:bg-care-blue-dark text-white">
                    <MapPin className="h-4 w-4 mr-2" />
                    Directions
                  </Button>
                )}
                
                <Button variant="outline" size="sm" className="border-care-blue/20">
                  <Phone className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

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