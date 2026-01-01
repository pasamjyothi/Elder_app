import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle, X, Volume2, Clock, Bell, Pill, Calendar } from "lucide-react";
import { toast } from "sonner";

interface MedicationAlarmOverlayProps {
  activeAlarm: {
    id: string;
    type: 'medication' | 'appointment';
    title: string;
    message: string;
    scheduledTime?: string;
    audio?: HTMLAudioElement;
  } | null;
  onDismiss: () => void;
  onSnooze: (minutes: number) => void;
  onMarkTaken: (id: string, scheduledTime?: string) => Promise<void>;
}

export const MedicationAlarmOverlay = ({ 
  activeAlarm, 
  onDismiss, 
  onSnooze, 
  onMarkTaken 
}: MedicationAlarmOverlayProps) => {
  const [showSnoozeOptions, setShowSnoozeOptions] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!activeAlarm) return null;

  const handleMarkTaken = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      if (activeAlarm.type === 'medication') {
        await onMarkTaken(activeAlarm.id, activeAlarm.scheduledTime);
        toast.success("Medication marked as taken!");
      } else {
        toast.success("Appointment reminder acknowledged!");
      }
      onDismiss();
    } catch (error) {
      toast.error("Failed to mark medication as taken");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = () => {
    onDismiss();
    toast.info("Alarm dismissed");
  };

  const handleSnooze = (minutes: number) => {
    onSnooze(minutes);
    setShowSnoozeOptions(false);
    toast.success(`Snoozed for ${minutes} minutes`);
  };

  const isAppointment = activeAlarm.type === 'appointment';

  return (
    <Dialog open={!!activeAlarm} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-md border-2 border-care-orange">
        <DialogHeader className="text-center">
          <div className={`w-20 h-20 ${isAppointment ? 'bg-care-blue' : 'bg-care-orange'} rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse`}>
            {isAppointment ? (
              <Calendar className="h-10 w-10 text-white" />
            ) : (
              <Pill className="h-10 w-10 text-white animate-bounce" />
            )}
          </div>
          <DialogTitle className={`text-2xl font-bold ${isAppointment ? 'text-care-blue' : 'text-care-orange'}`}>
            {activeAlarm.title}
          </DialogTitle>
          <DialogDescription className="text-base text-foreground mt-2">
            {activeAlarm.message}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {showSnoozeOptions ? (
            <div className="space-y-3">
              <p className="text-sm text-care-gray text-center">Snooze for:</p>
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
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={handleMarkTaken}
                  disabled={isProcessing}
                  className="bg-care-green hover:bg-care-green/90 text-white flex-1 h-12 text-base"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  {isAppointment ? 'Acknowledge' : 'Mark as Taken'}
                </Button>
              </div>
              
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => setShowSnoozeOptions(true)}
                  variant="outline"
                  className="flex-1 border-care-gray text-care-gray hover:bg-care-gray/10"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Snooze
                </Button>
                
                <Button
                  onClick={handleDismiss}
                  variant="outline"
                  className={`flex-1 ${isAppointment ? 'border-care-blue text-care-blue hover:bg-care-blue/10' : 'border-care-orange text-care-orange hover:bg-care-orange/10'}`}
                >
                  <X className="h-4 w-4 mr-2" />
                  Dismiss
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                {isAppointment 
                  ? 'Acknowledge, snooze, or dismiss the reminder'
                  : 'Mark as taken, snooze, or dismiss the alarm'
                }
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
