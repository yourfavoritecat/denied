import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Heart,
  ChevronRight,
  Check,
  Shield,
  Star,
  DollarSign,
} from "lucide-react";

/* ── FAQ data ─────────────────────────────────────────────────────────────── */
const FAQ = [
  {
    q: "What does the concierge fee include?",
    a: "The $150 flat fee covers full trip coordination — provider scheduling, travel planning support, accommodation recommendations, a pre-trip prep guide, day-of check-ins, and post-care follow-up. It does not include the cost of dental work, flights, or hotels.",
  },
  {
    q: "Can I switch from direct to concierge later?",
    a: "Absolutely. Start browsing providers on your own, and if you decide you'd like help coordinating, you can upgrade to concierge at any point before your trip.",
  },
  {
    q: "How are providers vetted?",
    a: "Every provider on denied.care has been personally visited and evaluated. We verify credentials, inspect facilities, review patient outcomes, and only list providers we'd trust with our own care.",
  },
  {
    q: "Is Tijuana safe for dental tourism?",
    a: "The dental district in Tijuana is a well-established medical corridor with clinics that serve thousands of US patients annually. Our providers are in safe, accessible locations minutes from the border.",
  },
];

/* ── Steps ────────────────────────────────────────────────────────────────── */
const STEPS = [
  { n: "1", label: "Choose your path" },
  { n: "2", label: "Share your dental needs" },
  { n: "3", label: "Get a quote & book" },
];

/* ── Concierge features ───────────────────────────────────────────────────── */
const CONCIERGE_FEATURES = [
  "Provider matching & scheduling",
  "Travel & accommodation guidance",
  "Pre-trip prep checklist",
  "Day-of coordination & support",
  "Post-care follow-up",
];

/* ── Direct features ──────────────────────────────────────────────────────── */
const DIRECT_FEATURES = [
  "Direct provider contact info",
  "Verified provider profiles",
  "Transparent pricing upfront",
  "Patient reviews & ratings",
  "Access to resource guides",
];

/* ── Trust items ──────────────────────────────────────────────────────────── */
const TRUST_ITEMS = [
  { icon: "🦷", label: "Vetted providers" },
  { icon: "📋", label: "Real patient reviews" },
  { icon: "💰", label: "50-80% savings" },
];

/* ════════════════════════════════════════════════════════════════════════════ */
const BookingPaths = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* ── Hero ────────────────────────────────────────────────────────── */}
        <section className="py-20 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <p className="text-xs uppercase tracking-widest font-semibold text-secondary mb-4">
              Book Your Care
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-5">
              Two ways to get started.{" "}
              <span className="text-primary">Both lead to savings.</span>
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              Book your dental trip to Tijuana through our concierge service, or
              connect directly with our vetted providers. Either way, you're in
              good hands.
            </p>
          </div>
        </section>

        {/* ── How It Works Strip ──────────────────────────────────────────── */}
        <section className="py-6 px-4 border-y border-border/50">
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0">
            {STEPS.map((step, i) => (
              <div key={step.n} className="flex items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
                    <span className="text-primary text-xs font-bold">{step.n}</span>
                  </div>
                  <span className="text-sm text-foreground/80 font-medium">{step.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground mx-3 hidden sm:block" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Two Cards ───────────────────────────────────────────────────── */}
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Concierge Card */}
            <div className="group relative bg-card border border-border rounded-2xl p-8 flex flex-col gap-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_-8px_rgba(248,180,160,0.18),0_0_0_1px_rgba(248,180,160,0.15)] cursor-default overflow-hidden">
              {/* Colored top border on hover */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-secondary/80 to-secondary rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="flex items-start justify-between">
                <Badge className="bg-secondary/10 text-secondary border border-secondary/20 text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5">
                  <Heart className="w-3 h-3" /> Concierge
                </Badge>
                <span className="text-2xl">✨</span>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Book through me</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  I'll handle everything — provider scheduling, travel logistics,
                  hotel recommendations, and day-of support. You just show up.
                </p>
              </div>

              <ul className="space-y-2.5 flex-1">
                {CONCIERGE_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/80">
                    <div className="w-4 h-4 rounded-full bg-secondary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 text-secondary" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="border-t border-border/50 pt-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Small flat fee</p>
                  <p className="text-2xl font-bold text-secondary">$150 <span className="text-sm font-normal text-muted-foreground">/ trip</span></p>
                </div>
                <Button
                  onClick={() => navigate("/search")}
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold"
                >
                  Book with concierge
                </Button>
              </div>
            </div>

            {/* Direct Card */}
            <div className="group relative bg-card border border-border rounded-2xl p-8 flex flex-col gap-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_-8px_rgba(94,178,152,0.18),0_0_0_1px_rgba(94,178,152,0.15)] cursor-default overflow-hidden">
              {/* Colored top border on hover */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/80 to-primary rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="flex items-start justify-between">
                <Badge className="bg-primary/10 text-primary border border-primary/20 text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3" /> Self-Service
                </Badge>
                <span className="text-2xl">🎯</span>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Book direct</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Already comfortable navigating medical travel? Connect straight
                  to our vetted providers and book on your own terms. No fee, no friction.
                </p>
              </div>

              <ul className="space-y-2.5 flex-1">
                {DIRECT_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/80">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 text-primary" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              <div className="border-t border-border/50 pt-5 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">No fee</p>
                  <p className="text-2xl font-bold text-primary">$0 <span className="text-sm font-normal text-muted-foreground">/ always</span></p>
                </div>
                <Button
                  onClick={() => navigate("/search")}
                  variant="outline"
                  className="border-primary/40 text-primary hover:bg-primary/10 font-semibold"
                >
                  Browse providers
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Trust Bar ───────────────────────────────────────────────────── */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <p className="text-foreground/75 text-base leading-relaxed italic">
              "Every provider on denied.care is personally vetted. I've sat in the
              chair myself. You're not gambling — you're choosing how much support
              you want along the way."
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              {TRUST_ITEMS.map((item) => (
                <div key={item.label} className="flex items-center gap-2.5">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm font-medium text-foreground/80">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Mini FAQ ────────────────────────────────────────────────────── */}
        <section className="py-16 px-4">
          <div className="max-w-xl mx-auto">
            <h2 className="text-xl font-bold text-foreground mb-6 text-center">Common questions</h2>
            <Accordion type="single" collapsible className="space-y-2">
              {FAQ.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="bg-card border border-border rounded-xl px-5 data-[state=open]:border-primary/30"
                >
                  <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-4">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BookingPaths;
