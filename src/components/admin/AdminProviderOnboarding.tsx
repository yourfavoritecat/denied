import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

interface Props {
  userId: string;
  providerSlug: string;
  providerName: string;
  onBack: () => void;
}

const AdminProviderOnboarding = ({ userId, providerSlug, providerName, onBack }: Props) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Load completion state from DB on mount
  useEffect(() => {
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
      // Jump to first incomplete step
      const firstIncomplete = STEPS.findIndex((_, i) => !done.has(i));
      if (firstIncomplete >= 0) setCurrentStep(firstIncomplete);
    };
    checkCompletion();
  }, [providerSlug]);

  const markStepComplete = (step: number) => {
    setCompletedSteps((prev) => new Set([...prev, step]));
    if (step < STEPS.length - 1) {
      setCurrentStep(step + 1);
    }
  };

  const stepProps = { userId, providerSlug, onComplete: () => markStepComplete(currentStep) };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to Providers
        </Button>
        <div className="h-4 w-px bg-border" />
        <h2 className="text-xl font-bold">Fill Out Profile — {providerName}</h2>
      </div>

      {/* Step navigation */}
      <div className="flex flex-wrap gap-2">
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
      <div>
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

      {/* Step content */}
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

      {completedSteps.size === STEPS.length && (
        <Card className="border-secondary/30 bg-secondary/5">
          <CardContent className="pt-6 text-center">
            <h3 className="text-xl font-bold mb-2">All sections complete! 🎉</h3>
            <p className="text-muted-foreground mb-4">
              This provider's profile is now fully populated and visible on the platform.
            </p>
            <Button onClick={onBack}>Back to Providers</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminProviderOnboarding;
