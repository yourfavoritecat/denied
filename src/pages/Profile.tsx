import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Settings, Heart, Calendar, ShieldCheck, Camera, ExternalLink, ClipboardList, Sparkles, Shield, KeyRound, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SettingsTab from "@/components/profile/SettingsTab";
import SocialVerificationSection from "@/components/profile/SocialVerificationSection";
import UserTrustBadge, { computeUserTrustTier } from "@/components/profile/UserTrustBadge";
import PatientHistoryTab from "@/components/profile/PatientHistoryTab";
import SavedProvidersTab from "@/components/profile/SavedProvidersTab";
import TripsTab from "@/components/profile/TripsTab";
import ProfileFeedTab from "@/components/profile/ProfileFeedTab";
import AvatarUpload from "@/components/profile/AvatarUpload";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const VALID_TABS = ["feed", "history", "settings", "verification", "saved", "trips", "security"];

const ProfilePage = () => {
  const { user, profile } = useAuth();
  const socialVerifications = (profile as any)?.social_verifications || {};
  const trustTier = computeUserTrustTier(socialVerifications, false);
  const [creatorHandle, setCreatorHandle] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = VALID_TABS.includes(searchParams.get("tab") || "") 
    ? searchParams.get("tab")! 
    : "feed";

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
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Profile Header */}
          <Card className="mb-8 shadow-elevated border-border/50">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <AvatarUpload size="lg" />
                <div className="text-center sm:text-left flex-1">
                  <div className="flex items-center gap-3 justify-center sm:justify-start mb-1">
                    <h1 className="text-2xl font-bold">{displayName}</h1>
                    <Badge variant="outline" className="text-xs">private view</Badge>
                  </div>
                  <p className="text-muted-foreground mb-3">{user?.email}</p>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <Badge variant="secondary">member since {new Date(user?.created_at || "").getFullYear()}</Badge>
                    <UserTrustBadge tier={trustTier} size="md" />
                    {(profile as any)?.username && (
                      <Button variant="outline" size="sm" asChild className="gap-1.5">
                        <Link to={`/user/${(profile as any).username}`}>
                          <ExternalLink className="w-3.5 h-3.5" />
                          view public profile
                        </Link>
                      </Button>
                    )}
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
              <TabsTrigger value="feed" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">my journey</span>
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

            <TabsContent value="feed"><ProfileFeedTab /></TabsContent>
            <TabsContent value="history"><PatientHistoryTab /></TabsContent>
            <TabsContent value="settings"><SettingsTab /></TabsContent>
            <TabsContent value="verification"><SocialVerificationSection /></TabsContent>
            <TabsContent value="saved"><SavedProvidersTab /></TabsContent>
            <TabsContent value="trips"><TripsTab /></TabsContent>
            <TabsContent value="security">
              <Card className="shadow-elevated border-border/50">
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
