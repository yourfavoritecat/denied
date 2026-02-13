import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sparkles, Plane, Heart, X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const SKIN_TYPES = ["Oily", "Dry", "Combination", "Sensitive", "Normal"];
const HAIR_TYPES = ["Straight", "Wavy", "Curly", "Coily", "Thinning"];
const TRAVEL_STYLES = ["Budget-conscious", "Luxury traveler", "Solo adventurer", "With family", "With friends", "First-timer"];
const EMOJI_OPTIONS = [
  "✨","💖","🦷","💉","🌸","🌊","✈️","🏖️",
  "💅","👑","🔥","💫","🌺","🧖","💎","🪷",
  "😍","🥰","😎","🤩","💪","🙌","👏","🎉",
  "🌈","☀️","🌙","⭐","🍀","🦋","🐚","🌻",
  "❤️","🧡","💛","💚","💙","💜","🤍","🖤",
  "🍓","🍑","🥥","🍋","🌿","🌴","🏝️","🗺️",
  "💄","👄","💇","🩺","🏥","💊","🧴","🪥",
  "🎯","🚀","💡","🎨","📸","🎵","🧘","🏋️",
];

interface ProfileExtras {
  bio: string;
  hobbies: string[];
  fun_facts: string[];
  favorite_emoji: string;
  skin_type: string;
  hair_type: string;
  favorite_treatments: string[];
  beauty_goals: string;
  travel_style: string;
  favorite_destinations: string[];
  bucket_list_procedures: string[];
}

type SectionKey = "about" | "beauty" | "travel";

const defaultExtras: ProfileExtras = {
  bio: "",
  hobbies: [],
  fun_facts: [],
  favorite_emoji: "",
  skin_type: "",
  hair_type: "",
  favorite_treatments: [],
  beauty_goals: "",
  travel_style: "",
  favorite_destinations: [],
  bucket_list_procedures: [],
};





const TagInput = ({
  tags,
  onAdd,
  onRemove,
  placeholder,
  max = 10,
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder: string;
  max?: number;
}) => {
  const [input, setInput] = useState("");

  const handleAdd = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < max) {
      onAdd(trimmed);
      setInput("");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 pr-1">
            {tag}
            <button onClick={() => onRemove(tag)} className="hover:text-destructive">
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
      {tags.length < max && (
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
            className="flex-1"
          />
          <Button type="button" size="sm" variant="outline" onClick={handleAdd} disabled={!input.trim()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

const AboutMeTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [extras, setExtras] = useState<ProfileExtras>(defaultExtras);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("user_profile_extras" as any)
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) {
        const d = data as any;
        setExtras({
          bio: d.bio || "",
          hobbies: d.hobbies || [],
          fun_facts: d.fun_facts || [],
          favorite_emoji: d.favorite_emoji || "",
          skin_type: d.skin_type || "",
          hair_type: d.hair_type || "",
          favorite_treatments: d.favorite_treatments || [],
          beauty_goals: d.beauty_goals || "",
          travel_style: d.travel_style || "",
          favorite_destinations: d.favorite_destinations || [],
          bucket_list_procedures: d.bucket_list_procedures || [],
        });
        // public_fields no longer needed
      }
      setLoaded(true);
    };
    fetch();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const payload = {
      user_id: user.id,
      ...extras,
    };

    // Upsert
    const { data: existing } = await supabase
      .from("user_profile_extras" as any)
      .select("id")
      .eq("user_id", user.id)
      .single();

    let error;
    if (existing) {
      ({ error } = await supabase
        .from("user_profile_extras" as any)
        .update({ ...extras } as any)
        .eq("user_id", user.id));
    } else {
      ({ error } = await supabase
        .from("user_profile_extras" as any)
        .insert(payload as any));
    }

    setSaving(false);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "About Me updated! ✨" });
    }
  };

  const updateField = <K extends keyof ProfileExtras>(key: K, value: ProfileExtras[K]) => {
    setExtras((prev) => ({ ...prev, [key]: value }));
  };




  if (!loaded) {
    return <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Bio & Personality */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-destructive" />
              About Me
            </CardTitle>
            <CardDescription>Tell the community about yourself</CardDescription>
          </div>
          
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea
              value={extras.bio}
              onChange={(e) => updateField("bio", e.target.value)}
              placeholder="Hey! I'm into self-care, travel, and finding the best deals on dental work 😄"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">{extras.bio.length}/500</p>
          </div>

          <div className="space-y-2">
            <Label>Favorite Emoji</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-20 h-12 text-2xl text-center"
                >
                  {extras.favorite_emoji || "✨"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3 bg-popover z-[60]" align="start">
                <p className="text-xs text-muted-foreground mb-2">pick your favorite</p>
                <div className="grid grid-cols-8 gap-1">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => updateField("favorite_emoji", emoji)}
                      className={`w-8 h-8 rounded text-lg hover:bg-muted flex items-center justify-center transition-colors ${extras.favorite_emoji === emoji ? "bg-primary/20 ring-1 ring-primary" : ""}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Hobbies & Interests</Label>
            <TagInput
              tags={extras.hobbies}
              onAdd={(t) => updateField("hobbies", [...extras.hobbies, t])}
              onRemove={(t) => updateField("hobbies", extras.hobbies.filter((h) => h !== t))}
              placeholder="e.g. yoga, cooking, hiking..."
            />
          </div>

          <div className="space-y-2">
            <Label>Fun Facts About Me</Label>
            <TagInput
              tags={extras.fun_facts}
              onAdd={(t) => updateField("fun_facts", [...extras.fun_facts, t])}
              onRemove={(t) => updateField("fun_facts", extras.fun_facts.filter((h) => h !== t))}
              placeholder="e.g. I've visited 12 countries"
              max={5}
            />
          </div>
        </CardContent>
      </Card>

      {/* Beauty & Wellness */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-secondary" />
              Beauty & Wellness
            </CardTitle>
          </div>
          
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Skin Type</Label>
              <div className="flex flex-wrap gap-2">
                {SKIN_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateField("skin_type", extras.skin_type === type ? "" : type)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      extras.skin_type === type
                        ? "bg-secondary text-secondary-foreground border-secondary"
                        : "bg-transparent text-muted-foreground border-border hover:border-secondary"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Hair Type</Label>
              <div className="flex flex-wrap gap-2">
                {HAIR_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateField("hair_type", extras.hair_type === type ? "" : type)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      extras.hair_type === type
                        ? "bg-secondary text-secondary-foreground border-secondary"
                        : "bg-transparent text-muted-foreground border-border hover:border-secondary"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Favorite Treatments</Label>
            <TagInput
              tags={extras.favorite_treatments}
              onAdd={(t) => updateField("favorite_treatments", [...extras.favorite_treatments, t])}
              onRemove={(t) => updateField("favorite_treatments", extras.favorite_treatments.filter((h) => h !== t))}
              placeholder="e.g. teeth whitening, facials, botox..."
            />
          </div>

          <div className="space-y-2">
            <Label>Beauty Goals</Label>
            <Textarea
              value={extras.beauty_goals}
              onChange={(e) => updateField("beauty_goals", e.target.value)}
              placeholder="What are you working towards?"
              rows={2}
              maxLength={300}
            />
          </div>
        </CardContent>
      </Card>

      {/* Travel */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Plane className="w-5 h-5 text-primary" />
              Travel Personality
            </CardTitle>
          </div>
          
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Travel Style</Label>
            <div className="flex flex-wrap gap-2">
              {TRAVEL_STYLES.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => updateField("travel_style", extras.travel_style === style ? "" : style)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    extras.travel_style === style
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-transparent text-muted-foreground border-border hover:border-primary"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Favorite Destinations</Label>
            <TagInput
              tags={extras.favorite_destinations}
              onAdd={(t) => updateField("favorite_destinations", [...extras.favorite_destinations, t])}
              onRemove={(t) => updateField("favorite_destinations", extras.favorite_destinations.filter((h) => h !== t))}
              placeholder="e.g. Tijuana, Cancún, Istanbul..."
            />
          </div>

          <div className="space-y-2">
            <Label>Bucket List Procedures</Label>
            <TagInput
              tags={extras.bucket_list_procedures}
              onAdd={(t) => updateField("bucket_list_procedures", [...extras.bucket_list_procedures, t])}
              onRemove={(t) => updateField("bucket_list_procedures", extras.bucket_list_procedures.filter((h) => h !== t))}
              placeholder="e.g. veneers, rhinoplasty..."
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Saving..." : "Save About Me ✨"}
      </Button>
    </div>
  );
};

export default AboutMeTab;
