import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ScanLine, Keyboard, Search, CheckCircle2, AlertCircle, Clock, User, Calendar, Stethoscope, DollarSign, Camera, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Booking {
  id: string;
  booking_code: string | null;
  user_id: string;
  provider_slug: string;
  procedures: any;
  preferred_dates: any;
  provider_estimated_dates: string | null;
  quoted_price: number | null;
  status: string;
  booking_type: string;
  checked_in: boolean;
  checked_in_at: string | null;
  commission_rate: number;
  patient_name?: string;
}

type ScanMode = "manual" | "camera";
type ViewState = "lookup" | "confirm" | "success";

interface CheckInScannerProps {
  providerSlug: string;
}

const CheckInScanner = ({ providerSlug }: CheckInScannerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<ScanMode>("manual");
  const [view, setView] = useState<ViewState>("lookup");
  const [manualCode, setManualCode] = useState("");
  const [looking, setLooking] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmedProcedures, setConfirmedProcedures] = useState<any[]>([]);
  const [confirmedTotal, setConfirmedTotal] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const scannerRef = useRef<any>(null);
  const scannerDivId = "html5qr-scanner";

  // Camera scanner setup
  useEffect(() => {
    if (mode !== "camera" || view !== "lookup") return;

    let scanner: any = null;

    const initScanner = async () => {
      try {
        const { Html5QrcodeScanner } = await import("html5-qrcode");
        scanner = new Html5QrcodeScanner(
          scannerDivId,
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          false
        );
        scanner.render(
          (decodedText: string) => {
            handleCodeFound(decodedText.trim().toUpperCase());
            scanner.clear().catch(() => {});
          },
          () => {} // silence errors
        );
        scannerRef.current = scanner;
      } catch (e) {
        console.error("Scanner init failed", e);
      }
    };

    initScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [mode, view]);

  const handleCodeFound = async (code: string) => {
    if (!code) return;
    setLooking(true);
    setError(null);

    const { data, error: dbErr } = await supabase
      .from("bookings")
      .select("*")
      .eq("booking_code", code)
      .eq("provider_slug", providerSlug)
      .maybeSingle();

    setLooking(false);

    if (dbErr || !data) {
      setError("No booking found for this code. Check the code and try again.");
      return;
    }

    // Fetch patient name
    const { data: profile } = await supabase
      .from("profiles_public")
      .select("first_name, last_name")
      .eq("user_id", data.user_id)
      .maybeSingle();

    const enriched: Booking = {
      ...data,
      patient_name: profile
        ? [profile.first_name, profile.last_name].filter(Boolean).join(" ")
        : "Unknown Patient",
    };

    setBooking(enriched);

    const procs = Array.isArray(data.procedures) ? data.procedures : [];
    setConfirmedProcedures(procs.map((p: any) => ({ ...p, checked: true })));
    setConfirmedTotal(data.quoted_price?.toString() || "");
    setView("confirm");
  };

  const handleManualLookup = () => {
    const code = manualCode.trim().toUpperCase();
    if (!code) return;
    handleCodeFound(code);
  };

  const toggleProcedure = (idx: number) => {
    setConfirmedProcedures((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, checked: !p.checked } : p))
    );
  };

  const handleConfirmCheckIn = async () => {
    if (!booking || !user) return;
    setSubmitting(true);

    const total = parseFloat(confirmedTotal) || 0;
    const commissionAmt = Math.round(total * (booking.commission_rate || 0.15) * 100) / 100;
    const checkedProcs = confirmedProcedures.filter((p) => p.checked);

    // A) Update booking
    const { error: updateErr } = await supabase
      .from("bookings")
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
        checked_in_by: user.id,
        procedures_confirmed: checkedProcs as any,
        confirmed_total: total,
        commission_amount: commissionAmt,
        status: "completed",
      } as any)
      .eq("id", booking.id);

    if (updateErr) {
      toast({ title: "Error", description: updateErr.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // B) Insert commission invoice
    const { error: invoiceErr } = await supabase
      .from("commission_invoices")
      .insert({
        booking_id: booking.id,
        provider_slug: booking.provider_slug,
        procedure_total: total,
        commission_rate: booking.commission_rate || 0.15,
        commission_amount: commissionAmt,
        status: "pending",
      } as any);

    if (invoiceErr) {
      console.error("Commission invoice error:", invoiceErr);
      // Non-blocking — booking already updated
    }

    setSubmitting(false);

    // C) Success toast
    toast({
      title: "Patient checked in! ✓",
      description: `Booking #${booking.booking_code} confirmed. Commission: $${commissionAmt.toLocaleString()}`,
    });

    // D) Reset
    setView("success");
  };

  const handleReset = () => {
    setView("lookup");
    setBooking(null);
    setError(null);
    setManualCode("");
    setConfirmedProcedures([]);
    setConfirmedTotal("");
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // ── ALREADY CHECKED IN guard ──────────────────────────────────────────────
  if (view === "confirm" && booking?.checked_in) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-8 text-center space-y-2">
            <Clock className="w-12 h-12 text-amber-500 mx-auto" />
            <h3 className="font-bold text-lg">Already Checked In</h3>
            <p className="text-muted-foreground text-sm">
              This patient was checked in on {formatDate(booking.checked_in_at)}.
            </p>
            <Button variant="outline" onClick={handleReset} className="mt-4">Scan Another</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── CANCELLED guard ───────────────────────────────────────────────────────
  if (view === "confirm" && booking?.status === "cancelled") {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-8 text-center space-y-2">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h3 className="font-bold text-lg">Booking Cancelled</h3>
            <p className="text-muted-foreground text-sm">This booking has been cancelled and cannot be checked in.</p>
            <Button variant="outline" onClick={handleReset} className="mt-4">Scan Another</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── SUCCESS ───────────────────────────────────────────────────────────────
  if (view === "success") {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-12 text-center space-y-3">
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
            <h3 className="font-bold text-2xl">Check-In Complete</h3>
            <p className="text-muted-foreground">
              Booking <span className="font-mono font-bold text-foreground">#{booking?.booking_code}</span> has been confirmed.
            </p>
            <Button onClick={handleReset} className="mt-4">Check In Next Patient</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── CONFIRM SCREEN ────────────────────────────────────────────────────────
  if (view === "confirm" && booking) {
    const total = parseFloat(confirmedTotal) || 0;
    const commission = Math.round(total * (booking.commission_rate || 0.15) * 100) / 100;

    return (
      <div className="max-w-lg mx-auto space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleReset} className="gap-1 text-muted-foreground">
            <X className="w-4 h-4" /> Cancel
          </Button>
          <h2 className="font-bold text-xl flex-1 text-center">Confirm Check-In</h2>
        </div>

        {/* Patient info */}
        <Card>
          <CardContent className="py-4 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{booking.patient_name}</p>
                <p className="text-xs text-muted-foreground font-mono">{booking.booking_code}</p>
              </div>
              <Badge className="ml-auto capitalize" variant="outline">
                {booking.booking_type}
              </Badge>
            </div>
            <Separator />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                {booking.provider_estimated_dates ||
                  (booking.preferred_dates as any)?.text ||
                  "No date set"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Procedures checklist */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Stethoscope className="w-4 h-4" /> Procedures Performed
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {confirmedProcedures.length === 0 ? (
              <p className="text-sm text-muted-foreground">No procedures listed</p>
            ) : (
              confirmedProcedures.map((proc, idx) => (
                <div key={idx} className="flex items-center gap-3 py-1">
                  <Checkbox
                    id={`proc-${idx}`}
                    checked={proc.checked}
                    onCheckedChange={() => toggleProcedure(idx)}
                  />
                  <label htmlFor={`proc-${idx}`} className="text-sm cursor-pointer flex-1">
                    {proc.name}
                    {proc.quantity > 1 && (
                      <span className="text-muted-foreground ml-1">×{proc.quantity}</span>
                    )}
                  </label>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Total amount */}
        <Card>
          <CardContent className="py-4 space-y-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Confirmed Total ($)
              </Label>
              <Input
                type="number"
                value={confirmedTotal}
                onChange={(e) => setConfirmedTotal(e.target.value)}
                placeholder="Enter total amount"
              />
            </div>
            {total > 0 && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Procedure total</span>
                  <span className="font-medium">${total.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Commission ({Math.round((booking.commission_rate || 0.15) * 100)}%)
                  </span>
                  <span className="font-bold text-primary">${commission.toLocaleString()}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          className="w-full gap-2"
          size="lg"
          onClick={handleConfirmCheckIn}
          disabled={submitting || !confirmedTotal}
        >
          <CheckCircle2 className="w-5 h-5" />
          {submitting ? "Confirming..." : "Confirm Check-In"}
        </Button>
      </div>
    );
  }

  // ── LOOKUP SCREEN ─────────────────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Check In Patient</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Scan the patient's booking pass QR code or enter the booking code manually.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <Button
          variant={mode === "manual" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("manual")}
          className="gap-2"
        >
          <Keyboard className="w-4 h-4" /> Manual Entry
        </Button>
        <Button
          variant={mode === "camera" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("camera")}
          className="gap-2"
        >
          <Camera className="w-4 h-4" /> Camera Scan
        </Button>
      </div>

      {/* Manual entry */}
      {mode === "manual" && (
        <Card>
          <CardContent className="py-6 space-y-4">
            <div className="space-y-2">
              <Label>Booking Code</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="DC-4X7R"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleManualLookup()}
                  className="font-mono tracking-widest text-lg"
                  maxLength={7}
                />
                <Button onClick={handleManualLookup} disabled={looking || !manualCode.trim()} className="gap-2">
                  <Search className="w-4 h-4" />
                  {looking ? "Looking up..." : "Look Up"}
                </Button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Camera scanner */}
      {mode === "camera" && (
        <Card>
          <CardContent className="py-4 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ScanLine className="w-4 h-4" />
              <span>Point camera at the QR code on the patient's booking pass</span>
            </div>
            <div id={scannerDivId} className="rounded-lg overflow-hidden" />
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick tips */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground font-medium mb-2 uppercase tracking-wide">Tips</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Booking codes are in the format <span className="font-mono text-foreground">DC-XXXX</span></li>
            <li>• The QR code is on the patient's digital booking pass</li>
            <li>• Camera scanner requires permission to access your device's camera</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default CheckInScanner;
