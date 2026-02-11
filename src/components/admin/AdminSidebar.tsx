import { BarChart3, Users, Building2, Plane, Mail, Shield, BadgeCheck, Stethoscope, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminSection = "overview" | "inbox" | "waitlist" | "applications" | "verification" | "providers" | "bookings" | "users";

const sections: { id: AdminSection; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "waitlist", label: "Waitlist", icon: Mail },
  { id: "applications", label: "Applications", icon: Building2 },
  { id: "verification", label: "Verification", icon: BadgeCheck },
  { id: "providers", label: "Providers", icon: Stethoscope },
  { id: "bookings", label: "Bookings", icon: Plane },
  { id: "users", label: "Users", icon: Users },
];

interface Props {
  active: AdminSection;
  onChange: (s: AdminSection) => void;
}

const AdminSidebar = ({ active, onChange }: Props) => (
  <aside className="w-56 shrink-0 border-r border-border bg-card min-h-[calc(100vh-4rem)]">
    <div className="p-4 border-b border-border flex items-center gap-2">
      <Shield className="w-5 h-5 text-primary" />
      <span className="font-bold text-sm">Admin</span>
    </div>
    <nav className="p-2 space-y-1">
      {sections.map((s) => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors",
            active === s.id
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <s.icon className="w-4 h-4" />
          {s.label}
        </button>
      ))}
    </nav>
  </aside>
);

export default AdminSidebar;
