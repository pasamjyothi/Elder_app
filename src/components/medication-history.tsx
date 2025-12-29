import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, Clock, Calendar } from "lucide-react";
import { MedicationHistoryEntry } from "@/hooks/use-user-data";
import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";

interface MedicationHistoryProps {
  history: MedicationHistoryEntry[];
  loading?: boolean;
}

export const MedicationHistory = ({ history, loading }: MedicationHistoryProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    }
    if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    }
    return format(date, 'MMM d, yyyy h:mm a');
  };

  const groupHistoryByDate = (entries: MedicationHistoryEntry[]) => {
    const groups: { [key: string]: MedicationHistoryEntry[] } = {};
    
    entries.forEach(entry => {
      const date = new Date(entry.taken_at);
      let key: string;
      
      if (isToday(date)) {
        key = 'Today';
      } else if (isYesterday(date)) {
        key = 'Yesterday';
      } else {
        key = format(date, 'EEEE, MMMM d');
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(entry);
    });
    
    return groups;
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-care-gray">
        Loading history...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <Card className="p-6 text-center">
        <Calendar className="h-12 w-12 text-care-gray mx-auto mb-3" />
        <h3 className="font-medium text-care-gray">No History Yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Your medication history will appear here when you mark medications as taken.
        </p>
      </Card>
    );
  }

  const groupedHistory = groupHistoryByDate(history);

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4">
        {Object.entries(groupedHistory).map(([date, entries]) => (
          <div key={date}>
            <h3 className="text-sm font-semibold text-care-gray mb-2 sticky top-0 bg-background py-1">
              {date}
            </h3>
            <div className="space-y-2">
              {entries.map((entry) => (
                <Card key={entry.id} className="p-3 border-l-4 border-l-care-green bg-green-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-care-green flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{entry.medication_name}</p>
                      <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                        <Clock className="h-3 w-3 mr-1" />
                        {format(new Date(entry.taken_at), 'h:mm a')}
                        {entry.scheduled_time && (
                          <span className="ml-2 text-care-blue">
                            (scheduled: {entry.scheduled_time})
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.taken_at), { addSuffix: true })}
                    </span>
                  </div>
                  {entry.notes && (
                    <p className="text-xs text-muted-foreground mt-2 pl-11">
                      {entry.notes}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
