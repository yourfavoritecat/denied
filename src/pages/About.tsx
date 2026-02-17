import { useState } from "react";
import { Search, MessageCircle, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
      <main className="flex-1 flex flex-col justify-center max-w-3xl mx-auto px-6 py-10">
        {/* Tagline */}
        <h1 className="text-2xl font-bold text-white mb-3 text-center">
          say yes, because health insurance said no
        </h1>
        <p className="text-sm text-white/60 text-center max-w-xl mx-auto mb-10 leading-relaxed">
          denied.care connects you with vetted dental and medical clinics abroad — saving up to 75% on procedures your insurance denied or priced out of reach. Real providers, transparent pricing, zero guesswork.
        </p>

        {/* How it works — compact row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {steps.map((step) => (
            <div key={step.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
              <step.icon className="w-5 h-5 mx-auto mb-2" style={{ color: "#5EB298" }} />
              <h3 className="text-sm font-semibold text-white mb-1">{step.title}</h3>
              <p className="text-xs text-white/50 leading-snug">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Why — 2 sentences, italic */}
        <p className="text-xs text-white/40 italic text-center max-w-lg mx-auto mb-8">
          Our founder got quoted $11,800 for dental work, got denied by insurance, flew to Tijuana and paid $3,400 for the same procedures. She built denied.care so nobody else has to figure it out alone.
        </p>

        {/* Waitlist CTA */}
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
      </main>

      <Footer />
    </div>
  );
};

export default About;
