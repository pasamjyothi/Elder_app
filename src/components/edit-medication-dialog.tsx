import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Medication } from "@/hooks/use-user-data";
import { useToast } from "@/hooks/use-toast";
import { Plus, X } from "lucide-react";

interface EditMedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medication: Medication | null;
  onUpdate: (medicationId: string, updates: Partial<Omit<Medication, 'id' | 'user_id'>>) => Promise<{ error: any } | { data: any; error: null } | undefined>;
}

export const EditMedicationDialog = ({ open, onOpenChange, medication, onUpdate }: EditMedicationDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    dosage: "",
    frequency: "",
    instructions: "",
    start_date: "",
    end_date: "",
    enable_notifications: true,
    sound_alert: true,
    is_active: true,
  });
  const [reminderTimes, setReminderTimes] = useState<string[]>(["08:00"]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (medication) {
      setFormData({
        name: medication.name,
        dosage: medication.dosage,
        frequency: medication.frequency,
        instructions: medication.instructions || "",
        start_date: medication.start_date,
        end_date: medication.end_date || "",
        enable_notifications: medication.enable_notifications ?? true,
        sound_alert: medication.sound_alert ?? true,
        is_active: medication.is_active ?? true,
      });
      setReminderTimes(medication.reminder_times?.length ? medication.reminder_times : ["08:00"]);
    }
  }, [medication]);

  const addReminderTime = () => {
    setReminderTimes([...reminderTimes, "08:00"]);
  };

  const removeReminderTime = (index: number) => {
    setReminderTimes(reminderTimes.filter((_, i) => i !== index));
  };

  const updateReminderTime = (index: number, time: string) => {
    const updated = [...reminderTimes];
    updated[index] = time;
    setReminderTimes(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medication) return;
    
    if (!formData.name || !formData.dosage || !formData.frequency) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await onUpdate(medication.id, {
        name: formData.name,
        dosage: formData.dosage,
        frequency: formData.frequency,
        instructions: formData.instructions || null,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        is_active: formData.is_active,
        reminder_times: formData.enable_notifications ? reminderTimes : [],
        enable_notifications: formData.enable_notifications,
        sound_alert: formData.sound_alert,
      });

      if (result?.error) {
        toast({
          title: "Error",
          description: "Failed to update medication. Please try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Medication updated successfully!"
        });
        onOpenChange(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90%] max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Medication</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Medication Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Aspirin"
            />
          </div>

          <div>
            <Label htmlFor="dosage">Dosage *</Label>
            <Input
              id="dosage"
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              placeholder="e.g., 100mg"
            />
          </div>

          <div>
            <Label htmlFor="frequency">Frequency *</Label>
            <Input
              id="frequency"
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              placeholder="e.g., Once daily, Twice daily"
            />
          </div>

          <div>
            <Label htmlFor="start_date">Start Date</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="end_date">End Date (Optional)</Label>
            <Input
              id="end_date"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="instructions">Instructions (Optional)</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="e.g., Take with food"
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Active Medication</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
          </div>

          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium text-care-blue">Reminder Settings</h3>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="enable_notifications">Enable Reminders</Label>
              <Switch
                id="enable_notifications"
                checked={formData.enable_notifications}
                onCheckedChange={(checked) => setFormData({ ...formData, enable_notifications: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="sound_alert">Sound Alert (Buzz)</Label>
              <Switch
                id="sound_alert"
                checked={formData.sound_alert}
                onCheckedChange={(checked) => setFormData({ ...formData, sound_alert: checked })}
              />
            </div>

            {formData.enable_notifications && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Reminder Times</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addReminderTime}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {reminderTimes.map((time, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => updateReminderTime(index, e.target.value)}
                      className="flex-1"
                    />
                    {reminderTimes.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeReminderTime(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Set multiple times for medications that need to be taken throughout the day
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-care-blue hover:bg-care-blue-dark"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
