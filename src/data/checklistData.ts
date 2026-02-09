export interface ChecklistItem {
  id: string;
  label: string;
  category: "pre-trip" | "packing" | "post-procedure";
}

const DENTAL_PROCEDURES = [
  "dental crowns", "dental implants", "all-on-4", "veneers", "root canal",
  "cleaning", "whitening", "crowns", "dentures", "filling", "zirconia crown",
  "dental implant", "porcelain veneer", "veneer", "bone graft", "full denture",
  "cleaning & exam",
];

const COSMETIC_PROCEDURES = [
  "botox", "microneedling", "prp facial", "chemical peel", "liposuction",
  "rhinoplasty", "tummy tuck", "breast augmentation", "facelift",
];

export const getProcedureCategory = (procedures: { name: string }[]): "dental" | "cosmetic" | "mixed" => {
  const names = procedures.map((p) => p.name.toLowerCase());
  const hasDental = names.some((n) => DENTAL_PROCEDURES.some((d) => n.includes(d)));
  const hasCosmetic = names.some((n) => COSMETIC_PROCEDURES.some((c) => n.includes(c)));
  if (hasDental && hasCosmetic) return "mixed";
  if (hasCosmetic) return "cosmetic";
  return "dental";
};

export const getPreTripChecklist = (): ChecklistItem[] => [
  { id: "passport", label: "Valid passport (check expiration date — must be valid 6+ months)", category: "pre-trip" },
  { id: "travel-insurance", label: "Travel insurance purchased", category: "pre-trip" },
  { id: "xrays", label: "Dental X-rays / medical records sent to provider", category: "pre-trip" },
  { id: "medical-history", label: "Medical history shared with provider", category: "pre-trip" },
  { id: "prescriptions", label: "Prescriptions list prepared", category: "pre-trip" },
  { id: "comfortable-clothes", label: "Comfortable travel clothes packed", category: "pre-trip" },
  { id: "payment-confirmed", label: "Payment method confirmed (cards accepted, cash backup)", category: "pre-trip" },
  { id: "transportation", label: "Transportation arranged (airport transfer / border parking)", category: "pre-trip" },
  { id: "accommodation", label: "Hotel / recovery accommodation booked", category: "pre-trip" },
  { id: "emergency-contacts", label: "Emergency contacts saved in phone", category: "pre-trip" },
];

export const getPackingList = (category: "dental" | "cosmetic" | "mixed"): ChecklistItem[] => {
  const common: ChecklistItem[] = [
    { id: "pack-booking-confirmation", label: "Copies of booking confirmation (printed + digital)", category: "packing" },
    { id: "pack-passport", label: "Passport and travel documents", category: "packing" },
    { id: "pack-charger", label: "Phone charger and portable battery", category: "packing" },
    { id: "pack-comfortable-clothes", label: "Comfortable, loose-fitting clothes", category: "packing" },
    { id: "pack-medications", label: "Current medications in original bottles", category: "packing" },
    { id: "pack-insurance-card", label: "Insurance card and policy documents", category: "packing" },
  ];

  const dental: ChecklistItem[] = [
    { id: "pack-soft-foods", label: "Soft foods for recovery (protein shakes, applesauce, soup)", category: "packing" },
    { id: "pack-pain-meds", label: "Over-the-counter pain medication (Advil, Tylenol)", category: "packing" },
    { id: "pack-ice-pack", label: "Reusable ice pack for swelling", category: "packing" },
    { id: "pack-neck-pillow", label: "Neck pillow for comfortable travel", category: "packing" },
    { id: "pack-straw", label: "Straws for drinking (avoid after extractions — check with provider)", category: "packing" },
    { id: "pack-lip-balm", label: "Lip balm (lips get dry during procedures)", category: "packing" },
  ];

  const cosmetic: ChecklistItem[] = [
    { id: "pack-compression", label: "Compression garments (if recommended by surgeon)", category: "packing" },
    { id: "pack-arnica", label: "Arnica gel / tablets for bruising", category: "packing" },
    { id: "pack-prescribed-meds", label: "Prescribed medications from surgeon", category: "packing" },
    { id: "pack-loose-clothing", label: "Extra loose, button-up clothing (easy to put on)", category: "packing" },
    { id: "pack-spf", label: "SPF 50+ sunscreen (protect healing skin)", category: "packing" },
    { id: "pack-pillows", label: "Extra pillows for elevated sleeping", category: "packing" },
  ];

  if (category === "dental") return [...common, ...dental];
  if (category === "cosmetic") return [...common, ...cosmetic];
  return [...common, ...dental, ...cosmetic];
};

export const getPostProcedureChecklist = (category: "dental" | "cosmetic" | "mixed"): ChecklistItem[] => {
  const dental: ChecklistItem[] = [
    { id: "post-soft-diet", label: "Soft diet for 48 hours after procedure", category: "post-procedure" },
    { id: "post-no-hot", label: "Avoid hot beverages for 24 hours", category: "post-procedure" },
    { id: "post-antibiotics", label: "Take prescribed antibiotics as directed", category: "post-procedure" },
    { id: "post-followup", label: "Follow-up appointment scheduled with provider", category: "post-procedure" },
    { id: "post-no-fly-sedation", label: "Avoid flying for 24 hours after sedation", category: "post-procedure" },
    { id: "post-salt-rinse", label: "Saltwater rinse as directed by provider", category: "post-procedure" },
    { id: "post-avoid-alcohol", label: "Avoid alcohol for 48 hours", category: "post-procedure" },
    { id: "post-us-followup", label: "Schedule follow-up with US dentist within 2 weeks", category: "post-procedure" },
  ];

  const cosmetic: ChecklistItem[] = [
    { id: "post-compression-schedule", label: "Follow compression garment schedule", category: "post-procedure" },
    { id: "post-med-schedule", label: "Follow medication schedule exactly", category: "post-procedure" },
    { id: "post-cosmetic-followup", label: "Follow-up appointment scheduled", category: "post-procedure" },
    { id: "post-activity-restrictions", label: "Follow activity restrictions (no lifting, no bending)", category: "post-procedure" },
    { id: "post-when-to-call", label: "Know when to call the provider (fever, excessive swelling, bleeding)", category: "post-procedure" },
    { id: "post-photos", label: "Take daily recovery photos for your records", category: "post-procedure" },
    { id: "post-hydrate", label: "Stay hydrated — drink plenty of water", category: "post-procedure" },
    { id: "post-no-sun", label: "Avoid direct sun exposure on treated areas", category: "post-procedure" },
  ];

  if (category === "dental") return dental;
  if (category === "cosmetic") return cosmetic;
  return [...dental, ...cosmetic];
};
