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
import { useUserData } from "@/hooks/use-user-data";

interface MedicationScreenProps {
  onBack: () => void;
}

export const MedicationScreen = ({ onBack }: MedicationScreenProps) => {
  const { medications, loading } = useUserData();

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
            <p className="text-blue-100">Active Medications</p>
            <p className="text-2xl font-bold">{medications.length} total</p>
          </div>
          <Button className="bg-white/20 hover:bg-white/30 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Med
          </Button>
        </div>
      </div>

      {/* Medications List */}
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Your Medications</h2>
          
          {loading ? (
            <p className="text-care-gray">Loading medications...</p>
          ) : medications.length === 0 ? (
            <Card className="p-6 text-center">
              <Pill className="h-12 w-12 text-care-gray mx-auto mb-4" />
              <p className="text-care-gray font-medium mb-2">No medications added</p>
              <p className="text-sm text-care-gray mb-4">Add your medications to track your schedule</p>
              <Button className="bg-care-blue hover:bg-care-blue-dark text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add First Medication
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {medications.map((med) => (
                <Card key={med.id} className={`p-4 ${med.is_active ? 'border-care-green/30' : 'border-care-gray/30'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        med.is_active ? 'bg-care-green text-white' : 'bg-care-gray/20 text-care-gray'
                      }`}>
                        <Pill className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-medium">{med.name}</p>
                        <p className="text-sm text-care-gray">{med.dosage} • {med.frequency}</p>
                        {med.instructions && (
                          <p className="text-xs text-care-gray mt-1">{med.instructions}</p>
                        )}
                        <div className="flex items-center text-xs text-care-gray mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          Started: {new Date(med.start_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        med.is_active 
                          ? 'bg-care-green/20 text-care-green' 
                          : 'bg-care-gray/20 text-care-gray'
                      }`}>
                        {med.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {medications.length > 0 && (
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 text-center">
              <Calendar className="h-8 w-8 text-care-blue mx-auto mb-2" />
              <p className="text-2xl font-bold">{medications.filter(m => m.is_active).length}</p>
              <p className="text-sm text-care-gray">Active Meds</p>
            </Card>
            <Card className="p-4 text-center">
              <Pill className="h-8 w-8 text-care-green mx-auto mb-2" />
              <p className="text-2xl font-bold">{medications.length}</p>
              <p className="text-sm text-care-gray">Total Meds</p>
            </Card>
          </div>
        )}
      </div>
    </MobileContainer>
  );
};