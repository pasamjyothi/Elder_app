import { useState, useEffect } from "react";
import { MobileContainer } from "@/components/ui/mobile-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  AlertTriangle,
  Heart,
  Edit,
  Save,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUserData } from "@/hooks/use-user-data";
import { AddScheduleDialog } from "./add-schedule-dialog";
import { BottomNavigation } from "./bottom-navigation";
import { toast } from "sonner";

interface ProfileScreenProps {
  onBack: () => void;
  onNavigate: (screen: "dashboard" | "medications" | "appointments" | "profile") => void;
  activeScreen: "dashboard" | "medications" | "appointments" | "profile";
}

export const ProfileScreen = ({ onBack, onNavigate, activeScreen }: ProfileScreenProps) => {
  const { user } = useAuth();
  const { profile, updateProfile, loading } = useUserData();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    date_of_birth: "",
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    medical_conditions: "",
    allergies: "",
  });

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        date_of_birth: profile.date_of_birth || "",
        address: profile.address || "",
        emergency_contact_name: profile.emergency_contact_name || "",
        emergency_contact_phone: profile.emergency_contact_phone || "",
        medical_conditions: profile.medical_conditions?.join(", ") || "",
        allergies: profile.allergies?.join(", ") || "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    try {
      await updateProfile({
        ...formData,
        medical_conditions: formData.medical_conditions 
          ? formData.medical_conditions.split(",").map(item => item.trim()).filter(Boolean)
          : [],
        allergies: formData.allergies 
          ? formData.allergies.split(",").map(item => item.trim()).filter(Boolean)
          : [],
      });
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        date_of_birth: profile.date_of_birth || "",
        address: profile.address || "",
        emergency_contact_name: profile.emergency_contact_name || "",
        emergency_contact_phone: profile.emergency_contact_phone || "",
        medical_conditions: profile.medical_conditions?.join(", ") || "",
        allergies: profile.allergies?.join(", ") || "",
      });
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <MobileContainer>
        <div className="flex items-center justify-center h-full">
          <p>Loading profile...</p>
        </div>
      </MobileContainer>
    );
  }

  return (
    <MobileContainer>
      {/* Header */}
      <div className="bg-gradient-to-br from-care-blue to-care-blue-dark text-white p-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Profile</h1>
          <div className="flex gap-2">
            <AddScheduleDialog onScheduleAdded={() => {}} />
            <Button
              variant="ghost"
              size="icon"
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
              className="text-white hover:bg-white/20"
            >
              {isEditing ? <Save className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4">
            <User className="h-10 w-10" />
          </div>
          <h2 className="text-xl font-semibold">{profile?.full_name || user?.email?.split('@')[0] || 'User'}</h2>
          <p className="text-blue-100">{user?.email}</p>
        </div>
      </div>

      <div className="p-6 space-y-6 pb-24">
        {/* Personal Information */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Personal Information</h3>
            {isEditing && (
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="full_name">Full Name</Label>
              {isEditing ? (
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Enter your full name"
                />
              ) : (
                <p className="p-2 text-sm">{profile?.full_name || "Not provided"}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              {isEditing ? (
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter your phone number"
                />
              ) : (
                <div className="flex items-center p-2">
                  <Phone className="h-4 w-4 mr-2 text-care-gray" />
                  <span className="text-sm">{profile?.phone || "Not provided"}</span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              {isEditing ? (
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                />
              ) : (
                <div className="flex items-center p-2">
                  <Calendar className="h-4 w-4 mr-2 text-care-gray" />
                  <span className="text-sm">
                    {profile?.date_of_birth 
                      ? new Date(profile.date_of_birth).toLocaleDateString()
                      : "Not provided"
                    }
                  </span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              {isEditing ? (
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter your address"
                  rows={2}
                />
              ) : (
                <div className="flex items-start p-2">
                  <MapPin className="h-4 w-4 mr-2 text-care-gray mt-0.5" />
                  <span className="text-sm">{profile?.address || "Not provided"}</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Emergency Contact */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Emergency Contact</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="emergency_contact_name">Contact Name</Label>
              {isEditing ? (
                <Input
                  id="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                  placeholder="Emergency contact name"
                />
              ) : (
                <p className="p-2 text-sm">{profile?.emergency_contact_name || "Not provided"}</p>
              )}
            </div>

            <div>
              <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
              {isEditing ? (
                <Input
                  id="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  placeholder="Emergency contact phone"
                />
              ) : (
                <div className="flex items-center p-2">
                  <Phone className="h-4 w-4 mr-2 text-care-gray" />
                  <span className="text-sm">{profile?.emergency_contact_phone || "Not provided"}</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Medical Information */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Medical Information</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="medical_conditions">Medical Conditions</Label>
              {isEditing ? (
                <Textarea
                  id="medical_conditions"
                  value={formData.medical_conditions}
                  onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
                  placeholder="Enter medical conditions (comma separated)"
                  rows={2}
                />
              ) : (
                <div className="flex items-start p-2">
                  <Heart className="h-4 w-4 mr-2 text-care-gray mt-0.5" />
                  <span className="text-sm">
                    {profile?.medical_conditions?.length 
                      ? profile.medical_conditions.join(", ")
                      : "None reported"
                    }
                  </span>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="allergies">Allergies</Label>
              {isEditing ? (
                <Textarea
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="Enter allergies (comma separated)"
                  rows={2}
                />
              ) : (
                <div className="flex items-start p-2">
                  <AlertTriangle className="h-4 w-4 mr-2 text-care-gray mt-0.5" />
                  <span className="text-sm">
                    {profile?.allergies?.length 
                      ? profile.allergies.join(", ")
                      : "None reported"
                    }
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
      
      <BottomNavigation activeScreen={activeScreen} onNavigate={onNavigate} />
    </MobileContainer>
  );
};