import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar, Plus, Pill, X } from "lucide-react";
import { useUserData } from "@/hooks/use-user-data";
import { toast } from "sonner";

interface AddScheduleDialogProps {
  onScheduleAdded: () => void;
}

export const AddScheduleDialog = ({ onScheduleAdded }: AddScheduleDialogProps) => {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"medication" | "appointment">("medication");
  const [loading, setLoading] = useState(false);
  const { addMedication, addAppointment } = useUserData();
  
  const [medicationData, setMedicationData] = useState({
    name: "",
    dosage: "",
    frequency: "daily",
    instructions: "",
    start_date: new Date().toISOString().split('T')[0],
    end_date: "",
    enable_notifications: true,
    sound_alert: true,
  });

  const [reminderTimes, setReminderTimes] = useState<string[]>(["08:00"]);

  const [appointmentData, setAppointmentData] = useState({
    doctor_name: "",
    appointment_type: "",
    appointment_date: "",
    appointment_time: "",
    duration_minutes: 30,
    is_virtual: false,
    notes: "",
    reminder_minutes: 30,
    enable_notifications: true,
  });

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
    setLoading(true);

    try {
      if (type === "medication") {
        await addMedication({
          ...medicationData,
          end_date: medicationData.end_date || null,
          is_active: true,
          reminder_times: medicationData.enable_notifications ? reminderTimes : [],
        });
        toast.success("Medication added successfully");
      } else {
        const appointmentDateTime = new Date(`${appointmentData.appointment_date}T${appointmentData.appointment_time}`);
        await addAppointment({
          doctor_name: appointmentData.doctor_name,
          appointment_type: appointmentData.appointment_type,
          appointment_date: appointmentDateTime.toISOString(),
          duration_minutes: appointmentData.duration_minutes,
          is_virtual: appointmentData.is_virtual,
          notes: appointmentData.notes || undefined,
          reminder_minutes: appointmentData.reminder_minutes,
          enable_notifications: appointmentData.enable_notifications,
          status: "scheduled",
          notification_sent: false,
        });
        toast.success("Appointment scheduled successfully");
      }

      // Reset forms
      setMedicationData({
        name: "",
        dosage: "",
        frequency: "daily",
        instructions: "",
        start_date: new Date().toISOString().split('T')[0],
        end_date: "",
        enable_notifications: true,
        sound_alert: true,
      });
      setReminderTimes(["08:00"]);
      setAppointmentData({
        doctor_name: "",
        appointment_type: "",
        appointment_date: "",
        appointment_time: "",
        duration_minutes: 30,
        is_virtual: false,
        notes: "",
        reminder_minutes: 30,
        enable_notifications: true,
      });

      setOpen(false);
      onScheduleAdded();
    } catch (error) {
      toast.error(`Failed to add ${type}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-care-blue">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add to Schedule</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selection */}
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={(value: "medication" | "appointment") => setType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="medication">
                  <div className="flex items-center">
                    <Pill className="h-4 w-4 mr-2" />
                    Medication
                  </div>
                </SelectItem>
                <SelectItem value="appointment">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Appointment
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "medication" ? (
            <>
              <div>
                <Label htmlFor="med-name">Medication Name *</Label>
                <Input
                  id="med-name"
                  value={medicationData.name}
                  onChange={(e) => setMedicationData({ ...medicationData, name: e.target.value })}
                  placeholder="Enter medication name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="dosage">Dosage *</Label>
                <Input
                  id="dosage"
                  value={medicationData.dosage}
                  onChange={(e) => setMedicationData({ ...medicationData, dosage: e.target.value })}
                  placeholder="e.g., 500mg, 1 tablet"
                  required
                />
              </div>

              <div>
                <Label>Frequency *</Label>
                <Select 
                  value={medicationData.frequency} 
                  onValueChange={(value) => setMedicationData({ ...medicationData, frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="twice_daily">Twice Daily</SelectItem>
                    <SelectItem value="three_times_daily">Three Times Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="as_needed">As Needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={medicationData.start_date}
                  onChange={(e) => setMedicationData({ ...medicationData, start_date: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="end-date">End Date (Optional)</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={medicationData.end_date}
                  onChange={(e) => setMedicationData({ ...medicationData, end_date: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={medicationData.instructions}
                  onChange={(e) => setMedicationData({ ...medicationData, instructions: e.target.value })}
                  placeholder="Special instructions..."
                  rows={2}
                />
              </div>

              {/* Medication Reminder Settings */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium text-care-blue">Reminder Settings</h3>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="enable_med_notifications">Enable Reminders</Label>
                  <Switch
                    id="enable_med_notifications"
                    checked={medicationData.enable_notifications}
                    onCheckedChange={(checked) => setMedicationData({ ...medicationData, enable_notifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="sound_alert">Sound Alert (Buzz)</Label>
                  <Switch
                    id="sound_alert"
                    checked={medicationData.sound_alert}
                    onCheckedChange={(checked) => setMedicationData({ ...medicationData, sound_alert: checked })}
                  />
                </div>

                {medicationData.enable_notifications && (
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
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="doctor-name">Doctor Name *</Label>
                <Input
                  id="doctor-name"
                  value={appointmentData.doctor_name}
                  onChange={(e) => setAppointmentData({ ...appointmentData, doctor_name: e.target.value })}
                  placeholder="Enter doctor's name"
                  required
                />
              </div>

              <div>
                <Label>Appointment Type *</Label>
                <Select
                  value={appointmentData.appointment_type}
                  onValueChange={(value) => setAppointmentData({ ...appointmentData, appointment_type: value })}
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
                <Label htmlFor="appointment-date">Date *</Label>
                <Input
                  id="appointment-date"
                  type="date"
                  value={appointmentData.appointment_date}
                  onChange={(e) => setAppointmentData({ ...appointmentData, appointment_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div>
                <Label htmlFor="appointment-time">Time *</Label>
                <Input
                  id="appointment-time"
                  type="time"
                  value={appointmentData.appointment_time}
                  onChange={(e) => setAppointmentData({ ...appointmentData, appointment_time: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Duration</Label>
                <Select 
                  value={appointmentData.duration_minutes.toString()} 
                  onValueChange={(value) => setAppointmentData({ ...appointmentData, duration_minutes: parseInt(value) })}
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
                  checked={appointmentData.is_virtual}
                  onCheckedChange={(checked) => setAppointmentData({ ...appointmentData, is_virtual: checked })}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={appointmentData.notes}
                  onChange={(e) => setAppointmentData({ ...appointmentData, notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={2}
                />
              </div>

              {/* Appointment Reminder Settings */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium text-care-blue">Reminder Settings</h3>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="enable_appt_notifications">Enable Reminder</Label>
                  <Switch
                    id="enable_appt_notifications"
                    checked={appointmentData.enable_notifications}
                    onCheckedChange={(checked) => setAppointmentData({ ...appointmentData, enable_notifications: checked })}
                  />
                </div>

                {appointmentData.enable_notifications && (
                  <div>
                    <Label htmlFor="reminder_minutes">Remind me (minutes before)</Label>
                    <Select
                      value={appointmentData.reminder_minutes.toString()}
                      onValueChange={(value) => setAppointmentData({ ...appointmentData, reminder_minutes: parseInt(value) })}
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
            </>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Adding..." : `Add ${type === "medication" ? "Medication" : "Appointment"}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
