import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  // Redirect legacy tab values
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
    <div className="min-h-screen">
      <Navbar />
      <main>
        <div className="max-w-[960px] mx-auto px-4 pt-24 pb-16">
          {/* Profile Header */}
          <Card className="mb-8 glossy-card">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <AvatarUpload size="lg" />
                <div className="text-center sm:text-left flex-1">
                  <div className="flex items-center gap-3 justify-center sm:justify-start mb-1">
                    <h1 className="text-2xl font-bold">{displayName}</h1>
                  </div>
                  <p className="text-muted-foreground mb-3">{user?.email}</p>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <Badge variant="secondary">member since {new Date(user?.created_at || "").getFullYear()}</Badge>
                    <VerifiedBadge verified={verified} size="md" />
                    {creatorHandle && (
                      <Button variant="secondary" size="sm" asChild className="gap-1.5">
                        <Link to={`/${creatorHandle}`}>
                          <Sparkles className="w-3.5 h-3.5" />
                          view creator page
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabbed Content */}
          <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
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
              <Card className="glossy-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    security
                  </CardTitle>
                  <CardDescription>manage your account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">change password</p>
                      <p className="text-xs text-muted-foreground">update your account password</p>
                    </div>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4" />
                      change password
                    </Button>
                  </div>
                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-destructive">delete account</p>
                        <p className="text-xs text-muted-foreground">permanently delete your account and all associated data</p>
                      </div>
                      <Button variant="destructive" size="sm" className="flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        delete account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
