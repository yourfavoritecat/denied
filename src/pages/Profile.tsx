import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Settings, Heart, Calendar, Syringe, Stethoscope, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import SettingsTab from "@/components/profile/SettingsTab";
import ProceduresTab from "@/components/profile/ProceduresTab";
import MedicalHistoryTab from "@/components/profile/MedicalHistoryTab";
import SkincareTab from "@/components/profile/SkincareTab";
import SavedProvidersTab from "@/components/profile/SavedProvidersTab";
import TripsTab from "@/components/profile/TripsTab";

const ProfilePage = () => {
  const { user, profile } = useAuth();

  const initials = profile
    ? `${(profile.first_name || "")[0] || ""}${(profile.last_name || "")[0] || ""}`.toUpperCase() || "U"
    : "U";

  const displayName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "User"
    : "User";

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Profile Header */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <Avatar className="w-24 h-24 text-2xl bg-primary text-primary-foreground">
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl font-bold mb-1">{displayName}</h1>
                  <p className="text-muted-foreground mb-3">{user?.email}</p>
                  <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                    <Badge variant="secondary">Member since {new Date(user?.created_at || "").getFullYear()}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabbed Content */}
          <Tabs defaultValue="settings" className="space-y-6">
            <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
              <TabsTrigger value="settings" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
              <TabsTrigger value="procedures" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Syringe className="w-4 h-4" />
                <span className="hidden sm:inline">Procedures</span>
              </TabsTrigger>
              <TabsTrigger value="medical" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Stethoscope className="w-4 h-4" />
                <span className="hidden sm:inline">Medical</span>
              </TabsTrigger>
              <TabsTrigger value="skincare" className="flex items-center gap-1.5 text-xs sm:text-sm">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Skincare</span>
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

            <TabsContent value="settings"><SettingsTab /></TabsContent>
            <TabsContent value="procedures"><ProceduresTab /></TabsContent>
            <TabsContent value="medical"><MedicalHistoryTab /></TabsContent>
            <TabsContent value="skincare"><SkincareTab /></TabsContent>
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
