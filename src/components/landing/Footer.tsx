import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";
import logo from "@/assets/final-new-logo.png";

const Footer = ({ light }: { light?: boolean }) => {
  return (
    <footer
      className="border-t py-14"
      style={light
        ? { background: '#F9F9F9', borderTopColor: 'rgba(0,0,0,0.06)' }
        : { background: 'hsl(var(--denied-black))', borderTopColor: 'rgba(255,255,255,0.06)' }
      }
    >
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          <div>
            <Link to="/" className="mb-4 block">
              <img
                src={logo}
                alt="Denied Logo"
                className="h-10 w-auto"
                style={light ? { filter: 'brightness(0)' } : { mixBlendMode: 'screen' as any }}
              />
            </Link>
            <p className="text-sm leading-relaxed" style={{ color: light ? '#888888' : 'rgba(255,255,255,0.5)' }}>
              Fighting back against the broken healthcare system. One procedure at a time.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-sm tracking-wide" style={{ color: light ? '#111111' : '#FFFFFF' }}>Company</h4>
            <ul className="space-y-2.5">
              {[
                { to: "/about", label: "About" },
                { to: "/about", label: "How It Works" },
                { to: "/apply", label: "For Providers" },
                { to: "/creators", label: "Creators" },
              ].map(link => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm transition-colors"
                    style={{ color: light ? '#555555' : 'rgba(255,255,255,0.5)' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#3BF07A'}
                    onMouseLeave={e => e.currentTarget.style.color = light ? '#555555' : 'rgba(255,255,255,0.5)'}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-sm tracking-wide" style={{ color: light ? '#111111' : '#FFFFFF' }}>Legal</h4>
            <ul className="space-y-2.5">
              {[
                { to: "/privacy", label: "Privacy Policy" },
                { to: "/terms", label: "Terms of Service" },
                { to: "/cookies", label: "Cookie Policy" },
              ].map(link => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm transition-colors"
                    style={{ color: light ? '#555555' : 'rgba(255,255,255,0.5)' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#3BF07A'}
                    onMouseLeave={e => e.currentTarget.style.color = light ? '#555555' : 'rgba(255,255,255,0.5)'}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-sm tracking-wide" style={{ color: light ? '#111111' : '#FFFFFF' }}>Connect</h4>
            <div className="flex gap-4">
              <a
                href="https://instagram.com/denied.care"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl w-10 h-10 flex items-center justify-center transition-colors"
                style={light
                  ? { background: 'rgba(0,0,0,0.05)', color: '#555555' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }
                }
                onMouseEnter={e => { e.currentTarget.style.color = '#3BF07A'; e.currentTarget.style.background = light ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = light ? '#555555' : 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = light ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'; }}
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 text-center" style={{ borderTop: light ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-sm" style={{ color: light ? '#888888' : 'rgba(255,255,255,0.3)' }}>
            © 2026 Denied.care. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
