import { useState } from "react";
import { MobileContainer } from "@/components/ui/mobile-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import careNestLogo from "@/assets/carenest-logo.png";

export const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [medicalConditions, setMedicalConditions] = useState("");
  const [allergies, setAllergies] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async () => {
    if (!email || !password) return;
    
    setLoading(true);
    
    if (isSignUp) {
      const additionalData = {
        phone,
        date_of_birth: dateOfBirth,
        address,
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
        medical_conditions: medicalConditions ? medicalConditions.split(",").map(item => item.trim()).filter(Boolean) : [],
        allergies: allergies ? allergies.split(",").map(item => item.trim()).filter(Boolean) : [],
      };
      await signUp(email, password, fullName, additionalData);
    } else {
      await signIn(email, password);
    }
    
    setLoading(false);
  };

  return (
    <MobileContainer>
      <div className="p-6 h-full flex flex-col">
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-center mb-12">
            <div className="bg-care-blue-light rounded-full p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <img 
                src={careNestLogo} 
                alt="CareNest Logo" 
                className="w-12 h-12"
              />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h1>
            <p className="text-care-gray">
              {isSignUp ? "Sign up to get started" : "Sign in to continue"}
            </p>
          </div>

          <div className="space-y-6">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-12"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    placeholder="Enter your address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                  <Input
                    id="emergencyContactName"
                    type="text"
                    placeholder="Emergency contact name"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
                  <Input
                    id="emergencyContactPhone"
                    type="tel"
                    placeholder="Emergency contact phone"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medicalConditions">Medical Conditions</Label>
                  <Textarea
                    id="medicalConditions"
                    placeholder="Enter medical conditions (comma separated)"
                    value={medicalConditions}
                    onChange={(e) => setMedicalConditions(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea
                    id="allergies"
                    placeholder="Enter allergies (comma separated)"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                    rows={2}
                  />
                </div>
              </>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12"
              />
            </div>

            <Button 
              onClick={handleSubmit}
              disabled={loading || !email || !password || (isSignUp && !fullName)}
              className="w-full h-12 bg-care-blue hover:bg-care-blue-dark text-white font-medium disabled:opacity-50"
            >
              {loading ? "Loading..." : (isSignUp ? "Sign Up" : "Sign In")}
            </Button>

            <div className="text-center">
              <p className="text-sm text-care-gray">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <span 
                  className="text-care-blue font-medium cursor-pointer"
                  onClick={() => setIsSignUp(!isSignUp)}
                >
                  {isSignUp ? "Sign in" : "Sign up"}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </MobileContainer>
  );
};