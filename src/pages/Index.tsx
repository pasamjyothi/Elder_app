import { useState, useEffect } from "react";
import { SplashScreen } from "@/components/splash-screen";
import { LoginScreen } from "@/components/login-screen";
import { MainDashboard } from "@/components/main-dashboard";
import { useAuth } from "@/hooks/use-auth";

type AppState = "splash" | "auth" | "dashboard";

const Index = () => {
  const [currentState, setCurrentState] = useState<AppState>("splash");
  const { user, loading } = useAuth();

  const handleSplashComplete = () => {
    setCurrentState("auth");
  };

  useEffect(() => {
    if (!loading) {
      if (user) {
        setCurrentState("dashboard");
      } else if (currentState === "splash") {
        // Keep splash state until user interaction
      } else {
        setCurrentState("auth");
      }
    }
  }, [user, loading, currentState]);

  if (loading || currentState === "splash") {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <MainDashboard />;
};

export default Index;
