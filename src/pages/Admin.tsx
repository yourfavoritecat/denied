import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import AdminSidebar, { AdminSection } from "@/components/admin/AdminSidebar";
import OverviewSection from "@/components/admin/OverviewSection";
import WaitlistSection from "@/components/admin/WaitlistSection";
import ApplicationsSection from "@/components/admin/ApplicationsSection";
import CredentialsReviewSection from "@/components/admin/CredentialsReviewSection";
import ProvidersSection from "@/components/admin/ProvidersSection";
import BookingsSection from "@/components/admin/BookingsSection";
import ReviewsSection from "@/components/admin/ReviewsSection";
import InboxSection from "@/components/admin/InboxSection";
import UsersSection from "@/components/admin/UsersSection";

const SECTIONS: Record<AdminSection, React.ComponentType> = {
  overview: OverviewSection,
  inbox: InboxSection,
  waitlist: WaitlistSection,
  applications: ApplicationsSection,
  verification: CredentialsReviewSection,
  providers: ProvidersSection,
  bookings: BookingsSection,
  reviews: ReviewsSection,
  users: UsersSection,
};

const AdminPage = () => {
  const { isAdmin, loading } = useAdmin();
  const [section, setSection] = useState<AdminSection>("overview");
  const [inboxCount, setInboxCount] = useState(0);

  useEffect(() => {
    const loadInboxCount = async () => {
      const { data: adminProviders } = await supabase
        .from("providers")
        .select("slug")
        .eq("admin_managed", true);
      if (!adminProviders?.length) return;
      const { count } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .in("provider_slug", adminProviders.map((p) => p.slug))
        .eq("status", "inquiry");
      setInboxCount(count || 0);
    };
    if (isAdmin) loadInboxCount();
  }, [isAdmin, section]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const ActiveSection = SECTIONS[section];

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar active={section} onChange={setSection} inboxCount={inboxCount} />
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <ActiveSection />
      </main>
    </div>
  );
};

export default AdminPage;
