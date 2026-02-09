import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Plane, User } from "lucide-react";
import logo from "@/assets/logo.svg";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-denied-black border-b border-denied-black/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Denied Logo" className="h-10 w-auto" />
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/search"
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <Search className="w-4 h-4" />
              Search
            </Link>
            <Link
              to="/my-trips"
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <Plane className="w-4 h-4" />
              My Trips
            </Link>
            <Link
              to="/profile"
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <User className="w-4 h-4" />
              Profile
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10">
              Log In
            </Button>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
