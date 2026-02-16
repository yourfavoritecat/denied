import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Check, ChevronRight, Loader2 } from "lucide-react";
import BusinessInfoStep from "@/components/onboarding/BusinessInfoStep";
import TeamStep from "@/components/onboarding/TeamStep";
import CredentialsStep from "@/components/onboarding/CredentialsStep";
import ServicesStep from "@/components/onboarding/ServicesStep";
import FacilityStep from "@/components/onboarding/FacilityStep";
import ExternalLinksStep from "@/components/onboarding/ExternalLinksStep";
import PoliciesStep from "@/components/onboarding/PoliciesStep";

const STEPS = [
  { key: "business", label: "Business Info" },
  { key: "team", label: "Team" },
  { key: "credentials", label: "Credentials" },
  { key: "services", label: "Services & Pricing" },
  { key: "facility", label: "Facility" },
  { key: "links", label: "External Links" },
  { key: "policies", label: "Policies" },
];

const ProviderOnboarding = () => {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isFinishing, setIsFinishing] = useState(false);

  const providerSlug = (profile as any)?.provider_slug;

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    } else if (!providerSlug) {
      navigate("/");
    }
  }, [user, providerSlug]);

  // Load completion state from DB on mount
  useEffect(() => {
    if (!providerSlug) return;
    const checkCompletion = async () => {
      const [biz, team, creds, services, facility, links, policies] = await Promise.all([
        supabase.from("provider_business_info").select("id").eq("provider_slug", providerSlug).maybeSingle(),
        supabase.from("provider_team_members").select("id").eq("provider_slug", providerSlug).limit(1),
        supabase.from("provider_credentials").select("id").eq("provider_slug", providerSlug).limit(1),
        supabase.from("provider_services").select("id").eq("provider_slug", providerSlug).limit(1),
        supabase.from("provider_facility").select("id").eq("provider_slug", providerSlug).maybeSingle(),
        supabase.from("provider_external_links").select("id").eq("provider_slug", providerSlug).maybeSingle(),
        supabase.from("provider_policies").select("id").eq("provider_slug", providerSlug).maybeSingle(),
      ]);
      const done = new Set<number>();
      if (biz.data) done.add(0);
      if (team.data && team.data.length > 0) done.add(1);
      if (creds.data && creds.data.length > 0) done.add(2);
      if (services.data && services.data.length > 0) done.add(3);
      if (facility.data) done.add(4);
      if (links.data) done.add(5);
      if (policies.data) done.add(6);
      setCompletedSteps(done);
      const firstIncomplete = STEPS.findIndex((_, i) => !done.has(i));
      if (firstIncomplete >= 0) setCurrentStep(firstIncomplete);
    };
    checkCompletion();
  }, [providerSlug]);

  if (!user || !providerSlug) return null;

  const markStepComplete = (step: number) => {
    setCompletedSteps((prev) => new Set([...prev, step]));
    if (step < STEPS.length - 1) {
      setCurrentStep(step + 1);
    }
  };

  const handleFinishOnboarding = async () => {
    if (completedSteps.size < STEPS.length) {
      toast({
        title: "Complete all sections",
        description: "Please fill out all sections before finishing.",
        variant: "destructive",
      });
      return;
    }
    setIsFinishing(true);
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_complete: true } as any)
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Onboarding complete! 🎉", description: "Your provider profile is now live." });
      await refreshProfile();
      navigate("/provider-dashboard");
    }
    setIsFinishing(false);
  };

  const stepProps = { userId: user.id, providerSlug, onComplete: () => markStepComplete(currentStep) };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold mb-2">Provider Onboarding</h1>
            <p className="text-muted-foreground">
              Complete all sections to activate your provider profile on Denied.
            </p>
          </motion.div>

          {/* Step navigation */}
          <div className="flex flex-wrap gap-2 mb-8">
            {STEPS.map((step, i) => {
              const isComplete = completedSteps.has(i);
              const isCurrent = i === currentStep;
              return (
                <button
                  key={step.key}
                  onClick={() => setCurrentStep(i)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    isCurrent
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : isComplete
                      ? "bg-secondary/20 text-secondary border border-secondary/30"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {isComplete && <Check className="w-3.5 h-3.5" />}
                  <span>{step.label}</span>
                </button>
              );
            })}
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>{completedSteps.size} of {STEPS.length} sections complete</span>
              <span>{Math.round((completedSteps.size / STEPS.length) * 100)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full transition-all duration-500"
                style={{ width: `${(completedSteps.size / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Current step content */}
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 0 && <BusinessInfoStep {...stepProps} />}
            {currentStep === 1 && <TeamStep {...stepProps} />}
            {currentStep === 2 && <CredentialsStep {...stepProps} />}
            {currentStep === 3 && <ServicesStep {...stepProps} />}
            {currentStep === 4 && <FacilityStep {...stepProps} />}
            {currentStep === 5 && <ExternalLinksStep {...stepProps} />}
            {currentStep === 6 && <PoliciesStep {...stepProps} />}
          </motion.div>

          {/* Finish */}
          {completedSteps.size === STEPS.length && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <Card className="border-secondary/30 bg-secondary/5">
                <CardContent className="pt-6 text-center">
                  <h3 className="text-xl font-bold mb-2">All sections complete!</h3>
                  <p className="text-muted-foreground mb-4">
                    Your profile will go live with a "Listed" badge. Once our team reviews your credentials, you'll be upgraded to "Verified."
                  </p>
                  <Button
                    size="lg"
                    className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold"
                    onClick={handleFinishOnboarding}
                    disabled={isFinishing}
                  >
                    {isFinishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Finish Onboarding
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProviderOnboarding;
