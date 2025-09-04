import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Calendar, Plus, Clock, Pill, X } from "lucide-react";
import { useUserData } from "@/hooks/use-user-data";
import { toast } from "sonner";

interface AddScheduleFormProps {
  onScheduleAdded: () => void;
}

export const AddScheduleForm = ({ onScheduleAdded }: AddScheduleFormProps) => {
  const [type, setType] = useState<"medication" | "appointment">("medication");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
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
    duration_minutes: 30,
    is_virtual: false,
    notes: "",
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

  const resetForms = () => {
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
      duration_minutes: 30,
      is_virtual: false,
      notes: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (type === "medication") {
        if (!medicationData.name || !medicationData.dosage) {
          toast.error("Please fill in all required fields");
          return;
        }
        
        await addMedication({
          ...medicationData,
          end_date: medicationData.end_date || null,
          is_active: true,
          reminder_times: medicationData.enable_notifications ? reminderTimes : [],
        });
        toast.success("Medication added successfully");
      } else {
        if (!appointmentData.doctor_name || !appointmentData.appointment_type || !appointmentData.appointment_date) {
          toast.error("Please fill in all required fields");
          return;
        }
        
        await addAppointment({
          ...appointmentData,
          appointment_date: new Date(appointmentData.appointment_date).toISOString(),
          status: "scheduled",
        });
        toast.success("Appointment scheduled successfully");
      }

      resetForms();
      setShowForm(false);
      onScheduleAdded();
    } catch (error) {
      toast.error(`Failed to add ${type}`);
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <Button 
        onClick={() => setShowForm(true)}
        className="w-full bg-care-blue hover:bg-care-blue-dark text-white"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add to Schedule
      </Button>
    );
  }

  return (
    <Card className="p-4 border-care-blue/20 bg-care-blue/5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-care-blue">Add New Item</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowForm(false);
            resetForms();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="med-name">Name *</Label>
                <Input
                  id="med-name"
                  value={medicationData.name}
                  onChange={(e) => setMedicationData({ ...medicationData, name: e.target.value })}
                  placeholder="Medicine name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="dosage">Dosage *</Label>
                <Input
                  id="dosage"
                  value={medicationData.dosage}
                  onChange={(e) => setMedicationData({ ...medicationData, dosage: e.target.value })}
                  placeholder="e.g., 500mg"
                  required
                />
              </div>
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

            <div className="grid grid-cols-2 gap-3">
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
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={medicationData.end_date}
                  onChange={(e) => setMedicationData({ ...medicationData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={medicationData.instructions}
                onChange={(e) => setMedicationData({ ...medicationData, instructions: e.target.value })}
                placeholder="Take with food..."
                rows={2}
              />
            </div>

            {/* Reminder Settings */}
            <div className="space-y-3 border-t pt-3">
              <div className="flex items-center justify-between">
                <Label>Enable Reminders</Label>
                <Switch
                  checked={medicationData.enable_notifications}
                  onCheckedChange={(checked) => setMedicationData({ ...medicationData, enable_notifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Sound Alert</Label>
                <Switch
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
                      <Plus className="h-3 w-3" />
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
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="doctor-name">Doctor Name *</Label>
                <Input
                  id="doctor-name"
                  value={appointmentData.doctor_name}
                  onChange={(e) => setAppointmentData({ ...appointmentData, doctor_name: e.target.value })}
                  placeholder="Dr. Smith"
                  required
                />
              </div>
              <div>
                <Label htmlFor="appointment-type">Type *</Label>
                <Input
                  id="appointment-type"
                  value={appointmentData.appointment_type}
                  onChange={(e) => setAppointmentData({ ...appointmentData, appointment_type: e.target.value })}
                  placeholder="Checkup"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="appointment-date">Date & Time *</Label>
              <Input
                id="appointment-date"
                type="datetime-local"
                value={appointmentData.appointment_date}
                onChange={(e) => setAppointmentData({ ...appointmentData, appointment_date: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Location</Label>
                <Select 
                  value={appointmentData.is_virtual.toString()} 
                  onValueChange={(value) => setAppointmentData({ ...appointmentData, is_virtual: value === "true" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">In-person</SelectItem>
                    <SelectItem value="true">Virtual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
          </>
        )}

        <div className="flex gap-2 pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              setShowForm(false);
              resetForms();
            }} 
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading} 
            className="flex-1 bg-care-blue hover:bg-care-blue-dark"
          >
            {loading ? "Adding..." : `Add ${type === "medication" ? "Medication" : "Appointment"}`}
          </Button>
        </div>
      </form>
    </Card>
  );
};