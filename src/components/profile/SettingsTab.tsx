import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { User, Bell, Eye, Lock, Mail, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const defaultNotifPrefs = {
  inquiry_received: true,
  quote_received: true,
  deposit_paid: true,
  trip_confirmed: true,
  new_message: true,
  marketing: true,
};

const SettingsTab = () => {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [city, setCity] = useState("");
  const [publicProfile, setPublicProfile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>(defaultNotifPrefs);

  // Sync form state whenever profile loads or changes
  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.first_name || "");
    setLastName(profile.last_name || "");
    setPhone(profile.phone || "");
    setUsername((profile as any)?.username || "");
    setCity((profile as any)?.city || "");
    setPublicProfile((profile as any)?.public_profile || false);
    setNotifPrefs((profile as any)?.notification_preferences || defaultNotifPrefs);
  }, [profile]);

  const existingUsername = (profile as any)?.username;
  const isUsernameLocked = !!existingUsername;

  const toggleNotif = (key: string) => {
    setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const usernameValid = username.length === 0 || username.length >= 3;

  const handleSave = async () => {
    if (!profile) return;
    if (publicProfile && username.length < 3) {
      toast({ title: "Username too short", description: "Username must be at least 3 characters.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        phone,
        ...(isUsernameLocked ? {} : { username: username.trim() || null }),
        city: city.trim() || null,
        public_profile: publicProfile,
        notification_preferences: notifPrefs,
      } as any)
      .eq("user_id", profile.user_id);
    setSaving(false);
    if (error) {
      if (error.message.includes("unique") || error.message.includes("duplicate")) {
        toast({ title: "Username taken", description: "Please choose a different username.", variant: "destructive" });
      } else {
        toast({ title: "Error saving", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Profile updated" });
      await refreshProfile();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal Information
          </CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="e.g. Phoenix, AZ" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Public Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Public Review Profile
          </CardTitle>
          <CardDescription>Control visibility of your review profile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Make my review profile public</p>
              <p className="text-xs text-muted-foreground">
                Your first name, city, reviews, and helpfulness score will be visible at /user/{username || "your-username"}
              </p>
            </div>
            <Switch checked={publicProfile} onCheckedChange={setPublicProfile} />
          </div>
          {publicProfile && (
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              {isUsernameLocked ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-muted">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{existingUsername}</span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Username is locked. To request a change, email us at <a href="mailto:support@denied.com" className="underline text-primary">support@denied.com</a>
                  </p>
                </div>
              ) : (
                <>
                  <Input
                    id="username"
                    placeholder="your-unique-username (min 3 characters)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ""))}
                    maxLength={30}
                  />
                  {username.length > 0 && username.length < 3 && (
                    <p className="text-xs text-destructive">Username must be at least 3 characters.</p>
                  )}
                  <p className="text-xs text-muted-foreground">Letters, numbers, dashes, underscores only. Once set, this cannot be changed.</p>
                </>
              )}
            </div>
          )}
          <Button onClick={handleSave} disabled={saving || (publicProfile && !usernameValid)}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Chat Assistant */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Chat Assistant
          </CardTitle>
          <CardDescription>Control the trip assistant chat bubble</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Show trip assistant chat bubble</p>
              <p className="text-xs text-muted-foreground">
                The floating chat bubble in the bottom-left corner
              </p>
            </div>
            <Switch
              checked={!((profile as any)?.chat_hidden)}
              onCheckedChange={async (checked) => {
                if (!profile) return;
                await supabase
                  .from("profiles")
                  .update({ chat_hidden: !checked } as any)
                  .eq("user_id", profile.user_id);
                await refreshProfile();
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
          </CardTitle>
          <CardDescription>Manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { key: "inquiry_received", label: "New inquiry received (providers)" },
              { key: "quote_received", label: "Quote received from provider" },
              { key: "deposit_paid", label: "Deposit payment confirmation" },
              { key: "trip_confirmed", label: "Trip confirmed notification" },
              { key: "new_message", label: "New message on a booking" },
              { key: "marketing", label: "Marketing emails & promotions" },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm">{label}</span>
                <Switch checked={notifPrefs[key] ?? true} onCheckedChange={() => toggleNotif(key)} />
              </div>
            ))}
            <Button onClick={handleSave} disabled={saving} size="sm">
              {saving ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsTab;
