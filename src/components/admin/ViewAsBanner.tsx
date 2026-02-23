import { useViewAs } from "@/hooks/useViewAs";
import { useAdmin } from "@/hooks/useAdmin";
import { Eye } from "lucide-react";

const ViewAsBanner = () => {
  const { isAdmin, loading } = useAdmin();
  const { viewAs, setViewAs } = useViewAs();

  if (loading || !isAdmin || viewAs === "admin") return null;

  const labelMap: Record<string, string> = { provider: "Provider", traveler: "Traveler", creator: "Creator", visitor: "Visitor" };
  const label = labelMap[viewAs] || viewAs;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[110] bg-amber-500 text-black text-xs font-semibold py-1.5 px-4 rounded-full flex items-center gap-2 shadow-lg">
      <Eye className="w-3 h-3" />
      Viewing as {label}
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
