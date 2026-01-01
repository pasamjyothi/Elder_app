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
  Bell,
  Volume2,
  Pencil
} from "lucide-react";
import { useUserData } from "@/hooks/use-user-data";
import { useNotifications } from "@/hooks/use-notifications";
import { AddMedicationDialog } from "./add-medication-dialog";
import { EditMedicationDialog } from "./edit-medication-dialog";
import { MedicationAlarmOverlay } from "./medication-alarm-overlay";
import { MedicationHistory } from "./medication-history";
import { AddScheduleDialog } from "./add-schedule-dialog";
import { AddScheduleForm } from "./add-schedule-form";
import { BottomNavigation } from "./bottom-navigation";
import { toast } from "sonner";
import { Medication } from "@/hooks/use-user-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MedicationScreenProps {
  onBack: () => void;
  onNavigate: (screen: "dashboard" | "medications" | "appointments" | "profile") => void;
  activeScreen: "dashboard" | "medications" | "appointments" | "profile";
}

export const MedicationScreen = ({ onBack, onNavigate, activeScreen }: MedicationScreenProps) => {
  const { medications, medicationHistory, loading, deleteMedication, markMedicationTaken, updateMedication } = useUserData();
  const { playVoiceAlert, activeAlarm, dismissAlarm, snoozeAlarm } = useNotifications();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [testingVoice, setTestingVoice] = useState<string | null>(null);

  const handleEditMedication = (medication: Medication) => {
    setEditingMedication(medication);
    setShowEditDialog(true);
  };

  const handleTestVoiceAlert = async (medication: typeof medications[0]) => {
    setTestingVoice(medication.id);
    try {
      const instructionText = medication.instructions 
        ? `. Instructions: ${medication.instructions}` 
        : '';
      const voiceMessage = `It's time to take your medication. ${medication.name}, ${medication.dosage}${instructionText}`;
      await playVoiceAlert(voiceMessage);
      toast.success("Voice alert played successfully");
    } catch (error) {
      console.error("Voice test failed:", error);
      toast.error("Voice alert failed - check console for details");
    } finally {
      setTestingVoice(null);
    }
  };

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
          <div className="flex gap-2">
            <AddScheduleDialog onScheduleAdded={() => {}} />
            <Button className="bg-white/20 hover:bg-white/30 text-white" onClick={() => setShowAddDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Med
            </Button>
          </div>
        </div>
      </div>

      {/* Medications List */}
      <div className="px-6 pb-24">
        {/* Add to Schedule Form */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Add to Schedule</h2>
          <AddScheduleForm onScheduleAdded={() => {}} />
        </div>
        
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
                            <div className="flex items-center text-xs text-care-blue mt-1 font-medium">
                              <Bell className="h-3 w-3 mr-1" />
                              Times: {med.reminder_times.map(time => {
                                const [hours, minutes] = time.split(':');
                                const hour24 = parseInt(hours);
                                const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
                                const ampm = hour24 >= 12 ? 'PM' : 'AM';
                                return `${hour12}:${minutes} ${ampm}`;
                              }).join(', ')}
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
                        
                        <div className="flex gap-1 flex-wrap justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 text-care-blue hover:bg-care-blue/10"
                            onClick={() => handleTestVoiceAlert(med)}
                            disabled={testingVoice === med.id}
                            title="Test voice alert"
                          >
                            <Volume2 className={`h-3.5 w-3.5 ${testingVoice === med.id ? 'animate-pulse' : ''}`} />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0 text-care-blue hover:bg-care-blue/10"
                            onClick={() => handleEditMedication(med)}
                            title="Edit medication"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/20"
                            onClick={() => handleDeleteMedication(med.id, med.name)}
                            title="Delete medication"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            size="sm"
                            className={`h-7 px-2 text-[10px] font-medium ${
                              takenToday 
                                ? 'bg-care-orange hover:bg-care-orange/90 text-white' 
                                : 'bg-care-green hover:bg-care-green/90 text-white'
                            }`}
                            onClick={() => handleMarkTaken(med.id, !takenToday)}
                          >
                            {takenToday ? 'Not Taken' : 'Taken'}
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

        {/* Medication History */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-care-blue" />
            Medication History
          </h2>
          <MedicationHistory history={medicationHistory} loading={loading} />
        </div>

        {/* Quick Stats */}
        {medications.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mt-6">
            <Card className="p-4 text-center">
              <Calendar className="h-8 w-8 text-care-blue mx-auto mb-2" />
              <p className="text-2xl font-bold">{medications.filter(m => m.is_active).length}</p>
              <p className="text-sm text-care-gray">Active Meds</p>
            </Card>
            <Card className="p-4 text-center">
              <Pill className="h-8 w-8 text-care-green mx-auto mb-2" />
              <p className="text-2xl font-bold">{medicationHistory.length}</p>
              <p className="text-sm text-care-gray">Times Taken</p>
            </Card>
          </div>
        )}
      </div>
      
      <AddMedicationDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
      <EditMedicationDialog 
        open={showEditDialog} 
        onOpenChange={setShowEditDialog} 
        medication={editingMedication}
        onUpdate={updateMedication}
      />
      <MedicationAlarmOverlay 
        activeAlarm={activeAlarm}
        onDismiss={dismissAlarm}
        onSnooze={snoozeAlarm}
        onMarkTaken={async (id, scheduledTime) => {
          await markMedicationTaken(id, true, scheduledTime);
        }}
      />
      
      <BottomNavigation activeScreen={activeScreen} onNavigate={onNavigate} />
    </MobileContainer>
  );
};