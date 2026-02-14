/**
 * @deprecated The `providers` array below is no longer used by any page.
 * Search.tsx and ProviderProfile.tsx now fetch all provider data from the database.
 * This file is kept temporarily for reference. The `providers` array can be safely
 * deleted once confirmed that no other component references it.
 *
 * Still-active exports (used by other pages):
 *   - US_PRICE_MAP — US price benchmarks for savings calculations
 *   - REVIEW_CATEGORIES — category rating labels
 *   - procedureTypes — filter option list for Search page
 *   - locations — filter option list for Search page
 *   - Provider interface — type definition
 */

import clinicDental from "@/assets/clinic-dental.jpg";
import clinicMedspa from "@/assets/clinic-medspa.jpg";
import clinicSurgery from "@/assets/clinic-surgery.jpg";

export interface Procedure {
  name: string;
  priceRange: string;
  usPrice: number;
  savings: number;
  duration: string;
}

export interface Review {
  name: string;
  initials: string;
  location: string;
  rating: number;
  date: string;
  procedure: string;
  text: string;
}

export interface Provider {
  slug: string;
  name: string;
  city: string;
  rating: number;
  reviews: number;
  startingPrice: number;
  verified: boolean;
  verificationTier?: "listed" | "verified" | "premium";
  specialties: string[];
  languages: string[];
  description: string;
  procedures: Procedure[];
  reviewsList: Review[];
  ratingBreakdown: number[]; // 5-star to 1-star counts
  photos?: string[];
}

export const REVIEW_CATEGORIES = [
  { key: "rating_cleanliness", label: "Facility Cleanliness" },
  { key: "rating_communication", label: "Communication" },
  { key: "rating_wait_time", label: "Wait Time & Punctuality" },
  { key: "rating_outcome", label: "Procedure Outcome" },
  { key: "rating_safety", label: "Safety & Comfort" },
  { key: "rating_value", label: "Value for Price" },
] as const;

// US average prices WITHOUT insurance — weighted toward CA, AZ, TX border states (2025-2026 data)
export const US_PRICE_MAP: Record<string, number> = {
  "Teeth Cleaning": 175,
  "Filling (per surface)": 300,
  "Extraction (regular)": 325,
  "Wisdom Tooth Extraction": 650,
  "Bone Graft": 1200,
  "Complete Acrylic Dentures (set)": 1800,
  "Complete Comfort Dentures (set)": 3200,
  "Removable Partial Plate": 1100,
  "Cast Metal Removable Partial Plate": 1200,
  "Porcelain Fused-to-Metal Crown": 1200,
  "Metal-Free Crown": 1400,
  "Zirconia Crown": 1500,
  "Gold Crown or Gold Porcelain Crown": 1900,
  "Root Canal (regular)": 1100,
  "Core Build-up": 350,
  "Pre-fabricated Post": 325,
  "Implant": 4500,
  // Legacy / common names
  "Root Canal": 1100,
  "Dental Implant": 4500,
  "Dental Implant (single)": 4500,
  "Night Guard": 500,
  "Teeth Whitening": 450,
  "Veneers": 1800,
  "Porcelain Veneer": 1800,
  "Dentures": 1800,
  "Free Consultation": 250,
  "All-on-4": 25000,
  "All-on-6": 30000,
};

export const providers: Provider[] = [
  {
    slug: "washington-dental-tijuana",
    name: "Washington Dental Clinic",
    city: "Tijuana",
    rating: 4.8,
    reviews: 1,
    startingPrice: 50,
    verified: false,
    verificationTier: "listed",
    specialties: ["Dental Implants", "Zirconia Crowns", "Full Mouth Rehabilitation", "Root Canals", "Cosmetic Dentistry"],
    languages: ["English", "Spanish"],
    description: "For over 30 years, Washington Dental Clinic has been providing high-quality dental care to patients from across the US. With 8 licensed dentists — 6 of whom specialize in implants and root canals — we deliver comprehensive dental care at 50-70% less than US prices. Over 90% of our patients travel from the United States. We are a walk-in clinic with no appointment necessary, and most dental work can be completed in one or two visits. All work comes with a 2-year guarantee.",
    procedures: [
      { name: "Zirconia Crown", priceRange: "$350", usPrice: 1500, savings: 77, duration: "2–3 days" },
      { name: "Root Canal", priceRange: "$250", usPrice: 1100, savings: 77, duration: "1–2 hours" },
      { name: "Dental Implant", priceRange: "$1,200", usPrice: 4500, savings: 73, duration: "3–6 months" },
      { name: "Night Guard", priceRange: "$150", usPrice: 500, savings: 70, duration: "1–2 days" },
      { name: "Teeth Whitening", priceRange: "$150", usPrice: 450, savings: 67, duration: "1 hour" },
      { name: "Veneers", priceRange: "$450", usPrice: 1800, savings: 75, duration: "2–3 days" },
      { name: "Wisdom Tooth Extraction", priceRange: "$150", usPrice: 650, savings: 77, duration: "1 hour" },
      { name: "Dentures", priceRange: "$400", usPrice: 1800, savings: 78, duration: "3–5 days" },
      { name: "Teeth Cleaning", priceRange: "$50", usPrice: 175, savings: 71, duration: "1 hour" },
      { name: "Free Consultation", priceRange: "FREE", usPrice: 250, savings: 100, duration: "30 min" },
    ],
    reviewsList: [],
    ratingBreakdown: [1, 0, 0, 0, 0],
    photos: [clinicDental, clinicSurgery, clinicMedspa],
  },
];

export const specialties = [
  "Dental Implants",
  "Zirconia Crowns",
  "Full Mouth Rehabilitation",
  "Root Canals",
  "Cosmetic Dentistry",
];

export const procedureTypes = [
  "Dental Implants",
  "Zirconia Crowns",
  "Veneers",
  "Root Canal",
  "All-on-4",
  "All-on-6",
  "Dentures",
  "Teeth Whitening",
  "Cleaning",
  "Extraction",
  "Botox",
  "Microneedling",
  "Chemical Peel",
  "Liposuction",
  "Rhinoplasty",
  "Tummy Tuck",
];

export const locations = [
  "Tijuana",
];
