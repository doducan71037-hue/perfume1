import { Perfume, Report, GlossaryItem } from '../types';

export const MOCK_PERFUMES: Perfume[] = [
  {
    id: 'p1',
    brand: 'Creed',
    name: 'Aventus',
    year: 2010,
    concentration: 'EDP',
    gender: 'Male',
    priceRange: 'Luxury',
    description: 'A contemporary classic celebrating strength and vision. Features finest hand-selected ingredients.',
    notes: [
      { id: 'n1', name: 'Bergamot', nameCn: 'Bergamot', position: 'top' },
      { id: 'n2', name: 'Blackcurrant', nameCn: 'Blackcurrant', position: 'top' },
      { id: 'n3', name: 'Birch', nameCn: 'Birch', position: 'middle' },
      { id: 'n4', name: 'Musk', nameCn: 'Musk', position: 'base' },
    ],
    accords: ['Fruity', 'Smoky', 'Leather', 'Woody'],
    affiliateLinks: [
      { id: 'l1', platform: 'Official Boutique', url: '#', price: 435, isAffiliate: true },
      { id: 'l2', platform: 'Niche Beauty', url: '#', price: 425, isAffiliate: false },
    ],
    // High quality glass bottle on dark/neutral background
    imageUrl: 'https://images.unsplash.com/photo-1622359281358-132d75151e2b?q=80&w=1000&auto=format&fit=crop'
  },
  {
    id: 'p2',
    brand: 'Le Labo',
    name: 'Santal 33',
    year: 2011,
    concentration: 'EDP',
    gender: 'Unisex',
    priceRange: 'Niche',
    description: 'An icon of modern perfumery. A smoking wood alloy of cardamom, iris, violet, and ambrox.',
    notes: [
      { id: 'n5', name: 'Cardamom', nameCn: 'Cardamom', position: 'top' },
      { id: 'n6', name: 'Sandalwood', nameCn: 'Sandalwood', position: 'middle' },
      { id: 'n7', name: 'Cedar', nameCn: 'Cedar', position: 'base' },
      { id: 'n8', name: 'Leather', nameCn: 'Leather', position: 'base' },
    ],
    accords: ['Woody', 'Powdery', 'Leather', 'Warm Spicy'],
    imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea477942698?q=80&w=1000&auto=format&fit=crop'
  },
  {
    id: 'p3',
    brand: 'Maison Francis Kurkdjian',
    name: 'Baccarat Rouge 540',
    year: 2015,
    concentration: 'Extrait',
    gender: 'Unisex',
    priceRange: 'Luxury',
    description: 'Luminous and sophisticated. A poetic alchemy of amber, floral and woody notes.',
    notes: [
      { id: 'n9', name: 'Saffron', nameCn: 'Saffron', position: 'top' },
      { id: 'n10', name: 'Jasmine', nameCn: 'Jasmine', position: 'top' },
      { id: 'n11', name: 'Amberwood', nameCn: 'Amberwood', position: 'middle' },
      { id: 'n12', name: 'Fir Resin', nameCn: 'Fir Resin', position: 'base' },
    ],
    accords: ['Woody', 'Amber', 'Warm Spicy', 'Fresh Spicy'],
    imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1000&auto=format&fit=crop'
  }
];

export const MOCK_REPORT: Report = {
  conversationId: 'conv_123',
  summary: 'Analysis complete. Based on your preference for fresh, woody structures and professional settings, we recommend the following.',
  topRecommendations: [
    {
      ...MOCK_PERFUMES[0],
      whatItSmellsLike: 'Crisp pineapple opening settling into sophisticated smoky leather.',
      whatItDoesNotSmellLike: 'Cloying sugar or dated dusty woods.',
      potentialIssues: 'Highly recognizable scent profile.',
      suitableScenes: 'Executive meetings, formal events.',
      matchScore: 98
    },
    {
      ...MOCK_PERFUMES[1],
      whatItSmellsLike: 'Dry sandalwood, papyrus, and leather. Intellectual and cool.',
      whatItDoesNotSmellLike: 'Traditional florals.',
      potentialIssues: 'Sandalwood can vary by skin chemistry.',
      suitableScenes: 'Creative workspaces, gallery visits.',
      matchScore: 92
    }
  ],
  alternatives: [
    {
      ...MOCK_PERFUMES[2],
      whatItSmellsLike: 'Mineral warmth meeting airy sweetness.',
      whatItDoesNotSmellLike: 'Generic vanilla.',
      potentialIssues: 'Potent projection.',
      suitableScenes: 'Evening wear.',
      matchScore: 85
    }
  ]
};

export const MOCK_GLOSSARY: GlossaryItem[] = [
  { term: 'Sillage', termCn: 'Projection', description: 'The trail of scent left behind in the air.', category: 'Technical' },
  { term: 'Longevity', termCn: 'Duration', description: 'The duration a fragrance remains perceptible on skin.', category: 'Technical' },
  { term: 'Dry Down', termCn: 'Base Phase', description: 'The final phase of evaporation revealing base notes.', category: 'Technical' },
  { term: 'Chypre', termCn: 'Family', description: 'Characterized by citrus top notes and a mossy base.', category: 'Classification' },
  { term: 'Gourmand', termCn: 'Family', description: 'Fragrances with edible notes like vanilla or coffee.', category: 'Classification' },
];