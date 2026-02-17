import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, MessageCircle, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/landing/Footer";

const steps = [
  {
    icon: Search,
    title: "browse verified providers",
    description: "explore clinics with transparent pricing, real patient reviews, and verified credentials. no guesswork.",
  },
  {
    icon: MessageCircle,
    title: "request a quote or book directly",
    description: "tell us what you need. we'll connect you with the right clinic and get you a price — no surprise fees.",
  },
  {
    icon: CalendarCheck,
    title: "we handle the rest",
    description: "travel tips, clinic communication, appointment scheduling — we coordinate everything so you can focus on your care.",
  },
];

const About = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: "email required", description: "please enter your email address.", variant: "destructive" });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({ title: "invalid email", description: "please enter a valid email address.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.from("waitlist").insert({ email: email.trim().toLowerCase() });
      if (error) {
        if (error.code === "23505") {
          toast({ title: "already on the list!", description: "this email is already on our waitlist." });
        } else {
          throw error;
        }
      } else {
        toast({ title: "you're on the list! 🎉", description: "we'll notify you when we launch." });
        setEmail("");
      }
    } catch {
      toast({ title: "something went wrong", description: "please try again later.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Back to home nav */}
      <nav className="flex items-center px-6 py-5 max-w-4xl mx-auto">
        <Link to="/" className="text-white/50 hover:text-white transition-colors text-sm">
          ← back to denied.care
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 pb-24">
        {/* Hero */}
        <section className="pt-8 pb-20 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            say yes, because health insurance said no
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            denied.care is a marketplace that connects you with vetted dental and medical clinics abroad — saving up to 75% on procedures your insurance denied or priced out of reach. real providers, transparent pricing, zero guesswork.
          </p>
        </section>

        {/* How it works */}
        <section className="pb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-10 text-center">
            how it works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-[#5EB298]/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-6 h-6" style={{ color: "#5EB298" }} />
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-2">
                  step {i + 1}
                </div>
                <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why we built this */}
        <section className="pb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
            why we built this
          </h2>
          <p className="text-base md:text-lg text-white/70 leading-relaxed">
            our founder got quoted $11,800 for dental work in the US. blue cross blue shield denied coverage for all but one crown. she flew to tijuana, got the exact same procedures with the same materials, and paid $3,400 — saving over $8,000 in two visits. denied.care exists so nobody else has to figure that out alone.
          </p>
        </section>

        {/* Waitlist CTA */}
        <section className="text-center pb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            be the first to know when we launch
          </h2>
          <p className="text-white/50 mb-8 text-sm">
            join the waitlist and we'll let you know when new providers go live.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/10 border-white/15 text-white placeholder:text-white/40 h-10 rounded-full"
              disabled={isLoading}
            />
            <Button
              type="submit"
              className="h-10 px-6 whitespace-nowrap rounded-full"
              disabled={isLoading}
            >
              {isLoading ? "joining..." : "join the waitlist"}
            </Button>
          </form>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
