import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Plane, User, LogOut, PlusCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.svg";

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const initials = profile
    ? `${(profile.first_name || "")[0] || ""}${(profile.last_name || "")[0] || ""}`.toUpperCase() || "U"
    : user?.email?.[0]?.toUpperCase() || "U";

  const displayName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || user?.email
    : user?.email;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-denied-black border-b border-denied-black/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Denied Logo" className="h-10 w-auto" />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/search" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <Search className="w-4 h-4" />
              Search
            </Link>
            <Link to="/my-trips" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <Plane className="w-4 h-4" />
              My Trips
            </Link>
            <Link to="/profile" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
              <User className="w-4 h-4" />
              Profile
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold hidden sm:flex items-center gap-2"
              onClick={() => navigate(user ? "/my-trips?plan=new" : "/auth")}
            >
              <PlusCircle className="w-4 h-4" />
              Plan a Trip
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/my-trips")}>
                    <Plane className="w-4 h-4 mr-2" />
                    My Trips
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" className="text-white hover:text-white hover:bg-white/10" onClick={() => navigate("/auth")}>
                  Log In
                </Button>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" onClick={() => navigate("/auth")}>
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
