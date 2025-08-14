import { MobileContainer } from "@/components/ui/mobile-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Plus, 
  Pill, 
  Clock, 
  Calendar,
  Check
} from "lucide-react";

interface MedicationScreenProps {
  onBack: () => void;
}

export const MedicationScreen = ({ onBack }: MedicationScreenProps) => {
  const medications = [
    {
      name: "Vitamin D3",
      dosage: "1000 IU",
      frequency: "Once daily",
      nextDose: "8:00 AM",
      taken: true
    },
    {
      name: "Omega-3",
      dosage: "1200mg",
      frequency: "Twice daily",
      nextDose: "6:00 PM",
      taken: false
    },
    {
      name: "Calcium",
      dosage: "500mg",
      frequency: "With meals",
      nextDose: "12:00 PM",
      taken: false
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
          <h1 className="text-xl font-semibold">Medications</h1>
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <p className="text-blue-100">Today's Progress</p>
            <p className="text-2xl font-bold">1 of 3 taken</p>
          </div>
          <Button className="bg-white/20 hover:bg-white/30 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Med
          </Button>
        </div>
      </div>

      {/* Today's Medications */}
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Today's Schedule</h2>
          
          <div className="space-y-4">
            {medications.map((med, index) => (
              <Card key={index} className={`p-4 ${med.taken ? 'bg-care-green/10 border-care-green/30' : 'border-care-blue/20'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      med.taken ? 'bg-care-green text-white' : 'bg-care-blue/10 text-care-blue'
                    }`}>
                      {med.taken ? <Check className="h-6 w-6" /> : <Pill className="h-6 w-6" />}
                    </div>
                    <div>
                      <p className="font-medium">{med.name}</p>
                      <p className="text-sm text-care-gray">{med.dosage} • {med.frequency}</p>
                      <div className="flex items-center text-xs text-care-gray mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        Next: {med.nextDose}
                      </div>
                    </div>
                  </div>
                  
                  {!med.taken && (
                    <Button size="sm" className="bg-care-blue hover:bg-care-blue-dark text-white">
                      Take Now
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 text-center">
            <Calendar className="h-8 w-8 text-care-blue mx-auto mb-2" />
            <p className="text-2xl font-bold">7</p>
            <p className="text-sm text-care-gray">Day Streak</p>
          </Card>
          <Card className="p-4 text-center">
            <Pill className="h-8 w-8 text-care-green mx-auto mb-2" />
            <p className="text-2xl font-bold">95%</p>
            <p className="text-sm text-care-gray">Adherence</p>
          </Card>
        </div>
      </div>
    </MobileContainer>
  );
};