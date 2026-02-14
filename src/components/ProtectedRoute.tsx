import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";


const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const location = useLocation();

  if (loading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  // Auto-redirect providers who haven't completed onboarding (admins exempt)
  const isProvider = !!(profile as any)?.provider_slug;
  const onboardingComplete = !!(profile as any)?.onboarding_complete;
  const isOnboardingPage = location.pathname === "/provider/onboarding";

  // Admins are always exempt from onboarding redirect
  if (isProvider && !onboardingComplete && !isOnboardingPage && !isAdmin) {
    return <Navigate to="/provider/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
