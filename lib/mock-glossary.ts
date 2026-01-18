export interface GlossaryItem {
  term: string;
  termCn: string;
  description: string;
  category: string;
}

export const MOCK_GLOSSARY: GlossaryItem[] = [
  {
    term: "Sillage",
    termCn: "Projection",
    description: "The trail of scent left behind in the air.",
    category: "Technical",
  },
  {
    term: "Longevity",
    termCn: "Duration",
    description: "The duration a fragrance remains perceptible on skin.",
    category: "Technical",
  },
  {
    term: "Dry Down",
    termCn: "Base Phase",
    description: "The final phase of evaporation revealing base notes.",
    category: "Technical",
  },
  {
    term: "Chypre",
    termCn: "Family",
    description: "Characterized by citrus top notes and a mossy base.",
    category: "Classification",
  },
  {
    term: "Gourmand",
    termCn: "Family",
    description: "Fragrances with edible notes like vanilla or coffee.",
    category: "Classification",
  },
];
