import { useState } from "react";
import { SplashScreen } from "@/components/splash-screen";
import { LoginScreen } from "@/components/login-screen";
import { MainDashboard } from "@/components/main-dashboard";

type AppState = "splash" | "login" | "dashboard";

const Index = () => {
  const [currentState, setCurrentState] = useState<AppState>("splash");

  const handleSplashComplete = () => {
    setCurrentState("login");
  };

  const handleLogin = () => {
    setCurrentState("dashboard");
  };

  if (currentState === "splash") {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (currentState === "login") {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <MainDashboard />;
};

export default Index;
