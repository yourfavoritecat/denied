import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { procedureTypes } from "@/data/providers";
import { Star, Plus, X, ClipboardPaste } from "lucide-react";

interface PreviousProcedure {
  name: string;
  date: string;
  provider: string;
  notes: string;
  rating: number;
}

const ProceduresTab = () => {
  const [currentInterest, setCurrentInterest] = useState<string[]>([]);
  const [futureInterest, setFutureInterest] = useState<string[]>([]);
  const [previousProcedures, setPreviousProcedures] = useState<PreviousProcedure[]>([]);
  const [newProcedure, setNewProcedure] = useState<PreviousProcedure>({
    name: "", date: "", provider: "", notes: "", rating: 0,
  });

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const addPreviousProcedure = () => {
    if (!newProcedure.name) return;
    setPreviousProcedures([...previousProcedures, newProcedure]);
    setNewProcedure({ name: "", date: "", provider: "", notes: "", rating: 0 });
  };

  return (
    <div className="space-y-6">
      {/* Current Interest */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Interest</CardTitle>
          <CardDescription>Procedures you're actively researching or planning</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {procedureTypes.map((proc) => (
              <Badge
                key={proc}
                variant={currentInterest.includes(proc) ? "default" : "outline"}
                className="cursor-pointer select-none"
                onClick={() => toggleItem(currentInterest, setCurrentInterest, proc)}
              >
                {proc}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Future Interest */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Future Interest</CardTitle>
          <CardDescription>Procedures you might want later</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {procedureTypes.map((proc) => (
              <Badge
                key={proc}
                variant={futureInterest.includes(proc) ? "default" : "outline"}
                className="cursor-pointer select-none"
                onClick={() => toggleItem(futureInterest, setFutureInterest, proc)}
              >
                {proc}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Previous Procedures */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Previous Procedures</CardTitle>
          <CardDescription>Record your past procedures</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {previousProcedures.map((proc, i) => (
            <div key={i} className="p-4 border rounded-lg relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 h-6 w-6 p-0"
                onClick={() => setPreviousProcedures(previousProcedures.filter((_, idx) => idx !== i))}
              >
                <X className="w-4 h-4" />
              </Button>
              <h4 className="font-semibold">{proc.name}</h4>
              <p className="text-sm text-muted-foreground">{proc.provider} · {proc.date}</p>
              {proc.notes && <p className="text-sm mt-1">{proc.notes}</p>}
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-4 h-4 ${s <= proc.rating ? "fill-secondary text-secondary" : "text-muted-foreground"}`} />
                ))}
              </div>
            </div>
          ))}

          <div className="border-t pt-4 space-y-3">
            <h4 className="font-medium text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Add Procedure</h4>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Procedure</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={newProcedure.name}
                  onChange={(e) => setNewProcedure({ ...newProcedure, name: e.target.value })}
                >
                  <option value="">Select...</option>
                  {procedureTypes.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={newProcedure.date} onChange={(e) => setNewProcedure({ ...newProcedure, date: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Provider / Location</Label>
                <Input placeholder="e.g. Dental Excellence, Tijuana" value={newProcedure.provider} onChange={(e) => setNewProcedure({ ...newProcedure, provider: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Satisfaction</Label>
                <div className="flex gap-1 pt-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-5 h-5 cursor-pointer ${s <= newProcedure.rating ? "fill-secondary text-secondary" : "text-muted-foreground"}`}
                      onClick={() => setNewProcedure({ ...newProcedure, rating: s })}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notes</Label>
              <Textarea placeholder="Any notes about the experience..." value={newProcedure.notes} onChange={(e) => setNewProcedure({ ...newProcedure, notes: e.target.value })} />
            </div>
            <Button size="sm" onClick={addPreviousProcedure} disabled={!newProcedure.name}>Add Procedure</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProceduresTab;
