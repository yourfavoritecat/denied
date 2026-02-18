import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import CreatorProfile from "./CreatorProfile";
import UserProfile from "./UserProfile";
import NotFound from "./NotFound";

type RouteType = "loading" | "creator" | "traveler" | "notfound";

const HandleRouter = () => {
  const { handle } = useParams<{ handle: string }>();
  const [routeType, setRouteType] = useState<RouteType>("loading");

  useEffect(() => {
    if (!handle) { setRouteType("notfound"); return; }
    const resolve = async () => {
      // Check creator profiles first
      const { data: creator } = await supabase
        .from("creator_profiles")
        .select("handle")
        .eq("handle", handle)
        .eq("is_published", true)
        .maybeSingle();

      if (creator) { setRouteType("creator"); return; }

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
  }, [handle]);

  if (routeType === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  if (routeType === "creator") return <CreatorProfile />;
  if (routeType === "traveler") return <UserProfile usernameParam={handle} />;
  return <NotFound />;
};

export default HandleRouter;
