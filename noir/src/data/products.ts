import { Product } from '@/types';

export const products: Product[] = [
  {
    id: 'belgian-training-tee',
    slug: 'belgian-training-tee',
    name: 'Belgian Fans 3D Training Tee',
    subtitle: 'Breathable 3D Printed Micro-Mesh',
    price: 135,
    description:
      'Engineered 3D graphic football training shirt with high-definition digital print. Lightweight, moisture-wicking micro-elastic fabric designed for performance comfort and streetwear appeal.',
    category: 'Training Tees',
    fit: 'regular',
    colors: [
      { name: 'Dark Graphic Print', hex: '#2A292F', image: '/garments/belgian-training-tee.png' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    garmentAsset: '/garments/belgian-training-tee.png',
    featured: true,
  },
  {
    id: 'graphic-streetwear-tee',
    slug: 'graphic-streetwear-tee',
    name: 'NOIR Graphic Streetwear Tee',
    subtitle: 'High-Impact Editorial Front Print',
    price: 140,
    description:
      'Statement oversized t-shirt featuring vibrant 3D street art illustration on ultra-heavyweight cotton. Precision-cut dropped shoulders and an effortless draped profile.',
    category: 'T-Shirts',
    fit: 'oversized',
    colors: [
      { name: 'Multicolor Graphic', hex: '#414856', image: '/garments/graphic-streetwear-tee.png' },
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    garmentAsset: '/garments/graphic-streetwear-tee.png',
    featured: true,
  },
  {
    id: 'blue-geometric-tee',
    slug: 'blue-geometric-tee',
    name: 'Cobalt Geometric 3D Tee',
    subtitle: 'Optic Dimensional Gradient Weave',
    price: 130,
    description:
      'Architectural geometric cube pattern rendered in vivid cobalt blue and deep midnight shadows. Seamless breathable knit construction with sharp dynamic contrast.',
    category: 'T-Shirts',
    fit: 'regular',
    colors: [
      { name: 'Cobalt & Midnight', hex: '#12487E', image: '/garments/blue-geometric-tee.png' },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    garmentAsset: '/garments/blue-geometric-tee.png',
    featured: false,
  },
  {
    id: 'golf-polo-3d',
    slug: 'golf-polo-3d',
    name: '3D-Druck Golf Poloshirt',
    subtitle: 'Micro-Elastic Performance Polo',
    price: 155,
    description:
      'Tailored short-sleeve performance golf polo shirt with 3D digital gradient print. Features an aerodynamic knit collar, three-button placket, and breathable 4-way stretch fit.',
    category: 'Polos',
    fit: 'slim',
    colors: [
      { name: 'Deep Navy / Black', hex: '#122037', image: '/garments/golf-polo-3d.png' },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    garmentAsset: '/garments/golf-polo-3d.png',
    featured: false,
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((product) => product.featured);
}
