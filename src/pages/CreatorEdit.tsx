import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Camera, Instagram, Globe, Star, Plus, X, GripVertical, ArrowUp, ArrowDown,
  ExternalLink, Eye, EyeOff, Trash2, Play, Image as ImageIcon, Save, Check, Clock, Lightbulb
} from "lucide-react";
import AvatarCropModal from "@/components/profile/AvatarCropModal";
import ReviewCard, { type ReviewData } from "@/components/reviews/ReviewCard";
import SuggestProviderModal from "@/components/creator/SuggestProviderModal";

interface CreatorProfile {
  id: string;
  user_id: string;
  handle: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  cover_photo_url: string | null;
  social_links: Record<string, string>;
  featured_providers: string[];
  is_published: boolean;
}

interface CreatorContentItem {
  id: string;
  creator_id: string;
  provider_slug: string | null;
  media_url: string;
  media_type: string;
  caption: string | null;
  procedure_tags: string[];
  sort_order: number;
}

interface ProviderInfo {
  slug: string;
  name: string;
  city: string | null;
  cover_photo_url: string | null;
}

const CreatorEdit = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState({ instagram: "", tiktok: "", youtube: "" });
  const [isPublished, setIsPublished] = useState(false);
  const [featuredProviders, setFeaturedProviders] = useState<string[]>([]);
  const [profileTheme, setProfileTheme] = useState<"mint" | "peach" | "pearl">("mint");

  // Provider data
  const [providerMap, setProviderMap] = useState<Record<string, ProviderInfo>>({});
  const [allProviders, setAllProviders] = useState<ProviderInfo[]>([]);
  const [providerSearchOpen, setProviderSearchOpen] = useState(false);

  // Content
  const [content, setContent] = useState<CreatorContentItem[]>([]);
  const [uploading, setUploading] = useState(false);

  // Reviews
  const [reviews, setReviews] = useState<ReviewData[]>([]);

  // Avatar crop
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const contentInputRef = useRef<HTMLInputElement>(null);

  // Lightbox
  const [lightboxItem, setLightboxItem] = useState<CreatorContentItem | null>(null);

  // Suggestions
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [pendingSuggestions, setPendingSuggestions] = useState<any[]>([]);

  // Load everything
  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    // Fetch creator profile
    const { data: cp } = await supabase
      .from("creator_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!cp) {
      navigate("/dashboard", { replace: true });
      return;
    }

    const profile = cp as unknown as CreatorProfile;
    setCreatorProfile(profile);
    setDisplayName(profile.display_name);
    setHandle(profile.handle);
    setBio(profile.bio || "");
    setAvatarUrl(profile.avatar_url);
    setCoverPhotoUrl(profile.cover_photo_url);
    setSocialLinks({
      instagram: profile.social_links?.instagram || "",
      tiktok: profile.social_links?.tiktok || "",
      youtube: profile.social_links?.youtube || "",
    });
    setIsPublished(profile.is_published);
    setFeaturedProviders(profile.featured_providers || []);
    setProfileTheme(((profile as any).profile_theme as "mint" | "peach" | "pearl") || "mint");

    // Fetch content
    const { data: contentData } = await supabase
      .from("creator_content")
      .select("*")
      .eq("creator_id", profile.id)
      .order("sort_order", { ascending: true });
    setContent((contentData as unknown as CreatorContentItem[]) || []);

    // Fetch all providers for search
    const { data: providers } = await supabase
      .from("providers")
      .select("slug, name, city, cover_photo_url")
      .order("name");
    const provList = (providers as ProviderInfo[]) || [];
    setAllProviders(provList);
    const pMap: Record<string, ProviderInfo> = {};
    provList.forEach((p) => (pMap[p.slug] = p));
    setProviderMap(pMap);

    // Fetch reviews
    const { data: reviewData } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (reviewData) {
      setReviews(
        (reviewData as any[]).map((r) => ({
          ...r,
          photos: r.photos || [],
          videos: r.videos || [],
          upvote_count: 0,
          user_has_upvoted: false,
          vibe_tags: r.vibe_tags || [],
        }))
      );
    }

    // Load pending suggestions
    const { data: sugData } = await supabase
      .from("provider_suggestions" as any)
      .select("*")
      .eq("creator_id", profile.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setPendingSuggestions(sugData || []);

    setLoading(false);
  };

  const handleSave = async () => {
    if (!creatorProfile || !user) return;
    setSaving(true);

    const { error } = await supabase
      .from("creator_profiles")
      .update({
        display_name: displayName,
        handle,
        bio: bio || null,
        avatar_url: avatarUrl,
        cover_photo_url: coverPhotoUrl,
        social_links: socialLinks,
        featured_providers: featuredProviders,
        is_published: isPublished,
        profile_theme: profileTheme,
      } as any)
      .eq("id", creatorProfile.id);

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      setSaving(false);
      return;
    }
    toast({ title: "Profile saved! ✨" });
    setSaving(false);
    navigate(`/c/${handle}`);
  };

  // Avatar upload
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Max 10MB", variant: "destructive" });
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
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      return;
    }
    const { data: urlData } = supabase.storage.from("profile-media").getPublicUrl(path);
    setAvatarUrl(urlData.publicUrl);
    toast({ title: "Avatar uploaded! 📸" });
  };

  // Cover photo upload
  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const path = `${user.id}/creator/cover-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("profile-media").upload(path, file, {
      contentType: file.type,
      upsert: true,
    });
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      return;
    }
    const { data: urlData } = supabase.storage.from("profile-media").getPublicUrl(path);
    setCoverPhotoUrl(urlData.publicUrl);
    toast({ title: "Cover photo updated!" });
    e.target.value = "";
  };

  // Content upload
  const handleContentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !creatorProfile) return;
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);

    for (const file of files) {
      const isVideo = file.type.startsWith("video/");
      const ext = file.name.split(".").pop() || "bin";
      const path = `${user.id}/creator/${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage.from("profile-media").upload(path, file, {
        contentType: file.type,
      });
      if (error) {
        toast({ title: `Failed: ${file.name}`, description: error.message, variant: "destructive" });
        continue;
      }

      const { data: urlData } = supabase.storage.from("profile-media").getPublicUrl(path);
      await supabase.from("creator_content").insert({
        creator_id: creatorProfile.id,
        media_url: urlData.publicUrl,
        media_type: isVideo ? "video" : "photo",
        sort_order: content.length,
      } as any);
    }

    setUploading(false);
    toast({ title: "Content uploaded! 📸" });
    // Reload content
    const { data } = await supabase
      .from("creator_content")
      .select("*")
      .eq("creator_id", creatorProfile.id)
      .order("sort_order", { ascending: true });
    setContent((data as unknown as CreatorContentItem[]) || []);
    e.target.value = "";
  };

  const handleDeleteContent = async (id: string) => {
    await supabase.from("creator_content").delete().eq("id", id);
    setContent((prev) => prev.filter((c) => c.id !== id));
    setLightboxItem(null);
    toast({ title: "Content removed" });
  };

  // Provider management
  const addProvider = (slug: string) => {
    if (!featuredProviders.includes(slug)) {
      setFeaturedProviders([...featuredProviders, slug]);
    }
    setProviderSearchOpen(false);
  };

  const removeProvider = (slug: string) => {
    setFeaturedProviders(featuredProviders.filter((s) => s !== slug));
  };

  const moveProvider = (index: number, direction: "up" | "down") => {
    const newList = [...featuredProviders];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newList.length) return;
    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
    setFeaturedProviders(newList);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!creatorProfile) return null;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">creator profile</h1>
            <p className="text-sm text-muted-foreground">Build your public page</p>
          </div>
          <div className="flex items-center gap-3">
            {isPublished && (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/c/${handle}`} target="_blank">
                  <Eye className="w-4 h-4 mr-1" /> View Page
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Cover Photo */}
        <section>
          <button
            onClick={() => coverInputRef.current?.click()}
            className="w-full aspect-[3/1] rounded-xl border-2 border-dashed border-border bg-card hover:bg-muted/50 transition-colors overflow-hidden relative group"
          >
            {coverPhotoUrl ? (
              <>
                <img src={coverPhotoUrl} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Camera className="w-8 h-8 mb-2" />
                <span className="text-sm">Add cover photo (16:9)</span>
              </div>
            )}
          </button>
          <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
        </section>

        {/* Avatar + Basic Info */}
        <section className="flex gap-6 items-start">
          <div className="relative group shrink-0">
            <Avatar className="w-24 h-24 bg-primary text-primary-foreground">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="Avatar" className="object-cover" />}
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {displayName?.[0]?.toUpperCase() || "C"}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center cursor-pointer"
            >
              <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
          </div>

          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label>Handle</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">denied.care/c/</span>
                <Input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Bio */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Bio</Label>
            <span className="text-xs text-muted-foreground">{bio.length}/300</span>
          </div>
          <Textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 300))}
            placeholder="Tell people about yourself and your medical tourism journey..."
            rows={3}
          />
        </section>

        {/* Profile Theme */}
        <section className="space-y-3">
          <Label className="text-base font-semibold">Profile Theme</Label>
          <p className="text-xs text-muted-foreground">Each theme changes your whole profile — card colors, borders, tags, and accent tones.</p>
          <div className="flex gap-3">
            {([
              {
                value: "mint" as const,
                label: "Mint",
                accent: "#5EB298",
                cardBg: "rgba(94,178,152,0.08)",
                cardBorder: "rgba(94,178,152,0.12)",
                tagBg: "rgba(94,178,152,0.15)",
                tagBorder: "rgba(94,178,152,0.3)",
                pageBg: "#0a0a0a",
                buttonBg: "#5EB298",
              },
              {
                value: "peach" as const,
                label: "Peach",
                accent: "#E0A693",
                cardBg: "rgba(224,166,147,0.08)",
                cardBorder: "rgba(224,166,147,0.12)",
                tagBg: "rgba(224,166,147,0.15)",
                tagBorder: "rgba(224,166,147,0.3)",
                pageBg: "#0a0a0a",
                buttonBg: "#E0A693",
              },
              {
                value: "pearl" as const,
                label: "Pearl",
                accent: "#D4C5A9",
                cardBg: "rgba(255,255,255,0.05)",
                cardBorder: "rgba(255,255,255,0.10)",
                tagBg: "rgba(212,197,169,0.12)",
                tagBorder: "rgba(212,197,169,0.25)",
                pageBg: "#121212",
                buttonBg: "#D4C5A9",
              },
            ]).map((t) => {
              const isActive = profileTheme === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setProfileTheme(t.value)}
                  className="flex-1 rounded-xl p-3 flex flex-col gap-2.5 transition-all text-left"
                  style={{
                    background: t.pageBg,
                    border: `2px solid ${isActive ? t.accent : 'rgba(255,255,255,0.08)'}`,
                    outline: isActive ? `3px solid ${t.accent}30` : 'none',
                    outlineOffset: '2px',
                  }}
                >
                  {/* Mock card preview */}
                  <div className="w-full rounded-lg p-2.5" style={{ background: t.cardBg, border: `1px solid ${t.cardBorder}` }}>
                    {/* Mock header bar */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-5 h-5 rounded-full" style={{ background: t.accent, opacity: 0.9 }} />
                      <div className="h-1.5 rounded-full flex-1" style={{ background: `${t.accent}40` }} />
                    </div>
                    {/* Mock tag */}
                    <div className="inline-flex rounded-full px-2 py-0.5 mb-1.5" style={{ background: t.tagBg, border: `1px solid ${t.tagBorder}` }}>
                      <div className="h-1 w-8 rounded-full" style={{ background: t.accent }} />
                    </div>
                    {/* Mock button */}
                    <div className="w-full rounded-full h-3" style={{ background: t.buttonBg, opacity: 0.85 }} />
                  </div>
                  {/* Label row */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold" style={{ color: isActive ? t.accent : 'rgba(255,255,255,0.7)' }}>{t.label}</span>
                    {isActive && (
                      <span className="text-[10px] rounded-full px-1.5 py-0.5 font-medium" style={{ background: `${t.accent}20`, color: t.accent }}>active</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Social Links */}
        <section className="space-y-4">
          <Label className="text-base font-semibold">Social Links</Label>
          <div className="grid gap-3">
            <div className="flex items-center gap-2">
              <Instagram className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input
                value={socialLinks.instagram}
                onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                placeholder="https://instagram.com/yourhandle"
              />
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-1-.08 6.27 6.27 0 0 0-6.27 6.27 6.27 6.27 0 0 0 6.27 6.27 6.27 6.27 0 0 0 6.27-6.27V8.97a8.16 8.16 0 0 0 4.04 1.05V6.69h-.01z" />
              </svg>
              <Input
                value={socialLinks.tiktok}
                onChange={(e) => setSocialLinks({ ...socialLinks, tiktok: e.target.value })}
                placeholder="https://tiktok.com/@yourhandle"
              />
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input
                value={socialLinks.youtube}
                onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                placeholder="https://youtube.com/@yourhandle"
              />
            </div>
          </div>
        </section>

        {/* Publish Toggle */}
        <Card className={isPublished ? "border-primary/30 bg-primary/5" : "border-border"}>
          <CardContent className="py-4 flex items-center justify-between">
            <div>
              {isPublished ? (
                <>
                  <div className="flex items-center gap-2 font-semibold text-primary">
                    <Eye className="w-4 h-4" /> Your page is live
                  </div>
                  <a
                    href={`/c/${handle}`}
                    target="_blank"
                    rel="noopener"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    denied.care/c/{handle} <ExternalLink className="w-3 h-3" />
                  </a>
                </>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <EyeOff className="w-4 h-4" /> Your page is not visible yet
                </div>
              )}
            </div>
            <Switch checked={isPublished} onCheckedChange={setIsPublished} />
          </CardContent>
        </Card>

        {/* Featured Providers */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">My Favorite Providers</Label>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setSuggestOpen(true)}>
                <Lightbulb className="w-4 h-4" /> Suggest New
              </Button>
              <Popover open={providerSearchOpen} onOpenChange={setProviderSearchOpen}>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Plus className="w-4 h-4" /> Add Provider
                  </Button>
                </PopoverTrigger>
              <PopoverContent className="p-0 w-[300px]" align="end">
                <Command>
                  <CommandInput placeholder="Search providers..." />
                  <CommandList>
                    <CommandEmpty>No providers found</CommandEmpty>
                    <CommandGroup>
                      {allProviders
                        .filter((p) => !featuredProviders.includes(p.slug))
                        .map((p) => (
                          <CommandItem key={p.slug} onSelect={() => addProvider(p.slug)}>
                            <div>
                              <div className="font-medium">{p.name}</div>
                              {p.city && <div className="text-xs text-muted-foreground">{p.city}</div>}
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Pending Suggestions */}
          {pendingSuggestions.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Pending Suggestions</Label>
              {pendingSuggestions.map((s: any) => (
                <Card key={s.id} className="border-border/50 bg-muted/30">
                  <CardContent className="py-3 flex items-center gap-3">
                    <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-sm">{s.name}</div>
                      {s.city && <div className="text-xs text-muted-foreground">{s.city}</div>}
                    </div>
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                      Awaiting review
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {featuredProviders.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                <Star className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No favorite providers yet</p>
                <p className="text-sm">Add providers you endorse to feature them on your page</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {featuredProviders.map((slug, i) => {
                const p = providerMap[slug];
                return (
                  <Card key={slug} className="border-border/50">
                    <CardContent className="py-3 flex items-center gap-3">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => moveProvider(i, "up")}
                          disabled={i === 0}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-20"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => moveProvider(i, "down")}
                          disabled={i === featuredProviders.length - 1}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-20"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {p?.cover_photo_url && (
                        <img
                          src={p.cover_photo_url}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover bg-muted"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{p?.name || slug}</div>
                        {p?.city && <div className="text-xs text-muted-foreground">{p.city}</div>}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => removeProvider(slug)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Content Gallery */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">My Content</Label>
            <label className="cursor-pointer">
              <Button size="sm" variant="outline" className="gap-1.5" asChild disabled={uploading}>
                <span>
                  <Plus className="w-4 h-4" />
                  {uploading ? "Uploading..." : "Add Photos/Videos"}
                </span>
              </Button>
              <input
                ref={contentInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleContentUpload}
                disabled={uploading}
              />
            </label>
          </div>

          {content.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No content yet</p>
                <p className="text-sm">Upload photos and videos from your experiences</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {content.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setLightboxItem(item)}
                  className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
                >
                  {item.media_type === "video" ? (
                    <>
                      <video src={item.media_url} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Play className="w-6 h-6 text-white drop-shadow-lg" />
                      </div>
                    </>
                  ) : (
                    <img src={item.media_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  {item.provider_slug && (
                    <Badge className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white border-0">
                      {providerMap[item.provider_slug]?.name || item.provider_slug}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Reviews */}
        <section className="space-y-4">
          <Label className="text-base font-semibold">My Reviews</Label>
          {reviews.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-muted-foreground">
                <Star className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>No reviews yet</p>
                <p className="text-sm">Leave reviews on provider pages — they'll appear here automatically</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  showProviderName
                  providerName={providerMap[review.provider_slug]?.name || review.provider_slug}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Sticky Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {saving ? "Saving..." : "All changes require saving"}
          </p>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
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

      {/* Content Lightbox */}
      <Dialog open={!!lightboxItem} onOpenChange={() => setLightboxItem(null)}>
        <DialogContent className="max-w-2xl p-0 bg-black/95 border-none">
          {lightboxItem && (
            <div className="relative">
              <button
                onClick={() => setLightboxItem(null)}
                className="absolute top-3 right-3 z-10 text-white/70 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
              <button
                onClick={() => handleDeleteContent(lightboxItem.id)}
                className="absolute top-3 left-3 z-10 text-white/70 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              {lightboxItem.media_type === "video" ? (
                <video src={lightboxItem.media_url} controls autoPlay className="w-full max-h-[80vh] object-contain" />
              ) : (
                <img src={lightboxItem.media_url} alt="" className="w-full max-h-[80vh] object-contain" />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Suggest Provider Modal */}
      <SuggestProviderModal
        open={suggestOpen}
        onOpenChange={setSuggestOpen}
        creatorId={creatorProfile.id}
        onSubmitted={loadData}
      />
    </div>
  );
};

export default CreatorEdit;
