import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Upload, X, FileText } from "lucide-react";
import { CREDENTIAL_TYPES } from "@/data/standardProcedures";

interface Props {
  userId: string;
  providerSlug: string;
  onComplete: () => void;
}

interface Credential {
  id?: string;
  credential_type: string;
  label: string;
  file_url: string;
  review_status: string;
  file?: File | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600",
  verified: "bg-secondary/10 text-secondary",
  rejected: "bg-destructive/10 text-destructive",
};

const CredentialsStep = ({ userId, providerSlug, onComplete }: Props) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [newType, setNewType] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);

  useEffect(() => {
    supabase
      .from("provider_credentials" as any)
      .select("*")
      .eq("provider_slug", providerSlug)
      .then(({ data }) => {
        if (data) setCredentials((data as any[]).map((d: any) => ({
          id: d.id,
          credential_type: d.credential_type,
          label: d.label,
          file_url: d.file_url,
          review_status: d.review_status,
        })));
      });
  }, [providerSlug]);

  const uploadFile = async (file: File): Promise<string | null> => {
    const path = `${userId}/credentials/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("provider-onboarding").upload(path, file);
    if (error) return null;
    const { data } = supabase.storage.from("provider-onboarding").getPublicUrl(path);
    return data.publicUrl;
  };

  const addCredential = async (): Promise<boolean> => {
    if (!newType || !newLabel || !newFile) {
      toast({ title: "Select type, label, and file", variant: "destructive" });
      return false;
    }
    if (newFile.size > 20 * 1024 * 1024) {
      toast({ title: "File must be under 20MB", variant: "destructive" });
      return false;
    }

    setSaving(true);
    const url = await uploadFile(newFile);
    if (!url) {
      toast({ title: "Upload failed", variant: "destructive" });
      setSaving(false);
      return false;
    }

    const { data, error } = await supabase.from("provider_credentials" as any).insert({
      user_id: userId,
      provider_slug: providerSlug,
      credential_type: newType,
      label: newLabel.trim(),
      file_url: url,
    } as any).select().single();

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return false;
    } else {
      setCredentials((prev) => [...prev, { ...(data as any), review_status: "pending" }]);
      setNewType(""); setNewLabel(""); setNewFile(null);
      toast({ title: "Credential uploaded!" });
      return true;
    }
  };

  const removeCredential = async (idx: number) => {
    const cred = credentials[idx];
    if (cred.id) {
      await supabase.from("provider_credentials" as any).delete().eq("id", cred.id);
    }
    setCredentials((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleComplete = async () => {
    // If user has filled in a credential but hasn't clicked upload, do it for them
    if (newType && newLabel && newFile) {
      const success = await addCredential();
      if (success) {
        onComplete();
      }
      return;
    }

    // Credentials are optional — allow continuing without any
    onComplete();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credentials & Licenses</CardTitle>
        <p className="text-sm text-muted-foreground">Upload licenses, certifications, and credentials to earn a "Verified" badge. This step is optional — you can add them later.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing credentials */}
        {credentials.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">{credentials.length} credential{credentials.length !== 1 ? "s" : ""} uploaded</p>
            {credentials.map((cred, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/50 bg-muted/30">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{cred.label}</p>
                    <p className="text-xs text-muted-foreground">{cred.credential_type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={statusColors[cred.review_status] || ""}>
                    {cred.review_status}
                  </Badge>
                  <button onClick={() => removeCredential(idx)} className="text-muted-foreground hover:text-destructive">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add new */}
        <div className="border border-dashed border-border rounded-lg p-4 space-y-4">
          <p className="font-medium text-sm">{credentials.length > 0 ? "Add Another Credential" : "Add Credential"}</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type <span className="text-destructive">*</span></Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {CREDENTIAL_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Label <span className="text-destructive">*</span></Label>
              <Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="e.g., Dr. Garcia's dental license" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>File <span className="text-destructive">*</span> <span className="text-muted-foreground font-normal">(PDF, JPG, PNG — max 20MB)</span></Label>
            {newFile ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="truncate">{newFile.name}</span>
                <button onClick={() => setNewFile(null)} className="text-destructive"><X className="w-3 h-3" /></button>
              </div>
            ) : (
              <label className="flex items-center gap-2 px-4 py-2 rounded-md border border-dashed border-border cursor-pointer hover:border-primary transition-colors text-sm text-muted-foreground">
                <Upload className="w-4 h-4" /> Choose file
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setNewFile(e.target.files?.[0] || null)} />
              </label>
            )}
          </div>
          {/* Add Another button - uploads and resets form for next credential */}
          <Button
            onClick={addCredential}
            disabled={saving || !newType || !newLabel || !newFile}
            variant="outline"
            className="w-full"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
            {credentials.length > 0 ? "Upload & Add Another" : "Upload Credential"}
          </Button>
        </div>

        <Button onClick={handleComplete} disabled={saving} className="w-full">
          {newFile && newType && newLabel ? "Upload & Continue" : credentials.length > 0 ? `Continue (${credentials.length} uploaded)` : "Skip for Now"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CredentialsStep;
