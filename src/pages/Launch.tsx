import { useState } from "react";
import { Instagram, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 4.76 1.52V6.84a4.84 4.84 0 0 1-1-.15z" />
  </svg>
);

const Launch = () => {
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
        toast({ title: "You're on the list! 🎉", description: "We'll be in touch soon." });
        setEmail("");
      }
    } catch {
      toast({ title: "Something went wrong", description: "Please try again later.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: "#1A1A1A" }}>
      <div className="w-full max-w-xl flex flex-col items-center text-center">
        {/* Logo */}
        <img src={logo} alt="Denied" className="w-64 md:w-80 lg:w-96 h-auto mb-10" />

        {/* Tagline */}
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-6 leading-tight">
          Say yes, because health insurance said no.
        </h1>

        {/* Body copy */}
        <p className="text-base md:text-lg leading-relaxed mb-8 max-w-[600px]" style={{ color: "#B0B0B0" }}>
          We're building a marketplace that connects you with verified doctors, dentists, and practitioners abroad — saving you up to 75% on procedures your insurance denied or priced out of reach.
        </p>

        {/* CTA line */}
        <p className="text-lg md:text-xl font-bold mb-8" style={{ color: "#F8B4A0" }}>
          Be the first to know when we launch.
        </p>

        {/* Email capture */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md mb-12">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/50 flex-1"
            disabled={isLoading}
          />
          <Button
            type="submit"
            className="h-12 px-8 font-semibold text-white whitespace-nowrap"
            style={{ backgroundColor: "#5EB298" }}
            disabled={isLoading}
          >
            {isLoading ? "Joining..." : "Join the Waitlist"}
          </Button>
        </form>

        {/* Social icons */}
        <div className="flex gap-6 mb-16">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">
            <Instagram className="w-5 h-5" />
          </a>
          <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">
            <TikTokIcon className="w-5 h-5" />
          </a>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">
            <Facebook className="w-5 h-5" />
          </a>
        </div>

        {/* Footer */}
        <p className="text-xs" style={{ color: "#555" }}>
          © 2026 Denied.care. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Launch;
