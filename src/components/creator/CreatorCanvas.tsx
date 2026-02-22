import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  Camera, Instagram, Globe, Check, X, Copy, Plus, ExternalLink,
} from "lucide-react";
import AvatarCropModal from "@/components/profile/AvatarCropModal";
import Navbar from "@/components/layout/Navbar";

/* ── custom svg icons ── */
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-1-.08 6.27 6.27 0 0 0-6.27 6.27 6.27 6.27 0 0 0 6.27 6.27 6.27 6.27 0 0 0 6.27-6.27V8.97a8.16 8.16 0 0 0 4.04 1.05V6.69h-.01z" />
  </svg>
);
const YouTubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.56A3.02 3.02 0 0 0 .5 6.2 31.68 31.68 0 0 0 0 12a31.68 31.68 0 0 0 .5 5.8 3.02 3.02 0 0 0 2.12 2.14c1.84.56 9.38.56 9.38.56s7.54 0 9.38-.56a3.02 3.02 0 0 0 2.12-2.14A31.68 31.68 0 0 0 24 12a31.68 31.68 0 0 0-.5-5.8zM9.55 15.57V8.43L15.82 12l-6.27 3.57z" />
  </svg>
);
const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

/* ── constants ── */
const SPECIALTY_OPTIONS = [
  "dental", "cosmetic", "skincare", "bariatric", "fertility",
  "wellness", "recovery tips", "travel hacks", "budget tips",
];

const THEMES: Record<string, { color: string; rgb: string }> = {
  mint: { color: "#3BF07A", rgb: "59,240,122" },
  coral: { color: "#FF6B4A", rgb: "255,107,74" },
  lavender: { color: "#C4A8FF", rgb: "196,168,255" },
  gold: { color: "#FFD700", rgb: "255,215,0" },
  ice: { color: "#7DF9FF", rgb: "125,249,255" },
};

const SOCIAL_PLATFORMS = [
  { key: "instagram", icon: Instagram, baseUrl: "https://www.instagram.com/", label: "instagram" },
  { key: "tiktok", iconCustom: TikTokIcon, baseUrl: "https://www.tiktok.com/@", label: "tiktok" },
  { key: "youtube", iconCustom: YouTubeIcon, baseUrl: "https://www.youtube.com/@", label: "youtube" },
  { key: "twitter", iconCustom: TwitterIcon, baseUrl: "https://x.com/", label: "x" },
  { key: "website", icon: Globe, baseUrl: "", label: "website" },
];

/* ── helpers ── */
const normalizeSocial = (value: string, baseUrl: string): string => {
  const v = value.trim();
  if (!v) return v;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^www\./i.test(v)) return `https://${v}`;
  const handle = v.replace(/^@/, "");
  if (handle.includes("/")) return `https://${handle}`;
  if (!baseUrl) return `https://${v}`;
  return `${baseUrl}${handle}`;
};

/* ── social link input ── */
const SocialInput = ({
  value,
  label,
  accent,
  onChange,
}: {
  value: string;
  label: string;
  accent: string;
  onChange: (v: string) => void;
}) => (
  <div className="p-3">
    <label className="text-[10px] tracking-wide mb-2 block" style={{ color: "#B0B0B0" }}>
      {label} url
    </label>
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={`paste your ${label} url`}
      className="w-full bg-transparent outline-none text-sm"
      style={{ color: "#FFFFFF", borderBottom: "1px solid #333", paddingBottom: 4 }}
      onFocus={(e) => (e.currentTarget.style.borderBottomColor = accent)}
      onBlur={(e) => (e.currentTarget.style.borderBottomColor = "#333")}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      autoFocus
    />
  </div>
);

/* ── component ── */
interface Props {
  isEditing: boolean;
  handleParam?: string;
}

const CreatorCanvas = ({ isEditing, handleParam }: Props) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  /* data */
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({
    instagram: "", tiktok: "", youtube: "", twitter: "", website: "",
  });
  const [accentTheme, setAccentTheme] = useState("mint");
  const [isPublished, setIsPublished] = useState(false);

  /* editing ui */
  const [editingField, setEditingField] = useState<string | null>(null);
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const [checkingHandle, setCheckingHandle] = useState(false);
  const originalHandle = useRef("");

  /* save */
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedRef = useRef(false);
  const statusFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavePayload = useRef<any>(null);

  /* avatar */
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  /* input refs */
  const nameInputRef = useRef<HTMLInputElement>(null);
  const handleInputRef = useRef<HTMLInputElement>(null);
  const bioRef = useRef<HTMLTextAreaElement>(null);

  const theme = THEMES[accentTheme] || THEMES.mint;
  const accent = theme.color;
  const rgb = theme.rgb;

  /* ── load profile ── */
  useEffect(() => {
    (async () => {
      if (isEditing) {
        if (!user) return;
        const { data: cp } = await supabase
          .from("creator_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!cp) { navigate("/dashboard", { replace: true }); return; }
        hydrateProfile(cp);
      } else {
        if (!handleParam) { setNotFound(true); setLoading(false); return; }
        const { data: cp } = await supabase
          .from("creator_profiles")
          .select("*")
          .eq("handle", handleParam)
          .maybeSingle();
        if (!cp || (!(cp as any).is_published && (!user || user.id !== (cp as any).user_id))) {
          setNotFound(true); setLoading(false); return;
        }
        hydrateProfile(cp);
      }
    })();
  }, [user, handleParam, isEditing]);

  const hydrateProfile = (cp: any) => {
    setProfileId(cp.id);
    setDisplayName(cp.display_name || "");
    setHandle(cp.handle || "");
    originalHandle.current = cp.handle || "";
    setBio(cp.bio || "");
    setAvatarUrl(cp.avatar_url || null);
    setSpecialties(cp.specialties || []);
    setAccentTheme(cp.profile_theme || "mint");
    setIsPublished(cp.is_published || false);
    const sl = cp.social_links || {};
    setSocialLinks({
      instagram: sl.instagram || "", tiktok: sl.tiktok || "",
      youtube: sl.youtube || "", twitter: sl.twitter || "",
      website: sl.website || "",
    });
    setLoading(false);
    setTimeout(() => { hasLoadedRef.current = true; }, 100);
  };

  /* ── handle availability ── */
  useEffect(() => {
    if (!isEditing) return;
    if (!handle || handle === originalHandle.current) {
      setHandleAvailable(handle ? true : null); return;
    }
    setCheckingHandle(true);
    const t = setTimeout(async () => {
      const { data } = await supabase.from("creator_profiles").select("id").eq("handle", handle).maybeSingle();
      setHandleAvailable(!data); setCheckingHandle(false);
    }, 400);
    return () => clearTimeout(t);
  }, [handle, isEditing]);

  /* ── auto-save ── */
  const doSave = useCallback(async () => {
    if (!profileId || !user) return;
    setSaveStatus("saving");
    const normalized = {
      instagram: normalizeSocial(socialLinks.instagram, "https://www.instagram.com/"),
      tiktok: normalizeSocial(socialLinks.tiktok, "https://www.tiktok.com/@"),
      youtube: normalizeSocial(socialLinks.youtube, "https://www.youtube.com/@"),
      twitter: normalizeSocial(socialLinks.twitter, "https://x.com/"),
      website: socialLinks.website.trim(),
    };
    const payload = {
      display_name: displayName, handle, bio: bio || null,
      avatar_url: avatarUrl, specialties, social_links: normalized,
      is_published: isPublished, profile_theme: accentTheme,
    };
    lastSavePayload.current = payload;
    const { error } = await supabase
      .from("creator_profiles")
      .update(payload as any)
      .eq("id", profileId);
    if (error) {
      setSaveStatus("error");
      toast({ title: "save failed", description: error.message, variant: "destructive" });
    } else {
      setSaveStatus("saved");
      if (handle !== originalHandle.current) originalHandle.current = handle;
      if (statusFadeTimer.current) clearTimeout(statusFadeTimer.current);
      statusFadeTimer.current = setTimeout(() => setSaveStatus("idle"), 3000);
    }
  }, [profileId, user, displayName, handle, bio, avatarUrl, specialties, socialLinks, isPublished, accentTheme]);

  const retrySave = () => doSave();

  useEffect(() => {
    if (!isEditing || !hasLoadedRef.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(), 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [displayName, handle, bio, avatarUrl, specialties, socialLinks, isPublished, accentTheme, doSave]);

  /* ── avatar upload ── */
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "image too large", description: "max 10mb", variant: "destructive" }); return;
    }
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAvatarCrop = async (blob: Blob) => {
    if (!user) return;
    setCropSrc(null);
    const path = `${user.id}/creator/avatar-${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("profile-media").upload(path, blob, {
      contentType: "image/jpeg", upsert: true,
    });
    if (error) { toast({ title: "upload failed", variant: "destructive" }); return; }
    const { data: urlData } = supabase.storage.from("profile-media").getPublicUrl(path);
    setAvatarUrl(urlData.publicUrl);
  };

  const toggleSpecialty = (s: string) => {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : prev.length < 5 ? [...prev, s] : prev
    );
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(`denied.care/${handle}`);
    toast({ title: "copied!" });
  };

  /* ── progress ── */
  const completeness = [
    !!avatarUrl, !!displayName, !!bio,
    specialties.length > 0,
    Object.values(socialLinks).some((v) => v.trim()),
  ];
  const progress = (completeness.filter(Boolean).length / completeness.length) * 100;

  /* ── focus input on edit mode ── */
  useEffect(() => {
    if (editingField === "name") nameInputRef.current?.focus();
    if (editingField === "handle") handleInputRef.current?.focus();
    if (editingField === "bio") bioRef.current?.focus();
  }, [editingField]);

  /* ── loading / not found ── */
  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: "#060606" }}>
        <Navbar />
        <div className="flex items-center justify-center pt-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: "#3BF07A" }} />
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen" style={{ background: "#060606" }}>
        <Navbar />
        <div className="flex flex-col items-center justify-center gap-4 px-4 pt-32">
          <h1 className="text-2xl font-bold text-white">creator not found</h1>
          <p className="text-sm" style={{ color: "#B0B0B0" }}>this profile doesn't exist or isn't published yet.</p>
        </div>
      </div>
    );
  }

  /* ── social icon renderer ── */
  const renderSocialIcon = (platform: typeof SOCIAL_PLATFORMS[0]) => {
    const value = socialLinks[platform.key] || "";
    const filled = !!value.trim();
    const IconComp = platform.icon;
    const CustomIcon = platform.iconCustom;

    if (!isEditing && !filled) return null;

    const iconEl = (
      <div className="relative">
        {CustomIcon ? <CustomIcon className="w-5 h-5" /> : IconComp ? <IconComp className="w-5 h-5" /> : null}
        {isEditing && !filled && (
          <div
            className="absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center"
            style={{ background: accent, fontSize: 8, color: "#0A0A0A" }}
          >
            <Plus className="w-2 h-2" />
          </div>
        )}
      </div>
    );

    /* read-only link */
    if (!isEditing && filled) {
      const url = normalizeSocial(value, platform.baseUrl);
      return (
        <a
          key={platform.key}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors duration-200"
          style={{ color: "#B0B0B0" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = accent)}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#B0B0B0")}
        >
          {iconEl}
        </a>
      );
    }

    /* editable — mobile uses drawer, desktop uses popover */
    const inputContent = (
      <SocialInput
        value={value}
        label={platform.label}
        accent={accent}
        onChange={(v) => setSocialLinks({ ...socialLinks, [platform.key]: v })}
      />
    );

    if (isMobile) {
      return (
        <Drawer key={platform.key}>
          <DrawerTrigger asChild>
            <button className="transition-colors duration-200 p-1" style={{ color: filled ? accent : "#333" }}>
              {iconEl}
            </button>
          </DrawerTrigger>
          <DrawerContent style={{ background: "#111111", border: "1px solid rgba(255,107,74,0.1)" }}>
            <div className="px-4 pb-8 pt-2">{inputContent}</div>
          </DrawerContent>
        </Drawer>
      );
    }

    return (
      <Popover key={platform.key}>
        <PopoverTrigger asChild>
          <button className="transition-colors duration-200 p-1" style={{ color: filled ? accent : "#333" }}>
            {iconEl}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0"
          style={{
            width: 280,
            background: "#111111",
            border: "1px solid transparent",
            backgroundImage: "linear-gradient(#111111, #111111), linear-gradient(135deg, rgba(255,107,74,0.15), rgba(59,240,122,0.15))",
            backgroundOrigin: "border-box",
            backgroundClip: "padding-box, border-box",
            borderRadius: 12,
            boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
          }}
        >
          {inputContent}
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: "#060606" }}>
      <Navbar />
      {/* ── sticky top bar (editing only) ── */}
      {isEditing && (
        <div className="sticky top-16 z-40" style={{ background: "#0A0A0A" }}>
          <div
            className="flex items-center justify-between h-12 px-5 md:px-12 max-w-[640px] mx-auto"
          >
            {!isMobile && (
              <span className="text-xs tracking-[0.15em]" style={{ color: "#B0B0B0" }}>
                editing your page
              </span>
            )}
            <div className="text-xs flex items-center gap-1 mx-auto md:mx-0" style={{ color: "#B0B0B0" }}>
              {saveStatus === "saving" && <span>saving...</span>}
              {saveStatus === "saved" && (
                <>
                  <span>all changes saved</span>
                  <Check className="w-3 h-3" style={{ color: accent }} />
                </>
              )}
              {saveStatus === "error" && (
                <button onClick={retrySave} className="flex items-center gap-1" style={{ color: "#FF6B4A" }}>
                  save failed — tap to retry
                </button>
              )}
              {saveStatus === "idle" && <span className="opacity-0 select-none">·</span>}
            </div>
            {!isMobile && (
              <a
                href={`/${handle || "handle"}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm flex items-center gap-1 hover:opacity-80 transition-opacity"
                style={{ color: accent }}
              >
                view public page
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          {/* glossy bottom border */}
          <div
            className="h-px"
            style={{ background: "linear-gradient(90deg, rgba(255,107,74,0.15), rgba(59,240,122,0.15))" }}
          />
          {/* progress bar */}
          <div className="h-0.5" style={{ background: "#111111" }}>
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${accent}, #FF6B4A)` }}
            />
          </div>
        </div>
      )}

      {/* ── content ── */}
      <div
        className="mx-auto pt-16"
        style={{ maxWidth: 640, paddingLeft: isMobile ? 20 : 48, paddingRight: isMobile ? 20 : 48, paddingBottom: 0 }}
      >
        {/* ── section 1: avatar + identity ── */}
        <div className="flex flex-col items-center text-center mb-6">
          {/* avatar */}
          <div
            className="relative group mb-3 rounded-full"
            style={{
              width: isMobile ? 96 : 120,
              height: isMobile ? 96 : 120,
              cursor: isEditing ? "pointer" : "default",
            }}
            onClick={() => isEditing && avatarInputRef.current?.click()}
          >
            <Avatar className="w-full h-full">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
              ) : (
                <AvatarFallback
                  className="flex flex-col items-center justify-center gap-1"
                  style={{ background: "#111111", color: "#B0B0B0" }}
                >
                  <Camera className="w-6 h-6" />
                  {isEditing && <span className="text-[10px]">add photo</span>}
                </AvatarFallback>
              )}
            </Avatar>
            {/* hover overlay */}
            {isEditing && avatarUrl && (
              <div
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-0.5"
                style={{ background: "rgba(0,0,0,0.5)" }}
              >
                <Camera className="w-5 h-5 text-white" />
                <span className="text-[9px] text-white">change</span>
              </div>
            )}
            {/* glow ring on hover */}
            {isEditing && (
              <div
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-all pointer-events-none"
                style={{ boxShadow: `0 0 0 3px rgba(${rgb},0.3)` }}
              />
            )}
            {isEditing && (
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
            )}
          </div>

          {/* display name */}
          {editingField === "name" ? (
            <input
              ref={nameInputRef}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onBlur={() => setEditingField(null)}
              onKeyDown={(e) => e.key === "Enter" && setEditingField(null)}
              className="bg-transparent text-center outline-none w-full transition-all duration-200"
              style={{
                color: "#FFFFFF",
                fontSize: isMobile ? 20 : 24,
                fontWeight: 700,
                borderBottom: "1px solid #333",
                paddingBottom: 2,
              }}
              onFocus={(e) => (e.currentTarget.style.borderBottomColor = accent)}
              placeholder="your name"
            />
          ) : (
            <h1
              className="transition-all duration-200"
              style={{
                color: displayName ? "#FFFFFF" : "#444",
                fontSize: isMobile ? 20 : 24,
                fontWeight: 700,
                cursor: isEditing ? "text" : "default",
                borderBottom: isEditing ? "1px dashed transparent" : "none",
              }}
              onMouseEnter={(e) => { if (isEditing) e.currentTarget.style.borderBottomColor = "#333"; }}
              onMouseLeave={(e) => { if (isEditing) e.currentTarget.style.borderBottomColor = "transparent"; }}
              onClick={() => isEditing && setEditingField("name")}
            >
              {displayName || (isEditing ? "your name" : "")}
            </h1>
          )}

          {/* handle */}
          {editingField === "handle" ? (
            <div className="flex items-center gap-0 mt-1 relative">
              <span className="text-sm" style={{ color: "#666" }}>@</span>
              <input
                ref={handleInputRef}
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                onBlur={() => setEditingField(null)}
                onKeyDown={(e) => e.key === "Enter" && setEditingField(null)}
                className="bg-transparent text-sm outline-none transition-all duration-200"
                style={{ color: "#B0B0B0", borderBottom: "1px solid #333", paddingBottom: 1, minWidth: 60 }}
                onFocus={(e) => (e.currentTarget.style.borderBottomColor = accent)}
              />
              {handle && !checkingHandle && handleAvailable !== null && (
                <span className="ml-1">
                  {handleAvailable ? (
                    <Check className="w-3 h-3" style={{ color: "#3BF07A" }} />
                  ) : (
                    <X className="w-3 h-3" style={{ color: "#FF6B4A" }} />
                  )}
                </span>
              )}
            </div>
          ) : (
            <p
              className="text-sm mt-1 transition-all duration-200"
              style={{
                color: "#B0B0B0",
                cursor: isEditing ? "text" : "default",
                borderBottom: isEditing ? "1px dashed transparent" : "none",
              }}
              onMouseEnter={(e) => { if (isEditing) e.currentTarget.style.borderBottomColor = "#333"; }}
              onMouseLeave={(e) => { if (isEditing) e.currentTarget.style.borderBottomColor = "transparent"; }}
              onClick={() => isEditing && setEditingField("handle")}
            >
              @{handle || (isEditing ? "handle" : "")}
            </p>
          )}

          {isEditing && isMobile && !editingField && (
            <span className="text-[9px] mt-1" style={{ color: "#444" }}>tap to edit</span>
          )}
        </div>

        {/* ── section 2: bio ── */}
        <div className="mb-8 text-center" style={{ marginTop: 24 }}>
          {editingField === "bio" ? (
            <div className="relative">
              <textarea
                ref={bioRef}
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 160))}
                onBlur={() => setEditingField(null)}
                rows={3}
                placeholder="tell people why you're here"
                className="w-full bg-transparent text-center outline-none resize-none transition-all duration-200"
                style={{
                  color: "#B0B0B0",
                  fontSize: 16,
                  lineHeight: 1.6,
                  border: "1px solid #333",
                  borderRadius: 8,
                  padding: "8px 12px",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = accent)}
              />
              <span className="absolute bottom-2 right-3 text-[10px]" style={{ color: "#444" }}>
                {bio.length}/160
              </span>
            </div>
          ) : (
            <p
              className="leading-relaxed transition-all duration-200"
              style={{
                color: bio ? "#B0B0B0" : "#444",
                fontSize: 16,
                cursor: isEditing ? "text" : "default",
                border: isEditing ? "1px dashed transparent" : "none",
                borderRadius: 8,
                padding: isEditing ? "8px 12px" : 0,
              }}
              onMouseEnter={(e) => { if (isEditing) e.currentTarget.style.borderColor = "#333"; }}
              onMouseLeave={(e) => { if (isEditing) e.currentTarget.style.borderColor = "transparent"; }}
              onClick={() => isEditing && setEditingField("bio")}
            >
              {bio || (isEditing ? "tell people why you're here" : "")}
            </p>
          )}
          {isEditing && isMobile && editingField !== "bio" && (
            <span className="text-[9px]" style={{ color: "#444" }}>tap to edit</span>
          )}
        </div>

        {/* ── section 3: specialties ── */}
        <div className="mb-8" style={{ marginTop: 32 }}>
          {isEditing && (
            <div className="flex justify-end mb-2">
              <span className="text-[10px]" style={{ color: "#444" }}>{specialties.length}/5</span>
            </div>
          )}
          <div className="flex flex-wrap gap-2 justify-center">
            {(isEditing ? SPECIALTY_OPTIONS : specialties).map((s) => {
              const selected = specialties.includes(s);
              if (!isEditing && !selected) return null;
              return (
                <button
                  key={s}
                  onClick={() => isEditing && toggleSpecialty(s)}
                  disabled={!isEditing}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200"
                  style={{
                    background: selected ? accent : "#111111",
                    color: selected ? "#0A0A0A" : "#B0B0B0",
                    border: selected ? `1px solid ${accent}` : "1px solid transparent",
                    boxShadow: selected
                      ? `0 2px 8px rgba(${rgb},0.2)`
                      : "inset 0 0 0 1px rgba(255,107,74,0.08), inset 0 0 0 1px rgba(59,240,122,0.08)",
                    cursor: isEditing ? "pointer" : "default",
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── section 4: social links ── */}
        <div className="mb-8" style={{ marginTop: 32 }}>
          <div className="flex items-center justify-center gap-4">
            {SOCIAL_PLATFORMS.map(renderSocialIcon)}
          </div>
          {isEditing && isMobile && (
            <p className="text-[9px] text-center mt-2" style={{ color: "#444" }}>tap icons to add links</p>
          )}
        </div>

        {/* ── section 5: accent theme (editing only) ── */}
        {isEditing && (
          <div className="mb-12" style={{ marginTop: 48 }}>
            <div className="flex justify-center mb-6">
              <div className="h-px w-[200px]" style={{ background: `linear-gradient(90deg, rgba(${rgb},0.3), transparent)` }} />
            </div>
            <p className="text-xs tracking-[0.15em] text-center mb-4" style={{ color: "#B0B0B0" }}>
              choose your vibe
            </p>
            <div className="flex items-center justify-center gap-3">
              {Object.entries(THEMES).map(([key, t]) => {
                const isActive = accentTheme === key;
                return (
                  <button
                    key={key}
                    onClick={() => setAccentTheme(key)}
                    className="relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
                    style={{
                      background: t.color,
                      border: isActive ? "none" : "2px solid #333",
                      boxShadow: isActive
                        ? `0 0 0 3px #060606, 0 0 0 5px ${t.color}, 0 0 12px ${t.color}40`
                        : "none",
                    }}
                  >
                    {isActive && <Check className="w-4 h-4" style={{ color: "#000" }} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── section 6: publish toggle (editing only) ── */}
        {isEditing && (
          <div className="mb-8 flex flex-col items-center gap-3" style={{ marginTop: 48 }}>
            <div className="flex items-center gap-3">
              <span className="text-sm" style={{ color: "#B0B0B0" }}>make my page public</span>
              <Switch checked={isPublished} onCheckedChange={setIsPublished} />
            </div>
            {isPublished ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs" style={{ color: accent }}>
                  your page is live at denied.care/{handle || "handle"}
                </span>
                <button onClick={copyUrl} className="p-0.5 hover:opacity-70 transition-opacity" style={{ color: accent }}>
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <span className="text-xs" style={{ color: "#666" }}>your page is hidden</span>
            )}
          </div>
        )}

        {/* ── section 7: footer spacer ── */}
        <div style={{ height: 120 }} />
      </div>

      {/* avatar crop modal */}
      {cropSrc && (
        <AvatarCropModal
          open={!!cropSrc}
          imageSrc={cropSrc}
          onClose={() => setCropSrc(null)}
          onConfirm={handleAvatarCrop}
        />
      )}
    </div>
  );
};

export default CreatorCanvas;
