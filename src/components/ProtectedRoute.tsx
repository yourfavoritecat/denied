import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useViewAs } from "@/hooks/useViewAs";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();
  const { isAdmin } = useAdmin();
  const { viewAs } = useViewAs();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Auto-redirect providers who haven't completed onboarding (admins exempt)
  const isProvider = !!(profile as any)?.provider_slug;
  const onboardingComplete = !!(profile as any)?.onboarding_complete;
  const isOnboardingPage = location.pathname === "/provider/onboarding";

  // Admins viewing as non-provider roles skip the onboarding redirect
  if (isProvider && !onboardingComplete && !isOnboardingPage && !isAdmin && viewAs !== "traveler") {
    return <Navigate to="/provider/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
