import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Plus, Clock, Pill } from "lucide-react";
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
  });

  const [appointmentData, setAppointmentData] = useState({
    doctor_name: "",
    appointment_type: "",
    appointment_date: "",
    duration_minutes: 30,
    is_virtual: false,
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (type === "medication") {
        await addMedication({
          ...medicationData,
          end_date: medicationData.end_date || null,
          is_active: true,
        });
        toast.success("Medication added successfully");
      } else {
        await addAppointment({
          ...appointmentData,
          appointment_date: new Date(appointmentData.appointment_date).toISOString(),
          status: "scheduled",
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
      });
      setAppointmentData({
        doctor_name: "",
        appointment_type: "",
        appointment_date: "",
        duration_minutes: 30,
        is_virtual: false,
        notes: "",
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
      <DialogContent className="w-[95vw] max-w-md">
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
                <Label htmlFor="appointment-type">Appointment Type *</Label>
                <Input
                  id="appointment-type"
                  value={appointmentData.appointment_type}
                  onChange={(e) => setAppointmentData({ ...appointmentData, appointment_type: e.target.value })}
                  placeholder="e.g., Consultation, Follow-up, Checkup"
                  required
                />
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

              <div>
                <Label>Duration (minutes)</Label>
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
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Appointment Type</Label>
                <Select 
                  value={appointmentData.is_virtual.toString()} 
                  onValueChange={(value) => setAppointmentData({ ...appointmentData, is_virtual: value === "true" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">In-person</SelectItem>
                    <SelectItem value="true">Virtual/Telemedicine</SelectItem>
                  </SelectContent>
                </Select>
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