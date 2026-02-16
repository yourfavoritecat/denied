import { Link } from "react-router-dom";
import { Camera, Instagram, Mail, MessageCircle, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/landing/Footer";

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.98a8.18 8.18 0 004.76 1.52V7.05a4.84 4.84 0 01-1-.36z" />
  </svg>
);

const credentials = [
  "18 years in the creator economy",
  "director of creator acquisition at mavely",
  "former content creator, 180k followers on instagram",
  "patient at 3 clinics in tijuana personally",
  "built denied.care from my own experience",
  "based in california, currently in tijuana",
];

const socials = [
  { icon: Instagram, label: "@catrific", href: "https://instagram.com/catrific" },
  { icon: Mail, label: "cat@denied.care", href: "mailto:cat@denied.care" },
  { icon: MessageCircle, label: "message me on whatsapp", href: "#" },
  { icon: Linkedin, label: "linkedin", href: "#" },
  { icon: TikTokIcon, label: "tiktok", href: "#", isCustom: true },
];

const About = () => {
  return (
    <div className="min-h-screen relative bg-background">
      {/* Gradient mesh blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full blur-[160px]"
          style={{ background: "radial-gradient(circle, rgba(94,178,152,0.08) 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-1/3 -right-32 w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{ background: "radial-gradient(circle, rgba(248,180,160,0.06) 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 left-1/3 w-[550px] h-[550px] rounded-full blur-[150px]"
          style={{ background: "radial-gradient(circle, rgba(94,178,152,0.05) 0%, transparent 70%)" }}
        />
      </div>

      {/* Grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-[1] opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Back to home nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-4xl mx-auto">
        <Link to="/" className="text-white/50 hover:text-white transition-colors text-sm">
          ← back to denied.care
        </Link>
      </nav>

      <main className="relative z-10 max-w-3xl mx-auto px-6 pb-24">
        {/* Section 1: Hero */}
        <section className="flex flex-col items-center text-center pt-8 pb-16">
          <div className="w-[200px] h-[200px] rounded-full bg-white/5 border-2 border-white/10 flex items-center justify-center mb-8">
            <Camera className="w-12 h-12 text-white/20" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">cat valdes</h1>
          <p className="text-lg font-semibold mb-6" style={{ color: "#5EB298" }}>
            founder of denied.care
          </p>
          <p className="text-xl md:text-2xl text-white/90 max-w-xl leading-relaxed">
            i built this because blue cross blue shield told me my teeth weren't worth covering.
          </p>
        </section>

        {/* Section 2: My Story */}
        <section className="pb-16 section-panel">
          <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: "#F8B4A0" }}>
            the short version
          </h2>
          <div className="text-base md:text-lg leading-relaxed space-y-4" style={{ color: "#E8E0DB" }}>
            <p>
              3 dentists told me i needed 7 crowns and a root canal. my insurance, blue cross blue shield, denied coverage for all but one crown. the out-of-pocket quote in the US? $11,800.
            </p>
            <p>
              so i flew to tijuana. i walked into washington dental clinic, got the exact same procedures done with the same materials, and paid $3,400. total. i saved over $8,000 in two visits.
            </p>
            <p>
              that experience changed everything for me. i realized millions of americans are skipping procedures they need, not because they don't want care, but because they literally can't afford it.
            </p>
            <p>
              denied.care is the marketplace i wish existed when i was panicking about that $11,800 quote.
            </p>
          </div>
        </section>

        {/* Section 3: What I Do */}
        <section className="pb-16 section-panel">
          <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: "#F8B4A0" }}>
            how this works right now
          </h2>
          <div className="text-base md:text-lg leading-relaxed space-y-4" style={{ color: "#E8E0DB" }}>
            <p>
              i'm not hiding behind a logo. right now, i personally coordinate every booking. you tell me what you need, i connect you with a vetted clinic, i handle the back-and-forth on whatsapp so you don't have to, and i make sure everything goes smoothly.
            </p>
            <p>
              think of me as your medical tourism concierge, except i've actually done the procedures myself.
            </p>
          </div>
        </section>

        {/* Section 4: Credentials */}
        <section className="pb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-8" style={{ color: "#F8B4A0" }}>
            why you should trust me
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {credentials.map((cred) => (
                <div
                  key={cred}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-5 py-4 text-sm md:text-base shadow-elevated"
                  style={{ color: "#E8E0DB" }}
              >
                {cred}
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Find Me */}
        <section className="pb-20">
          <h2 className="text-2xl md:text-3xl font-bold mb-8" style={{ color: "#F8B4A0" }}>
            go ahead, look me up
          </h2>
          <div className="flex flex-wrap gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm text-white/80 transition-all hover:border-[#5EB298] hover:text-white hover:bg-white/[0.03]"
              >
                {s.isCustom ? <TikTokIcon /> : <s.icon className="w-5 h-5" />}
                {s.label}
              </a>
            ))}
          </div>
        </section>

        {/* Section 6: CTA */}
        <section className="text-center pb-16">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-8 leading-tight">
            ready to save thousands on your next procedure?
          </h2>
          <Link to="/#waitlist">
            <Button
              className="h-12 px-10 text-base font-semibold text-white rounded-full"
              style={{ backgroundColor: "#5EB298" }}
            >
              join the waitlist
            </Button>
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
