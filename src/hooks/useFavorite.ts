import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useFavorite(targetId: string, targetType: "provider" | "creator") {
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !targetId) return;
    supabase
      .from("favorites" as any)
      .select("id")
      .eq("user_id", user.id)
      .eq("target_id", targetId)
      .eq("target_type", targetType)
      .maybeSingle()
      .then(({ data }) => setIsFavorited(!!data));
  }, [user, targetId, targetType]);

  const toggle = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    if (isFavorited) {
      await supabase
        .from("favorites" as any)
        .delete()
        .eq("user_id", user.id)
        .eq("target_id", targetId)
        .eq("target_type", targetType);
      setIsFavorited(false);
    } else {
      await supabase
        .from("favorites" as any)
        .insert({ user_id: user.id, target_id: targetId, target_type: targetType });
      setIsFavorited(true);
    }
    setLoading(false);
  }, [user, isFavorited, targetId, targetType]);

  return { isFavorited, toggle, loading };
}
