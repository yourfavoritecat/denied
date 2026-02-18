import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo-new.png";
import darkBackdrop from "@/assets/dark-backdrop.png";

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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden" style={{ backgroundColor: '#000000' }}>
      {/* Background image */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${darkBackdrop})` }} />
      {/* Radial vignette overlay */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 30%, #000000 85%)' }} />

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
          src={logo}
          alt="Denied"
          className="w-80 md:w-[400px] lg:w-[500px] h-auto mb-10"
        />

        {/* Tagline */}
        <h1 className="text-xl md:text-2xl lg:text-3xl font-black mb-6 leading-tight" style={{ color: "#FF8C69" }}>
          say yes, because health insurance said no. oh, and f* health insurance.
        </h1>

        {/* Body copy */}
        <p className="text-sm md:text-base leading-relaxed mb-8 max-w-[600px] font-light" style={{ color: "#E0DDD8" }}>
          we're building a marketplace that connects you with verified doctors, dentists, and practitioners abroad — saving you up to 75% on procedures your insurance denied or priced out of reach.
        </p>

        {/* CTA line */}
        <p className="text-base md:text-lg font-bold mb-8" style={{ color: "#50FF90" }}>
          be the first to know when we launch.
        </p>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full max-w-md mb-12">
          <Input
            type="email"
            placeholder="enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 flex-1 rounded-full text-white placeholder:text-white/50 shadow-none border focus-visible:ring-2 focus-visible:ring-[#50FF90]/60 focus-visible:border-[#50FF90]/50"
            style={{ background: 'rgba(0,0,0,0.4)', borderColor: 'rgba(255,255,255,0.15)' }}
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="lg"
            className="h-12 px-8 font-bold whitespace-nowrap"
            style={{ background: '#50FF90', color: '#1a1714' }}
            disabled={isLoading}
          >
            {isLoading ? "joining..." : "join the waitlist"}
          </Button>
        </form>

        {/* Social icons */}
        <div className="flex gap-4 mb-16">
          <a href="https://instagram.com/denied.care" target="_blank" rel="noopener noreferrer" className="transition-colors bg-white/5 rounded-xl w-10 h-10 flex items-center justify-center hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.4)' }} onMouseEnter={e => (e.currentTarget.style.color = '#50FF90')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
            <Instagram className="w-5 h-5" />
          </a>
          <a href="#" target="_blank" rel="noopener noreferrer" className="transition-colors bg-white/5 rounded-xl w-10 h-10 flex items-center justify-center hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.4)' }} onMouseEnter={e => (e.currentTarget.style.color = '#50FF90')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
            <TikTokIcon />
          </a>
          <a href="#" target="_blank" rel="noopener noreferrer" className="transition-colors bg-white/5 rounded-xl w-10 h-10 flex items-center justify-center hover:bg-white/10" style={{ color: 'rgba(255,255,255,0.4)' }} onMouseEnter={e => (e.currentTarget.style.color = '#50FF90')} onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
            <FacebookIcon />
          </a>
        </div>

        {/* Footer */}
        <p className="text-xs" style={{ color: "#E0DDD8", opacity: 0.35 }}>
          © 2026 denied.care. all rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Launch;
