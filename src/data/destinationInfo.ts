export interface DestinationInfo {
  city: string;
  borderCrossing: string | null;
  currency: string;
  emergencyContacts: { label: string; value: string }[];
  pharmacyGuide: string;
  tips: string[];
}

export const destinationData: Record<string, DestinationInfo> = {
  Tijuana: {
    city: "Tijuana",
    borderCrossing:
      "Cross at San Ysidro — the world's busiest land border crossing. Bring your passport (REAL ID not accepted for land crossings). Pedestrian crossing takes 15–30 min southbound, 1–3 hours returning. SENTRI lane available for pre-approved travelers. Consider parking at Las Americas Premium Outlets ($8–12/day) or use the Cross Border Xpress (CBX) if flying. Uber and taxi service widely available on the Mexican side.",
    currency:
      "Mexico uses Mexican pesos (MXN). Most dental and medical clinics accept USD and all major credit cards. ATMs are widely available — Banorte, BBVA, and Santander offer good rates. Tip: Withdraw pesos from ATMs for street food and taxis. Avoid airport exchange booths.",
    emergencyContacts: [
      { label: "Mexico Emergency (Police/Fire/Ambulance)", value: "911" },
      { label: "Cruz Roja (Red Cross) Tijuana", value: "+52 664 621 7787" },
      { label: "US Consulate Tijuana", value: "+52 664 977 2000" },
      { label: "Tourist Assistance Hotline", value: "078" },
    ],
    pharmacyGuide:
      "Many medications available over-the-counter in Mexico require prescriptions in the US, including antibiotics, muscle relaxants, and some pain medications. Major pharmacy chains: Farmacias Similares (affordable generics), Farmacia Guadalajara, and Benavides. Pharmacies near the border zone in Zona Río are accustomed to serving US patients. Bring a list of medications you want to purchase. Note: Controlled substances (opioids, benzodiazepines) still require a Mexican prescription.",
    tips: [
      "The Zona Río area is the safest and most clinic-dense neighborhood",
      "Uber works in Tijuana and accepts US payment methods",
      "Most clinics offer free shuttle service from the border",
    ],
  },
  Cancun: {
    city: "Cancún",
    borderCrossing: null,
    currency:
      "Mexico uses Mexican pesos (MXN). The Hotel Zone is very tourist-friendly — USD accepted almost everywhere, but you'll get better rates paying in pesos. ATMs are abundant in the Hotel Zone and downtown. Major banks: HSBC, Banamex, Santander. Credit cards widely accepted. Avoid exchanging money at the airport.",
    emergencyContacts: [
      { label: "Mexico Emergency", value: "911" },
      { label: "Cruz Roja Cancún", value: "+52 998 884 1616" },
      { label: "US Consulate Mérida (serves Cancún)", value: "+52 999 942 5700" },
      { label: "Tourist Police Cancún", value: "+52 998 885 2277" },
      { label: "Tourist Assistance Hotline", value: "078" },
    ],
    pharmacyGuide:
      "Farmacias Similares, Farmacia Guadalajara, and Farmacias del Ahorro are the major chains. Many have locations in the Hotel Zone and downtown. Antibiotics, anti-inflammatories, and many other medications are available without a prescription. Pharmacies often have a doctor on-site for consultations ($2–5 USD). Controlled substances require a Mexican prescription.",
    tips: [
      "Many clinics offer airport pickup and hotel coordination",
      "The Hotel Zone is safe and walkable with great recovery amenities",
      "ADO buses connect the airport to downtown affordably",
    ],
  },
  "Mexico City": {
    city: "Mexico City",
    borderCrossing: null,
    currency:
      "Mexico uses Mexican pesos (MXN). Mexico City is a major metropolis — credit cards and digital payments are widely accepted. ATMs are everywhere (use bank-attached ATMs for safety). Polanco, Roma, and Condesa neighborhoods are the most tourist-friendly. Uber and DiDi are reliable and affordable. Most clinics in Polanco accept USD and cards.",
    emergencyContacts: [
      { label: "Mexico Emergency", value: "911" },
      { label: "Cruz Roja CDMX", value: "+52 55 5557 5757" },
      { label: "US Embassy Mexico City", value: "+52 55 5080 2000" },
      { label: "LOCATEL (City info/emergencies)", value: "+52 55 5658 1111" },
      { label: "Tourist Assistance Hotline", value: "078" },
    ],
    pharmacyGuide:
      "Mexico City has pharmacies on nearly every block. Major chains: Farmacias Similares (budget-friendly generics), Farmacia San Pablo (well-stocked, upscale), Farmacia Guadalajara, and Farmacias del Ahorro. Many medications available OTC. Polanco and Roma neighborhoods have pharmacies accustomed to serving international patients.",
    tips: [
      "Polanco is the premier medical district with world-class clinics",
      "Altitude is 7,350 ft — stay hydrated and take it easy on arrival",
      "Uber is the safest and most reliable transportation option",
    ],
  },
  Guadalajara: {
    city: "Guadalajara",
    borderCrossing: null,
    currency:
      "Mexico uses Mexican pesos (MXN). Guadalajara is Mexico's second-largest city with a modern banking infrastructure. Credit cards are accepted at most businesses. ATMs from BBVA, Banorte, and Scotiabank are reliable. The Providencia and Zapopan areas are the most developed for international visitors.",
    emergencyContacts: [
      { label: "Mexico Emergency", value: "911" },
      { label: "Cruz Roja Guadalajara", value: "+52 33 3614 5600" },
      { label: "US Consulate Guadalajara", value: "+52 33 3268 2100" },
      { label: "Tourist Assistance Hotline", value: "078" },
    ],
    pharmacyGuide:
      "Farmacia Guadalajara (headquartered here — largest chain in western Mexico), Farmacias Similares, and Farmacias Benavides are everywhere. Many pharmacies have attached doctors' offices for quick consultations. OTC medications are widely available. The Providencia neighborhood has upscale pharmacies with bilingual staff.",
    tips: [
      "Providencia and Zapopan are the best neighborhoods for clinics",
      "The climate is mild year-round — great for recovery",
      "Guadalajara's international airport (GDL) has direct US flights",
    ],
  },
  Merida: {
    city: "Mérida",
    borderCrossing: null,
    currency:
      "Mexico uses Mexican pesos (MXN). Mérida is a smaller, safer city with a growing expat community. Credit cards accepted at most clinics and restaurants. ATMs available at major banks (Banorte, BBVA, Banamex). The historic centro and northern neighborhoods (Montejo, Altabrisa) are the main commercial areas.",
    emergencyContacts: [
      { label: "Mexico Emergency", value: "911" },
      { label: "Cruz Roja Mérida", value: "+52 999 924 9813" },
      { label: "US Consulate Mérida", value: "+52 999 942 5700" },
      { label: "Tourist Assistance Hotline", value: "078" },
    ],
    pharmacyGuide:
      "Farmacias Similares, Farmacias Yza (regional chain, very popular in the Yucatán), and Farmacia Guadalajara are the main options. Mérida has a large expat community, so many pharmacists are accustomed to English-speaking customers. OTC antibiotics and pain medications are readily available.",
    tips: [
      "Mérida is consistently rated one of Mexico's safest cities",
      "The city has a large American and Canadian expat community",
      "Cenotes and Mayan ruins make for great recovery-day excursions",
    ],
  },
  "Puerto Vallarta": {
    city: "Puerto Vallarta",
    borderCrossing: null,
    currency:
      "Mexico uses Mexican pesos (MXN). Puerto Vallarta's tourist zone (Zona Romántica, Marina Vallarta, Hotel Zone) is very USD-friendly. Most clinics, restaurants, and shops accept US dollars and credit cards. ATMs are plentiful along the Malecón and in major shopping centers.",
    emergencyContacts: [
      { label: "Mexico Emergency", value: "911" },
      { label: "Cruz Roja Puerto Vallarta", value: "+52 322 222 1533" },
      { label: "US Consular Agency PV", value: "+52 322 222 0069" },
      { label: "Tourist Assistance Hotline", value: "078" },
    ],
    pharmacyGuide:
      "CMQ Pharmacy (hospital-attached, well-stocked), Farmacias Similares, Farmacia Guadalajara, and Farmacias del Ahorro are the main chains. The Zona Romántica has several pharmacies with bilingual staff. Many medications available without prescription. The CMQ hospital also has an on-site pharmacy for post-procedure needs.",
    tips: [
      "Zona Romántica is the most walkable and tourist-friendly area",
      "Beach recovery is a real perk — many clinics offer resort packages",
      "Direct flights from most major US cities to PVR airport",
    ],
  },
  "Los Algodones": {
    city: "Los Algodones",
    borderCrossing:
      "Cross at the Andrade/Los Algodones port of entry from Yuma, AZ (or Winterhaven, CA). It's a small, walkable border town — the entire dental district is within 4 blocks of the crossing. Pedestrian crossing takes 5–15 min southbound, 30 min–2 hours returning (longer on weekends in winter). Free parking available on the US side at the Quechan Casino. Passport required. No SENTRI lane — but the crossing is small and manageable.",
    currency:
      "US dollars are accepted everywhere in Los Algodones — it's essentially a dental tourism town. Most prices are quoted in USD. Credit cards accepted at most clinics. ATMs available but not as numerous. Tip: Bring cash for street vendors, pharmacies, and opticians. Pesos are accepted but not necessary.",
    emergencyContacts: [
      { label: "Mexico Emergency", value: "911" },
      { label: "Cruz Roja Mexicali (nearest)", value: "+52 686 552 0606" },
      { label: "US Consulate Tijuana (serves region)", value: "+52 664 977 2000" },
      { label: "Tourist Assistance Hotline", value: "078" },
    ],
    pharmacyGuide:
      "Los Algodones is famous for its pharmacies — there are dozens within the 4-block town center. Medications are significantly cheaper than the US, and many are available without a prescription. Popular purchases include antibiotics, blood pressure medications, and pain relievers. Prices are often negotiable. Farmacias ABC and several independent pharmacies are well-established.",
    tips: [
      "Known as 'Molar City' — the dental capital of the world",
      "The entire town is walkable — no transportation needed",
      "Winter months (Nov–Mar) are peak season with longer wait times at the border",
    ],
  },
};

// Map city names to handle variations
export const getCityInfo = (destination: string): DestinationInfo | null => {
  // Direct match
  if (destinationData[destination]) return destinationData[destination];
  // Case-insensitive search
  const key = Object.keys(destinationData).find(
    (k) => k.toLowerCase() === destination.toLowerCase()
  );
  return key ? destinationData[key] : null;
};
