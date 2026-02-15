import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, AlertTriangle } from "lucide-react";
import logo from "@/assets/logo.png";

type InviteStatus = "loading" | "valid" | "invalid";

interface InviteCode {
  id: string;
  code: string;
  handle: string | null;
  is_active: boolean;
  claimed_by: string | null;
}

const CreatorJoin = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();

  const [inviteStatus, setInviteStatus] = useState<InviteStatus>("loading");
  const [invite, setInvite] = useState<InviteCode | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [handle, setHandle] = useState("");
  const [handleError, setHandleError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate invite code on load
  useEffect(() => {
    if (!code) {
      setInviteStatus("invalid");
      return;
    }
    const validate = async () => {
      const { data, error } = await supabase
        .from("creator_invite_codes")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .is("claimed_by", null)
        .maybeSingle();

      if (error || !data) {
        setInviteStatus("invalid");
      } else {
        setInvite(data as InviteCode);
        if ((data as InviteCode).handle) {
          setHandle((data as InviteCode).handle!);
        }
        setInviteStatus("valid");
      }
    };
    validate();
  }, [code]);

  // If already logged in, claim invite and redirect
  useEffect(() => {
    if (inviteStatus !== "valid" || !invite || !user) return;

    const claimForExistingUser = async () => {
      setIsSubmitting(true);
      try {
        const chosenHandle = invite.handle || handle;
        if (!chosenHandle) return; // need handle input
        await setupCreatorProfile(user.id, chosenHandle, profile?.first_name || "Creator");
        toast({ title: "Welcome, creator! 🎉", description: "Your creator profile is ready." });
        navigate(`/c/${chosenHandle}`, { replace: true });
      } catch (err: any) {
        toast({ title: "Setup failed", description: err.message, variant: "destructive" });
      } finally {
        setIsSubmitting(false);
      }
    };

    // Auto-claim if handle is pre-assigned
    if (invite.handle) {
      claimForExistingUser();
    }
  }, [inviteStatus, invite, user]);

  const validateHandle = (value: string) => {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setHandle(cleaned);
    if (cleaned.length < 3) {
      setHandleError("Handle must be at least 3 characters");
    } else {
      setHandleError("");
    }
    return cleaned;
  };

  const checkHandleAvailability = async (h: string): Promise<boolean> => {
    const { data } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("handle", h)
      .maybeSingle();
    return !data;
  };

  const setupCreatorProfile = async (userId: string, creatorHandle: string, displayName: string) => {
    // Check handle availability
    const available = await checkHandleAvailability(creatorHandle);
    if (!available) throw new Error(`Handle "${creatorHandle}" is already taken`);

    // Insert creator role
    await supabase.from("user_roles").insert({ user_id: userId, role: "creator" } as any);

    // Insert creator profile
    const { error: profileError } = await supabase.from("creator_profiles").insert({
      user_id: userId,
      handle: creatorHandle,
      display_name: displayName,
    } as any);
    if (profileError) throw profileError;

    // Claim invite code
    await supabase
      .from("creator_invite_codes")
      .update({ claimed_by: userId } as any)
      .eq("id", invite!.id);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (handleError || handle.length < 3) {
      setHandleError("Handle must be at least 3 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      // Check handle first
      const available = await checkHandleAvailability(handle);
      if (!available) {
        setHandleError(`"${handle}" is already taken`);
        setIsSubmitting(false);
        return;
      }

      // Create auth user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/creator/edit`,
          data: { first_name: firstName, last_name: lastName },
        },
      });
      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("Signup failed — no user returned");

      const userId = signUpData.user.id;

      // The profile is auto-created by handle_new_user trigger
      // Insert creator role
      await supabase.from("user_roles").insert({ user_id: userId, role: "creator" } as any);

      // Insert creator profile
      const { error: cpError } = await supabase.from("creator_profiles").insert({
        user_id: userId,
        handle,
        display_name: `${firstName} ${lastName}`.trim() || handle,
      } as any);
      if (cpError) throw cpError;

      // Claim invite
      await supabase
        .from("creator_invite_codes")
        .update({ claimed_by: userId } as any)
        .eq("id", invite!.id);

      // Auto sign-in and redirect
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      toast({ title: "Welcome, creator! 🎉", description: "Your creator profile is ready." });
      navigate(`/c/${handle}`, { replace: true });
    } catch (err: any) {
      toast({ title: "Signup failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle claim for logged-in user without pre-assigned handle
  const handleClaimLoggedIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (handleError || handle.length < 3) {
      setHandleError("Handle must be at least 3 characters");
      return;
    }
    setIsSubmitting(true);
    try {
      await setupCreatorProfile(user!.id, handle, profile?.first_name || "Creator");
      toast({ title: "Welcome, creator! 🎉" });
      navigate(`/c/${handle}`, { replace: true });
    } catch (err: any) {
      toast({ title: "Setup failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (inviteStatus === "loading") {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (inviteStatus === "invalid") {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <img src={logo} alt="Denied" className="h-12 mx-auto mb-8" />
          <Card className="shadow-hero border-border/50">
            <CardContent className="py-12">
              <AlertTriangle className="w-12 h-12 mx-auto text-secondary mb-4" />
              <h2 className="text-xl font-bold mb-2">invite link expired</h2>
              <p className="text-muted-foreground mb-6">
                This invite link has already been used or is no longer active.
              </p>
              <Button asChild>
                <Link to="/">back to homepage</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Logged in user, needs handle input
  if (user && invite && !invite.handle) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <img src={logo} alt="Denied" className="h-12 mx-auto mb-8" />
          <Card className="shadow-hero border-border/50">
            <CardHeader className="text-center">
              <Badge className="mx-auto mb-2 bg-secondary/10 text-secondary border-secondary/20">
                <Sparkles className="w-3 h-3 mr-1" /> creator invite
              </Badge>
              <CardTitle className="text-2xl">choose your handle</CardTitle>
              <CardDescription>This will be your public URL: denied.care/c/[handle]</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleClaimLoggedIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="handle">Handle</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">denied.care/c/</span>
                    <Input
                      id="handle"
                      value={handle}
                      onChange={(e) => validateHandle(e.target.value)}
                      placeholder="yourhandle"
                      required
                    />
                  </div>
                  {handleError && <p className="text-xs text-destructive">{handleError}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Setting up..." : "Become a Creator"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Logged in user with pre-assigned handle — auto-claiming (shown above in useEffect)
  if (user && invite?.handle) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // New user signup form
  return (
    <div className="min-h-screen bg-muted flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src={logo} alt="Denied" className="h-12" />
        </div>

        <Card className="shadow-hero border-border/50">
          <CardHeader className="text-center">
            <Badge className="mx-auto mb-2 bg-secondary/10 text-secondary border-secondary/20">
              <Sparkles className="w-3 h-3 mr-1" /> creator invite
            </Badge>
            <CardTitle className="text-2xl">you've been invited</CardTitle>
            <CardDescription>
              Join denied.care as a creator and build your public profile
            </CardDescription>
            <Badge variant="outline" className="mx-auto mt-2">
              Code: {code}
            </Badge>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="handle">Your Handle</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">denied.care/c/</span>
                  <Input
                    id="handle"
                    value={handle}
                    onChange={(e) => validateHandle(e.target.value)}
                    placeholder="yourhandle"
                    required
                    disabled={!!invite?.handle}
                  />
                </div>
                {handleError && <p className="text-xs text-destructive">{handleError}</p>}
                {invite?.handle && (
                  <p className="text-xs text-muted-foreground">This handle was reserved for you</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating account..." : "Join as Creator"}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground mt-6">
              Already have an account?{" "}
              <Link to="/auth" className="text-primary hover:underline font-medium">
                Log in first
              </Link>
              , then visit this link again.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatorJoin;
