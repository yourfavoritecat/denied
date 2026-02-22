import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import CreatorCanvas from "@/components/creator/CreatorCanvas";
import UserProfile from "./UserProfile";
import NotFound from "./NotFound";

type RouteType = "loading" | "creator" | "creator_draft" | "traveler" | "notfound";

const HandleRouter = () => {
  const { handle } = useParams<{ handle: string }>();
  const { user } = useAuth();
  const [routeType, setRouteType] = useState<RouteType>("loading");

  useEffect(() => {
    if (!handle) { setRouteType("notfound"); return; }
    const resolve = async () => {
      const { data: creator } = await supabase
        .from("creator_profiles")
        .select("handle, is_published, user_id")
        .eq("handle", handle)
        .maybeSingle();

      if (creator) {
        if ((creator as any).is_published) {
          setRouteType("creator");
        } else if (user && user.id === (creator as any).user_id) {
          setRouteType("creator_draft");
        } else {
          setRouteType("notfound");
        }
        return;
      }

      const { data: traveler } = await supabase
        .from("profiles_public" as any)
        .select("username")
        .eq("username", handle)
        .maybeSingle();

      if (traveler) { setRouteType("traveler"); return; }
      setRouteType("notfound");
    };
    resolve();
  }, [handle, user]);

  if (routeType === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#060606' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: '#3BF07A' }} />
      </div>
    );
  }
  if (routeType === "creator") return <CreatorCanvas isEditing={false} handleParam={handle} />;
  if (routeType === "creator_draft") return (
    <>
      <div className="px-4 py-2 text-center text-sm" style={{ background: '#0A0A0A', borderBottom: '1px solid rgba(59,240,122,0.1)', color: '#B0B0B0' }}>
        your profile is hidden —{" "}
        <Link to="/creator/edit" className="underline" style={{ color: '#3BF07A' }}>
          publish it from your editor
        </Link>
      </div>
      <CreatorCanvas isEditing={false} handleParam={handle} />
    </>
  );
  if (routeType === "traveler") return <UserProfile usernameParam={handle} />;
  return <NotFound />;
};

export default HandleRouter;
