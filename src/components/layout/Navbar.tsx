import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
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
import { Search, Plane, User, LogOut, PlusCircle, Menu, X, LayoutDashboard, Settings, Shield, ClipboardList, FileText, Bug, Sparkles, MessageCircle, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useViewAs } from "@/hooks/useViewAs";
import { useBetaTester } from "@/hooks/useBetaTester";
import { useCreator } from "@/hooks/useCreator";
import { useChat } from "@/hooks/useChatContext";
import { Settings as SettingsIcon } from "lucide-react";
import NotificationBell from "@/components/notifications/NotificationBell";
import logo from "@/assets/final-new-logo.png";

const Navbar = ({ light }: { light?: boolean }) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAdmin } = useAdmin();
  const { viewAs } = useViewAs();
  const { isBetaTester } = useBetaTester();
  const { isCreator, creatorHandle } = useCreator();
  const { setIsOpen: openChat } = useChat();
  const showBanner = isAdmin && viewAs !== "admin";

  const initials = profile
    ? `${(profile.first_name || "")[0] || ""}${(profile.last_name || "")[0] || ""}`.toUpperCase() || "U"
    : user?.email?.[0]?.toUpperCase() || "U";

  const displayName = profile
    ? [profile.first_name, profile.last_name].filter(Boolean).join(" ") || user?.email
    : user?.email;

  const actualProvider = !!(profile as any)?.provider_slug;
  const isProvider = (actualProvider && viewAs !== "traveler" && viewAs !== "creator" && viewAs !== "visitor") || (isAdmin && viewAs === "provider");
  const showProviderDashboard = isProvider || (isAdmin && viewAs === "admin");
  const showAdminLink = isAdmin && viewAs === "admin";
  const showCreatorLink = (isCreator && !!creatorHandle) || (isAdmin && (viewAs === "admin" || viewAs === "creator"));

  const visitorMode = isAdmin && viewAs === "visitor";

  const myPageUrl = creatorHandle ? `/c/${creatorHandle}` : "/creator/edit";

  const navLinks = visitorMode
    ? [
        { to: "/search", icon: Search, label: "Providers" },
      ]
    : [
        { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
        { to: "/search", icon: Search, label: "Providers" },
        { to: "/creators", icon: Users, label: "Creators" },
        { to: "/my-trips", icon: Plane, label: "My Trips" },
        ...(showCreatorLink ? [{ to: myPageUrl, icon: User, label: "My Page" }] : []),
        { to: "/profile", icon: User, label: "my account" },
      ];

  const isLinkActive = (to: string) => {
    if (to === "/dashboard") return location.pathname === "/dashboard";
    if (to.startsWith("/c/")) return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  const handleMobileNav = (to: string) => {
    setMobileOpen(false);
    navigate(to);
  };

  // Theme-aware colors
  const linkDefault = light ? '#555555' : 'rgba(255,255,255,0.8)';
  const linkActive = '#3BF07A';

  return (
    <nav
      className={`fixed left-0 right-0 z-50 ${showBanner ? "top-6" : "top-0"}`}
      style={light
        ? { background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.06)' }
        : { background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }
      }
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center">
            <img
              src={logo}
              alt="Denied Logo"
              className="h-10 w-auto"
              style={light ? { filter: 'brightness(0)' } : { mixBlendMode: 'screen' as any }}
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-2 lg:gap-6 xl:gap-8 min-w-0">
            {navLinks.map((link) => {
              const active = isLinkActive(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center gap-1 lg:gap-2 whitespace-nowrap text-xs lg:text-sm"
                  style={{
                    color: active ? linkActive : linkDefault,
                    textShadow: active && !light ? "0 0 8px rgba(59,240,122,0.2)" : "none",
                    transition: "all 300ms ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.color = linkActive;
                      if (!light) e.currentTarget.style.textShadow = "0 0 10px rgba(59,240,122,0.3)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.color = linkDefault;
                      e.currentTarget.style.textShadow = "none";
                    }
                  }}
                >
                  <link.icon className="w-4 h-4 shrink-0" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <Button
              size="sm"
              className="hidden sm:flex items-center gap-1.5 whitespace-nowrap text-[13px] h-7 px-[18px] py-1.5 font-semibold border-none"
              style={{
                background: "#3BF07A",
                color: "#111111",
                borderRadius: "9999px",
                boxShadow: "0 4px 16px rgba(59,240,122,0.25)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.03)";
                e.currentTarget.style.boxShadow = "0 4px 24px rgba(59,240,122,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(59,240,122,0.25)";
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "scale(0.98)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "scale(1.03)";
              }}
              onClick={() => navigate(user ? "/my-trips?plan=new" : "/auth")}
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0" />
              plan a trip
            </Button>

            {user && !visitorMode && <NotificationBell />}

            {/* Desktop auth */}
            <div className="hidden md:flex items-center gap-3">
              {user && !visitorMode ? (
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
                    <DropdownMenuItem onClick={() => navigate(creatorHandle ? `/c/${creatorHandle}` : "/profile")}>
                      <User className="w-4 h-4 mr-2" /> Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/profile?tab=security")}>
                      <Shield className="w-4 h-4 mr-2" /> Security
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/my-trips")}>
                      <Plane className="w-4 h-4 mr-2" /> My Trips
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/my-trips?tab=briefs")}>
                      <FileText className="w-4 h-4 mr-2" /> Trip Briefs
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/profile?tab=history")}>
                      <ClipboardList className="w-4 h-4 mr-2" /> Patient History
                    </DropdownMenuItem>
                    {showProviderDashboard && (
                      <DropdownMenuItem onClick={() => navigate("/provider-dashboard")}>
                        <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                      </DropdownMenuItem>
                    )}
                    {isBetaTester && (
                      <DropdownMenuItem onClick={() => navigate("/my-bugs")}>
                        <Bug className="w-4 h-4 mr-2" /> My Bug Reports
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => openChat(true)}>
                      <MessageCircle className="w-4 h-4 mr-2" /> Trip Assistant
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={signOut} className="text-destructive">
                      <LogOut className="w-4 h-4 mr-2" /> Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    className={light ? "text-[#555555] hover:text-[#111111] hover:bg-black/5" : "text-white hover:text-white hover:bg-white/10"}
                    onClick={() => navigate("/auth")}
                  >
                    Log In
                  </Button>
                  <Button
                    className="font-semibold"
                    style={{ background: '#3BF07A', color: '#111111', borderRadius: '9999px' }}
                    onClick={() => navigate("/auth")}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`md:hidden ${light ? "text-[#111111] hover:bg-black/5" : "text-white hover:bg-white/10"}`}
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-72 z-[60]"
                style={light
                  ? { background: '#FFFFFF', borderLeft: '1px solid rgba(0,0,0,0.06)' }
                  : { background: 'hsl(var(--card))' }
                }
              >
                <div className="flex flex-col h-full pt-6">
                  {user && (
                    <div className="flex items-center gap-3 px-2 pb-6 border-b mb-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate" style={{ color: light ? '#111111' : undefined }}>{displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    {navLinks.map((link) => {
                      const active = isLinkActive(link.to);
                      return (
                        <button
                          key={link.to}
                          onClick={() => handleMobileNav(link.to)}
                          className="flex items-center gap-3 w-full px-3 py-3 rounded-lg hover:bg-muted transition-colors text-sm"
                          style={{ color: active ? "#3BF07A" : light ? '#555555' : undefined }}
                        >
                          <link.icon className="w-5 h-5" />
                          {link.label}
                        </button>
                      );
                    })}
                    <button
                      onClick={() => handleMobileNav(user ? "/my-trips?plan=new" : "/auth")}
                      className="flex items-center gap-3 w-full px-3 py-3 rounded-lg font-semibold hover:bg-muted transition-colors text-sm"
                      style={{ color: '#3BF07A' }}
                    >
                      <PlusCircle className="w-5 h-5" />
                      plan a trip
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
                        <Button className="w-full" style={{ background: '#3BF07A', color: '#111111' }} onClick={() => handleMobileNav("/auth")}>Sign Up</Button>
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
