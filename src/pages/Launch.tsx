import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative" style={{ backgroundColor: "#1A1A1A" }}>
      {showLogin && (
        <div className="absolute top-6 right-6">
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 text-white hover:bg-white/10"
            onClick={() => navigate("/auth")}
          >
            Log In
          </Button>
        </div>
      )}

      <div className="w-full max-w-xl flex flex-col items-center text-center">
        <img src={logo} alt="Denied" className="w-64 md:w-80 lg:w-96 h-auto mb-10" />

        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-6 leading-tight">
          Say yes, because health insurance said no.
        </h1>

        <p className="text-base md:text-lg leading-relaxed mb-8 max-w-[600px]" style={{ color: "#B0B0B0" }}>
          We're building a marketplace that connects you with verified doctors, dentists, and practitioners abroad — saving you up to 75% on procedures your insurance denied or priced out of reach.
        </p>

        <p className="text-lg md:text-xl font-bold mb-8" style={{ color: "#F8B4A0" }}>
          Be the first to know when we launch.
        </p>

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

        <div className="flex gap-6 mb-16">
          <a href="https://instagram.com/denied.care" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">
            <Instagram className="w-5 h-5" />
          </a>
        </div>

        <p className="text-xs" style={{ color: "#555" }}>
          © 2026 Denied.care. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Launch;
