import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, Plus, Trash2, Plane, Stethoscope, BedDouble, MapPin } from "lucide-react";

interface ItineraryEvent {
  id: string;
  time: string;
  title: string;
  notes: string;
  type: "arrival" | "procedure" | "recovery" | "departure" | "custom";
}

interface DayPlan {
  date: string;
  label: string;
  events: ItineraryEvent[];
}

interface DayByDayItineraryProps {
  travelStart: string | null;
  travelEnd: string | null;
  providerEstimatedDates: string | null;
  destination: string;
  storageKey: string;
}

const EVENT_ICONS: Record<string, React.ElementType> = {
  arrival: Plane,
  procedure: Stethoscope,
  recovery: BedDouble,
  departure: Plane,
  custom: MapPin,
};

const EVENT_COLORS: Record<string, string> = {
  arrival: "bg-primary/10 border-primary/30 text-primary",
  procedure: "bg-secondary/10 border-secondary/30 text-secondary",
  recovery: "bg-muted border-border",
  departure: "bg-primary/10 border-primary/30 text-primary",
  custom: "bg-accent/10 border-accent/30",
};

const generateDefaultItinerary = (
  travelStart: string | null,
  travelEnd: string | null,
  destination: string,
): DayPlan[] => {
  if (!travelStart || !travelEnd) return [];

  const start = new Date(travelStart + "T00:00:00");
  const end = new Date(travelEnd + "T00:00:00");
  const days: DayPlan[] = [];
  const current = new Date(start);
  let dayNum = 0;

  while (current <= end) {
    dayNum++;
    const dateStr = current.toISOString().split("T")[0];
    const events: ItineraryEvent[] = [];

    if (dayNum === 1) {
      events.push(
        { id: `${dateStr}-arrival`, time: "Morning", title: `Arrive in ${destination}`, notes: "Check into hotel, settle in", type: "arrival" },
        { id: `${dateStr}-consult`, time: "Afternoon", title: "Clinic consultation & intake", notes: "Bring X-rays, medical records, list of questions", type: "procedure" },
      );
    } else if (dayNum === 2) {
      events.push(
        { id: `${dateStr}-procedure`, time: "Morning", title: "Procedure day", notes: "Follow pre-op instructions from provider", type: "procedure" },
        { id: `${dateStr}-rest`, time: "Afternoon", title: "Rest & recovery", notes: "Take prescribed medications, ice as directed", type: "recovery" },
      );
    } else if (current.getTime() === end.getTime()) {
      events.push(
        { id: `${dateStr}-checkout`, time: "Morning", title: "Final check-up with provider", notes: "Get post-care instructions and emergency contacts", type: "procedure" },
        { id: `${dateStr}-depart`, time: "Afternoon", title: "Departure", notes: "Safe travels home!", type: "departure" },
      );
    } else {
      events.push(
        { id: `${dateStr}-recovery`, time: "All day", title: "Recovery day", notes: "Rest, soft foods, follow provider instructions", type: "recovery" },
      );
    }

    days.push({
      date: dateStr,
      label: `Day ${dayNum} — ${new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`,
      events,
    });

    current.setDate(current.getDate() + 1);
  }

  return days;
};

const DayByDayItinerary = ({ travelStart, travelEnd, destination, storageKey }: DayByDayItineraryProps) => {
  const [days, setDays] = useState<DayPlan[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return generateDefaultItinerary(travelStart, travelEnd, destination);
  });

  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newNotes, setNewNotes] = useState("");

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(days));
  }, [days, storageKey]);

  const addEvent = (dateStr: string) => {
    if (!newTitle.trim()) return;
    const event: ItineraryEvent = {
      id: `${dateStr}-custom-${Date.now()}`,
      time: newTime || "TBD",
      title: newTitle.trim(),
      notes: newNotes.trim(),
      type: "custom",
    };
    setDays((prev) =>
      prev.map((d) =>
        d.date === dateStr ? { ...d, events: [...d.events, event] } : d
      )
    );
    setAddingTo(null);
    setNewTitle("");
    setNewTime("");
    setNewNotes("");
  };

  const removeEvent = (dateStr: string, eventId: string) => {
    setDays((prev) =>
      prev.map((d) =>
        d.date === dateStr ? { ...d, events: d.events.filter((e) => e.id !== eventId) } : d
      )
    );
  };

  if (days.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Set travel dates on your trip brief to generate an itinerary.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-primary" />
        Day-by-Day Itinerary
      </h3>

      {days.map((day) => (
        <Card key={day.date}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{day.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {day.events.map((event) => {
              const Icon = EVENT_ICONS[event.type] || MapPin;
              return (
                <div
                  key={event.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${EVENT_COLORS[event.type] || ""} group`}
                >
                  <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium opacity-70">{event.time}</span>
                    </div>
                    <p className="text-sm font-medium">{event.title}</p>
                    {event.notes && (
                      <p className="text-xs text-muted-foreground mt-0.5">{event.notes}</p>
                    )}
                  </div>
                  {event.type === "custom" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => removeEvent(day.date, event.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              );
            })}

            {addingTo === day.date ? (
              <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
                <div className="flex gap-2">
                  <Input
                    placeholder="Time (e.g. 10:00 AM)"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-32 text-sm"
                  />
                  <Input
                    placeholder="Activity title"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="flex-1 text-sm"
                  />
                </div>
                <Textarea
                  placeholder="Notes (optional)"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="text-sm min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => addEvent(day.date)} disabled={!newTitle.trim()}>
                    Add
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setAddingTo(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={() => setAddingTo(day.date)}
              >
                <Plus className="w-3 h-3 mr-1" /> Add activity
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DayByDayItinerary;
