import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search } from "lucide-react";

interface UserRow {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  provider_slug: string | null;
  created_at: string;
  booking_count: number;
}

const UsersSection = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Get profiles, auth user emails, and booking counts
      const [profilesRes, authRes, bookingsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, first_name, last_name, provider_slug, created_at"),
        supabase.rpc("get_admin_user_list"),
        supabase.from("bookings").select("user_id"),
      ]);

      const profiles = (profilesRes.data as any[]) || [];
      const authUsers = (authRes.data as any[]) || [];
      const bookings = (bookingsRes.data as any[]) || [];

      const emailMap = new Map(authUsers.map((u: any) => [u.user_id, u.email]));
      const bookingCounts = new Map<string, number>();
      bookings.forEach((b: any) => bookingCounts.set(b.user_id, (bookingCounts.get(b.user_id) || 0) + 1));

      setUsers(profiles.map((p: any) => ({
        user_id: p.user_id,
        email: emailMap.get(p.user_id) || "—",
        first_name: p.first_name,
        last_name: p.last_name,
        provider_slug: p.provider_slug,
        created_at: p.created_at,
        booking_count: bookingCounts.get(p.user_id) || 0,
      })));
      setLoading(false);
    };
    load();
  }, []);

  const filtered = users.filter((u) =>
    [u.email, u.first_name, u.last_name].some((f) => (f || "").toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Users</h2>
        <span className="text-sm text-muted-foreground">{filtered.length} users</span>
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
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No users</TableCell></TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">{[u.first_name, u.last_name].filter(Boolean).join(" ") || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {u.provider_slug ? "Provider" : "Patient"}
                      </Badge>
                    </TableCell>
                    <TableCell>{u.booking_count}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
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

export default UsersSection;
