import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MobileContainerProps {
  children: ReactNode;
  className?: string;
}

export const MobileContainer = ({ children, className }: MobileContainerProps) => {
  return (
    <div className={cn(
      "max-w-sm mx-auto min-h-screen bg-background relative overflow-hidden",
      className
    )}>
      {children}
    </div>
  );
};