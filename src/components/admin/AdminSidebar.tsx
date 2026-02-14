import { BarChart3, Users, Building2, Plane, Mail, Shield, BadgeCheck, Stethoscope, Inbox, Star, Flag, Bug, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export type AdminSection = "overview" | "inbox" | "waitlist" | "applications" | "verification" | "providers" | "bookings" | "reviews" | "flags" | "users" | "bugs";

const sections: { id: AdminSection; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "waitlist", label: "Waitlist", icon: Mail },
  { id: "applications", label: "Applications", icon: Building2 },
  { id: "verification", label: "Verification", icon: BadgeCheck },
  { id: "providers", label: "Providers", icon: Stethoscope },
  { id: "bookings", label: "Bookings", icon: Plane },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "flags", label: "Flags", icon: Flag },
  { id: "users", label: "Users", icon: Users },
  { id: "bugs", label: "Bug Reports", icon: Bug },
];

interface Props {
  active: AdminSection;
  onChange: (s: AdminSection) => void;
  inboxCount?: number;
  flagCount?: number;
}

const SidebarNav = ({ active, onChange, inboxCount = 0, flagCount = 0, onItemClick }: Props & { onItemClick?: () => void }) => (
  <nav className="p-2 space-y-1">
    {sections.map((s) => {
      const badgeCount = s.id === "inbox" ? inboxCount : s.id === "flags" ? flagCount : 0;
      return (
        <button
          key={s.id}
          onClick={() => { onChange(s.id); onItemClick?.(); }}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors",
            active === s.id
              ? "bg-primary/10 text-primary font-medium"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <s.icon className="w-4 h-4" />
          {s.label}
          {badgeCount > 0 && (
            <span className="ml-auto bg-secondary text-secondary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {badgeCount}
            </span>
          )}
        </button>
      );
    })}
  </nav>
);

const AdminSidebar = ({ active, onChange, inboxCount = 0, flagCount = 0 }: Props) => {
  const [open, setOpen] = useState(false);
  const activeLabel = sections.find(s => s.id === active)?.label || "Overview";

  return (
    <>
      {/* Mobile: top bar with hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="shrink-0">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-bold text-sm">Admin</span>
            </div>
            <SidebarNav active={active} onChange={onChange} inboxCount={inboxCount} flagCount={flagCount} onItemClick={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">{activeLabel}</span>
        </div>
      </div>

      {/* Desktop: fixed sidebar */}
      <aside className="hidden lg:block w-56 shrink-0 border-r border-border bg-card min-h-[calc(100vh-4rem)] shadow-lifted">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <span className="font-bold text-sm">Admin</span>
        </div>
        <SidebarNav active={active} onChange={onChange} inboxCount={inboxCount} flagCount={flagCount} />
      </aside>
    </>
  );
};

export default AdminSidebar;
