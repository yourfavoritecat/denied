import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Play } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  creatorId: string;
  userId: string;
  accent: string;
  rgb: string;
  onSuccess: () => void;
}

const ContentUploadModal = ({ open, onClose, creatorId, userId, accent, rgb, onSuccess }: Props) => {
  const { toast } = useToast();
  const [contentType, setContentType] = useState<"photo" | "video">("photo");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtagInput, setHashtagInput] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [providerSlug, setProviderSlug] = useState("");
  const [providers, setProviders] = useState<{ slug: string; name: string }[]>([]);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (open) {
      supabase.from("providers").select("slug, name").order("name").then(({ data }) => {
        setProviders((data as any[]) || []);
      });
    }
  }, [open]);

  const parsedHashtags = hashtagInput
    .split(",")
    .map((t) => t.trim().toLowerCase().replace(/^#/, ""))
    .filter(Boolean)
    .slice(0, 5);

  const reset = () => {
    setContentType("photo");
    setTitle("");
    setDescription("");
    setHashtagInput("");
    setVideoUrl("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setThumbFile(null);
    setThumbPreview(null);
    setProviderSlug("");
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    const r = new FileReader();
    r.onload = () => setPhotoPreview(r.result as string);
    r.readAsDataURL(f);
  };

  const handleThumbSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setThumbFile(f);
    const r = new FileReader();
    r.onload = () => setThumbPreview(r.result as string);
    r.readAsDataURL(f);
  };

  const uploadFile = async (file: File, prefix: string) => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${creatorId}/${Date.now()}_${prefix}.${ext}`;
    const { error } = await supabase.storage.from("creator-content").upload(path, file, {
      contentType: file.type, upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from("creator-content").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!title.trim()) { toast({ title: "title is required", variant: "destructive" }); return; }
    if (contentType === "photo" && !photoFile) { toast({ title: "please upload a photo", variant: "destructive" }); return; }
    if (contentType === "video" && !videoUrl.trim()) { toast({ title: "please paste a video link", variant: "destructive" }); return; }
    if (contentType === "video" && videoUrl.trim()) {
      try { new URL(videoUrl); } catch { toast({ title: "invalid url", variant: "destructive" }); return; }
    }

    setPublishing(true);
    try {
      let mediaUrl = "";
      let thumbnailUrl: string | null = null;

      if (contentType === "photo") {
        mediaUrl = await uploadFile(photoFile!, "photo");
        thumbnailUrl = mediaUrl;
      } else {
        mediaUrl = videoUrl.trim();
        if (thumbFile) {
          thumbnailUrl = await uploadFile(thumbFile, "thumb");
        }
      }

      const row: any = {
        creator_id: creatorId,
        media_type: contentType,
        media_url: mediaUrl,
        title: title.trim(),
        caption: description.trim() || null,
        thumbnail_url: thumbnailUrl,
        url: contentType === "video" ? videoUrl.trim() : null,
        hashtags: parsedHashtags.length > 0 ? parsedHashtags : null,
        provider_slug: providerSlug || null,
      };

      const { error } = await supabase.from("creator_content").insert(row);
      if (error) throw error;

      toast({ title: "content added!" });
      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({ title: "upload failed", description: err.message, variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "#0A0A0A",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12,
    color: "#fff",
    padding: "10px 14px",
    fontSize: 14,
    outline: "none",
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent
        className="p-0 border-0 overflow-hidden"
        style={{
          background: "#111111",
          borderRadius: 20,
          border: "1px solid rgba(255,107,74,0.08)",
          maxWidth: 480,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <div style={{ padding: "28px 28px 24px" }}>
          <DialogHeader className="mb-1">
            <DialogTitle style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>add content</DialogTitle>
            <DialogDescription style={{ fontSize: 13, color: "#666" }}>share your medical tourism content</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-5 mt-5">
            {/* content type toggle */}
            <div>
              <label style={{ fontSize: 11, letterSpacing: 1, color: "#666", display: "block", marginBottom: 8 }}>content type</label>
              <div className="flex gap-2">
                {(["photo", "video"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setContentType(t)}
                    style={{
                      padding: "8px 20px",
                      borderRadius: 9999,
                      fontSize: 13,
                      fontWeight: contentType === t ? 600 : 400,
                      background: contentType === t ? accent : "#0A0A0A",
                      color: contentType === t ? "#0A0A0A" : "#666",
                      border: "none",
                      cursor: "pointer",
                      transition: "all 200ms",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* title */}
            <div>
              <label style={{ fontSize: 11, letterSpacing: 1, color: "#666", display: "block", marginBottom: 8 }}>title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                placeholder="what's this about?"
                style={inputStyle}
              />
              <div style={{ fontSize: 10, color: "#444", textAlign: "right", marginTop: 4 }}>{title.length}/80</div>
            </div>

            {/* photo upload */}
            {contentType === "photo" && (
              <div>
                <label style={{ fontSize: 11, letterSpacing: 1, color: "#666", display: "block", marginBottom: 8 }}>upload your photo</label>
                {photoPreview ? (
                  <div style={{ width: "100%", height: 140, borderRadius: 12, overflow: "hidden", position: "relative" }}>
                    <img src={photoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button
                      onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                      style={{
                        position: "absolute", top: 8, right: 8,
                        background: "rgba(0,0,0,0.7)", color: "#fff",
                        borderRadius: 9999, width: 24, height: 24,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: "none", cursor: "pointer", fontSize: 14,
                      }}
                    >×</button>
                  </div>
                ) : (
                  <label
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: "100%", height: 100, borderRadius: 12,
                      border: `2px dashed rgba(${rgb},0.25)`, cursor: "pointer",
                      color: `rgba(${rgb},0.4)`, fontSize: 13,
                    }}
                  >
                    click to upload
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                  </label>
                )}
              </div>
            )}

            {/* video link */}
            {contentType === "video" && (
              <>
                <div>
                  <label style={{ fontSize: 11, letterSpacing: 1, color: "#666", display: "block", marginBottom: 8 }}>video link</label>
                  <input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="paste your tiktok, instagram, or youtube link"
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, letterSpacing: 1, color: "#666", display: "block", marginBottom: 8 }}>thumbnail (optional)</label>
                  {thumbPreview ? (
                    <div style={{ width: 120, height: 80, borderRadius: 10, overflow: "hidden", position: "relative" }}>
                      <img src={thumbPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button
                        onClick={() => { setThumbFile(null); setThumbPreview(null); }}
                        style={{
                          position: "absolute", top: 4, right: 4,
                          background: "rgba(0,0,0,0.7)", color: "#fff",
                          borderRadius: 9999, width: 20, height: 20,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          border: "none", cursor: "pointer", fontSize: 12,
                        }}
                      >×</button>
                    </div>
                  ) : (
                    <label
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: 120, height: 80, borderRadius: 10,
                        border: `2px dashed rgba(${rgb},0.2)`, cursor: "pointer",
                        color: `rgba(${rgb},0.3)`, fontSize: 11,
                      }}
                    >
                      <Play className="w-4 h-4 mr-1" /> add
                      <input type="file" accept="image/*" className="hidden" onChange={handleThumbSelect} />
                    </label>
                  )}
                  <p style={{ fontSize: 10, color: "#444", marginTop: 6 }}>add a thumbnail so people know what they're clicking</p>
                </div>
              </>
            )}

            {/* hashtags */}
            <div>
              <label style={{ fontSize: 11, letterSpacing: 1, color: "#666", display: "block", marginBottom: 8 }}>hashtags</label>
              <input
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                placeholder="add hashtags separated by commas"
                style={inputStyle}
              />
              {parsedHashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {parsedHashtags.map((h) => (
                    <span
                      key={h}
                      style={{
                        padding: "3px 10px",
                        borderRadius: 9999,
                        fontSize: 11,
                        background: `rgba(${rgb},0.1)`,
                        color: accent,
                        border: `1px solid rgba(${rgb},0.12)`,
                      }}
                    >
                      #{h}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* provider */}
            <div>
              <label style={{ fontSize: 11, letterSpacing: 1, color: "#666", display: "block", marginBottom: 8 }}>tag a provider (optional)</label>
              <select
                value={providerSlug}
                onChange={(e) => setProviderSlug(e.target.value)}
                style={{ ...inputStyle, appearance: "auto" as any }}
              >
                <option value="">none</option>
                {providers.map((p) => (
                  <option key={p.slug} value={p.slug}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* description */}
            <div>
              <label style={{ fontSize: 11, letterSpacing: 1, color: "#666", display: "block", marginBottom: 8 }}>description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                placeholder="tell people about this content..."
                rows={3}
                style={{ ...inputStyle, minHeight: 80, resize: "none" }}
              />
              <div style={{ fontSize: 10, color: "#444", textAlign: "right", marginTop: 4 }}>{description.length}/500</div>
            </div>

            {/* actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => { reset(); onClose(); }}
                style={{ fontSize: 14, color: "#666", background: "none", border: "none", cursor: "pointer" }}
              >
                cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={publishing}
                style={{
                  padding: "10px 32px",
                  borderRadius: 9999,
                  background: accent,
                  color: "#0A0A0A",
                  fontWeight: 600,
                  fontSize: 14,
                  border: "none",
                  cursor: publishing ? "wait" : "pointer",
                  opacity: publishing ? 0.7 : 1,
                  transition: "opacity 200ms",
                }}
              >
                {publishing ? "publishing..." : "publish"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContentUploadModal;
