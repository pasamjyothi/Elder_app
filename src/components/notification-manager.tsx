import { useEffect } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';

export const NotificationManager = () => {
  const { permission, requestPermission } = useNotifications();

  useEffect(() => {
    // Show notification request if not already granted
    if (permission.default) {
      toast.info('Enable notifications to get medication and appointment reminders', {
        action: {
          label: 'Enable',
          onClick: requestPermission,
        },
        duration: 10000,
      });
    }
  }, [permission.default, requestPermission]);

  if (permission.granted) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <Bell className="h-4 w-4" />
        <span className="text-xs">Notifications enabled</span>
      </div>
    );
  }

  if (permission.denied) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <BellOff className="h-4 w-4" />
        <span className="text-xs">Notifications blocked</span>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={requestPermission}
      className="flex items-center gap-2"
    >
      <Bell className="h-4 w-4" />
      Enable Notifications
    </Button>
  );
};