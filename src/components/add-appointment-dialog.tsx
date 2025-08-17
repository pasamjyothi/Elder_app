import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    is_virtual: false,
    reminder_minutes: 30,
    enable_notifications: true,
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
        is_virtual: formData.is_virtual,
        reminder_minutes: formData.reminder_minutes,
        enable_notifications: formData.enable_notifications,
        notification_sent: false,
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
          description: "Appointment scheduled successfully with reminder!"
        });
        setFormData({
          doctor_name: "",
          appointment_type: "",
          appointment_date: "",
          appointment_time: "",
          duration_minutes: 30,
          notes: "",
          is_virtual: false,
          reminder_minutes: 30,
          enable_notifications: true,
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
            <Select
              value={formData.appointment_type}
              onValueChange={(value) => setFormData({ ...formData, appointment_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select appointment type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="General Checkup">General Checkup</SelectItem>
                <SelectItem value="Follow-up">Follow-up</SelectItem>
                <SelectItem value="Consultation">Consultation</SelectItem>
                <SelectItem value="Emergency">Emergency</SelectItem>
                <SelectItem value="Specialist">Specialist</SelectItem>
                <SelectItem value="Lab Results">Lab Results</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

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

          <div>
            <Label htmlFor="duration">Duration</Label>
            <Select
              value={formData.duration_minutes.toString()}
              onValueChange={(value) => setFormData({ ...formData, duration_minutes: parseInt(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 minutes</SelectItem>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_virtual">Virtual Appointment</Label>
            <Switch
              id="is_virtual"
              checked={formData.is_virtual}
              onCheckedChange={(checked) => setFormData({ ...formData, is_virtual: checked })}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes..."
              rows={3}
            />
          </div>

          {/* Notification Settings */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium text-care-blue">Reminder Settings</h3>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="enable_notifications">Enable Reminder</Label>
              <Switch
                id="enable_notifications"
                checked={formData.enable_notifications}
                onCheckedChange={(checked) => setFormData({ ...formData, enable_notifications: checked })}
              />
            </div>

            {formData.enable_notifications && (
              <div>
                <Label htmlFor="reminder_minutes">Remind me (minutes before)</Label>
                <Select
                  value={formData.reminder_minutes.toString()}
                  onValueChange={(value) => setFormData({ ...formData, reminder_minutes: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="1440">1 day</SelectItem>
                  </SelectContent>
                </Select>
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
              {loading ? "Scheduling..." : "Schedule Appointment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};