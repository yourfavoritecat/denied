import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChecklistItem } from "@/data/checklistData";
import { ShoppingBag, Plus, X } from "lucide-react";

interface PackingListSectionProps {
  items: ChecklistItem[];
  storageKey: string;
}

const PackingListSection = ({ items, storageKey }: PackingListSectionProps) => {
  const customKey = `${storageKey}-custom`;
  const checkedKey = `${storageKey}-checked`;

  const [customItems, setCustomItems] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(customKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(checkedKey);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [newItem, setNewItem] = useState("");

  useEffect(() => {
    localStorage.setItem(customKey, JSON.stringify(customItems));
  }, [customItems, customKey]);

  useEffect(() => {
    localStorage.setItem(checkedKey, JSON.stringify(checked));
  }, [checked, checkedKey]);

  const allItems = [
    ...items.map((i) => ({ id: i.id, label: i.label, custom: false })),
    ...customItems.map((label, idx) => ({ id: `custom-${idx}`, label, custom: true })),
  ];

  const toggle = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const addCustom = () => {
    if (!newItem.trim()) return;
    setCustomItems((prev) => [...prev, newItem.trim()]);
    setNewItem("");
  };

  const removeCustom = (idx: number) => {
    setCustomItems((prev) => prev.filter((_, i) => i !== idx));
    setChecked((prev) => {
      const next = { ...prev };
      delete next[`custom-${idx}`];
      return next;
    });
  };

  const completedCount = allItems.filter((i) => checked[i.id]).length;
  const progress = allItems.length > 0 ? Math.round((completedCount / allItems.length) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-secondary" />
            Packing List
          </CardTitle>
          <span className="text-sm font-medium text-muted-foreground">
            {completedCount}/{allItems.length}
          </span>
        </div>
        <Progress value={progress} className="h-2 mt-2" />
      </CardHeader>
      <CardContent className="space-y-3">
        {allItems.map((item, idx) => (
          <div key={item.id} className="flex items-start gap-3 group">
            <label
              className={`flex items-start gap-3 cursor-pointer flex-1 p-2 rounded-lg transition-colors hover:bg-muted/50 ${checked[item.id] ? "opacity-60" : ""}`}
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
            {item.custom && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeCustom(idx - items.length)}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        ))}

        <div className="flex gap-2 pt-2 border-t">
          <Input
            placeholder="Add custom item..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustom()}
            className="text-sm"
          />
          <Button variant="outline" size="icon" onClick={addCustom} disabled={!newItem.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PackingListSection;
