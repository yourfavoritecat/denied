import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, X, UserPlus } from "lucide-react";

interface Props {
  userId: string;
  providerSlug: string;
  onComplete: () => void;
}

interface TeamMember {
  id?: string;
  name: string;
  role: string;
  headshot_url: string;
  bio: string;
  license_number: string;
  is_lead: boolean;
  headshotFile?: File | null;
}

const emptyMember = (isLead = false): TeamMember => ({
  name: "", role: isLead ? "Lead Doctor" : "", headshot_url: "", bio: "", license_number: "", is_lead: isLead, headshotFile: null,
});

const TeamStep = ({ userId, providerSlug, onComplete }: Props) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [members, setMembers] = useState<TeamMember[]>([emptyMember(true)]);

  useEffect(() => {
    supabase
      .from("provider_team_members" as any)
      .select("*")
      .eq("provider_slug", providerSlug)
      .order("sort_order")
      .then(({ data }) => {
        if (data && (data as any[]).length > 0) {
          setMembers((data as any[]).map((d: any) => ({
            id: d.id,
            name: d.name,
            role: d.role,
            headshot_url: d.headshot_url,
            bio: d.bio || "",
            license_number: d.license_number || "",
            is_lead: d.is_lead,
          })));
        }
      });
  }, [providerSlug]);

  const updateMember = (idx: number, field: string, value: any) => {
    setMembers((prev) => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  const addMember = () => {
    if (members.length >= 21) return;
    setMembers((prev) => [...prev, emptyMember()]);
  };

  const removeMember = (idx: number) => {
    if (members[idx].is_lead) return;
    setMembers((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadHeadshot = async (file: File, idx: number) => {
    const path = `${userId}/headshots/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("provider-onboarding").upload(path, file);
    if (error) return null;
    const { data } = supabase.storage.from("provider-onboarding").getPublicUrl(path);
    updateMember(idx, "headshot_url", data.publicUrl);
    return data.publicUrl;
  };

  const handleSave = async () => {
    const lead = members.find((m) => m.is_lead);
    if (!lead?.name || !lead?.role) {
      toast({ title: "Lead doctor/dentist name and title are required", variant: "destructive" });
      return;
    }

    // Upload pending headshots
    for (let i = 0; i < members.length; i++) {
      if (members[i].headshotFile) {
        const url = await uploadHeadshot(members[i].headshotFile!, i);
        if (url) members[i].headshot_url = url;
        members[i].headshotFile = null;
      }
    }

    const activeMems = members.filter((m) => m.name.trim());

    setSaving(true);

    // Delete existing, re-insert
    await supabase.from("provider_team_members" as any).delete().eq("provider_slug", providerSlug);

    const inserts = activeMems.map((m, i) => ({
      user_id: userId,
      provider_slug: providerSlug,
      name: m.name.trim(),
      role: m.role.trim(),
      headshot_url: m.headshot_url,
      bio: m.bio.trim() || null,
      license_number: m.license_number.trim() || null,
      is_lead: m.is_lead,
      sort_order: i,
    }));

    const { error } = await supabase.from("provider_team_members" as any).insert(inserts as any);

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Team saved!" });
      onComplete();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Members</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {members.map((member, idx) => (
          <div key={idx} className="border border-border/50 rounded-lg p-4 space-y-4 relative">
            {member.is_lead && (
              <span className="text-xs font-bold text-primary uppercase tracking-wide">Lead Practitioner</span>
            )}
            {!member.is_lead && (
              <button
                onClick={() => removeMember(idx)}
                className="absolute top-3 right-3 text-muted-foreground hover:text-destructive"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={member.name} onChange={(e) => updateMember(idx, "name", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Title / Role *</Label>
                <Input value={member.role} onChange={(e) => updateMember(idx, "role", e.target.value)} placeholder="e.g., Lead Dentist, Orthodontist" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>License Number</Label>
                <Input value={member.license_number} onChange={(e) => updateMember(idx, "license_number", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Headshot</Label>
                {member.headshot_url ? (
                  <div className="flex items-center gap-3">
                    <img src={member.headshot_url} alt="" className="w-12 h-12 rounded-full object-cover" />
                    <Button variant="outline" size="sm" onClick={() => updateMember(idx, "headshot_url", "")}>Change</Button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 px-4 py-2 rounded-md border border-dashed border-border cursor-pointer hover:border-primary transition-colors text-sm text-muted-foreground">
                    <Upload className="w-4 h-4" /> Upload headshot
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) updateMember(idx, "headshotFile", file);
                    }} />
                  </label>
                )}
                {member.headshotFile && (
                  <p className="text-xs text-muted-foreground">{member.headshotFile.name} (pending upload)</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Bio</Label>
              <Textarea value={member.bio} onChange={(e) => updateMember(idx, "bio", e.target.value)} rows={2} placeholder="Brief professional background..." />
            </div>
          </div>
        ))}

        {members.length < 21 && (
          <Button variant="outline" onClick={addMember} className="gap-2">
            <UserPlus className="w-4 h-4" /> Add Team Member
          </Button>
        )}

        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Save & Continue
        </Button>
      </CardContent>
    </Card>
  );
};

export default TeamStep;
