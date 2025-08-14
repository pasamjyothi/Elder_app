import { useEffect, useState } from "react";
import { MobileContainer } from "@/components/ui/mobile-container";
import careNestLogo from "@/assets/carenest-logo.png";

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 500);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <MobileContainer className="bg-care-blue-light">
      <div className={`h-full flex flex-col items-center justify-center transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
        <div className="bg-white rounded-full p-8 shadow-lg mb-8">
          <img 
            src={careNestLogo} 
            alt="CareNest Logo" 
            className="w-20 h-20"
          />
        </div>
        <h1 className="text-3xl font-bold text-care-blue mb-2">CareNest</h1>
        <p className="text-care-gray text-sm">Your Health Companion</p>
      </div>
    </MobileContainer>
  );
};