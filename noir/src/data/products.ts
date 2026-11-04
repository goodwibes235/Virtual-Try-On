import { Product } from '@/types';

export const products: Product[] = [
  {
    id: 'obsidian-oversized-tee',
    slug: 'obsidian-oversized-tee',
    name: 'Obsidian Oversized Tee',
    subtitle: 'Premium Heavyweight Cotton',
    price: 120,
    description:
      'Cut from 300GSM organic cotton with dropped shoulders and an oversized silhouette. The Obsidian Tee redefines casual luxury with its architectural drape and lived-in comfort.',
    category: 'T-Shirts',
    fit: 'oversized',
    colors: [
      { name: 'Black', hex: '#111111', image: '/products/obsidian-black.jpg' },
      { name: 'Charcoal', hex: '#333333', image: '/products/obsidian-charcoal.jpg' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    garmentAsset: '/garments/black-tshirt.png',
    featured: true,
  },
  {
    id: 'ivory-essential-tee',
    slug: 'ivory-essential-tee',
    name: 'Ivory Essential Tee',
    subtitle: 'Japanese Cotton Blend',
    price: 95,
    description:
      'The perfect white tee, elevated. Crafted from a Japanese cotton-modal blend with a clean regular fit. Designed to become your most worn piece.',
    category: 'T-Shirts',
    fit: 'regular',
    colors: [
      { name: 'White', hex: '#F5F3EF', image: '/products/ivory-white.jpg' },
      { name: 'Cream', hex: '#E8E4DD', image: '/products/ivory-cream.jpg' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    garmentAsset: '/garments/white-tshirt.png',
    featured: false,
  },
  {
    id: 'midnight-polo',
    slug: 'midnight-polo',
    name: 'Midnight Polo',
    subtitle: 'Technical Knit Construction',
    price: 145,
    description:
      'A polo shirt reimagined for the modern wardrobe. Constructed from technical knit fabric with a hidden button placket and tailored proportions.',
    category: 'Polos',
    fit: 'slim',
    colors: [
      { name: 'Navy', hex: '#1B2A4A', image: '/products/midnight-navy.jpg' },
      { name: 'Midnight', hex: '#0D1117', image: '/products/midnight-dark.jpg' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    garmentAsset: '/garments/navy-polo.png',
    featured: true,
  },
  {
    id: 'shadow-minimal-tee',
    slug: 'shadow-minimal-tee',
    name: 'Shadow Minimal Tee',
    subtitle: 'Seamless Construction',
    price: 110,
    description:
      'Minimalism taken to its logical extreme. Seamless construction in ultra-fine merino wool creates a second-skin fit with zero distractions.',
    category: 'T-Shirts',
    fit: 'regular',
    colors: [
      { name: 'Slate', hex: '#5A5A5A', image: '/products/shadow-slate.jpg' },
      { name: 'Stone', hex: '#8B8680', image: '/products/shadow-stone.jpg' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    garmentAsset: '/garments/black-tshirt.png',
    featured: false,
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((product) => product.featured);
}
