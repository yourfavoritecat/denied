import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useCreator = () => {
  const { user, profile } = useAuth();
  const [isCreator, setIsCreator] = useState(false);
  const [creatorHandle, setCreatorHandle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsCreator(false);
      setCreatorHandle(null);
      setLoading(false);
      return;
    }

    const check = async () => {
      // Check is_creator flag on profile OR user_roles table
      const profileIsCreator = !!(profile as any)?.is_creator;

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .eq("role", "creator")
        .maybeSingle();

      const creator = profileIsCreator || !!roleData;
      setIsCreator(creator);

      if (creator) {
        const { data: cp } = await supabase
          .from("creator_profiles")
          .select("handle")
          .eq("user_id", user.id)
          .maybeSingle();
        setCreatorHandle(cp?.handle ?? null);
      }

      setLoading(false);
    };

    check();
  }, [user, profile]);

  return { isCreator, creatorHandle, loading };
};
