import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Launch from "./pages/Launch";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Search from "./pages/Search";
import ProviderProfile from "./pages/ProviderProfile";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import MyTrips from "./pages/MyTrips";
import BookingDetail from "./pages/BookingDetail";
import Settings from "./pages/Settings";
import Apply from "./pages/Apply";
import ProviderOnboarding from "./pages/ProviderOnboarding";
import ProviderDashboard from "./pages/ProviderDashboard";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Launch />} />
            <Route path="/admin-login" element={<Launch showLogin />} />
            <Route path="/home" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/search" element={<Search />} />
            <Route path="/provider/:slug" element={<ProviderProfile />} />
            <Route path="/apply" element={<Apply />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/user/:userId" element={<UserProfile />} />
            <Route path="/my-trips" element={<ProtectedRoute><MyTrips /></ProtectedRoute>} />
            <Route path="/booking/:bookingId" element={<ProtectedRoute><BookingDetail /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/provider/onboarding" element={<ProtectedRoute><ProviderOnboarding /></ProtectedRoute>} />
            <Route path="/provider-dashboard" element={<ProtectedRoute><ProviderDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
