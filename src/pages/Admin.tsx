import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
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
import FlagsSection from "@/components/admin/FlagsSection";
import InboxSection from "@/components/admin/InboxSection";
import UsersSection from "@/components/admin/UsersSection";
import BugReportsSection from "@/components/admin/BugReportsSection";
import CreatorsSection from "@/components/admin/CreatorsSection";
import CommissionsSection from "@/components/admin/CommissionsSection";

const SECTIONS: Record<AdminSection, React.ComponentType<any>> = {
  overview: OverviewSection,
  inbox: InboxSection,
  waitlist: WaitlistSection,
  applications: ApplicationsSection,
  verification: CredentialsReviewSection,
  providers: ProvidersSection,
  bookings: BookingsSection,
  reviews: ReviewsSection,
  flags: FlagsSection,
  users: UsersSection,
  bugs: BugReportsSection,
  creators: CreatorsSection,
  commissions: CommissionsSection,
};

const AdminPage = () => {
  const { isAdmin, loading } = useAdmin();
  const [section, setSection] = useState<AdminSection>("overview");
  const [inboxCount, setInboxCount] = useState(0);
  const [flagCount, setFlagCount] = useState(0);

  useEffect(() => {
    const loadCounts = async () => {
      const { data: adminProviders } = await supabase
        .from("providers")
        .select("slug")
        .eq("admin_managed", true);
      if (adminProviders?.length) {
        const { count } = await supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .in("provider_slug", adminProviders.map((p) => p.slug))
          .eq("status", "inquiry");
        setInboxCount(count || 0);
      }

      const { count: flags } = await supabase
        .from("content_flags" as any)
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      setFlagCount(flags || 0);
    };
    if (isAdmin) loadCounts();
  }, [isAdmin, section]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const ActiveSection = SECTIONS[section];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-16">
        <AdminSidebar active={section} onChange={setSection} inboxCount={inboxCount} flagCount={flagCount} />
        <main className="flex-1 p-4 pt-4 lg:p-8 overflow-y-auto">
          {section === "overview" ? (
            <OverviewSection onNavigate={(s: string) => setSection(s as AdminSection)} />
          ) : (
            <ActiveSection />
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPage;
