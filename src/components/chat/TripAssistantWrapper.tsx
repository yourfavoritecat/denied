import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import TripAssistantChat from "./TripAssistantChat";

const HIDDEN_PATHS = ["/", "/auth"];

export default function TripAssistantWrapper() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  if (!user) return null;
  if (HIDDEN_PATHS.includes(pathname)) return null;
  if (pathname.startsWith("/join/")) return null;

  return <TripAssistantChat />;
}
