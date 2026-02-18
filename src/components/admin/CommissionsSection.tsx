import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Clock, TrendingUp, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InvoiceRow {
  id: string;
  created_at: string;
  provider_slug: string;
  procedure_total: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
  paid_at: string | null;
  booking_id: string;
  booking_code?: string | null;
}

const formatSlug = (slug: string) =>
  slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-secondary/10 text-secondary border-secondary/20",
  paid: "bg-primary/10 text-primary border-primary/20",
  disputed: "bg-destructive/10 text-destructive border-destructive/20",
};

const CommissionsSection = () => {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("commission_invoices")
      .select("*, bookings(booking_code)")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading invoices", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const rows: InvoiceRow[] = (data || []).map((row: any) => ({
      id: row.id,
      created_at: row.created_at,
      provider_slug: row.provider_slug,
      procedure_total: Number(row.procedure_total),
      commission_rate: Number(row.commission_rate),
      commission_amount: Number(row.commission_amount),
      status: row.status,
      paid_at: row.paid_at,
      booking_id: row.booking_id,
      booking_code: row.bookings?.booking_code ?? null,
    }));

    setInvoices(rows);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkPaid = async (id: string) => {
    const { error } = await supabase
      .from("commission_invoices")
      .update({ status: "paid", paid_at: new Date().toISOString() } as any)
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Marked as paid!", description: "Invoice status updated." });
    await load();
  };

  // Filters
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const filtered = invoices.filter((inv) => {
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
    if (providerFilter !== "all" && inv.provider_slug !== providerFilter) return false;
    if (dateFilter === "this_month" && new Date(inv.created_at) < startOfMonth) return false;
    if (dateFilter === "last_month") {
      const d = new Date(inv.created_at);
      if (d < startOfLastMonth || d > endOfLastMonth) return false;
    }
    return true;
  });

  // Summary stats
  const totalEarned = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.commission_amount, 0);
  const totalOutstanding = invoices.filter((i) => i.status === "pending").reduce((s, i) => s + i.commission_amount, 0);
  const thisMonthTotal = invoices
    .filter((i) => new Date(i.created_at) >= startOfMonth)
    .reduce((s, i) => s + i.commission_amount, 0);

  // Provider summary
  const providerMap: Record<string, { owed: number; paid: number; count: number }> = {};
  invoices.forEach((inv) => {
    if (!providerMap[inv.provider_slug]) providerMap[inv.provider_slug] = { owed: 0, paid: 0, count: 0 };
    providerMap[inv.provider_slug].count += 1;
    if (inv.status === "pending") providerMap[inv.provider_slug].owed += inv.commission_amount;
    if (inv.status === "paid") providerMap[inv.provider_slug].paid += inv.commission_amount;
  });

  const uniqueProviders = Object.keys(providerMap);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Commissions</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-5 px-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Total Earned</span>
              <CheckCircle className="w-4 h-4 text-primary opacity-60" />
            </div>
            <p className="text-3xl font-bold text-primary">{formatCurrency(totalEarned)}</p>
            <p className="text-xs text-muted-foreground mt-1">all paid invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5 px-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Outstanding</span>
              <Clock className="w-4 h-4 text-secondary opacity-60" />
            </div>
            <p className="text-3xl font-bold text-secondary">{formatCurrency(totalOutstanding)}</p>
            <p className="text-xs text-muted-foreground mt-1">pending collection</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5 px-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">This Month</span>
              <TrendingUp className="w-4 h-4 text-secondary opacity-60" />
            </div>
            <p className="text-3xl font-bold text-secondary">{formatCurrency(thisMonthTotal)}</p>
            <p className="text-xs text-muted-foreground mt-1">all statuses</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="disputed">Disputed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={providerFilter} onValueChange={setProviderFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Provider" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Providers</SelectItem>
            {uniqueProviders.map((slug) => (
              <SelectItem key={slug} value={slug}>{formatSlug(slug)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="this_month">This Month</SelectItem>
            <SelectItem value="last_month">Last Month</SelectItem>
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground self-center ml-auto">
          {filtered.length} invoice{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Invoice Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Booking Code</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Procedure Total</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Commission Owed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {new Date(inv.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {inv.booking_code ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="font-medium">{formatSlug(inv.provider_slug)}</TableCell>
                    <TableCell>{formatCurrency(inv.procedure_total)}</TableCell>
                    <TableCell>{(inv.commission_rate * 100).toFixed(0)}%</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(inv.commission_amount)}</TableCell>
                    <TableCell>
                      <Badge className={`text-xs border ${STATUS_STYLES[inv.status] || ""}`}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {inv.status === "pending" && (
                        <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleMarkPaid(inv.id)}>
                          <DollarSign className="w-3 h-3 mr-1" />
                          Mark Paid
                        </Button>
                      )}
                      {inv.status === "paid" && inv.paid_at && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(inv.paid_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Provider Summary */}
      {uniqueProviders.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" />
              Provider Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Total Owed (Pending)</TableHead>
                    <TableHead>Total Paid</TableHead>
                    <TableHead>Bookings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uniqueProviders
                    .sort((a, b) => providerMap[b].owed - providerMap[a].owed)
                    .map((slug) => {
                      const s = providerMap[slug];
                      return (
                        <TableRow key={slug}>
                          <TableCell className="font-medium">{formatSlug(slug)}</TableCell>
                          <TableCell>
                            <span className={s.owed > 0 ? "text-secondary font-semibold" : "text-muted-foreground"}>
                              {formatCurrency(s.owed)}
                            </span>
                          </TableCell>
                          <TableCell className="text-primary font-medium">{formatCurrency(s.paid)}</TableCell>
                          <TableCell className="text-muted-foreground">{s.count}</TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CommissionsSection;
