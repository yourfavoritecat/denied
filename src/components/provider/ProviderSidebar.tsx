import { BarChart3, MessageSquare, DollarSign, Plane, History, Building2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProviderSection = "home" | "inquiries" | "quoted" | "active" | "past";

const sections: { id: ProviderSection; label: string; icon: React.ElementType }[] = [
  { id: "home", label: "Home", icon: BarChart3 },
  { id: "inquiries", label: "Inquiries", icon: MessageSquare },
  { id: "quoted", label: "Quoted", icon: DollarSign },
  { id: "active", label: "Active Trips", icon: Plane },
  { id: "past", label: "Past", icon: History },
];

interface Props {
  active: ProviderSection;
  onChange: (s: ProviderSection) => void;
  counts: Record<string, number>;
  providerName?: string;
}

const ProviderSidebar = ({ active, onChange, counts, providerName }: Props) => (
  <aside className="w-56 shrink-0 border-r border-border bg-card min-h-[calc(100vh-4rem)] shadow-lifted">
    <div className="p-4 border-b border-border flex items-center gap-2">
      <Building2 className="w-5 h-5 text-primary" />
      <span className="font-bold text-sm truncate">{providerName || "Provider"}</span>
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
          {s.id !== "home" && (counts[s.id] || 0) > 0 && (
            <span className={cn(
              "ml-auto text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center",
              s.id === "inquiries" ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {counts[s.id]}
            </span>
          )}
        </button>
      ))}
    </nav>
  </aside>
);

export default ProviderSidebar;
