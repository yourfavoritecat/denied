import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Syncs a JSON state blob to the trip_planner_state table,
 * keyed by (user_id, booking_id, state_key).
 * Falls back to localStorage when user is not authenticated.
 * Debounces writes to the database (500ms).
 */
export function useTripPlannerState<T>(
  bookingId: string,
  stateKey: string,
  defaultValue: T
): [T, (updater: T | ((prev: T) => T)) => void, boolean] {
  const { user } = useAuth();
  const localKey = `${stateKey}-${bookingId}`;
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestValue = useRef<T>(defaultValue);

  // Initialize from localStorage as fast fallback
  const [value, setValueRaw] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(localKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return defaultValue;
  });

  // Load from database on mount (overrides localStorage if found)
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      const { data } = await supabase
        .from("trip_planner_state" as any)
        .select("state_data")
        .eq("user_id", user.id)
        .eq("booking_id", bookingId)
        .eq("state_key", stateKey)
        .maybeSingle();

      if (!cancelled && data) {
        const dbValue = (data as any).state_data as T;
        setValueRaw(dbValue);
        latestValue.current = dbValue;
        // Also sync to localStorage as cache
        localStorage.setItem(localKey, JSON.stringify(dbValue));
      }
      if (!cancelled) setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, [user, bookingId, stateKey]);

  // Debounced save to database
  const persistToDb = useCallback(
    (newValue: T) => {
      if (!user) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);

      saveTimer.current = setTimeout(async () => {
        await supabase
          .from("trip_planner_state" as any)
          .upsert(
            {
              user_id: user.id,
              booking_id: bookingId,
              state_key: stateKey,
              state_data: newValue as any,
            } as any,
            { onConflict: "user_id,booking_id,state_key" }
          );
      }, 500);
    },
    [user, bookingId, stateKey]
  );

  // Wrapper around setState that also persists
  const setValue = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setValueRaw((prev) => {
        const next = typeof updater === "function" ? (updater as (prev: T) => T)(prev) : updater;
        latestValue.current = next;
        // Always sync to localStorage immediately
        localStorage.setItem(localKey, JSON.stringify(next));
        // Debounced sync to database
        persistToDb(next);
        return next;
      });
    },
    [localKey, persistToDb]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  return [value, setValue, loading];
}
