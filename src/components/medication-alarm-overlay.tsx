import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, CheckCircle, X } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { useUserData } from "@/hooks/use-user-data";
import { toast } from "sonner";

export const MedicationAlarmOverlay = () => {
  const { activeAlarm, dismissAlarm } = useNotifications();
  const { markMedicationTaken } = useUserData();

  if (!activeAlarm || activeAlarm.type !== 'medication') return null;

  const handleMarkTaken = async () => {
    const result = await markMedicationTaken(activeAlarm.id, true);
    if (!result?.error) {
      toast.success("Medication marked as taken!");
      dismissAlarm();
    } else {
      toast.error("Failed to mark medication as taken");
    }
  };

  const handleDismiss = () => {
    dismissAlarm();
    toast.info("Alarm dismissed");
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6 bg-care-orange/10 border-care-orange animate-pulse">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-care-orange rounded-full flex items-center justify-center mx-auto">
            <Bell className="h-8 w-8 text-white animate-bounce" />
          </div>
          
          <div>
            <h2 className="text-xl font-bold text-care-orange mb-2">
              {activeAlarm.title}
            </h2>
            <p className="text-care-gray">
              {activeAlarm.message}
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              onClick={handleMarkTaken}
              className="bg-care-green hover:bg-care-green/90 text-white flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Taken
            </Button>
            
            <Button
              onClick={handleDismiss}
              variant="outline"
              className="border-care-orange text-care-orange hover:bg-care-orange/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-xs text-care-gray">
            Tap "Mark as Taken" to complete your medication or dismiss to stop the alarm
          </p>
        </div>
      </Card>
    </div>
  );
};