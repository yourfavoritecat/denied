import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { Bug, CheckCircle, Clock, MessageSquare } from "lucide-react";

interface BugReport {
  id: string;
  user_id: string;
  page_url: string;
  description: string;
  ai_guess: string | null;
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
  open: <Clock className="w-4 h-4" />,
  in_progress: <MessageSquare className="w-4 h-4" />,
  resolved: <CheckCircle className="w-4 h-4" />,
};

const BugReportsSection = () => {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("open");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const fetchReports = async () => {
    let query = supabase
      .from("bug_reports" as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data } = await query;
    setReports((data as any as BugReport[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    await supabase
      .from("bug_reports" as any)
      .update({ 
        status, 
        ...(status === "resolved" ? { resolved_at: new Date().toISOString() } : {}) 
      } as any)
      .eq("id", id);
    fetchReports();
  };

  const saveNotes = async (id: string) => {
    await supabase
      .from("bug_reports" as any)
      .update({ admin_notes: noteText } as any)
      .eq("id", id);
    setEditingNotes(null);
    fetchReports();
  };

  // Fetch reporter emails
  const [emailMap, setEmailMap] = useState<Record<string, string>>({});
  useEffect(() => {
    if (reports.length === 0) return;
    const fetchEmails = async () => {
      const { data } = await supabase.rpc("get_admin_user_list");
      if (data) {
        const map: Record<string, string> = {};
        data.forEach((u: any) => { map[u.user_id] = u.email; });
        setEmailMap(map);
      }
    };
    fetchEmails();
  }, [reports]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bug className="w-6 h-6" /> Bug Reports
        </h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : reports.length === 0 ? (
        <Card className="py-12 text-center">
          <Bug className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-muted-foreground">No {filter !== "all" ? filter : ""} bug reports</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={severityColors[r.severity] || ""}>
                      {r.severity}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {statusIcons[r.status]} {r.status}
                    </Badge>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{r.page_url}</code>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                  </span>
                </div>

                <p className="text-sm mb-1">
                  <span className="text-muted-foreground">Reporter: </span>
                  {emailMap[r.user_id] || r.user_id.slice(0, 8)}
                </p>

                <p className="text-sm mb-3">{r.description}</p>

                {r.ai_guess && (
                  <details className="mb-3">
                    <summary className="text-xs text-muted-foreground cursor-pointer">🤖 AI guess</summary>
                    <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line bg-muted/50 p-2 rounded">{r.ai_guess}</p>
                  </details>
                )}

                {r.admin_notes && editingNotes !== r.id && (
                  <div className="bg-primary/5 p-2 rounded text-sm mb-3">
                    <span className="font-medium text-xs">Admin notes: </span>{r.admin_notes}
                  </div>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  {r.status !== "resolved" && (
                    <>
                      {r.status === "open" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "in_progress")}>
                          Mark In Progress
                        </Button>
                      )}
                      <Button size="sm" variant="default" onClick={() => updateStatus(r.id, "resolved")}>
                        Resolve
                      </Button>
                    </>
                  )}
                  {r.status === "resolved" && (
                    <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "open")}>
                      Reopen
                    </Button>
                  )}
                  {editingNotes === r.id ? (
                    <div className="flex-1 flex gap-2">
                      <Textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        rows={2}
                        className="flex-1"
                        placeholder="Add admin notes..."
                      />
                      <Button size="sm" onClick={() => saveNotes(r.id)}>Save</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => { setEditingNotes(r.id); setNoteText(r.admin_notes || ""); }}>
                      {r.admin_notes ? "Edit Notes" : "Add Notes"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BugReportsSection;
