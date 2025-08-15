import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useUserData } from "@/hooks/use-user-data";
import { useToast } from "@/hooks/use-toast";

interface AddAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddAppointmentDialog = ({ open, onOpenChange }: AddAppointmentDialogProps) => {
  const [formData, setFormData] = useState({
    doctor_name: "",
    appointment_type: "",
    appointment_date: "",
    appointment_time: "",
    duration_minutes: 30,
    notes: "",
    is_virtual: false
  });
  const [loading, setLoading] = useState(false);
  const { addAppointment } = useUserData();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.doctor_name || !formData.appointment_type || !formData.appointment_date || !formData.appointment_time) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Combine date and time for the appointment_date field
      const appointmentDateTime = new Date(`${formData.appointment_date}T${formData.appointment_time}`);
      
      const result = await addAppointment({
        doctor_name: formData.doctor_name,
        appointment_type: formData.appointment_type,
        appointment_date: appointmentDateTime.toISOString(),
        duration_minutes: formData.duration_minutes,
        notes: formData.notes || undefined,
        status: "scheduled",
        is_virtual: formData.is_virtual
      });

      if (result?.error) {
        toast({
          title: "Error",
          description: "Failed to schedule appointment. Please try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Success",
          description: "Appointment scheduled successfully!"
        });
        setFormData({
          doctor_name: "",
          appointment_type: "",
          appointment_date: "",
          appointment_time: "",
          duration_minutes: 30,
          notes: "",
          is_virtual: false
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
      <DialogContent className="w-[90%] max-w-md">
        <DialogHeader>
          <DialogTitle>Schedule Appointment</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="doctor_name">Doctor Name *</Label>
            <Input
              id="doctor_name"
              value={formData.doctor_name}
              onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
              placeholder="e.g., Dr. Smith"
            />
          </div>

          <div>
            <Label htmlFor="appointment_type">Appointment Type *</Label>
            <Input
              id="appointment_type"
              value={formData.appointment_type}
              onChange={(e) => setFormData({ ...formData, appointment_type: e.target.value })}
              placeholder="e.g., General Checkup, Consultation"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="appointment_date">Date *</Label>
              <Input
                id="appointment_date"
                type="date"
                value={formData.appointment_date}
                onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label htmlFor="appointment_time">Time *</Label>
              <Input
                id="appointment_time"
                type="time"
                value={formData.appointment_time}
                onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="duration_minutes">Duration (minutes)</Label>
            <Input
              id="duration_minutes"
              type="number"
              value={formData.duration_minutes}
              onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 30 })}
              min="15"
              max="240"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_virtual"
              checked={formData.is_virtual}
              onCheckedChange={(checked) => setFormData({ ...formData, is_virtual: checked })}
            />
            <Label htmlFor="is_virtual">Virtual Appointment</Label>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes or symptoms"
              rows={3}
            />
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
              {loading ? "Scheduling..." : "Schedule Appointment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};