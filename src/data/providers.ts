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
}

export const REVIEW_CATEGORIES = [
  { key: "rating_cleanliness", label: "Facility Cleanliness" },
  { key: "rating_communication", label: "Communication" },
  { key: "rating_wait_time", label: "Wait Time & Punctuality" },
  { key: "rating_outcome", label: "Procedure Outcome" },
  { key: "rating_safety", label: "Safety & Comfort" },
  { key: "rating_value", label: "Value for Price" },
] as const;

export const US_PRICE_MAP: Record<string, number> = {
  "Teeth Cleaning": 90,
  "Filling (per surface)": 100,
  "Extraction (regular)": 150,
  "Wisdom Tooth Extraction": 475,
  "Bone Graft": 1125,
  "Complete Acrylic Dentures (set)": 1400,
  "Complete Comfort Dentures (set)": 2750,
  "Removable Partial Plate": 900,
  "Cast Metal Removable Partial Plate": 975,
  "Porcelain Fused-to-Metal Crown": 750,
  "Metal-Free Crown": 1125,
  "Zirconia Crown": 1125,
  "Gold Crown or Gold Porcelain Crown": 1400,
  "Root Canal (regular)": 750,
  "Core Build-up": 250,
  "Pre-fabricated Post": 250,
  "Implant": 4500,
  // Legacy names for other providers
  "Root Canal": 750,
  "Dental Implant": 4500,
  "Night Guard": 500,
  "Teeth Whitening": 500,
  "Veneers": 2000,
  "Dentures": 1800,
  "Free Consultation": 225,
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
      { name: "Root Canal", priceRange: "$250", usPrice: 1800, savings: 86, duration: "1–2 hours" },
      { name: "Dental Implant", priceRange: "$1,200", usPrice: 4000, savings: 70, duration: "3–6 months" },
      { name: "Night Guard", priceRange: "$150", usPrice: 500, savings: 70, duration: "1–2 days" },
      { name: "Teeth Whitening", priceRange: "$150", usPrice: 500, savings: 70, duration: "1 hour" },
      { name: "Veneers", priceRange: "$450", usPrice: 2000, savings: 78, duration: "2–3 days" },
      { name: "Wisdom Tooth Extraction", priceRange: "$150", usPrice: 600, savings: 75, duration: "1 hour" },
      { name: "Dentures", priceRange: "$400", usPrice: 1800, savings: 78, duration: "3–5 days" },
      { name: "Teeth Cleaning", priceRange: "$50", usPrice: 200, savings: 75, duration: "1 hour" },
      { name: "Free Consultation", priceRange: "FREE", usPrice: 225, savings: 100, duration: "30 min" },
    ],
    reviewsList: [],
    ratingBreakdown: [1, 0, 0, 0, 0],
  },
  {
    slug: "dental-excellence-tijuana",
    name: "Dental Excellence Tijuana",
    city: "Tijuana",
    rating: 4.9,
    reviews: 342,
    startingPrice: 350,
    verified: true,
    specialties: ["Dental Implants", "Zirconia Crowns", "Veneers"],
    languages: ["English", "Spanish"],
    description: "Founded in 2008, Dental Excellence Tijuana is one of Mexico's premier dental clinics. Located just 20 minutes from the San Ysidro border crossing, we specialize in full-mouth restorations, implants, and cosmetic dentistry. Our team of ADA-trained specialists uses cutting-edge CAD/CAM technology and only FDA-approved materials. Over 15,000 patients served from the U.S. and Canada.",
    procedures: [
      { name: "Zirconia Crown", priceRange: "$350–$450", usPrice: 1500, savings: 77, duration: "2–3 days" },
      { name: "Dental Implant (single)", priceRange: "$1,100–$1,400", usPrice: 4500, savings: 73, duration: "3–6 months" },
      { name: "All-on-4", priceRange: "$7,500–$9,500", usPrice: 25000, savings: 66, duration: "3–5 days" },
      { name: "Porcelain Veneer", priceRange: "$380–$500", usPrice: 2000, savings: 78, duration: "2–3 days" },
      { name: "Root Canal", priceRange: "$280–$400", usPrice: 1800, savings: 81, duration: "1–2 hours" },
    ],
    reviewsList: [
      { name: "Michael R.", initials: "MR", location: "Phoenix, AZ", rating: 5, date: "2025-11-15", procedure: "All-on-4", text: "Saved $18,000 on my All-on-4 implants. The clinic was world-class — better than any dentist I've been to in the States." },
      { name: "Linda P.", initials: "LP", location: "Los Angeles, CA", rating: 5, date: "2025-10-22", procedure: "Veneers", text: "Got 8 veneers done in 3 days. The results are absolutely stunning. Staff was incredibly caring." },
      { name: "David K.", initials: "DK", location: "Tucson, AZ", rating: 4, date: "2025-09-08", procedure: "Dental Implant", text: "Great experience overall. The implant procedure was smooth and the follow-up care was excellent." },
    ],
    ratingBreakdown: [290, 38, 10, 3, 1],
  },
  {
    slug: "cancun-smile-center",
    name: "Cancún Smile Center",
    city: "Cancun",
    rating: 4.8,
    reviews: 218,
    startingPrice: 400,
    verified: true,
    specialties: ["All-on-4", "Root Canal", "Dental Implants"],
    languages: ["English", "Spanish"],
    description: "Cancún Smile Center combines top-tier dental care with the beauty of the Caribbean. Our bilingual team offers everything from routine cleanings to complex full-mouth rehabilitations. We coordinate hotel stays, transportation, and aftercare so you can focus on healing — and maybe a day at the beach.",
    procedures: [
      { name: "Zirconia Crown", priceRange: "$400–$500", usPrice: 1500, savings: 73, duration: "2–3 days" },
      { name: "Dental Implant (single)", priceRange: "$1,200–$1,600", usPrice: 4500, savings: 71, duration: "3–6 months" },
      { name: "All-on-4", priceRange: "$8,000–$10,000", usPrice: 25000, savings: 64, duration: "4–5 days" },
      { name: "Root Canal", priceRange: "$300–$450", usPrice: 1800, savings: 79, duration: "1–2 hours" },
    ],
    reviewsList: [
      { name: "Sarah K.", initials: "SK", location: "San Diego, CA", rating: 5, date: "2025-12-01", procedure: "Crowns", text: "The whole experience was seamless. From airport pickup to my hotel to the clinic — they handled everything." },
      { name: "Robert M.", initials: "RM", location: "Dallas, TX", rating: 5, date: "2025-11-18", procedure: "All-on-4", text: "Best decision I ever made. The quality of care rivaled top U.S. clinics at a fraction of the cost." },
    ],
    ratingBreakdown: [178, 28, 8, 3, 1],
  },
  {
    slug: "los-algodones-dental-group",
    name: "Los Algodones Dental Group",
    city: "Los Algodones",
    rating: 4.9,
    reviews: 489,
    startingPrice: 250,
    verified: true,
    specialties: ["Crowns", "Dentures", "Cleaning"],
    languages: ["English", "Spanish"],
    description: "Located in 'Molar City' — the dental capital of the world — Los Algodones Dental Group has been serving cross-border patients for over 20 years. Walk across the border from Yuma, AZ and get same-day crowns, dentures, and cleanings at unbeatable prices.",
    procedures: [
      { name: "Zirconia Crown", priceRange: "$250–$350", usPrice: 1500, savings: 80, duration: "Same day" },
      { name: "Full Denture Set", priceRange: "$600–$900", usPrice: 3500, savings: 79, duration: "2–3 days" },
      { name: "Cleaning & Exam", priceRange: "$40–$60", usPrice: 300, savings: 83, duration: "1 hour" },
      { name: "Whitening", priceRange: "$150–$250", usPrice: 800, savings: 75, duration: "1 hour" },
    ],
    reviewsList: [
      { name: "James T.", initials: "JT", location: "Houston, TX", rating: 5, date: "2025-10-10", procedure: "Root Canal + Crown", text: "My insurance wanted $8,000. I paid $700 in Mexico. Never going back to US dental care." },
      { name: "Patricia W.", initials: "PW", location: "Yuma, AZ", rating: 5, date: "2025-09-15", procedure: "Dentures", text: "I've been coming here for 10 years. The quality is consistent and the prices can't be beat." },
      { name: "Tom H.", initials: "TH", location: "Portland, OR", rating: 4, date: "2025-08-20", procedure: "Crowns", text: "Got 4 crowns done in one day. Incredible efficiency and great results." },
    ],
    ratingBreakdown: [420, 50, 14, 4, 1],
  },
  {
    slug: "cdmx-dental-institute",
    name: "CDMX Dental Institute",
    city: "Mexico City",
    rating: 4.7,
    reviews: 156,
    startingPrice: 300,
    verified: true,
    specialties: ["Dental Implants", "Oral Surgery", "Veneers"],
    languages: ["English", "Spanish"],
    description: "CDMX Dental Institute is a state-of-the-art facility in the heart of Mexico City's Polanco district. Our board-certified surgeons specialize in complex implant cases and full-mouth reconstructions using the latest 3D imaging and guided surgery technology.",
    procedures: [
      { name: "Dental Implant (single)", priceRange: "$1,000–$1,300", usPrice: 4500, savings: 74, duration: "3–6 months" },
      { name: "Zirconia Crown", priceRange: "$300–$420", usPrice: 1500, savings: 76, duration: "2–3 days" },
      { name: "Porcelain Veneer", priceRange: "$350–$480", usPrice: 2000, savings: 79, duration: "2–3 days" },
      { name: "Bone Graft", priceRange: "$400–$600", usPrice: 2000, savings: 75, duration: "1–2 hours" },
    ],
    reviewsList: [
      { name: "Ana G.", initials: "AG", location: "Chicago, IL", rating: 5, date: "2025-11-05", procedure: "Implants", text: "Dr. Ramirez and his team were phenomenal. The facility is modern and spotless." },
      { name: "Mark S.", initials: "MS", location: "Denver, CO", rating: 4, date: "2025-10-01", procedure: "Veneers", text: "Really happy with my veneers. Plus I got to explore Mexico City — amazing food and culture." },
    ],
    ratingBreakdown: [112, 30, 10, 3, 1],
  },
  {
    slug: "pvr-aesthetics-clinic",
    name: "PVR Aesthetics & MedSpa",
    city: "Puerto Vallarta",
    rating: 4.8,
    reviews: 197,
    startingPrice: 180,
    verified: true,
    specialties: ["Botox", "Chemical Peel", "Microneedling"],
    languages: ["English", "Spanish"],
    description: "PVR Aesthetics is Puerto Vallarta's leading medical spa, offering injectable treatments, skin rejuvenation, and non-surgical body contouring. Recover beachside with our VIP concierge package that includes luxury resort stays.",
    procedures: [
      { name: "Botox (per area)", priceRange: "$180–$250", usPrice: 600, savings: 65, duration: "30 min" },
      { name: "Microneedling", priceRange: "$150–$220", usPrice: 700, savings: 74, duration: "45 min" },
      { name: "PRP Facial", priceRange: "$200–$300", usPrice: 900, savings: 72, duration: "1 hour" },
      { name: "Chemical Peel", priceRange: "$120–$200", usPrice: 500, savings: 68, duration: "30 min" },
    ],
    reviewsList: [
      { name: "Jessica L.", initials: "JL", location: "Austin, TX", rating: 5, date: "2025-12-10", procedure: "Botox + PRP", text: "Felt like a vacation AND a glow-up. The clinic is gorgeous and the staff is so welcoming." },
      { name: "Karen D.", initials: "KD", location: "Seattle, WA", rating: 5, date: "2025-11-22", procedure: "Microneedling", text: "My skin has never looked better. And I saved hundreds compared to Seattle prices." },
    ],
    ratingBreakdown: [162, 25, 7, 2, 1],
  },
  {
    slug: "guadalajara-plastic-surgery",
    name: "Guadalajara Plastic Surgery Center",
    city: "Guadalajara",
    rating: 4.7,
    reviews: 134,
    startingPrice: 2800,
    verified: true,
    specialties: ["Rhinoplasty", "Liposuction", "Tummy Tuck"],
    languages: ["English", "Spanish"],
    description: "One of western Mexico's most respected plastic surgery centers. Our team of board-certified surgeons performs over 500 procedures annually in our AAAHC-accredited surgical facility. Full recovery suites and 24/7 nursing care included.",
    procedures: [
      { name: "Rhinoplasty", priceRange: "$2,800–$4,000", usPrice: 12000, savings: 72, duration: "2–3 hours" },
      { name: "Liposuction", priceRange: "$2,500–$4,500", usPrice: 10000, savings: 68, duration: "2–4 hours" },
      { name: "Tummy Tuck", priceRange: "$3,500–$5,500", usPrice: 12000, savings: 67, duration: "3–5 hours" },
      { name: "Breast Augmentation", priceRange: "$3,000–$4,500", usPrice: 10000, savings: 65, duration: "2–3 hours" },
    ],
    reviewsList: [
      { name: "Maria S.", initials: "MS", location: "Miami, FL", rating: 5, date: "2025-10-30", procedure: "Rhinoplasty", text: "Dr. Gutierrez is an artist. I couldn't be happier with my results." },
      { name: "Chris B.", initials: "CB", location: "Atlanta, GA", rating: 4, date: "2025-09-20", procedure: "Liposuction", text: "Professional from start to finish. Recovery house was comfortable and staff was attentive." },
    ],
    ratingBreakdown: [98, 24, 8, 3, 1],
  },
  {
    slug: "merida-dental-care",
    name: "Mérida Dental Care",
    city: "Merida",
    rating: 4.8,
    reviews: 203,
    startingPrice: 280,
    verified: true,
    specialties: ["Dental Implants", "Crowns", "Whitening"],
    languages: ["English", "Spanish"],
    description: "In the cultural heart of the Yucatán, Mérida Dental Care offers world-class dentistry in a warm, colonial-city setting. We specialize in implant dentistry and cosmetic procedures, with a dedicated patient coordinator for U.S. and Canadian visitors.",
    procedures: [
      { name: "Dental Implant (single)", priceRange: "$1,000–$1,350", usPrice: 4500, savings: 74, duration: "3–6 months" },
      { name: "Zirconia Crown", priceRange: "$280–$380", usPrice: 1500, savings: 78, duration: "2–3 days" },
      { name: "Whitening", priceRange: "$180–$250", usPrice: 800, savings: 73, duration: "1 hour" },
      { name: "Veneer", priceRange: "$350–$480", usPrice: 2000, savings: 79, duration: "2–3 days" },
    ],
    reviewsList: [
      { name: "Steve R.", initials: "SR", location: "Nashville, TN", rating: 5, date: "2025-11-28", procedure: "Implants", text: "Mérida is beautiful and the dental care was top-notch. Highly recommend." },
      { name: "Diane F.", initials: "DF", location: "Minneapolis, MN", rating: 5, date: "2025-10-15", procedure: "Crowns", text: "Got 6 crowns in 3 days. Perfect fit, beautiful color match. Saved over $7,000." },
    ],
    ratingBreakdown: [170, 22, 8, 2, 1],
  },
  {
    slug: "rosarito-beach-dental",
    name: "Rosarito Beach Dental Studio",
    city: "Rosarito",
    rating: 4.6,
    reviews: 98,
    startingPrice: 300,
    verified: true,
    specialties: ["Crowns", "Root Canal", "Cleaning"],
    languages: ["English", "Spanish"],
    description: "A boutique dental studio steps from the beach in Rosarito. We focus on restorative and preventive care with a personal touch. Small team, big results — and you can hear the waves from our treatment chairs.",
    procedures: [
      { name: "Zirconia Crown", priceRange: "$300–$400", usPrice: 1500, savings: 76, duration: "2 days" },
      { name: "Root Canal", priceRange: "$250–$380", usPrice: 1800, savings: 82, duration: "1–2 hours" },
      { name: "Cleaning & Exam", priceRange: "$45–$65", usPrice: 300, savings: 82, duration: "1 hour" },
      { name: "Filling (composite)", priceRange: "$60–$100", usPrice: 350, savings: 77, duration: "30 min" },
    ],
    reviewsList: [
      { name: "Nancy V.", initials: "NV", location: "San Diego, CA", rating: 5, date: "2025-12-05", procedure: "Crowns", text: "Charming little clinic with amazing skill. Dr. Luna made me feel so comfortable." },
      { name: "Greg P.", initials: "GP", location: "Las Vegas, NV", rating: 4, date: "2025-11-10", procedure: "Root Canal", text: "Painless root canal and crown for under $600. Can't beat that." },
    ],
    ratingBreakdown: [72, 16, 6, 3, 1],
  },
  {
    slug: "cancun-cosmetic-surgery",
    name: "Cancún Cosmetic Surgery Institute",
    city: "Cancun",
    rating: 4.7,
    reviews: 167,
    startingPrice: 2500,
    verified: true,
    specialties: ["Liposuction", "Tummy Tuck", "Botox"],
    languages: ["English", "Spanish"],
    description: "Premier cosmetic surgery destination in Cancún's Hotel Zone. Our ISAPS-certified surgeons perform body contouring, facial rejuvenation, and non-invasive treatments in a JCI-accredited facility. Recovery villas and private nursing available.",
    procedures: [
      { name: "Liposuction", priceRange: "$2,500–$4,000", usPrice: 10000, savings: 70, duration: "2–4 hours" },
      { name: "Tummy Tuck", priceRange: "$3,200–$5,000", usPrice: 12000, savings: 69, duration: "3–5 hours" },
      { name: "Botox (per area)", priceRange: "$160–$230", usPrice: 600, savings: 68, duration: "30 min" },
      { name: "Facelift", priceRange: "$4,000–$6,500", usPrice: 18000, savings: 72, duration: "4–6 hours" },
    ],
    reviewsList: [
      { name: "Tina M.", initials: "TM", location: "New York, NY", rating: 5, date: "2025-11-01", procedure: "Tummy Tuck", text: "The recovery villa was incredible. Felt pampered the entire time. Results speak for themselves." },
      { name: "Rachel E.", initials: "RE", location: "Boston, MA", rating: 4, date: "2025-10-18", procedure: "Lipo", text: "Smooth process from consultation to recovery. Very happy with the contouring results." },
    ],
    ratingBreakdown: [128, 26, 9, 3, 1],
  },
  {
    slug: "tijuana-medspa-aesthetics",
    name: "TJ MedSpa & Aesthetics",
    city: "Tijuana",
    rating: 4.6,
    reviews: 112,
    startingPrice: 120,
    verified: true,
    specialties: ["Botox", "PRP Facial", "Chemical Peel"],
    languages: ["English", "Spanish"],
    description: "TJ MedSpa brings affordable luxury aesthetics to Tijuana. Walk across the border and enjoy medical-grade facials, injectables, and skin treatments at prices that'll make your Sephora budget blush. Same products, same training — 70% less.",
    procedures: [
      { name: "Botox (per area)", priceRange: "$120–$200", usPrice: 600, savings: 73, duration: "30 min" },
      { name: "PRP Facial", priceRange: "$180–$280", usPrice: 900, savings: 74, duration: "1 hour" },
      { name: "Chemical Peel", priceRange: "$100–$180", usPrice: 500, savings: 72, duration: "30 min" },
      { name: "Microneedling", priceRange: "$130–$200", usPrice: 700, savings: 76, duration: "45 min" },
    ],
    reviewsList: [
      { name: "Amber C.", initials: "AC", location: "San Diego, CA", rating: 5, date: "2025-12-12", procedure: "PRP + Microneedling", text: "I go monthly now. It's so close to the border and the results are amazing." },
      { name: "Lisa W.", initials: "LW", location: "Phoenix, AZ", rating: 4, date: "2025-11-06", procedure: "Botox", text: "Quick, professional, and affordable. My go-to for injectables now." },
    ],
    ratingBreakdown: [82, 20, 6, 3, 1],
  },
];

export const procedureTypes = [
  "Dental Crowns",
  "Dental Implants",
  "All-on-4",
  "Veneers",
  "Root Canal",
  "Cleaning",
  "Whitening",
  "Botox",
  "Microneedling",
  "PRP Facial",
  "Chemical Peel",
  "Liposuction",
  "Rhinoplasty",
  "Tummy Tuck",
];

export const locations = [
  "Tijuana",
  "Rosarito",
  "Los Algodones",
  "Cancun",
  "Puerto Vallarta",
  "Mexico City",
  "Guadalajara",
  "Merida",
];
