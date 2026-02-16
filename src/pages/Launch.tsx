import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logoReflection from "@/assets/logo-reflection.svg";

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.98a8.18 8.18 0 004.76 1.52V7.05a4.84 4.84 0 01-1-.36z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

interface LaunchProps {
  showLogin?: boolean;
}

const Launch = ({ showLogin = false }: LaunchProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
        toast({ title: "you're on the list. 🎉", description: "we'll be in touch soon." });
        setEmail("");
      }
    } catch {
      toast({ title: "something went wrong", description: "please try again later.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden bg-background">
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(160_50%_65%/0.05)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_hsl(15_100%_71%/0.04)_0%,_transparent_50%)]" />

      {showLogin && (
        <div className="absolute top-6 right-6 z-20">
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10 backdrop-blur-sm"
            onClick={() => navigate("/auth")}
          >
            log in
          </Button>
        </div>
      )}

      <div className="w-full max-w-xl flex flex-col items-center text-center relative z-10">
        {/* Logo with reflection — large and prominent */}
        <img
          src={logoReflection}
          alt="Denied"
          className="w-80 md:w-[400px] lg:w-[500px] h-auto mb-10"
        />

        {/* Tagline */}
        <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-white mb-6 leading-tight">
          say yes, because health insurance said no. oh, and f* health insurance.
        </h1>

        {/* Body copy */}
        <p className="text-sm md:text-base leading-relaxed mb-8 max-w-[600px] font-light" style={{ color: "#B0B0B0" }}>
          we're building a marketplace that connects you with verified doctors, dentists, and practitioners abroad — saving you up to 75% on procedures your insurance denied or priced out of reach.
        </p>

        {/* CTA line */}
        <p className="text-base md:text-lg font-bold mb-8" style={{ color: "#F8B4A0" }}>
          be the first to know when we launch.
        </p>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md mb-12 bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-2 shadow-hero">
          <Input
            type="email"
            placeholder="enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 bg-white/10 border-white/15 text-white placeholder:text-white/40 flex-1 rounded-xl shadow-none focus-visible:ring-primary/50"
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="lg"
            className="h-12 px-8 font-bold whitespace-nowrap rounded-xl shadow-floating hover:shadow-hero"
            style={{ backgroundColor: "#5EB298", color: "#000000" }}
            disabled={isLoading}
          >
            {isLoading ? "joining..." : "join the waitlist"}
          </Button>
        </form>

        {/* Social icons */}
        <div className="flex gap-4 mb-16">
          <a href="https://instagram.com/denied.care" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-secondary transition-colors bg-white/5 rounded-xl w-10 h-10 flex items-center justify-center hover:bg-white/10">
            <Instagram className="w-5 h-5" />
          </a>
          <a href="#" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-secondary transition-colors bg-white/5 rounded-xl w-10 h-10 flex items-center justify-center hover:bg-white/10">
            <TikTokIcon />
          </a>
          <a href="#" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-secondary transition-colors bg-white/5 rounded-xl w-10 h-10 flex items-center justify-center hover:bg-white/10">
            <FacebookIcon />
          </a>
        </div>

        {/* Footer */}
        <p className="text-xs" style={{ color: "#444" }}>
          © 2026 denied.care. all rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Launch;
