import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserRow {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  provider_slug: string | null;
  created_at: string;
  booking_count: number;
  is_admin?: boolean;
}

const UsersSection = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    const [profilesRes, authRes, bookingsRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("user_id, first_name, last_name, provider_slug, created_at"),
      supabase.rpc("get_admin_user_list"),
      supabase.from("bookings").select("user_id"),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    const profiles = (profilesRes.data as any[]) || [];
    const authUsers = (authRes.data as any[]) || [];
    const bookings = (bookingsRes.data as any[]) || [];
    const roles = (rolesRes.data as any[]) || [];

    const emailMap = new Map(authUsers.map((u: any) => [u.user_id, u.email]));
    const bookingCounts = new Map<string, number>();
    bookings.forEach((b: any) => bookingCounts.set(b.user_id, (bookingCounts.get(b.user_id) || 0) + 1));

    const adminSet = new Set(roles.filter((r: any) => r.role === "admin").map((r: any) => r.user_id));

    setUsers(profiles.map((p: any) => ({
      user_id: p.user_id,
      email: emailMap.get(p.user_id) || "—",
      first_name: p.first_name,
      last_name: p.last_name,
      provider_slug: p.provider_slug,
      created_at: p.created_at,
      booking_count: bookingCounts.get(p.user_id) || 0,
      is_admin: adminSet.has(p.user_id),
    })));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ user_id: deleteTarget.user_id }),
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Delete failed");

      toast({ title: "User deleted successfully" });
      setDeleteTarget(null);
      load();
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const filtered = users.filter((u) =>
    [u.email, u.first_name, u.last_name].some((f) => (f || "").toLowerCase().includes(search.toLowerCase()))
  );

  const getUserName = (u: UserRow) => [u.first_name, u.last_name].filter(Boolean).join(" ") || "—";

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
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No users</TableCell></TableRow>
              ) : (
                filtered.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">{getUserName(u)}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {u.is_admin ? "Admin" : u.provider_slug ? "Provider" : "Patient"}
                      </Badge>
                    </TableCell>
                    <TableCell>{u.booking_count}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </TableCell>
                    <TableCell>
                      {!u.is_admin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDeleteTarget(u)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget ? getUserName(deleteTarget) : "user"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove their account and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UsersSection;
