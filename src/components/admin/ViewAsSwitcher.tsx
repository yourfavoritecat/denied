import { useViewAs, ViewAsRole } from "@/hooks/useViewAs";
import { useAdmin } from "@/hooks/useAdmin";
import { Shield, Stethoscope, User, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const roles: { value: ViewAsRole; label: string; icon: typeof Shield; description: string }[] = [
  { value: "admin", label: "Admin", icon: Shield, description: "Full platform access" },
  { value: "provider", label: "Provider", icon: Stethoscope, description: "Clinic dashboard view" },
  { value: "traveler", label: "Traveler", icon: User, description: "Patient experience" },
];

const ViewAsSwitcher = () => {
  const { isAdmin, loading } = useAdmin();
  const { viewAs, setViewAs } = useViewAs();

  if (loading || !isAdmin) return null;

  const current = roles.find((r) => r.value === viewAs) || roles[0];

  return (
    <div className="fixed bottom-4 right-4 z-[100]">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            className={`shadow-lg gap-2 font-semibold ${
              viewAs !== "admin"
                ? "bg-amber-500 hover:bg-amber-600 text-black"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }`}
          >
            <current.icon className="w-4 h-4" />
            Viewing as: {current.label}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 z-[101]">
          {roles.map((role) => (
            <DropdownMenuItem
              key={role.value}
              onClick={() => setViewAs(role.value)}
              className={`flex items-center gap-3 py-2.5 ${viewAs === role.value ? "bg-muted" : ""}`}
            >
              <role.icon className="w-4 h-4 shrink-0" />
              <div>
                <p className="font-medium text-sm">{role.label}</p>
                <p className="text-xs text-muted-foreground">{role.description}</p>
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ViewAsSwitcher;
