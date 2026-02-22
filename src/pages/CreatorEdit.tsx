import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  Camera, Instagram, Globe, Check, X, Copy, Plus,
} from "lucide-react";
import AvatarCropModal from "@/components/profile/AvatarCropModal";
import CreatorProfilePreview, { ACCENT_THEMES } from "@/components/creator/CreatorProfilePreview";

/* ── Icons ── */
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

/* ── Constants ── */
const SPECIALTY_OPTIONS = [
  "dental", "cosmetic", "skincare", "bariatric", "fertility",
  "wellness", "recovery tips", "travel hacks", "budget tips",
];

const THEME_SWATCHES = [
  { key: "mint", color: "#3BF07A", label: "mint" },
  { key: "coral", color: "#FF6B4A", label: "coral" },
  { key: "lavender", color: "#C4A8FF", label: "lavender" },
  { key: "gold", color: "#FFD700", label: "gold" },
  { key: "ice", color: "#7DF9FF", label: "ice" },
];

/* ── Helpers ── */
const normalizeSocial = (value: string, baseUrl: string): string => {
  const v = value.trim();
  if (!v) return v;
  if (/^https?:\/\//i.test(v)) return v;
  if (/^www\./i.test(v)) return `https://${v}`;
  const handle = v.replace(/^@/, "");
  if (handle.includes("/")) return `https://${handle}`;
  return `${baseUrl}${handle}`;
};

/* ── Gradient border style ── */
const glossyBorderStyle = {
  background: '#111111',
  border: '1px solid transparent',
  backgroundClip: 'padding-box',
  boxShadow: 'inset 0 0 0 1px rgba(255,107,74,0.08), inset 0 0 0 1px rgba(59,240,122,0.08)',
};

const inputStyle = {
  ...glossyBorderStyle,
  borderRadius: '16px',
  padding: '12px 16px',
  color: '#FFFFFF',
  fontSize: '14px',
  outline: 'none',
  width: '100%',
  transition: 'box-shadow 0.2s',
};

const inputFocusClass = "focus:shadow-[0_0_0_2px_rgba(59,240,122,0.3)]";

/* ── Main Component ── */
const CreatorEdit = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Form state
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

  // Handle availability
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const [checkingHandle, setCheckingHandle] = useState(false);
  const originalHandle = useRef("");

  // Save state
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedRef = useRef(false);

  // Avatar crop
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Mobile preview
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  // Load profile
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: cp } = await supabase
        .from("creator_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!cp) {
        navigate("/dashboard", { replace: true });
        return;
      }

      const p = cp as any;
      setProfileId(p.id);
      setDisplayName(p.display_name || "");
      setHandle(p.handle || "");
      originalHandle.current = p.handle || "";
      setBio(p.bio || "");
      setAvatarUrl(p.avatar_url || null);
      setSpecialties(p.specialties || []);
      setAccentTheme(p.profile_theme || "mint");
      setIsPublished(p.is_published || false);

      const sl = p.social_links || {};
      setSocialLinks({
        instagram: sl.instagram || "",
        tiktok: sl.tiktok || "",
        youtube: sl.youtube || "",
        twitter: sl.twitter || "",
        website: sl.website || "",
      });

      setLoading(false);
      // Mark loaded so auto-save doesn't fire on initial hydration
      setTimeout(() => { hasLoadedRef.current = true; }, 100);
    })();
  }, [user]);

  // Handle availability check
  useEffect(() => {
    if (!handle || handle === originalHandle.current) {
      setHandleAvailable(handle ? true : null);
      return;
    }
    setCheckingHandle(true);
    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("creator_profiles")
        .select("id")
        .eq("handle", handle)
        .maybeSingle();
      setHandleAvailable(!data);
      setCheckingHandle(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [handle]);

  // Auto-save with debounce
  const doSave = useCallback(async () => {
    if (!profileId || !user) return;
    setSaveStatus("saving");

    const normalizedSocialLinks = {
      instagram: normalizeSocial(socialLinks.instagram, "https://www.instagram.com/"),
      tiktok: normalizeSocial(socialLinks.tiktok, "https://www.tiktok.com/@"),
      youtube: normalizeSocial(socialLinks.youtube, "https://www.youtube.com/@"),
      twitter: normalizeSocial(socialLinks.twitter, "https://x.com/"),
      website: socialLinks.website.trim(),
    };

    const { error } = await supabase
      .from("creator_profiles")
      .update({
        display_name: displayName,
        handle,
        bio: bio || null,
        avatar_url: avatarUrl,
        specialties,
        social_links: normalizedSocialLinks,
        is_published: isPublished,
        profile_theme: accentTheme,
      } as any)
      .eq("id", profileId);

    if (error) {
      setSaveStatus("idle");
      toast({ title: "save failed", description: error.message, variant: "destructive" });
    } else {
      setSaveStatus("saved");
      if (handle !== originalHandle.current) originalHandle.current = handle;
      setTimeout(() => setSaveStatus("idle"), 2500);
    }
  }, [profileId, user, displayName, handle, bio, avatarUrl, specialties, socialLinks, isPublished, accentTheme]);

  // Trigger auto-save on any field change
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(), 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [displayName, handle, bio, avatarUrl, specialties, socialLinks, isPublished, accentTheme, doSave]);

  // Avatar upload
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "image too large", description: "max 10mb", variant: "destructive" });
      return;
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
      contentType: "image/jpeg",
      upsert: true,
    });
    if (error) {
      toast({ title: "upload failed", description: error.message, variant: "destructive" });
      return;
    }
    const { data: urlData } = supabase.storage.from("profile-media").getPublicUrl(path);
    setAvatarUrl(urlData.publicUrl);
  };

  const toggleSpecialty = (s: string) => {
    setSpecialties((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : prev.length < 5 ? [...prev, s] : prev
    );
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(`denied.care/c/${handle}`);
    toast({ title: "copied!" });
  };

  // Progress computation
  const progressSections = [
    { label: "photo", done: !!avatarUrl },
    { label: "info", done: !!displayName && !!handle },
    { label: "specialties", done: specialties.length > 0 },
    { label: "links", done: Object.values(socialLinks).some((v) => v.trim()) },
    { label: "theme", done: true }, // always has a default
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#060606' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2" style={{ borderColor: '#3BF07A' }} />
      </div>
    );
  }

  const rightPanel = (
    <div className="flex flex-col h-full">
      {/* Save status + Progress */}
      <div className="px-6 pt-5 pb-3 space-y-3">
        {/* Save status */}
        <div className="flex items-center gap-1.5 text-xs" style={{ color: '#B0B0B0' }}>
          {saveStatus === "saving" && <span>saving...</span>}
          {saveStatus === "saved" && (
            <>
              <Check className="w-3 h-3" style={{ color: '#3BF07A' }} />
              <span>all changes saved</span>
            </>
          )}
          {saveStatus === "idle" && <span>&nbsp;</span>}
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-2">
          {progressSections.map((s) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full transition-colors"
                style={{
                  background: s.done ? '#3BF07A' : 'rgba(255,255,255,0.15)',
                  boxShadow: s.done ? '0 0 6px rgba(59,240,122,0.4)' : 'none',
                }}
              />
              <span className="text-[10px] tracking-wide" style={{ color: s.done ? '#3BF07A' : '#666' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto px-6 pb-8 space-y-7">

        {/* ── Section 1: Profile Photo ── */}
        <section className="space-y-3">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, rgba(59,240,122,0.2) 0%, transparent 100%)' }} />
          <label className="text-xs font-medium tracking-wide" style={{ color: '#FFFFFF' }}>profile photo</label>
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
              <Avatar className="w-24 h-24" style={{ border: '2px solid rgba(59,240,122,0.2)' }}>
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt="avatar" className="object-cover" />
                ) : (
                  <AvatarFallback style={{ background: '#111111', color: '#666' }}>
                    <Plus className="w-6 h-6" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{displayName || "your name"}</p>
              <p className="text-xs" style={{ color: '#B0B0B0' }}>@{handle || "handle"}</p>
            </div>
          </div>
        </section>

        {/* ── Section 2: Basic Info ── */}
        <section className="space-y-4">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, rgba(59,240,122,0.2) 0%, transparent 100%)' }} />
          <label className="text-xs font-medium tracking-wide" style={{ color: '#FFFFFF' }}>basic info</label>

          {/* Display Name */}
          <div className="space-y-1.5">
            <label className="text-xs" style={{ color: '#B0B0B0' }}>display name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="your name"
              className={inputFocusClass}
              style={{ ...inputStyle, '::placeholder': { color: '#666' } } as any}
            />
          </div>

          {/* Handle */}
          <div className="space-y-1.5">
            <label className="text-xs" style={{ color: '#B0B0B0' }}>handle</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#666' }}>@</span>
              <input
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className={inputFocusClass}
                style={{ ...inputStyle, paddingLeft: '32px' } as any}
              />
              {handle && !checkingHandle && handleAvailable !== null && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2">
                  {handleAvailable ? (
                    <Check className="w-4 h-4" style={{ color: '#3BF07A' }} />
                  ) : (
                    <X className="w-4 h-4" style={{ color: '#FF6B4A' }} />
                  )}
                </span>
              )}
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs" style={{ color: '#B0B0B0' }}>bio</label>
              <span className="text-[10px]" style={{ color: '#666' }}>{bio.length}/160</span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 160))}
              placeholder="tell people why you're here"
              rows={3}
              className={inputFocusClass}
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical', '::placeholder': { color: '#666' } } as any}
            />
          </div>
        </section>

        {/* ── Section 3: Specialties ── */}
        <section className="space-y-3">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, rgba(59,240,122,0.2) 0%, transparent 100%)' }} />
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium tracking-wide" style={{ color: '#FFFFFF' }}>specialties</label>
            <span className="text-[10px]" style={{ color: '#666' }}>{specialties.length}/5</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SPECIALTY_OPTIONS.map((s) => {
              const selected = specialties.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleSpecialty(s)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: selected ? '#3BF07A' : '#111111',
                    color: selected ? '#0A0A0A' : '#B0B0B0',
                    border: selected ? '1px solid #3BF07A' : '1px solid rgba(255,107,74,0.08)',
                    boxShadow: selected ? 'none' : 'inset 0 0 0 1px rgba(59,240,122,0.08)',
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Section 4: Social Links ── */}
        <section className="space-y-3">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, rgba(59,240,122,0.2) 0%, transparent 100%)' }} />
          <label className="text-xs font-medium tracking-wide" style={{ color: '#FFFFFF' }}>social links</label>

          {[
            { key: "instagram", icon: <Instagram className="w-4 h-4" />, placeholder: "instagram handle or url" },
            { key: "tiktok", icon: <TikTokIcon className="w-4 h-4" />, placeholder: "tiktok handle or url" },
            { key: "youtube", icon: <YouTubeIcon className="w-4 h-4" />, placeholder: "youtube channel url" },
            { key: "twitter", icon: <TwitterIcon className="w-4 h-4" />, placeholder: "x / twitter handle" },
            { key: "website", icon: <Globe className="w-4 h-4" />, placeholder: "your website url" },
          ].map(({ key, icon, placeholder }) => (
            <div key={key} className="flex items-center gap-3">
              <div className="shrink-0" style={{ color: '#666' }}>{icon}</div>
              <input
                value={socialLinks[key] || ""}
                onChange={(e) => setSocialLinks({ ...socialLinks, [key]: e.target.value })}
                placeholder={placeholder}
                className={inputFocusClass}
                style={{ ...inputStyle } as any}
              />
            </div>
          ))}
        </section>

        {/* ── Section 5: Accent Theme ── */}
        <section className="space-y-3">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, rgba(59,240,122,0.2) 0%, transparent 100%)' }} />
          <label className="text-xs font-medium tracking-wide" style={{ color: '#FFFFFF' }}>choose your vibe</label>
          <div className="flex items-center gap-3">
            {THEME_SWATCHES.map((t) => {
              const isActive = accentTheme === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setAccentTheme(t.key)}
                  className="relative w-10 h-10 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: t.color,
                    boxShadow: isActive ? `0 0 0 3px #060606, 0 0 0 5px ${t.color}, 0 0 15px ${t.color}40` : 'none',
                  }}
                  title={t.label}
                >
                  {isActive && <Check className="w-4 h-4" style={{ color: '#000' }} />}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Section 6: Publish Toggle ── */}
        <section className="space-y-3">
          <div className="h-px" style={{ background: 'linear-gradient(90deg, rgba(59,240,122,0.2) 0%, transparent 100%)' }} />
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-medium tracking-wide" style={{ color: '#FFFFFF' }}>make my page public</label>
              <p className="text-[10px] mt-0.5" style={{ color: isPublished ? '#3BF07A' : '#B0B0B0' }}>
                {isPublished ? "your page is live" : "your page is hidden"}
              </p>
            </div>
            <Switch checked={isPublished} onCheckedChange={setIsPublished} />
          </div>
        </section>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: '#060606' }}>
      <div className="max-w-[1200px] mx-auto">
        {isMobile ? (
          /* ── Mobile: single column ── */
          <div className="min-h-screen flex flex-col" style={{ background: '#0A0A0A' }}>
            {rightPanel}

            {/* Sticky preview button */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
              <button
                onClick={() => setMobilePreviewOpen(true)}
                className="px-6 py-2.5 rounded-full text-sm font-semibold text-black shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #3BF07A, #2DD468)',
                  boxShadow: '0 4px 20px rgba(59,240,122,0.3)',
                }}
              >
                preview my page
              </button>
            </div>

            {/* Full-screen preview modal */}
            <Dialog open={mobilePreviewOpen} onOpenChange={setMobilePreviewOpen}>
              <DialogContent className="max-w-full h-full p-0 border-none rounded-none" style={{ background: '#060606' }}>
                <button
                  onClick={() => setMobilePreviewOpen(false)}
                  className="absolute top-4 right-4 z-10 p-2 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#FFFFFF' }}
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="p-4 pt-14 overflow-y-auto h-full">
                  <p className="text-[10px] tracking-[0.2em] mb-2" style={{ color: '#B0B0B0' }}>live preview</p>
                  <CreatorProfilePreview
                    displayName={displayName}
                    handle={handle}
                    bio={bio}
                    avatarUrl={avatarUrl}
                    specialties={specialties}
                    socialLinks={socialLinks}
                    accentTheme={accentTheme}
                    isPublished={isPublished}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          /* ── Desktop: split panel ── */
          <div className="flex min-h-screen">
            {/* Left: Live Preview (55%) */}
            <div className="w-[55%] p-8 flex flex-col">
              <p className="text-[10px] tracking-[0.2em] mb-3" style={{ color: '#B0B0B0' }}>live preview</p>

              {/* Device frame */}
              <div
                className="flex-1 rounded-2xl overflow-hidden"
                style={{
                  border: '1px solid transparent',
                  backgroundClip: 'padding-box',
                  boxShadow: `
                    inset 0 0 0 1px rgba(255,107,74,0.15),
                    inset 0 0 0 1px rgba(59,240,122,0.15),
                    0 4px 40px rgba(0,0,0,0.5),
                    0 0 80px rgba(59,240,122,0.05)
                  `,
                }}
              >
                <CreatorProfilePreview
                  displayName={displayName}
                  handle={handle}
                  bio={bio}
                  avatarUrl={avatarUrl}
                  specialties={specialties}
                  socialLinks={socialLinks}
                  accentTheme={accentTheme}
                  isPublished={isPublished}
                />
              </div>

              {/* Public URL */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: '#3BF07A' }}>
                  denied.care/c/{handle || "handle"}
                </span>
                <button
                  onClick={copyUrl}
                  className="p-1 rounded hover:bg-white/5 transition-colors"
                  style={{ color: '#3BF07A' }}
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right: Builder Controls (45%) */}
            <div className="w-[45%] min-h-screen" style={{ background: '#0A0A0A' }}>
              {rightPanel}
            </div>
          </div>
        )}
      </div>

      {/* Avatar Crop Modal */}
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

export default CreatorEdit;
