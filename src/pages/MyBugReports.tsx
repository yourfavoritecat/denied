import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bug, ArrowLeft, CheckCircle, Clock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/layout/Navbar";
import { formatDistanceToNow } from "date-fns";

interface BugReport {
  id: string;
  page_url: string;
  description: string;
  severity: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

const severityColors: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
  critical: "bg-red-600 text-white",
};

const statusIcons: Record<string, React.ReactNode> = {
  open: <Clock className="w-3.5 h-3.5" />,
  in_progress: <MessageSquare className="w-3.5 h-3.5" />,
  resolved: <CheckCircle className="w-3.5 h-3.5" />,
};

const MyBugReports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("bug_reports" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setReports((data as any as BugReport[]) || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bug className="w-6 h-6" />
              My Bug Reports
            </h1>
            <p className="text-sm text-muted-foreground">
              {reports.filter((r) => r.status !== "resolved").length} open
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : reports.length === 0 ? (
          <Card className="py-16 text-center">
            <Bug className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No bug reports yet</p>
            <p className="text-sm text-muted-foreground mt-1">Use the "Report Bug" button to submit issues</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={severityColors[r.severity] || ""}>{r.severity}</Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {statusIcons[r.status]} {r.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                  </span>
                </div>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{r.page_url}</code>
                <p className="text-sm mt-2">{r.description}</p>
                {r.admin_notes && (
                  <div className="bg-primary/5 p-2 rounded text-sm mt-3">
                    <span className="font-medium text-xs">Admin response: </span>{r.admin_notes}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBugReports;
