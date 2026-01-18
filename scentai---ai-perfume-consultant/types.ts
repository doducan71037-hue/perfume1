export interface Note {
  id: string;
  name: string;
  nameCn: string;
  position: 'top' | 'middle' | 'base';
  weight?: number;
}

export interface Accord {
  name: string;
  color?: string;
}

export interface AffiliateLink {
  id: string;
  platform: string;
  url: string;
  price: number;
  isAffiliate: boolean;
}

export interface Perfume {
  id: string;
  brand: string;
  name: string;
  year?: number;
  concentration?: string;
  gender?: string;
  priceRange?: string;
  description: string;
  notes: Note[];
  accords: string[];
  affiliateLinks?: AffiliateLink[];
  imageUrl?: string;
}

export interface PerfumeRecommendation extends Perfume {
  whatItSmellsLike: string;
  whatItDoesNotSmellLike: string;
  potentialIssues: string;
  suitableScenes: string;
  uncertaintyHints?: string;
  matchScore?: number;
}

export interface Report {
  conversationId: string;
  topRecommendations: PerfumeRecommendation[];
  alternatives: PerfumeRecommendation[];
  summary: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'report_link';
  reportId?: string;
  timestamp: number;
}

export interface SearchResult {
  perfumes: Perfume[];
}

export interface GlossaryItem {
  term: string;
  termCn: string;
  description: string;
  category: string;
}