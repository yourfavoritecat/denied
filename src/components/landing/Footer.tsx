import { Link } from "react-router-dom";
import { Instagram } from "lucide-react";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-denied-black border-t border-white/[0.06] py-14">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <Link to="/" className="mb-4 block">
              <img src={logo} alt="Denied Logo" className="h-10 w-auto" />
            </Link>
            <p className="text-white/50 text-sm leading-relaxed">
              Fighting back against the broken healthcare system. One procedure at a time.
            </p>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-white mb-4 text-sm tracking-wide">Company</h4>
            <ul className="space-y-2.5">
              <li><a href="#" className="text-white/50 hover:text-white transition-colors text-sm">About</a></li>
              <li><a href="#" className="text-white/50 hover:text-white transition-colors text-sm">How It Works</a></li>
              <li><Link to="/about" className="text-white/50 hover:text-white transition-colors text-sm">Meet the Founder</Link></li>
              <li><Link to="/apply" className="text-white/50 hover:text-white transition-colors text-sm">For Providers</Link></li>
              <li><a href="#" className="text-white/50 hover:text-white transition-colors text-sm">Careers</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-white mb-4 text-sm tracking-wide">Legal</h4>
            <ul className="space-y-2.5">
              <li><a href="#" className="text-white/50 hover:text-white transition-colors text-sm">Privacy Policy</a></li>
              <li><a href="#" className="text-white/50 hover:text-white transition-colors text-sm">Terms of Service</a></li>
              <li><a href="#" className="text-white/50 hover:text-white transition-colors text-sm">Cookie Policy</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="font-bold text-white mb-4 text-sm tracking-wide">Connect</h4>
            <div className="flex gap-4">
              <a href="https://instagram.com/denied.care" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-secondary transition-colors bg-white/5 rounded-xl w-10 h-10 flex items-center justify-center hover:bg-white/10">
                <Instagram className="w-5 h-5" />
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
