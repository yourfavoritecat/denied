import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BookingRow {
  id: string;
  user_id: string;
  provider_slug: string;
  procedures: any;
  status: string;
  quoted_price: number | null;
  commission_amount: number | null;
  deposit_amount: number | null;
  inquiry_message: string | null;
  medical_notes: string | null;
  provider_message: string | null;
  provider_estimated_dates: string | null;
  preferred_dates: any;
  created_at: string;
  patient_name?: string;
}

const STATUS_COLORS: Record<string, string> = {
  inquiry: "bg-secondary/10 text-secondary",
  quoted: "bg-primary/10 text-primary",
  deposit_paid: "bg-primary/20 text-primary",
  confirmed: "bg-primary/30 text-primary",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

const BookingsSection = () => {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<BookingRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
      const raw = (data as any[]) || [];

      const userIds = [...new Set(raw.map((b) => b.user_id))];
      const { data: profiles } = userIds.length > 0
        ? await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds)
        : { data: [] };
      const pMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      setBookings(raw.map((b) => {
        const p = pMap.get(b.user_id);
        return { ...b, patient_name: p ? [p.first_name, p.last_name].filter(Boolean).join(" ") : "Unknown" };
      }));
      setLoading(false);
    };
    load();
  }, []);

  const getProcedures = (p: any) => {
    if (!p || !Array.isArray(p)) return "—";
    return p.map((x: any) => x.name).join(", ");
  };

  const filtered = bookings.filter((b) =>
    [b.patient_name, b.provider_slug, getProcedures(b.procedures), b.status]
      .some((f) => (f || "").toLowerCase().includes(search.toLowerCase()))
  );

  const escapeCsv = (v: string) => `"${String(v).replace(/"/g, '""')}"`;

  const exportCSV = useCallback(() => {
    if (filtered.length === 0) {
      toast({ title: "Nothing to export", description: "No bookings match the current filter." });
      return;
    }
    const rows = filtered.map((b) => ({
      status: b.status,
      patient: b.patient_name || "",
      provider: b.provider_slug,
      procedures: getProcedures(b.procedures),
      quoted_price: b.quoted_price ?? "",
      deposit: b.deposit_amount ?? "",
      commission: b.commission_amount ?? "",
      preferred_dates: b.preferred_dates?.text || "",
      estimated_dates: b.provider_estimated_dates || "",
      inquiry_message: b.inquiry_message || "",
      medical_notes: b.medical_notes || "",
      provider_message: b.provider_message || "",
      created_at: b.created_at,
    }));

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(","),
      ...rows.map((row) => headers.map((h) => escapeCsv(String((row as any)[h]))).join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bookings-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${rows.length} booking(s) exported to CSV.` });
  }, [filtered, toast]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Bookings</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{filtered.length} bookings</span>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Procedures</TableHead>
                <TableHead>Quoted</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No bookings</TableCell></TableRow>
              ) : (
                filtered.map((b) => (
                  <TableRow key={b.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(b)}>
                    <TableCell><Badge className={`text-xs ${STATUS_COLORS[b.status] || ""}`}>{b.status}</Badge></TableCell>
                    <TableCell className="font-medium">{b.patient_name}</TableCell>
                    <TableCell className="text-muted-foreground">{b.provider_slug}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{getProcedures(b.procedures)}</TableCell>
                    <TableCell>{b.quoted_price ? `$${Number(b.quoted_price).toLocaleString()}` : "—"}</TableCell>
                    <TableCell>{b.commission_amount ? `$${Number(b.commission_amount).toLocaleString()}` : "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Booking Detail</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <Badge className={`${STATUS_COLORS[selected.status] || ""}`}>{selected.status}</Badge>
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Patient:</span> <span className="font-medium">{selected.patient_name}</span></div>
                <div><span className="text-muted-foreground">Provider:</span> <span className="font-medium">{selected.provider_slug}</span></div>
                <div><span className="text-muted-foreground">Procedures:</span> <span className="font-medium">{getProcedures(selected.procedures)}</span></div>
                <div><span className="text-muted-foreground">Quoted:</span> <span className="font-medium">{selected.quoted_price ? `$${Number(selected.quoted_price).toLocaleString()}` : "—"}</span></div>
                <div><span className="text-muted-foreground">Deposit:</span> <span className="font-medium">{selected.deposit_amount ? `$${Number(selected.deposit_amount).toLocaleString()}` : "—"}</span></div>
                <div><span className="text-muted-foreground">Commission:</span> <span className="font-medium">{selected.commission_amount ? `$${Number(selected.commission_amount).toLocaleString()}` : "—"}</span></div>
                <div><span className="text-muted-foreground">Est. Dates:</span> <span className="font-medium">{selected.provider_estimated_dates || "—"}</span></div>
                <div><span className="text-muted-foreground">Preferred:</span> <span className="font-medium">{selected.preferred_dates?.text || "—"}</span></div>
              </div>
              {selected.inquiry_message && <div><p className="text-muted-foreground mb-1">Inquiry Message</p><p>{selected.inquiry_message}</p></div>}
              {selected.medical_notes && <div><p className="text-muted-foreground mb-1">Medical Notes</p><p>{selected.medical_notes}</p></div>}
              {selected.provider_message && <div><p className="text-muted-foreground mb-1">Provider Message</p><p>{selected.provider_message}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingsSection;
