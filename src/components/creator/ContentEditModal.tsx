import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onClose: () => void;
  item: any;
  accent: string;
  rgb: string;
  onSuccess: () => void;
}

const ContentEditModal = ({ open, onClose, item, accent, rgb, onSuccess }: Props) => {
  const { toast } = useToast();
  const [thumbPreview, setThumbPreview] = useState<string | null>(item?.thumbnail_url || null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState(item?.url || "");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isVideo = item?.media_type === "video";

  const handleThumbSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbFile(file);
    setThumbPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let newThumbUrl = item.thumbnail_url;

      if (thumbFile) {
        const ext = thumbFile.name.split(".").pop();
        const path = `${item.creator_id}/${Date.now()}_thumb.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("creator-content")
          .upload(path, thumbFile, { upsert: true });
        if (upErr) throw upErr;
        const { data: pubData } = supabase.storage.from("creator-content").getPublicUrl(path);
        newThumbUrl = pubData.publicUrl;
      }

      const updates: any = { thumbnail_url: newThumbUrl };
      if (isVideo) updates.url = videoUrl.trim();

      const { error } = await supabase
        .from("creator_content")
        .update(updates)
        .eq("id", item.id);
      if (error) throw error;

      toast({ title: "content updated!" });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({ title: "error saving", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.from("creator_content").delete().eq("id", item.id);
      if (error) throw error;
      toast({ title: "content deleted" });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({ title: "error deleting", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        className="p-0 border-0"
        style={{
          background: "#111111",
          borderRadius: 20,
          border: "1px solid rgba(255,107,74,0.08)",
          maxWidth: 480,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 28 }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: 18, fontWeight: 700, color: "#fff", textTransform: "lowercase" as const }}>
              edit content
            </DialogTitle>
          </DialogHeader>

          {/* thumbnail preview */}
          <div style={{ marginTop: 20 }}>
            <div
              style={{
                width: "100%", maxWidth: 200, height: 140, borderRadius: 12,
                overflow: "hidden", background: "#0A0A0A", marginBottom: 10,
              }}
            >
              {thumbPreview ? (
                <img src={thumbPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#333" }}>
                  no thumbnail
                </div>
              )}
            </div>
            <label
              style={{
                display: "inline-block", padding: "6px 16px", borderRadius: 999,
                background: "#222", color: "#999", fontSize: 12, cursor: "pointer",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              update thumbnail
              <input type="file" accept="image/*" onChange={handleThumbSelect} className="hidden" />
            </label>
          </div>

          {/* video link */}
          {isVideo && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>video link</div>
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: accent, textDecoration: "underline", display: "block", marginBottom: 8, wordBreak: "break-all" as const }}
                >
                  {item.url}
                </a>
              )}
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="paste video link"
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 12,
                  background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.08)",
                  color: "#fff", fontSize: 14, outline: "none",
                }}
              />
            </div>
          )}

          {/* action buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 28 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "10px 32px", borderRadius: 999,
                background: accent, color: "#0A0A0A", fontWeight: 600,
                fontSize: 14, border: "none", cursor: "pointer", opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "saving..." : "save changes"}
            </button>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", color: "#666", fontSize: 14, cursor: "pointer" }}
            >
              cancel
            </button>
          </div>

          {/* delete */}
          <div style={{ marginTop: 24, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 16 }}>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                style={{ background: "none", border: "none", color: "#FF6B4A", fontSize: 13, cursor: "pointer" }}
              >
                delete this content
              </button>
            ) : (
              <div>
                <div style={{ fontSize: 13, color: "#999", marginBottom: 10 }}>
                  are you sure? this can't be undone
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{
                      padding: "8px 20px", borderRadius: 999,
                      background: "#FF6B4A", color: "#fff", fontWeight: 600,
                      fontSize: 13, border: "none", cursor: "pointer", opacity: deleting ? 0.6 : 1,
                    }}
                  >
                    {deleting ? "deleting..." : "yes, delete"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    style={{ background: "none", border: "none", color: "#666", fontSize: 13, cursor: "pointer" }}
                  >
                    cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContentEditModal;
