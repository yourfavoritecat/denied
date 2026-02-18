import { useState } from "react";
import { Search, MessageCircle, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/landing/Footer";

const steps = [
  { icon: Search, title: "browse providers", desc: "Verified clinics, transparent pricing, real reviews." },
  { icon: MessageCircle, title: "request a quote", desc: "Tell us what you need — no surprise fees." },
  { icon: CalendarCheck, title: "we handle the rest", desc: "Travel, scheduling, clinic communication." },
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
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 flex flex-col pt-16">
        {/* Hero with background image */}
        <div className="relative w-full" style={{ height: 250 }}>
          <img
            src="/images/hero-about.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0.3) 0%, rgba(10,10,10,0.7) 60%, hsl(var(--background)) 100%)" }} />

          {/* Overlaid text */}
          <div className="relative z-10 flex flex-col justify-end h-full max-w-2xl mx-auto px-6 pb-4">
            <h1 className="text-2xl font-bold mb-2" style={{ color: "#50FF90" }}>
              say yes, because health insurance said no
            </h1>
          </div>
        </div>

        {/* Body copy */}
        <div className="max-w-2xl mx-auto px-6 py-5 space-y-3">
          <p className="text-sm text-white/70 leading-relaxed">
            denied.care is a marketplace for people who've been priced out of healthcare in the us. we connect you with vetted dental and medical clinics abroad. real providers, transparent pricing, zero guesswork and saving up to 75% on procedures your insurance denied or barely cover.
          </p>
          <p className="text-sm text-white/70 leading-relaxed">
            we're more than a booking site. we're building a community of people who've been through it. our users are sharing real experiences, honest reviews, safety tips, what to look for (and what to avoid) when exploring medical tourism. the more we share, the safer and smarter everyone gets.
          </p>
          <p className="text-xs text-white/40 italic leading-relaxed">
            our founder got quoted $11,800 for dental work in the US. blue cross blue shield denied coverage. she flew to tijuana, got the same procedures, and paid $3,400. denied.care exists so nobody else has to figure that out alone.
          </p>
        </div>

        {/* How it works */}
        <div className="max-w-2xl mx-auto px-6 pb-4">
          <div className="grid grid-cols-3 gap-4">
            {steps.map((step) => (
              <div key={step.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
                <step.icon className="w-5 h-5 mx-auto mb-2" style={{ color: "#50FF90" }} />
                <h3 className="text-sm font-semibold text-white mb-1">{step.title}</h3>
                <p className="text-xs text-white/50 leading-snug">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Waitlist CTA */}
        <div className="max-w-2xl mx-auto px-6 pb-8">
          <p className="text-xs text-white/50 text-center mb-3">be the first to know when we launch</p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto w-full">
            <Input
              type="email"
              placeholder="enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/10 border-white/15 text-white placeholder:text-white/40 h-9 rounded-full text-sm"
              disabled={isLoading}
            />
            <Button type="submit" className="h-9 px-5 whitespace-nowrap rounded-full text-sm" disabled={isLoading}>
              {isLoading ? "joining..." : "join the waitlist"}
            </Button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
