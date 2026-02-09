import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ChecklistItem } from "@/data/checklistData";
import { CheckCircle } from "lucide-react";
import { useTripPlannerState } from "@/hooks/useTripPlannerState";

interface ChecklistSectionProps {
  title: string;
  items: ChecklistItem[];
  storageKey: string;
  bookingId: string;
}

const ChecklistSection = ({ title, items, storageKey, bookingId }: ChecklistSectionProps) => {
  const [checked, setChecked] = useTripPlannerState<Record<string, boolean>>(
    bookingId,
    storageKey,
    {}
  );

  const toggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = items.filter((i) => checked[i.id]).length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            {title}
          </CardTitle>
          <span className="text-sm font-medium text-muted-foreground">
            {completedCount}/{items.length}
          </span>
        </div>
        <Progress value={progress} className="h-2 mt-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <label
            key={item.id}
            className={`flex items-start gap-3 cursor-pointer p-2 rounded-lg transition-colors hover:bg-muted/50 ${checked[item.id] ? "opacity-60" : ""}`}
          >
            <Checkbox
              checked={!!checked[item.id]}
              onCheckedChange={() => toggle(item.id)}
              className="mt-0.5"
            />
            <span className={`text-sm ${checked[item.id] ? "line-through text-muted-foreground" : ""}`}>
              {item.label}
            </span>
          </label>
        ))}
      </CardContent>
    </Card>
  );
};

export default ChecklistSection;
