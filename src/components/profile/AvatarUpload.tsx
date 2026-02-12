import { useState, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface AvatarUploadProps {
  size?: "sm" | "md" | "lg";
  onUploaded?: (url: string) => void;
}

const sizeClasses = {
  sm: "w-16 h-16 text-lg",
  md: "w-24 h-24 text-2xl",
  lg: "w-32 h-32 text-3xl",
};

const AvatarUpload = ({ size = "md", onUploaded }: AvatarUploadProps) => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const avatarUrl = profile?.avatar_url;
  const initials = profile
    ? `${(profile.first_name || "")[0] || ""}${(profile.last_name || "")[0] || ""}`.toUpperCase() || "U"
    : "U";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image too large", description: "Max 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/avatar/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from("profile-media").upload(path, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: true,
    });

    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("profile-media").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl } as any)
      .eq("user_id", user.id);

    await refreshProfile();
    onUploaded?.(publicUrl);
    toast({ title: "Profile photo updated! 📸" });
    setUploading(false);
  };

  return (
    <div className="relative group">
      <Avatar className={`${sizeClasses[size]} bg-primary text-primary-foreground`}>
        {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile" />}
        <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
      </Avatar>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center cursor-pointer"
      >
        <Camera className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
      {uploading && (
        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
        </div>
      )}
    </div>
  );
};

export default AvatarUpload;
