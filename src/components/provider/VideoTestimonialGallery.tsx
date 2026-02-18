import { useState, useRef, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Star, Play, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { ReviewData } from "@/components/reviews/ReviewCard";

interface VideoTestimonialGalleryProps {
  reviews: ReviewData[];
  /** When true, renders thumbnails inline without a header or scrollable wrapper — for side-by-side layout */
  compact?: boolean;
}

interface VideoReview {
  review: ReviewData;
  videoUrl: string;
}

const VideoPlayerModal = ({
  videoReviews,
  initialIndex,
  open,
  onClose,
}: {
  videoReviews: VideoReview[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}) => {
  const [index, setIndex] = useState(initialIndex);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setIndex(initialIndex);
  }, [initialIndex, open]);

  useEffect(() => {
    if (open && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [index, open]);

  const navigate = useCallback((dir: 1 | -1) => {
    setIndex((i) => {
      const next = i + dir;
      if (next < 0) return videoReviews.length - 1;
      if (next >= videoReviews.length) return 0;
      return next;
    });
  }, [videoReviews.length]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") navigate(-1);
      if (e.key === "ArrowRight" || e.key === "ArrowDown") navigate(1);
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, navigate, onClose]);

  if (!open || videoReviews.length === 0) return null;

  const current = videoReviews[index];
  const firstName = current.review.profile?.first_name || "Anonymous";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 bg-black border-none overflow-hidden [&>button]:hidden">
        <div className="relative aspect-[9/16] max-h-[85vh] flex items-center justify-center bg-black">
          <video
            ref={videoRef}
            src={current.videoUrl}
            className="w-full h-full object-cover"
            loop
            playsInline
            autoPlay
            controls={false}
            onClick={(e) => {
              const v = e.currentTarget;
              v.paused ? v.play() : v.pause();
            }}
          />

          {/* Overlay info at bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pb-6">
            <div className="flex items-center gap-1 mb-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`w-3.5 h-3.5 ${s <= current.review.rating ? "fill-[#50FF90] text-[#50FF90]" : "text-white/30"}`} />
              ))}
            </div>
            <p className="text-white font-bold text-sm">{firstName}</p>
            <p className="text-white/70 text-xs line-clamp-2 mt-1">{current.review.review_text}</p>
          </div>

          {/* Close button */}
          <button onClick={onClose} className="absolute top-3 right-3 z-10 text-white/70 hover:text-white bg-black/40 rounded-full p-1">
            <X className="w-5 h-5" />
          </button>

          {/* Navigation arrows */}
          {videoReviews.length > 1 && (
            <>
              <button onClick={() => navigate(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white bg-black/30 rounded-full p-1">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={() => navigate(1)} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white bg-black/30 rounded-full p-1">
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Counter */}
          {videoReviews.length > 1 && (
            <div className="absolute top-3 left-3 text-white/50 text-xs bg-black/40 rounded px-2 py-0.5">
              {index + 1} / {videoReviews.length}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const VideoTestimonialGallery = ({ reviews, compact = false }: VideoTestimonialGalleryProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const videoReviews: VideoReview[] = reviews
    .filter((r) => r.videos && r.videos.length > 0)
    .flatMap((r) => r.videos.map((url) => ({ review: r, videoUrl: url })));

  if (videoReviews.length === 0) return null;

  const thumbnails = videoReviews.map((vr, i) => (
    <button
      key={i}
      onClick={() => { setSelectedIndex(i); setModalOpen(true); }}
      className="shrink-0 w-[100px] aspect-[9/16] rounded-lg overflow-hidden bg-black border border-border/50 hover:ring-2 hover:ring-[#50FF90] transition-all relative group"
    >
      <video
        src={vr.videoUrl}
        className="w-full h-full object-cover"
        muted
        playsInline
        preload="metadata"
      />
      <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/20 transition-colors">
        <Play className="w-8 h-8 text-white drop-shadow-lg" />
      </div>
      <div className="absolute bottom-1 left-1 right-1">
        <p className="text-white text-[10px] font-semibold truncate drop-shadow">
          {vr.review.profile?.first_name || "Anonymous"}
        </p>
      </div>
    </button>
  ));

  if (compact) {
    return (
      <>
        <div className="flex gap-3 flex-wrap">
          {thumbnails}
        </div>
        <VideoPlayerModal
          videoReviews={videoReviews}
          initialIndex={selectedIndex}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold flex items-center gap-2">
        <Play className="w-5 h-5 text-[#50FF90]" /> Patient Videos
      </h3>
      <div className="overflow-x-auto">
        <div className="flex gap-3 pb-2">
          {thumbnails}
        </div>
      </div>

      <VideoPlayerModal
        videoReviews={videoReviews}
        initialIndex={selectedIndex}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
};

export default VideoTestimonialGallery;
