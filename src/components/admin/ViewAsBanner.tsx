import { useViewAs } from "@/hooks/useViewAs";
import { useAdmin } from "@/hooks/useAdmin";
import { Eye } from "lucide-react";

const ViewAsBanner = () => {
  const { isAdmin, loading } = useAdmin();
  const { viewAs, setViewAs } = useViewAs();

  if (loading || !isAdmin || viewAs === "admin") return null;

  const label = viewAs === "provider" ? "Provider" : "Traveler";

  return (
    <div className="fixed top-0 left-0 right-0 z-[110] bg-amber-500 text-black text-center text-xs font-semibold py-1 flex items-center justify-center gap-2">
      <Eye className="w-3 h-3" />
      You are viewing the site as a {label}
      <button
        onClick={() => setViewAs("admin")}
        className="underline hover:no-underline ml-1"
      >
        Exit
      </button>
    </div>
  );
};

export default ViewAsBanner;
