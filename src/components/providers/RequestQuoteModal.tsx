import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MapPin, Calendar, FileText, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface TripBrief {
  id: string;
  trip_name: string;
  destination: string | null;
  travel_start: string | null;
  travel_end: string | null;
  procedures: { name: string; quantity: number }[];
  inquiry_description: string | null;
}

interface RequestQuoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerName: string;
}

const RequestQuoteModal = ({ open, onOpenChange, providerName }: RequestQuoteModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tripBriefs, setTripBriefs] = useState<TripBrief[]>([]);
  const [selectedBrief, setSelectedBrief] = useState<string | null>(null);
  const [mode, setMode] = useState<"select" | "new">("select");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && user) {
      supabase
        .from("trip_briefs")
        .select("id, trip_name, destination, travel_start, travel_end, procedures, inquiry_description")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setTripBriefs((data as TripBrief[]) || []);
          setLoading(false);
          if (!data || data.length === 0) setMode("new");
        });
    }
  }, [open, user]);

  const handleSend = () => {
    const brief = tripBriefs.find((b) => b.id === selectedBrief);
    toast({
      title: "Quote request sent!",
      description: `Your inquiry has been sent to ${providerName}.`,
    });
    onOpenChange(false);
    setSelectedBrief(null);
    setMessage("");
    setMode("select");
  };

  const formatDate = (d: string | null) => {
    if (!d) return "";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in required</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">Please sign in to request a quote.</p>
          <Button asChild><a href="/auth">Sign In</a></Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Quote from {providerName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : mode === "select" && tripBriefs.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Attach a Trip Brief to auto-fill your inquiry, or write a new message.</p>

            <div className="space-y-2">
              {tripBriefs.map((brief) => (
                <Card
                  key={brief.id}
                  className={`cursor-pointer transition-colors ${selectedBrief === brief.id ? "ring-2 ring-primary" : "hover:bg-muted/50"}`}
                  onClick={() => setSelectedBrief(brief.id)}
                >
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{brief.trip_name}</h4>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          {brief.destination && (
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{brief.destination}</span>
                          )}
                          {brief.travel_start && (
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(brief.travel_start)}</span>
                          )}
                        </div>
                      </div>
                      <FileText className="w-4 h-4 text-muted-foreground" />
                    </div>
                    {brief.procedures && brief.procedures.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {brief.procedures.map((p: any, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {p.name} {p.quantity > 1 ? `×${p.quantity}` : ""}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedBrief && (
              <div className="space-y-2">
                <Label>Additional message (optional)</Label>
                <Textarea
                  placeholder="Any additional details for this provider..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleSend} disabled={!selectedBrief}>
                Send with Trip Brief
              </Button>
              <Button variant="outline" onClick={() => setMode("new")}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Write New
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {tripBriefs.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setMode("select")}>
                ← Back to Trip Briefs
              </Button>
            )}
            <div className="space-y-2">
              <Label>Your message to {providerName}</Label>
              <Textarea
                placeholder="Hi, I'm interested in getting a quote for... (procedures, dates, any questions)"
                className="min-h-[150px]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={handleSend} disabled={!message.trim()}>
              Send Quote Request
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RequestQuoteModal;
