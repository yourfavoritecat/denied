import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ViewAsProvider } from "@/hooks/useViewAs";
import { ChatProvider } from "@/hooks/useChatContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import ViewAsSwitcher from "@/components/admin/ViewAsSwitcher";
import ViewAsBanner from "@/components/admin/ViewAsBanner";
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
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";
import Notifications from "./pages/Notifications";
import MyBugReports from "./pages/MyBugReports";
import CreatorJoin from "./pages/CreatorJoin";
import CreatorEdit from "./pages/CreatorEdit";
import CreatorProfile from "./pages/CreatorProfile";
import BugReportButton from "./components/beta/BugReportButton";
import TripAssistantWrapper from "./components/chat/TripAssistantWrapper";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ViewAsProvider>
      <ChatProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Launch />} />
            <Route path="/admin-login" element={<Launch showLogin />} />
            <Route path="/home" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
            <Route path="/provider/:slug" element={<ProtectedRoute><ProviderProfile /></ProtectedRoute>} />
            <Route path="/about" element={<About />} />
            <Route path="/apply" element={<ProtectedRoute><Apply /></ProtectedRoute>} />
            <Route path="/join/:code" element={<CreatorJoin />} />
            <Route path="/c/:handle" element={<CreatorProfile />} />
            <Route path="/creator/edit" element={<ProtectedRoute><CreatorEdit /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/user/:userId" element={<UserProfile />} />
            <Route path="/my-trips" element={<ProtectedRoute><MyTrips /></ProtectedRoute>} />
            <Route path="/booking/:bookingId" element={<ProtectedRoute><BookingDetail /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/my-bugs" element={<ProtectedRoute><MyBugReports /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/provider/onboarding" element={<ProtectedRoute><ProviderOnboarding /></ProtectedRoute>} />
            <Route path="/provider-dashboard" element={<ProtectedRoute><ProviderDashboard /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ViewAsBanner />
          <ViewAsSwitcher />
          <BugReportButton />
          <TripAssistantWrapper />
        </BrowserRouter>
      </TooltipProvider>
      </ChatProvider>
      </ViewAsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
