import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Settings, Heart, Calendar, ShieldCheck, Camera, User, ExternalLink, ClipboardList } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SettingsTab from "@/components/profile/SettingsTab";
import SocialVerificationSection from "@/components/profile/SocialVerificationSection";
import UserTrustBadge, { computeUserTrustTier } from "@/components/profile/UserTrustBadge";
import PatientHistoryTab from "@/components/profile/PatientHistoryTab";
import SavedProvidersTab from "@/components/profile/SavedProvidersTab";
import TripsTab from "@/components/profile/TripsTab";
import ProfileFeedTab from "@/components/profile/ProfileFeedTab";
import AboutMeTab from "@/components/profile/AboutMeTab";
import AvatarUpload from "@/components/profile/AvatarUpload";

const ProfilePage = () => {
  const { user, profile } = useAuth();
  const socialVerifications = (profile as any)?.social_verifications || {};
  const trustTier = computeUserTrustTier(socialVerifications, false);

  const displayName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "User"
    : "User";

  return (
    <div className="min-h-screen bg-muted">
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
                    <Badge variant="outline" className="text-xs">Private View</Badge>
                  </div>
                  <p className="text-muted-foreground mb-3">{user?.email}</p>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <Badge variant="secondary">Member since {new Date(user?.created_at || "").getFullYear()}</Badge>
                    <UserTrustBadge tier={trustTier} size="md" />
                    {(profile as any)?.username && (
                      <Button variant="outline" size="sm" asChild className="gap-1.5">
                        <Link to={`/user/${(profile as any).username}`}>
                          <ExternalLink className="w-3.5 h-3.5" />
                          View Public Profile
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabbed Content */}
          <Tabs defaultValue="about" className="space-y-6">
            <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
              <TabsTrigger value="about" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">About Me</span>
              </TabsTrigger>
              <TabsTrigger value="feed" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">My Journey</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <ClipboardList className="w-4 h-4" />
                <span className="hidden sm:inline">Patient History</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
              <TabsTrigger value="verification" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Verification</span>
              </TabsTrigger>
              <TabsTrigger value="saved" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Heart className="w-4 h-4" />
                <span className="hidden sm:inline">Saved</span>
              </TabsTrigger>
              <TabsTrigger value="trips" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Trips</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="about"><AboutMeTab /></TabsContent>
            <TabsContent value="feed"><ProfileFeedTab /></TabsContent>
            <TabsContent value="history"><PatientHistoryTab /></TabsContent>
            <TabsContent value="settings"><SettingsTab /></TabsContent>
            <TabsContent value="verification"><SocialVerificationSection /></TabsContent>
            <TabsContent value="saved"><SavedProvidersTab /></TabsContent>
            <TabsContent value="trips"><TripsTab /></TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
