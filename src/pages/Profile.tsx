import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Heart, Calendar, ShieldCheck, ClipboardList, Sparkles, Shield, KeyRound, Trash2, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SettingsTab from "@/components/profile/SettingsTab";
import SocialVerificationSection from "@/components/profile/SocialVerificationSection";
import VerifiedBadge, { isUserVerified } from "@/components/profile/VerifiedBadge";
import PatientHistoryTab from "@/components/profile/PatientHistoryTab";
import SavedProvidersTab from "@/components/profile/SavedProvidersTab";
import TripsTab from "@/components/profile/TripsTab";
import ReviewsTab from "@/components/profile/ReviewsTab";
import AvatarUpload from "@/components/profile/AvatarUpload";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const VALID_TABS = ["reviews", "history", "settings", "verification", "saved", "trips", "security"];

const ProfilePage = () => {
  const { user, profile } = useAuth();
  const socialVerifications = (profile as any)?.social_verifications || {};
  const verified = isUserVerified(socialVerifications);
  const [creatorHandle, setCreatorHandle] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const rawTab = searchParams.get("tab") || "";
  const currentTab = (rawTab === "feed" || rawTab === "my-journey")
    ? "reviews"
    : VALID_TABS.includes(rawTab) ? rawTab : "reviews";

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  useEffect(() => {
    if (!user) return;
    const fetchCreator = async () => {
      const { data } = await supabase
        .from("creator_profiles")
        .select("handle")
        .eq("user_id", user.id)
        .maybeSingle();
      setCreatorHandle(data?.handle || null);
    };
    fetchCreator();
  }, [user]);

  const displayName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "User"
    : "User";

  return (
    <div className="min-h-screen theme-public" style={{ background: '#FFFFFF' }}>
      <Navbar light />
      <main>
        <div className="max-w-[960px] mx-auto px-4 pt-24 pb-16">
          {/* Profile Header */}
          <div
            className="mb-8"
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.06)',
              borderRadius: 16,
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              padding: 24,
            }}
          >
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <AvatarUpload size="lg" />
              <div className="text-center sm:text-left flex-1">
                <div className="flex items-center gap-3 justify-center sm:justify-start mb-1">
                  <h1 className="text-2xl font-bold" style={{ color: '#111111' }}>{displayName}</h1>
                </div>
                <p className="mb-3" style={{ color: '#888888', fontSize: 14 }}>{user?.email}</p>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {/* Member since badge */}
                  <span
                    className="inline-flex items-center text-xs font-medium"
                    style={{
                      background: 'rgba(0,0,0,0.04)',
                      border: '1px solid rgba(0,0,0,0.08)',
                      borderRadius: 9999,
                      padding: '4px 12px',
                      color: '#555555',
                    }}
                  >
                    member since {new Date(user?.created_at || "").getFullYear()}
                  </span>
                  <VerifiedBadge verified={verified} size="md" />
                  {creatorHandle && (
                    <Link
                      to={`/${creatorHandle}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium transition-all duration-200"
                      style={{
                        background: 'rgba(255,107,74,0.06)',
                        border: '1px solid rgba(255,107,74,0.12)',
                        borderRadius: 9999,
                        padding: '4px 12px',
                        color: '#FF6B4A',
                      }}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      view creator page
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabbed Content */}
          <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList
              className="flex flex-wrap h-auto gap-1 p-1 rounded-xl"
              style={{
                background: '#FAFAFA',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              <TabsTrigger value="reviews" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Star className="w-4 h-4" />
                <span className="hidden sm:inline">reviews</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <ClipboardList className="w-4 h-4" />
                <span className="hidden sm:inline">patient history</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">personal info</span>
              </TabsTrigger>
              <TabsTrigger value="verification" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">verification</span>
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Heart className="w-4 h-4" />
                <span className="hidden sm:inline">favorites</span>
              </TabsTrigger>
              <TabsTrigger value="trips" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">trips</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">security</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reviews"><ReviewsTab /></TabsContent>
            <TabsContent value="history"><PatientHistoryTab /></TabsContent>
            <TabsContent value="settings"><SettingsTab /></TabsContent>
            <TabsContent value="verification"><SocialVerificationSection /></TabsContent>
            <TabsContent value="saved"><SavedProvidersTab /></TabsContent>
            <TabsContent value="trips"><TripsTab /></TabsContent>
            <TabsContent value="security">
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: 16,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                  padding: 24,
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-5 h-5" style={{ color: '#111111' }} />
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#111111' }}>security</h3>
                </div>
                <p style={{ fontSize: 13, color: '#888888', marginBottom: 24 }}>manage your account security</p>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#111111' }}>change password</p>
                      <p className="text-xs" style={{ color: '#888888' }}>update your account password</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      style={{ borderRadius: 9999, border: '1px solid rgba(0,0,0,0.1)', color: '#555555' }}
                    >
                      <KeyRound className="w-4 h-4" />
                      change password
                    </Button>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 24 }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#DC2626' }}>delete account</p>
                        <p className="text-xs" style={{ color: '#888888' }}>permanently delete your account and all associated data</p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex items-center gap-2"
                        style={{ borderRadius: 9999 }}
                      >
                        <Trash2 className="w-4 h-4" />
                        delete account
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
