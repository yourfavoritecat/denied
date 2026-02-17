import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";
import logo from "@/assets/logo-clean.png";

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.18 8.18 0 0 0 3.76.92V6.69Z" />
  </svg>
);

const Footer = () => {
  return (
    <footer className="bg-denied-black border-t border-white/[0.06] py-14">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          <div>
            <Link to="/" className="mb-4 block">
              <img src={logo} alt="Denied Logo" className="h-10 w-auto" />
            </Link>
            <p className="text-white/50 text-sm leading-relaxed">
              Fighting back against the broken healthcare system. One procedure at a time.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4 text-sm tracking-wide">Company</h4>
            <ul className="space-y-2.5">
              <li><Link to="/about" className="text-white/50 hover:text-white transition-colors text-sm">About</Link></li>
              <li><Link to="/about" className="text-white/50 hover:text-white transition-colors text-sm">How It Works</Link></li>
              <li><Link to="/apply" className="text-white/50 hover:text-white transition-colors text-sm">For Providers</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4 text-sm tracking-wide">Legal</h4>
            <ul className="space-y-2.5">
              <li><Link to="/about" className="text-white/50 hover:text-white transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link to="/about" className="text-white/50 hover:text-white transition-colors text-sm">Terms of Service</Link></li>
              <li><Link to="/about" className="text-white/50 hover:text-white transition-colors text-sm">Cookie Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4 text-sm tracking-wide">Connect</h4>
            <div className="flex gap-4">
              <a href="https://instagram.com/denied.care" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-secondary transition-colors bg-white/5 rounded-xl w-10 h-10 flex items-center justify-center hover:bg-white/10">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://tiktok.com/@denied.care" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-secondary transition-colors bg-white/5 rounded-xl w-10 h-10 flex items-center justify-center hover:bg-white/10">
                <TikTokIcon className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-8 text-center">
          <p className="text-white/30 text-sm">
            © 2026 Denied.care. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
