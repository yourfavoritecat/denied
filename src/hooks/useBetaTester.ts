import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useBetaTester = () => {
  const { user, loading: authLoading } = useAuth();
  const [isBetaTester, setIsBetaTester] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsBetaTester(false);
      setLoading(false);
      return;
    }

    const check = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "beta_tester")
        .maybeSingle();
      setIsBetaTester(!!data);
      setLoading(false);
    };
    check();
  }, [user, authLoading]);

  return { isBetaTester, loading: loading || authLoading };
};
