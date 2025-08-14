import { useState } from "react";
import { MobileContainer } from "@/components/ui/mobile-container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import careNestLogo from "@/assets/carenest-logo.png";

export const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async () => {
    if (!email || !password) return;
    
    setLoading(true);
    
    if (isSignUp) {
      await signUp(email, password, fullName);
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
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="h-12"
                />
              </div>
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