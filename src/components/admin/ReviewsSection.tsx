import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ReviewRow {
  id: string;
  user_id: string;
  provider_slug: string;
  procedure_name: string;
  title: string;
  review_text: string;
  rating: number;
  rating_cleanliness: number | null;
  rating_communication: number | null;
  rating_wait_time: number | null;
  rating_outcome: number | null;
  rating_safety: number | null;
  rating_value: number | null;
  recommend: boolean;
  verified_trip: boolean;
  is_edited: boolean;
  photos: string[] | null;
  videos: string[] | null;
  created_at: string;
  reviewer_name?: string;
}

const ReviewsSection = () => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
      const raw = (data as any[]) || [];

      const userIds = [...new Set(raw.map((r) => r.user_id))];
      const { data: profiles } = userIds.length > 0
        ? await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds)
        : { data: [] };
      const pMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      setReviews(raw.map((r) => {
        const p = pMap.get(r.user_id);
        return { ...r, reviewer_name: p ? [p.first_name, p.last_name].filter(Boolean).join(" ") : "Anonymous" };
      }));
      setLoading(false);
    };
    load();
  }, []);

  const filtered = reviews.filter((r) =>
    [r.reviewer_name, r.provider_slug, r.procedure_name, r.title]
      .some((f) => (f || "").toLowerCase().includes(search.toLowerCase()))
  );

  const escapeCsv = (v: string) => `"${String(v).replace(/"/g, '""')}"`;

  const exportCSV = useCallback(() => {
    if (filtered.length === 0) {
      toast({ title: "Nothing to export", description: "No reviews match the current filter." });
      return;
    }
    const rows = filtered.map((r) => ({
      title: r.title,
      reviewer: r.reviewer_name || "",
      provider: r.provider_slug,
      procedure: r.procedure_name,
      rating: r.rating,
      cleanliness: r.rating_cleanliness ?? "",
      communication: r.rating_communication ?? "",
      wait_time: r.rating_wait_time ?? "",
      outcome: r.rating_outcome ?? "",
      safety: r.rating_safety ?? "",
      value: r.rating_value ?? "",
      recommend: r.recommend ? "yes" : "no",
      verified_trip: r.verified_trip ? "yes" : "no",
      edited: r.is_edited ? "yes" : "no",
      photos: (r.photos ?? []).length,
      videos: (r.videos ?? []).length,
      review_text: r.review_text,
      created_at: r.created_at,
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
    a.download = `reviews-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${rows.length} review(s) exported to CSV.` });
  }, [filtered, toast]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Reviews</h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{filtered.length} reviews</span>
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
                <TableHead>Rating</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Reviewer</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Procedure</TableHead>
                <TableHead>Recommend</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No reviews</TableCell></TableRow>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                        <span className="font-medium">{r.rating}</span>
                      </span>
                    </TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">{r.title}</TableCell>
                    <TableCell className="text-muted-foreground">{r.reviewer_name}</TableCell>
                    <TableCell className="text-muted-foreground">{r.provider_slug}</TableCell>
                    <TableCell>{r.procedure_name}</TableCell>
                    <TableCell>
                      <Badge variant={r.recommend ? "default" : "destructive"} className="text-xs">
                        {r.recommend ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ReviewsSection;
