import { useState } from "react";
import { Bug, Send, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useBetaTester } from "@/hooks/useBetaTester";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";

const AI_GUESSES: Record<string, string[]> = {
  "/search": ["Search results not loading", "Filters not applying correctly", "Provider cards showing wrong data"],
  "/provider/": ["Provider profile not displaying", "Photos/gallery not loading", "Quote request not working"],
  "/my-trips": ["Trip briefs not saving", "Bookings not showing up", "Tab navigation broken"],
  "/booking/": ["Messages not sending", "Quote details missing", "Status not updating"],
  "/profile": ["Profile data not saving", "Avatar upload failing", "Tabs not switching correctly"],
  "/dashboard": ["Dashboard stats incorrect", "Quick actions not working", "Bookings summary missing"],
  "/admin": ["Admin data not loading", "Actions not executing", "Counts incorrect"],
};

const getAiGuess = (pathname: string): string => {
  for (const [key, guesses] of Object.entries(AI_GUESSES)) {
    if (pathname.startsWith(key)) {
      return `Based on where you are (${pathname}), the issue might be:\n• ${guesses.join("\n• ")}`;
    }
  }
  return `You're on ${pathname}. Common issues: page not loading correctly, data not displaying, or buttons not responding.`;
};

const BugReportButton = () => {
  const { user } = useAuth();
  const { isBetaTester } = useBetaTester();
  const { toast } = useToast();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [submitting, setSubmitting] = useState(false);
  const [showGuess, setShowGuess] = useState(false);

  if (!user || !isBetaTester) return null;

  const aiGuess = getAiGuess(location.pathname);

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setSubmitting(true);

    const { error } = await supabase
      .from("bug_reports" as any)
      .insert({
        user_id: user.id,
        page_url: location.pathname + location.search,
        description: description.trim(),
        ai_guess: aiGuess,
        severity,
      } as any);

    setSubmitting(false);
    if (error) {
      toast({ title: "Failed to submit", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Bug reported! 🐛", description: "Thanks for helping us improve!" });
      setDescription("");
      setSeverity("medium");
      setShowGuess(false);
      setOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed left-5 z-50 flex items-center justify-center rounded-full shadow-lg transition-opacity"
        style={{ bottom: 80, width: 40, height: 40, opacity: 0.4, background: 'hsl(var(--destructive))' }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.4')}
        title="Report a bug"
      >
        <Bug className="w-4 h-4 text-white" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-destructive" />
              Report a Bug
            </DialogTitle>
            <DialogDescription>
              You're on <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{location.pathname}</code>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* AI guess accordion */}
            <button
              type="button"
              onClick={() => setShowGuess(!showGuess)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full"
            >
              {showGuess ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              🤖 What we think might have happened
            </button>
            {showGuess && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground whitespace-pre-line">
                {aiGuess}
              </div>
            )}

            <div className="space-y-2">
              <Label>What happened?</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the bug... What did you expect vs. what actually happened?"
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground">{description.length}/1000</p>
            </div>

            <div className="space-y-2">
              <Label>Severity</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Low — cosmetic / minor</SelectItem>
                  <SelectItem value="medium">🟡 Medium — something doesn't work right</SelectItem>
                  <SelectItem value="high">🔴 High — can't complete a task</SelectItem>
                  <SelectItem value="critical">🚨 Critical — app is broken</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!description.trim() || submitting}
              className="w-full"
            >
              {submitting ? "Submitting..." : (
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4" /> Submit Bug Report
                </span>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BugReportButton;
