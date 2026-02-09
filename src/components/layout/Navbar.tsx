import { useState } from "react";
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Search, Plane, User, LogOut, PlusCircle, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.svg";

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = profile
    ? `${(profile.first_name || "")[0] || ""}${(profile.last_name || "")[0] || ""}`.toUpperCase() || "U"
    : user?.email?.[0]?.toUpperCase() || "U";

  const displayName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || user?.email
    : user?.email;

  const navLinks = [
    { to: "/search", icon: Search, label: "Search" },
    { to: "/my-trips", icon: Plane, label: "My Trips" },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  const handleMobileNav = (to: string) => {
    setMobileOpen(false);
    navigate(to);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-denied-black border-b border-denied-black/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center">
            <img src={logo} alt="Denied Logo" className="h-10 w-auto" />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link key={link.to} to={link.to} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
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

            {/* Desktop auth */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">{initials}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-popover z-[60]">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{displayName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <User className="w-4 h-4 mr-2" /> Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/my-trips")}>
                      <Plane className="w-4 h-4 mr-2" /> My Trips
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-destructive">
                      <LogOut className="w-4 h-4 mr-2" /> Log Out
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

            {/* Mobile hamburger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-card z-[60]">
                <div className="flex flex-col h-full pt-6">
                  {user && (
                    <div className="flex items-center gap-3 px-2 pb-6 border-b mb-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    {navLinks.map((link) => (
                      <button
                        key={link.to}
                        onClick={() => handleMobileNav(link.to)}
                        className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-foreground hover:bg-muted transition-colors text-sm"
                      >
                        <link.icon className="w-5 h-5" />
                        {link.label}
                      </button>
                    ))}
                    <button
                      onClick={() => handleMobileNav(user ? "/my-trips?plan=new" : "/auth")}
                      className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-secondary font-semibold hover:bg-muted transition-colors text-sm"
                    >
                      <PlusCircle className="w-5 h-5" />
                      Plan a Trip
                    </button>
                  </div>

                  <div className="mt-auto pb-6">
                    {user ? (
                      <Button
                        variant="outline"
                        className="w-full flex items-center gap-2 text-destructive"
                        onClick={() => { signOut(); setMobileOpen(false); }}
                      >
                        <LogOut className="w-4 h-4" /> Log Out
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Button className="w-full" onClick={() => handleMobileNav("/auth")}>Sign Up</Button>
                        <Button variant="outline" className="w-full" onClick={() => handleMobileNav("/auth")}>Log In</Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
