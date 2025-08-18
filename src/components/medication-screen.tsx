import { useState } from "react";
import { MobileContainer } from "@/components/ui/mobile-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Plus, 
  Pill, 
  Clock, 
  Calendar,
  Check,
  Trash2,
  CheckCircle,
  XCircle,
  Bell
} from "lucide-react";
import { useUserData } from "@/hooks/use-user-data";
import { AddMedicationDialog } from "./add-medication-dialog";
import { MedicationAlarmOverlay } from "./medication-alarm-overlay";
import { toast } from "sonner";

interface MedicationScreenProps {
  onBack: () => void;
}

export const MedicationScreen = ({ onBack }: MedicationScreenProps) => {
  const { medications, loading, deleteMedication, markMedicationTaken } = useUserData();
  const [showAddDialog, setShowAddDialog] = useState(false);

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

  const handleMarkTaken = async (medicationId: string, taken: boolean) => {
    const result = await markMedicationTaken(medicationId, taken);
    if (!result?.error) {
      toast.success(taken ? "Marked as taken" : "Marked as not taken");
    } else {
      toast.error("Failed to update medication status");
    }
  };

  const isMedicationTakenToday = (lastTaken?: string) => {
    if (!lastTaken) return false;
    const takenDate = new Date(lastTaken);
    const today = new Date();
    return takenDate.toDateString() === today.toDateString();
  };

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
          <Button className="bg-white/20 hover:bg-white/30 text-white" onClick={() => setShowAddDialog(true)}>
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
              <Button className="bg-care-blue hover:bg-care-blue-dark text-white" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Medication
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {medications.map((med) => {
                const takenToday = isMedicationTakenToday(med.last_taken);
                return (
                  <Card key={med.id} className={`p-4 transition-all duration-300 ${
                    takenToday 
                      ? 'border-care-green bg-care-green/5 shadow-sm' 
                      : 'border-care-orange bg-care-orange/5 shadow-md'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                          takenToday 
                            ? 'bg-care-green text-white shadow-lg' 
                            : 'bg-care-orange text-white shadow-lg animate-pulse'
                        }`}>
                          {takenToday ? <CheckCircle className="h-6 w-6" /> : <Bell className="h-6 w-6" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{med.name}</p>
                            {!takenToday && (
                              <span className="text-xs bg-care-orange text-white px-2 py-1 rounded-full animate-pulse">
                                PENDING
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-care-gray">{med.dosage} • {med.frequency}</p>
                          {med.instructions && (
                            <p className="text-xs text-care-gray mt-1">{med.instructions}</p>
                          )}
                          <div className="flex items-center text-xs text-care-gray mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            Started: {new Date(med.start_date).toLocaleDateString()}
                          </div>
                          {med.reminder_times && med.reminder_times.length > 0 && (
                            <div className="flex items-center text-xs text-care-gray mt-1">
                              <Calendar className="h-3 w-3 mr-1" />
                              Reminders: {med.reminder_times.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                          takenToday 
                            ? 'bg-care-green text-white shadow-sm' 
                            : 'bg-care-orange text-white shadow-sm animate-pulse'
                        }`}>
                          {takenToday ? '✓ COMPLETED TODAY' : '⏰ NOT TAKEN'}
                        </span>
                        
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            className={`h-8 px-3 text-xs font-medium ${
                              takenToday 
                                ? 'bg-care-orange hover:bg-care-orange/90 text-white' 
                                : 'bg-care-green hover:bg-care-green/90 text-white'
                            }`}
                            onClick={() => handleMarkTaken(med.id, !takenToday)}
                          >
                            {takenToday ? 'Mark Not Taken' : 'Mark as Taken'}
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/20"
                            onClick={() => handleDeleteMedication(med.id, med.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
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
      
      <AddMedicationDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      <MedicationAlarmOverlay />
    </MobileContainer>
  );
};