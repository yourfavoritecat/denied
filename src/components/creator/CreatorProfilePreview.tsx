import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Instagram, Globe } from "lucide-react";

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

interface ThemeConfig {
  accent: string;
  accentRgb: string;
}

const ACCENT_THEMES: Record<string, ThemeConfig> = {
  mint: { accent: '#3BF07A', accentRgb: '59,240,122' },
  coral: { accent: '#FF6B4A', accentRgb: '255,107,74' },
  lavender: { accent: '#C4A8FF', accentRgb: '196,168,255' },
  gold: { accent: '#FFD700', accentRgb: '255,215,0' },
  ice: { accent: '#7DF9FF', accentRgb: '125,249,255' },
};

interface PreviewProps {
  displayName: string;
  handle: string;
  bio: string;
  avatarUrl: string | null;
  specialties: string[];
  socialLinks: Record<string, string>;
  accentTheme: string;
  isPublished: boolean;
}

const CreatorProfilePreview = ({
  displayName, handle, bio, avatarUrl, specialties, socialLinks, accentTheme, isPublished,
}: PreviewProps) => {
  const theme = ACCENT_THEMES[accentTheme] || ACCENT_THEMES.mint;
  const accent = theme.accent;
  const rgb = theme.accentRgb;

  const hasSocials = socialLinks.instagram || socialLinks.tiktok || socialLinks.youtube || socialLinks.twitter || socialLinks.website;

  return (
    <div className="w-full rounded-xl overflow-hidden" style={{ background: '#0A0A0A' }}>
      {/* Hero area */}
      <div className="relative h-24" style={{ background: `linear-gradient(135deg, rgba(${rgb},0.15) 0%, rgba(${rgb},0.05) 100%)` }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 50%, #0A0A0A 100%)' }} />
      </div>

      <div className="px-5 pb-5 -mt-8 relative">
        {/* Avatar */}
        <Avatar className="w-16 h-16 mb-3" style={{ border: `2px solid ${accent}`, boxShadow: `0 0 0 2px #0A0A0A` }}>
          {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />}
          <AvatarFallback style={{ background: `rgba(${rgb},0.15)`, color: accent }} className="text-xl font-bold">
            {displayName?.[0]?.toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>

        {/* Identity */}
        <h2 className="text-lg font-bold text-white leading-tight">{displayName || "your name"}</h2>
        <p className="text-xs mb-3" style={{ color: '#B0B0B0' }}>@{handle || "handle"}</p>

        {/* Bio */}
        {bio && (
          <p className="text-sm leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.7)' }}>
            {bio}
          </p>
        )}

        {/* Specialties */}
        {specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {specialties.map((s) => (
              <span key={s} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: `rgba(${rgb},0.1)`,
                  border: `1px solid rgba(${rgb},0.25)`,
                  color: accent,
                }}>
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Social icons */}
        {hasSocials && (
          <div className="flex items-center gap-1.5 mb-3">
            {socialLinks.instagram && (
              <div className="p-1.5 rounded-full" style={{ background: `rgba(${rgb},0.12)`, color: accent }}>
                <Instagram className="w-3 h-3" />
              </div>
            )}
            {socialLinks.tiktok && (
              <div className="p-1.5 rounded-full" style={{ background: `rgba(${rgb},0.12)`, color: accent }}>
                <TikTokIcon className="w-3 h-3" />
              </div>
            )}
            {socialLinks.youtube && (
              <div className="p-1.5 rounded-full" style={{ background: `rgba(${rgb},0.12)`, color: accent }}>
                <YouTubeIcon className="w-3 h-3" />
              </div>
            )}
            {socialLinks.twitter && (
              <div className="p-1.5 rounded-full" style={{ background: `rgba(${rgb},0.12)`, color: accent }}>
                <TwitterIcon className="w-3 h-3" />
              </div>
            )}
            {socialLinks.website && (
              <div className="p-1.5 rounded-full" style={{ background: `rgba(${rgb},0.12)`, color: accent }}>
                <Globe className="w-3 h-3" />
              </div>
            )}
          </div>
        )}

        {/* Status */}
        <div className="mt-2 pt-3" style={{ borderTop: `1px solid rgba(${rgb},0.1)` }}>
          {isPublished ? (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: accent }} />
              <span className="text-[10px]" style={{ color: accent }}>page is live</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#B0B0B0' }} />
              <span className="text-[10px]" style={{ color: '#B0B0B0' }}>page is hidden</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { ACCENT_THEMES };
export default CreatorProfilePreview;
