import { Button } from "@/components/ui/button";
import { Activity, Calendar, Pill, User } from "lucide-react";

interface BottomNavigationProps {
  activeScreen: "dashboard" | "medications" | "appointments" | "profile";
  onNavigate: (screen: "dashboard" | "medications" | "appointments" | "profile") => void;
}

export const BottomNavigation = ({ activeScreen, onNavigate }: BottomNavigationProps) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-care-gray/20 shadow-lg z-40">
      <div className="flex justify-around p-4 max-w-md mx-auto">
        <Button 
          variant="ghost" 
          size="sm" 
          className={`flex-col space-y-1 ${
            activeScreen === "dashboard" ? "text-care-blue bg-care-blue/5" : "text-care-gray"
          }`}
          onClick={() => onNavigate("dashboard")}
        >
          <Activity className="h-5 w-5" />
          <span className="text-xs font-medium">Dashboard</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className={`flex-col space-y-1 ${
            activeScreen === "appointments" ? "text-care-blue bg-care-blue/5" : "text-care-gray"
          }`}
          onClick={() => onNavigate("appointments")}
        >
          <Calendar className="h-5 w-5" />
          <span className="text-xs font-medium">Schedule</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className={`flex-col space-y-1 ${
            activeScreen === "medications" ? "text-care-blue bg-care-blue/5" : "text-care-gray"
          }`}
          onClick={() => onNavigate("medications")}
        >
          <Pill className="h-5 w-5" />
          <span className="text-xs font-medium">Meds</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className={`flex-col space-y-1 ${
            activeScreen === "profile" ? "text-care-blue bg-care-blue/5" : "text-care-gray"
          }`}
          onClick={() => onNavigate("profile")}
        >
          <User className="h-5 w-5" />
          <span className="text-xs font-medium">Profile</span>
        </Button>
      </div>
    </div>
  );
};