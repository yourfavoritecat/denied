import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import AdminSidebar, { AdminSection } from "@/components/admin/AdminSidebar";
import OverviewSection from "@/components/admin/OverviewSection";
import WaitlistSection from "@/components/admin/WaitlistSection";
import ApplicationsSection from "@/components/admin/ApplicationsSection";
import CredentialsReviewSection from "@/components/admin/CredentialsReviewSection";
import ProvidersSection from "@/components/admin/ProvidersSection";
import BookingsSection from "@/components/admin/BookingsSection";
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
  users: UsersSection,
};

const AdminPage = () => {
  const { isAdmin, loading } = useAdmin();
  const [section, setSection] = useState<AdminSection>("overview");

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
      <AdminSidebar active={section} onChange={setSection} />
      <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
        <ActiveSection />
      </main>
    </div>
  );
};

export default AdminPage;
