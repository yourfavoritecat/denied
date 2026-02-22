export interface CoverOption {
  id: string;
  label: string;
  url: string;
}

export const COVER_OPTIONS: CoverOption[] = [
  { id: "black-green-stars", label: "Stars", url: "/covers/black-green-stars.jpg" },
  { id: "bubble-plaid-3-colors", label: "Plaid", url: "/covers/bubble-plaid-3-colors.jpg" },
  { id: "bubble-stripes-horizontal", label: "Stripes", url: "/covers/bubble-stripes-horizontal.jpg" },
  { id: "dog-heart-pattern", label: "Dogs & Hearts", url: "/covers/dog-heart-pattern.jpg" },
  { id: "dog-stripes", label: "Dog Stripes", url: "/covers/dog-stripes.jpg" },
  { id: "heart-peach-green", label: "Hearts", url: "/covers/heart-peach-green.jpg" },
  { id: "lightning-dog-pattern", label: "Lightning Bolts", url: "/covers/lightning-dog-pattern.jpg" },
  { id: "dark-plaid", label: "Dark Plaid", url: "/covers/dark-plaid.jpg" },
  { id: "peach-green-plaid-squares", label: "Plaid Squares", url: "/covers/peach-green-plaid-squares.jpg" },
  { id: "vertical-stripes", label: "Vertical Stripes", url: "/covers/vertical-stripes.jpg" },
];

export const DEFAULT_COVER_URL = COVER_OPTIONS[0].url;
