import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroLogo from "@/assets/hero-logo-3d.png";
import candyStrip from "@/assets/candy-strip-wide.png";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section
      className="relative flex flex-col items-center justify-center overflow-hidden"
      style={{ minHeight: '100vh', background: '#FFFFFF', paddingTop: '96px', paddingBottom: '0' }}
    >
      {/* 3D Logo */}
      <img
        src={heroLogo}
        alt="denied"
        className="mb-8 md:mb-10"
        style={{
          height: '56px',
          width: 'auto',
          filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.06))',
        }}
      />

      {/* Headline */}
      <h1
        className="text-center lowercase px-4"
        style={{
          fontSize: 'clamp(32px, 5vw, 56px)',
          fontWeight: 800,
          letterSpacing: '-2.5px',
          lineHeight: 1.05,
        }}
      >
        <span style={{ color: '#111111' }}>your insurance said no.</span>
        <br />
        <span style={{ color: '#3BF07A' }}>we say let's go.</span>
      </h1>

      {/* Subline */}
      <p
        className="text-center px-4"
        style={{
          fontSize: '15px',
          color: '#888888',
          fontWeight: 400,
          maxWidth: '420px',
          marginTop: '24px',
          lineHeight: 1.6,
        }}
      >
        save up to 70% on dental and wellness with vetted providers in mexico.
      </p>

      {/* CTA */}
      <Button
        onClick={() => navigate("/search")}
        className="mt-8 transition-all duration-200"
        style={{
          background: '#3BF07A',
          color: '#111111',
          border: 'none',
          borderRadius: '50px',
          padding: '18px 48px',
          fontSize: '17px',
          fontWeight: 700,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 24px rgba(59,240,122,0.3)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        get a free quote
      </Button>

      {/* Candy strip — anchored to bottom, eager load (above fold) */}
      <img
        src={candyStrip}
        alt=""
        className="absolute bottom-0 left-0 w-full pointer-events-none"
        style={{
          filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.05))',
          maxHeight: '35vh',
          objectFit: 'contain',
          objectPosition: 'bottom center',
        }}
      />
    </section>
  );
};

export default HeroSection;
