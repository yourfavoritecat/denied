import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useCreator = () => {
  const { user } = useAuth();
  const [isCreator, setIsCreator] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsCreator(false);
      setLoading(false);
      return;
    }

    const check = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .eq("role", "creator")
        .maybeSingle();
      setIsCreator(!!data);
      setLoading(false);
    };

    check();
  }, [user]);

  return { isCreator, loading };
};
