import { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ZoomIn, RotateCw, Sparkles } from "lucide-react";

interface AvatarCropModalProps {
  open: boolean;
  imageSrc: string;
  onClose: () => void;
  onConfirm: (blob: Blob) => void;
}

const FILTERS = [
  { name: "none", label: "Original", css: "" },
  { name: "warm", label: "Warm", css: "sepia(0.25) saturate(1.3) brightness(1.05)" },
  { name: "cool", label: "Cool", css: "saturate(0.9) hue-rotate(15deg) brightness(1.05)" },
  { name: "vivid", label: "Vivid", css: "saturate(1.5) contrast(1.1)" },
  { name: "soft", label: "Soft", css: "brightness(1.1) contrast(0.9) saturate(0.9)" },
  { name: "bw", label: "B&W", css: "grayscale(1) contrast(1.1)" },
  { name: "vintage", label: "Vintage", css: "sepia(0.4) contrast(0.9) brightness(1.05)" },
];

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.crossOrigin = "anonymous";
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation: number,
  filter: string
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const size = Math.max(image.width, image.height);
  const safeArea = 2 * ((size / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  if (filter) {
    ctx.filter = filter;
  }

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  // Resize to 512x512 for consistent avatar size
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = 512;
  outputCanvas.height = 512;
  const outputCtx = outputCanvas.getContext("2d")!;
  outputCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, 512, 512);

  return new Promise((resolve) => {
    outputCanvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.9);
  });
}

const AvatarCropModal = ({ open, imageSrc, onClose, onConfirm }: AvatarCropModalProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("none");
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setSaving(true);
    try {
      const filterCss = FILTERS.find((f) => f.name === selectedFilter)?.css || "";
      const blob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation, filterCss);
      onConfirm(blob);
    } catch {
      setSaving(false);
    }
  };

  const activeFilter = FILTERS.find((f) => f.name === selectedFilter)?.css || "";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>edit profile photo</DialogTitle>
        </DialogHeader>

        {/* Crop area */}
        <div className="relative w-full aspect-square bg-black/90 overflow-hidden">
          <div style={{ filter: activeFilter }} className="absolute inset-0">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
        </div>

        {/* Controls */}
        <Tabs defaultValue="adjust" className="px-4 pt-2 pb-1">
          <TabsList className="w-full bg-muted">
            <TabsTrigger value="adjust" className="flex-1 gap-1.5 text-xs">
              <ZoomIn className="w-3.5 h-3.5" /> adjust
            </TabsTrigger>
            <TabsTrigger value="filters" className="flex-1 gap-1.5 text-xs">
              <Sparkles className="w-3.5 h-3.5" /> filters
            </TabsTrigger>
          </TabsList>

          <TabsContent value="adjust" className="space-y-3 mt-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5" /> zoom
              </label>
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.05}
                onValueChange={([v]) => setZoom(v)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5" /> rotate
              </label>
              <Slider
                value={[rotation]}
                min={0}
                max={360}
                step={1}
                onValueChange={([v]) => setRotation(v)}
              />
            </div>
          </TabsContent>

          <TabsContent value="filters" className="mt-3">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {FILTERS.map((f) => (
                <button
                  key={f.name}
                  onClick={() => setSelectedFilter(f.name)}
                  className={`flex-shrink-0 flex flex-col items-center gap-1 group`}
                >
                  <div
                    className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-colors ${
                      selectedFilter === f.name
                        ? "border-primary"
                        : "border-transparent group-hover:border-muted-foreground/30"
                    }`}
                  >
                    <img
                      src={imageSrc}
                      alt={f.label}
                      className="w-full h-full object-cover"
                      style={{ filter: f.css }}
                    />
                  </div>
                  <span
                    className={`text-[10px] ${
                      selectedFilter === f.name
                        ? "text-primary font-semibold"
                        : "text-muted-foreground"
                    }`}
                  >
                    {f.label.toLowerCase()}
                  </span>
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="px-4 pb-4 pt-2 flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={saving}>
            cancel
          </Button>
          <Button onClick={handleConfirm} className="flex-1" disabled={saving}>
            {saving ? "saving..." : "save photo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarCropModal;
