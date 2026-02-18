import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/final-new-logo.png";

const HeroSection = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase.from("waitlist").insert({ email: email.trim().toLowerCase() });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Already on the list!", description: "This email is already on our waitlist." });
        } else {
          throw error;
        }
      } else {
        toast({ title: "You're on the list! 🎉", description: "We'll notify you when we launch." });
        setEmail("");
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error("Waitlist error:", error);
      toast({ title: "Something went wrong", description: "Please try again later.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center pt-16 relative overflow-hidden">
      {/* Full-screen resort background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url('/images/hero-landing.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 50%, #000000 100%)',
        }}
      />
      
      <div className="container mx-auto px-4 py-20 text-center relative z-10">
        {/* Logo */}
        <div className="mb-6 animate-fade-in flex justify-center">
          <img 
            src={logo} 
            alt="Denied Logo" 
            className="w-72 md:w-96 lg:w-[500px] h-auto drop-shadow-[0_8px_32px_hsl(15_100%_71%/0.15)]"
            style={{ mixBlendMode: 'screen' }}
          />
        </div>
        
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-primary mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          Fuck Health Insurance.
        </h1>
        
        <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-12 animate-fade-in font-light leading-relaxed" style={{ animationDelay: "0.2s" }}>
          Save 50-70% on dental, cosmetic, and medical care with verified providers worldwide. Starting with Mexico.
        </p>

        {/* Elevated form container */}
        <div className="max-w-md mx-auto mb-16 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-2 shadow-hero">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/10 border-white/15 text-white placeholder:text-white/40 h-12 rounded-xl shadow-none focus-visible:ring-primary/50"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              size="lg"
              className="font-bold h-12 px-8 whitespace-nowrap rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? "Joining..." : "Join the Waitlist"}
            </Button>
          </form>
        </div>

        {/* Trust Indicators — elevated cards */}
        <div className="flex flex-wrap justify-center gap-6 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          {[
            { value: "50-70%", label: "Average Savings" },
            { value: "100+", label: "Verified Providers" },
            { value: "24/7", label: "Concierge Support" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-8 py-5 shadow-elevated">
              <div className="text-3xl font-black text-secondary">{stat.value}</div>
              <div className="text-sm text-white/50 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
