import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.svg";

const HeroSection = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from("waitlist")
        .insert({ email: email.trim().toLowerCase() });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already on the list!",
            description: "This email is already on our waitlist.",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "You're on the list! 🎉",
          description: "We'll notify you when we launch.",
        });
        setEmail("");
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Waitlist error:", error);
      }
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-denied-black min-h-screen flex items-center pt-16">
      <div className="container mx-auto px-4 py-20 text-center">
        {/* Logo */}
        <div className="mb-6 animate-fade-in flex justify-center">
          <img 
            src={logo} 
            alt="Denied Logo" 
            className="w-72 md:w-96 lg:w-[500px] h-auto"
          />
        </div>
        
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          Fuck Health Insurance.
        </h1>
        
        <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-12 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          Save 50-70% on dental, cosmetic, and medical care with verified providers worldwide. Starting with Mexico.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-16 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12 px-8 whitespace-nowrap"
            disabled={isLoading}
          >
            {isLoading ? "Joining..." : "Join the Waitlist"}
          </Button>
        </form>

        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center gap-8 text-white/60 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <div className="text-center">
            <div className="text-3xl font-bold text-secondary">50-70%</div>
            <div className="text-sm">Average Savings</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-secondary">100+</div>
            <div className="text-sm">Verified Providers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-secondary">24/7</div>
            <div className="text-sm">Concierge Support</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
