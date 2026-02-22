import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, AlertTriangle } from "lucide-react";
import logo from "@/assets/final-new-logo.png";

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
        toast({ title: "welcome, creator! let's set up your profile." });
        navigate("/creator/edit", { replace: true });
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

    // Insert creator role (skip if already exists)
    const { data: existingRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "creator")
      .maybeSingle();

    if (!existingRole) {
      const { error: roleError } = await supabase.from("user_roles").insert({ user_id: userId, role: "creator" } as any);
      if (roleError) {
        console.error("Failed to insert user_roles:", roleError);
        throw roleError;
      }
    }

    // Insert creator profile (skip if already exists)
    const { data: existingProfile } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!existingProfile) {
      const { error: profileError } = await supabase.from("creator_profiles").insert({
        user_id: userId,
        handle: creatorHandle,
        display_name: displayName,
        is_published: false,
      } as any);
      if (profileError) {
        console.error("Failed to insert creator_profiles:", profileError);
        throw profileError;
      }
    }

    // Claim invite code
    const { error: claimError } = await supabase
      .from("creator_invite_codes")
      .update({ claimed_by: userId } as any)
      .eq("id", invite!.id);
    if (claimError) {
      console.error("Failed to claim invite code:", claimError);
      throw claimError;
    }
  };

  const handleGoogleSignup = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.href,
    });
    if (error) {
      toast({ title: "Google signup failed", description: error.message, variant: "destructive" });
    }
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
      // Insert creator role (skip if already exists)
      const { data: existingRole2 } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .eq("role", "creator")
        .maybeSingle();

      if (!existingRole2) {
        const { error: roleError2 } = await supabase.from("user_roles").insert({ user_id: userId, role: "creator" } as any);
        if (roleError2) {
          console.error("Failed to insert user_roles:", roleError2);
          throw roleError2;
        }
      }

      // Insert creator profile (skip if already exists)
      const { data: existingProfile2 } = await supabase
        .from("creator_profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existingProfile2) {
        const { error: cpError } = await supabase.from("creator_profiles").insert({
          user_id: userId,
          handle,
          display_name: `${firstName} ${lastName}`.trim() || handle,
          is_published: false,
        } as any);
        if (cpError) {
          console.error("Failed to insert creator_profiles:", cpError);
          throw cpError;
        }
      }

      // Claim invite
      const { error: claimError2 } = await supabase
        .from("creator_invite_codes")
        .update({ claimed_by: userId } as any)
        .eq("id", invite!.id);
      if (claimError2) {
        console.error("Failed to claim invite code:", claimError2);
        throw claimError2;
      }

      // Auto sign-in and redirect
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      toast({ title: "welcome, creator! let's set up your profile." });
      navigate("/creator/edit", { replace: true });
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes("password")) {
        toast({
          title: "Signup failed",
          description: "password must be at least 8 characters and include a mix of letters and numbers.",
          variant: "destructive",
        });
      } else {
        toast({ title: "Signup failed", description: err.message, variant: "destructive" });
      }
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
      toast({ title: "welcome, creator! let's set up your profile." });
      navigate("/creator/edit", { replace: true });
    } catch (err: any) {
      toast({ title: "Setup failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (inviteStatus === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (inviteStatus === "invalid") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <img src={logo} alt="Denied" className="h-12 mx-auto mb-8" style={{ mixBlendMode: 'screen' }} />
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
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <img src={logo} alt="Denied" className="h-12 mx-auto mb-8" style={{ mixBlendMode: 'screen' }} />
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // New user signup form
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <img src={logo} alt="Denied" className="h-12" style={{ mixBlendMode: 'screen' }} />
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
            <Button
              variant="outline"
              className="w-full flex items-center gap-2"
              onClick={handleGoogleSignup}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign up with Google
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or sign up with email</span>
              </div>
            </div>

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
