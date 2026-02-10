import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, ExternalLink, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { lovable } from "@/integrations/lovable/index";
import UserTrustBadge, { computeUserTrustTier } from "./UserTrustBadge";

interface SocialPlatform {
  id: string;
  label: string;
  icon: string;
  type: "oauth" | "link";
  placeholder?: string;
  color: string;
}

const platforms: SocialPlatform[] = [
  { id: "google", label: "Google", icon: "G", type: "oauth", color: "bg-red-500" },
  { id: "apple", label: "Apple", icon: "🍎", type: "oauth", color: "bg-gray-800" },
  { id: "facebook", label: "Facebook", icon: "f", type: "link", placeholder: "https://facebook.com/yourprofile", color: "bg-blue-600" },
  { id: "instagram", label: "Instagram", icon: "📷", type: "link", placeholder: "https://instagram.com/yourusername", color: "bg-gradient-to-br from-purple-500 to-pink-500" },
  { id: "tiktok", label: "TikTok", icon: "♪", type: "link", placeholder: "https://tiktok.com/@yourusername", color: "bg-foreground" },
];

const extractUsername = (platform: string, url: string): string => {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/^\//, "").replace(/\/$/, "");
    if (platform === "tiktok") return path.startsWith("@") ? path : `@${path}`;
    return path.split("/")[0] || url;
  } catch {
    return url;
  }
};

const SocialVerificationSection = () => {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [linkInputs, setLinkInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const socialVerifications = (profile as any)?.social_verifications || {};
  const hasCompletedBooking = false; // Computed separately if needed
  const trustTier = computeUserTrustTier(socialVerifications, hasCompletedBooking);
  const connectedCount = Object.values(socialVerifications).filter((v: any) => v?.connected).length;

  const handleOAuthConnect = async (platformId: string) => {
    setSaving(platformId);
    try {
      if (platformId === "google" || platformId === "apple") {
        // Use OAuth — on callback we'll mark as connected
        const { error } = await lovable.auth.signInWithOAuth(platformId, {
          redirect_uri: window.location.origin + "/profile",
        });
        if (error) {
          toast({ title: "Connection failed", description: String(error), variant: "destructive" });
        }
        // The OAuth will redirect; on return, the user is already authenticated via Google/Apple
        // We mark the social as connected
        const updatedVerifications = {
          ...socialVerifications,
          [platformId]: {
            connected: true,
            connected_at: new Date().toISOString(),
          },
        };
        await supabase
          .from("profiles")
          .update({ social_verifications: updatedVerifications } as any)
          .eq("user_id", profile!.user_id);
        await refreshProfile();
        toast({ title: `${platformId === "google" ? "Google" : "Apple"} connected!` });
      }
    } catch (e) {
      toast({ title: "Error", description: "Could not connect account", variant: "destructive" });
    }
    setSaving(null);
  };

  const handleLinkConnect = async (platformId: string) => {
    const url = linkInputs[platformId]?.trim();
    if (!url) {
      toast({ title: "Enter your profile URL", variant: "destructive" });
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast({ title: "Invalid URL", description: "Please enter a valid profile URL", variant: "destructive" });
      return;
    }

    setSaving(platformId);
    const username = extractUsername(platformId, url);
    const updatedVerifications = {
      ...socialVerifications,
      [platformId]: {
        connected: true,
        url,
        username,
        connected_at: new Date().toISOString(),
      },
    };

    const { error } = await supabase
      .from("profiles")
      .update({ social_verifications: updatedVerifications } as any)
      .eq("user_id", profile!.user_id);

    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${platformId.charAt(0).toUpperCase() + platformId.slice(1)} connected!` });
      await refreshProfile();
    }
    setSaving(null);
  };

  const handleDisconnect = async (platformId: string) => {
    setSaving(platformId);
    const updated = { ...socialVerifications };
    delete updated[platformId];

    await supabase
      .from("profiles")
      .update({ social_verifications: updated } as any)
      .eq("user_id", profile!.user_id);

    await refreshProfile();
    toast({ title: `${platformId.charAt(0).toUpperCase() + platformId.slice(1)} disconnected` });
    setSaving(null);
  };

  return (
    <div className="space-y-6">
      {/* Trust Badge CTA */}
      <Card className="border-2 border-dashed border-secondary/40 bg-secondary/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-secondary/10">
              <Sparkles className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <UserTrustBadge tier={trustTier} size="md" />
                <p className="font-semibold text-sm">
                  {trustTier === "unverified"
                    ? "Connect your socials to earn Verified status."
                    : trustTier === "verified" || trustTier === "trusted"
                      ? "Complete a trip through Denied to become a Trusted Traveler."
                      : "You're a Trusted Traveler! 🎉"}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Verified profiles get more visibility and providers respond faster.
              </p>
              <span className="text-xs text-muted-foreground">{connectedCount}/5 connected</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tier explanation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-5 h-5" />
            Trust Tiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-3">
              <UserTrustBadge tier="unverified" />
              <span className="text-muted-foreground">No socials connected</span>
            </div>
            <div className="flex items-center gap-3">
              <UserTrustBadge tier="verified" />
              <span className="text-muted-foreground">1 social connected</span>
            </div>
            <div className="flex items-center gap-3">
              <UserTrustBadge tier="trusted" />
              <span className="text-muted-foreground">2+ socials connected</span>
            </div>
            <div className="flex items-center gap-3">
              <UserTrustBadge tier="trusted_traveler" />
              <span className="text-muted-foreground">2+ socials + completed booking</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform connections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-5 h-5" />
            Verify Your Profile
          </CardTitle>
          <CardDescription>Connect accounts to prove your identity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {platforms.map((platform) => {
            const verification = socialVerifications[platform.id];
            const isConnected = verification?.connected;

            return (
              <div key={platform.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-card">
                <div className={`w-9 h-9 rounded-full ${platform.color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                  {platform.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{platform.label}</span>
                    {isConnected && (
                      <CheckCircle className="w-4 h-4 text-[hsl(160,50%,45%)]" />
                    )}
                  </div>
                  {isConnected && verification.username && (
                    <p className="text-xs text-muted-foreground truncate">{verification.username}</p>
                  )}
                  {isConnected && verification.url && (
                    <a
                      href={verification.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      View profile <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {!isConnected && platform.type === "link" && (
                    <div className="flex gap-2 mt-1.5">
                      <Input
                        placeholder={platform.placeholder}
                        className="text-xs h-8"
                        value={linkInputs[platform.id] || ""}
                        onChange={(e) =>
                          setLinkInputs((prev) => ({ ...prev, [platform.id]: e.target.value }))
                        }
                      />
                    </div>
                  )}
                </div>
                <div>
                  {isConnected ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground"
                      onClick={() => handleDisconnect(platform.id)}
                      disabled={saving === platform.id}
                    >
                      Disconnect
                    </Button>
                  ) : platform.type === "oauth" ? (
                    <Button
                      size="sm"
                      className="text-xs"
                      onClick={() => handleOAuthConnect(platform.id)}
                      disabled={saving === platform.id}
                    >
                      {saving === platform.id ? "..." : "Connect"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="text-xs"
                      onClick={() => handleLinkConnect(platform.id)}
                      disabled={saving === platform.id}
                    >
                      {saving === platform.id ? "..." : "Connect"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialVerificationSection;
