import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, X, Volume2, Clock } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { useUserData } from "@/hooks/use-user-data";
import { toast } from "sonner";

export const MedicationAlarmOverlay = () => {
  const { activeAlarm, dismissAlarm, snoozeAlarm } = useNotifications();
  const { markMedicationTaken } = useUserData();
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);

  if (!activeAlarm) return null;

  const handleMarkTaken = async () => {
    if (activeAlarm.type === 'medication') {
      const result = await markMedicationTaken(activeAlarm.id, true);
      if (!result?.error) {
        toast.success("Medication marked as taken!");
        dismissAlarm();
      } else {
        toast.error("Failed to mark medication as taken");
      }
    } else {
      // For appointments, just dismiss
      toast.success("Appointment reminder acknowledged!");
      dismissAlarm();
    }
  };

  const handleDismiss = () => {
    dismissAlarm();
    toast.info("Alarm dismissed");
  };

  const handleSnooze = (minutes: number) => {
    snoozeAlarm(minutes);
    setShowSnoozeOptions(false);
    toast.success(`Snoozed for ${minutes} minutes`);
  };

  const isAppointment = activeAlarm.type === 'appointment';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className={`w-full max-w-md p-6 ${isAppointment ? 'bg-care-blue/10 border-care-blue' : 'bg-care-orange/10 border-care-orange'} animate-pulse`}>
        <div className="text-center space-y-4">
          <div className={`w-16 h-16 ${isAppointment ? 'bg-care-blue' : 'bg-care-orange'} rounded-full flex items-center justify-center mx-auto`}>
            <Volume2 className="h-8 w-8 text-white animate-bounce" />
          </div>
          
          <div>
            <h2 className={`text-xl font-bold ${isAppointment ? 'text-care-blue' : 'text-care-orange'} mb-2`}>
              {activeAlarm.title}
            </h2>
            <p className="text-care-gray">
              {activeAlarm.message}
            </p>
          </div>

          {showSnoozeOptions ? (
            <div className="space-y-3">
              <p className="text-sm text-care-gray">Snooze for:</p>
              <div className="flex gap-2 justify-center flex-wrap">
                {[5, 10, 15, 30].map((mins) => (
                  <Button
                    key={mins}
                    onClick={() => handleSnooze(mins)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Clock className="h-3 w-3" />
                    {mins} min
                  </Button>
                ))}
              </div>
              <Button
                onClick={() => setShowSnoozeOptions(false)}
                variant="ghost"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={handleMarkTaken}
                  className="bg-care-green hover:bg-care-green/90 text-white flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isAppointment ? 'Acknowledge' : 'Mark as Taken'}
                </Button>
                
                <Button
                  onClick={() => setShowSnoozeOptions(true)}
                  variant="outline"
                  className="border-care-gray text-care-gray hover:bg-care-gray/10"
                >
                  <Clock className="h-4 w-4" />
                </Button>
                
                <Button
                  onClick={handleDismiss}
                  variant="outline"
                  className={`${isAppointment ? 'border-care-blue text-care-blue hover:bg-care-blue/10' : 'border-care-orange text-care-orange hover:bg-care-orange/10'}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-xs text-care-gray">
                {isAppointment 
                  ? 'Acknowledge, snooze, or dismiss the reminder'
                  : 'Mark as taken, snooze, or dismiss the alarm'
                }
              </p>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};
