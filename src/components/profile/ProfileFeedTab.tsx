import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Camera, Plus, X, Play, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface FeedPost {
  id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  created_at: string;
}

interface ProfileFeedTabProps {
  userId?: string; // If provided, viewing someone else's feed
  readOnly?: boolean;
}

const ProfileFeedTab = ({ userId, readOnly = false }: ProfileFeedTabProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [lightboxPost, setLightboxPost] = useState<FeedPost | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const targetUserId = userId || user?.id;

  const fetchPosts = async () => {
    if (!targetUserId) return;
    const { data } = await supabase
      .from("user_feed_posts" as any)
      .select("*")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false });
    setPosts((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [targetUserId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!user || files.length === 0) return;
    setUploading(true);

    for (const file of files) {
      const isVideo = file.type.startsWith("video/");
      const ext = file.name.split(".").pop() || "bin";
      const path = `${user.id}/feed/${Date.now()}-${crypto.randomUUID()}.${ext}`;

      const { error } = await supabase.storage.from("profile-media").upload(path, file, {
        contentType: file.type,
        cacheControl: "3600",
      });

      if (error) {
        toast({ title: `Failed to upload ${file.name}`, description: error.message, variant: "destructive" });
        continue;
      }

      const { data: urlData } = supabase.storage.from("profile-media").getPublicUrl(path);

      await supabase.from("user_feed_posts" as any).insert({
        user_id: user.id,
        media_url: urlData.publicUrl,
        media_type: isVideo ? "video" : "photo",
      } as any);
    }

    setUploading(false);
    toast({ title: "Photos added to your feed! 📸" });
    fetchPosts();
    e.target.value = "";
  };

  const handleDelete = async (postId: string) => {
    await supabase.from("user_feed_posts" as any).delete().eq("id", postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setLightboxPost(null);
    toast({ title: "Post removed" });
  };

  // Group posts into rows of 3 for the horizontal scroll grid
  const rows: FeedPost[][] = [];
  for (let i = 0; i < posts.length; i += 3) {
    rows.push(posts.slice(i, i + 3));
  }

  if (loading) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" />
          My Journey
        </h3>
        {!readOnly && (
          <label className="cursor-pointer">
            <Button size="sm" variant="outline" className="gap-1.5" asChild>
              <span>
                <Plus className="w-4 h-4" />
                {uploading ? "Uploading..." : "Add Photos/Videos"}
              </span>
            </Button>
            <input
              type="file"
              accept="image/*,video/*"
              multiple
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {posts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Camera className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">
              {readOnly ? "No posts yet" : "Document your journey!"}
            </p>
            {!readOnly && (
              <p className="text-sm text-muted-foreground mt-1">
                Upload photos and videos from your experiences
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div ref={scrollRef} className="overflow-x-auto pb-2 -mx-1">
          <div className="flex gap-1 px-1" style={{ width: `${Math.max(rows.length * 280, 100)}px` }}>
            {rows.map((row, colIdx) => (
              <div key={colIdx} className="flex flex-col gap-1 w-[270px] shrink-0">
                {row.map((post) => (
                  <button
                    key={post.id}
                    onClick={() => setLightboxPost(post)}
                    className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
                  >
                    {post.media_type === "video" ? (
                      <>
                        <video src={post.media_url} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Play className="w-8 h-8 text-white drop-shadow-lg" />
                        </div>
                      </>
                    ) : (
                      <img src={post.media_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={!!lightboxPost} onOpenChange={() => setLightboxPost(null)}>
        <DialogContent className="max-w-2xl p-0 bg-black/95 border-none">
          {lightboxPost && (
            <div className="relative">
              <button
                onClick={() => setLightboxPost(null)}
                className="absolute top-3 right-3 z-10 text-white/70 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
              {!readOnly && (
                <button
                  onClick={() => handleDelete(lightboxPost.id)}
                  className="absolute top-3 left-3 z-10 text-white/70 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              {lightboxPost.media_type === "video" ? (
                <video
                  src={lightboxPost.media_url}
                  controls
                  autoPlay
                  className="w-full max-h-[80vh] object-contain"
                />
              ) : (
                <img
                  src={lightboxPost.media_url}
                  alt=""
                  className="w-full max-h-[80vh] object-contain"
                />
              )}
              {lightboxPost.caption && (
                <p className="text-white/80 text-sm p-4">{lightboxPost.caption}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileFeedTab;
