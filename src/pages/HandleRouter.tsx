import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import CreatorProfile from "./CreatorProfile";
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
      // Check creator profiles first (without is_published filter)
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

      // Check traveler profiles by username
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  if (routeType === "creator") return <CreatorProfile />;
  if (routeType === "creator_draft") return (
    <>
      <div className="bg-muted border-b border-border px-4 py-2 text-center text-sm text-muted-foreground" style={{ marginTop: '64px' }}>
        your profile is hidden —{" "}
        <Link to="/creator/edit" className="underline text-primary hover:text-primary/80">
          publish it from your editor
        </Link>
      </div>
      <CreatorProfile />
    </>
  );
  if (routeType === "traveler") return <UserProfile usernameParam={handle} />;
  return <NotFound />;
};

export default HandleRouter;
