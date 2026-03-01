import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";
import logo from "@/assets/final-new-logo.png";
import footerBeads from "@/assets/footer-beads.png";

const Footer = () => {
  return (
    <footer
      className="py-14"
      style={{
        background: 'linear-gradient(135deg, rgba(59,240,122,0.06) 0%, rgba(249,249,249,0.9) 30%, rgba(249,249,249,0.9) 70%, rgba(255,107,74,0.06) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(59,240,122,0.08)',
      }}
    >
      {/* Candy bead accent strip */}
      <div className="flex justify-center -mt-14 mb-8">
        <img
          src={footerBeads}
          alt=""
          style={{
            width: "100%",
            height: "auto",
            opacity: 0.25,
            pointerEvents: "none",
            filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.03))",
          }}
        />
      </div>
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          <div>
            <Link to="/" className="mb-4 block">
              <img
                src={logo}
                alt="Denied Logo"
                className="h-10 w-auto"
                style={{ filter: 'brightness(0)' }}
              />
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: '#888888' }}>
              fighting back against the broken healthcare system. one procedure at a time.
            </p>
          </div>

          <div>
            <h4 className="mb-4 tracking-wide" style={{ color: '#333333', fontSize: 14, fontWeight: 700 }}>company</h4>
            <ul className="space-y-2.5">
              {[
                { to: "/about", label: "about" },
                { to: "/about", label: "how it works" },
                { to: "/apply", label: "for providers" },
                { to: "/creators", label: "creators" },
              ].map(link => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="transition-colors"
                    style={{ color: '#555555', fontSize: 14 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#3BF07A'}
                    onMouseLeave={e => e.currentTarget.style.color = '#555555'}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 tracking-wide" style={{ color: '#333333', fontSize: 14, fontWeight: 700 }}>legal</h4>
            <ul className="space-y-2.5">
              {[
                { to: "/privacy", label: "privacy policy" },
                { to: "/terms", label: "terms of service" },
                { to: "/cookies", label: "cookie policy" },
              ].map(link => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="transition-colors"
                    style={{ color: '#555555', fontSize: 14 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#3BF07A'}
                    onMouseLeave={e => e.currentTarget.style.color = '#555555'}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 tracking-wide" style={{ color: '#333333', fontSize: 14, fontWeight: 700 }}>connect</h4>
            <div className="flex gap-4">
              <a
                href="https://instagram.com/denied.care"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl w-10 h-10 flex items-center justify-center transition-colors"
                style={{ background: 'rgba(0,0,0,0.05)', color: '#555555' }}
                onMouseEnter={e => { e.currentTarget.style.color = '#3BF07A'; e.currentTarget.style.background = 'rgba(0,0,0,0.08)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#555555'; e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; }}
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 text-center" style={{ borderTop: '1px solid rgba(0,0,0,0.04)' }}>
          <p style={{ color: '#AAAAAA', fontSize: 12 }}>
            © 2026 denied.care. all rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
