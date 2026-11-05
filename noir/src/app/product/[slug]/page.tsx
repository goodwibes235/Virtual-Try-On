'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ArrowLeft, Shirt, Heart, Share2, Sparkles } from 'lucide-react';
import { products, getProductBySlug } from '@/data/products';
import type { Product } from '@/types';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const product = getProductBySlug(slug);

  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!pageRef.current || !product) return;

    const ctx = gsap.context(() => {
      gsap.from('.product-image-area', {
        clipPath: 'inset(100% 0 0 0)',
        duration: 1.2,
        ease: 'power4.out',
      });
      gsap.from('.product-info > *', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        delay: 0.3,
      });
    }, pageRef);

    return () => ctx.revert();
  }, [product]);

  if (!product) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#111111] mb-4">Product Not Found</h1>
          <Link href="/" className="btn-primary">
            Back to Collection
          </Link>
        </div>
      </div>
    );
  }

  const currentColor = product.colors[selectedColor] || product.colors[0];

  return (
    <div ref={pageRef} className="min-h-screen bg-[#F5F3EF]">
      {/* Back Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-16 lg:px-24 py-6 flex items-center justify-between bg-[#F5F3EF]/80 backdrop-blur-md">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm tracking-[0.1em] uppercase text-[#858585] hover:text-[#111111] transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <Link href="/" className="text-xl font-bold tracking-[0.3em] text-[#111111]">
          NOIR
        </Link>
        <div className="w-16" />
      </nav>

      {/* Product Detail Layout */}
      <div className="pt-28 px-6 md:px-16 lg:px-24 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 max-w-7xl mx-auto">
          {/* Product Image Area */}
          <div className="product-image-area">
            <div className="aspect-[3/4] relative bg-[#E8E4DD] overflow-hidden rounded-lg shadow-sm">
              <Image
                src={currentColor.image}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
              />
            </div>
            {/* Thumbnail Row */}
            <div className="flex gap-3 mt-4">
              {product.colors.map((color, idx) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(idx)}
                  className={`w-20 h-24 relative bg-[#E8E4DD] rounded overflow-hidden transition-all cursor-pointer ${
                    selectedColor === idx
                      ? 'ring-2 ring-[#111111] ring-offset-2'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={color.image}
                    alt={color.name}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="product-info flex flex-col justify-center lg:py-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs tracking-[0.3em] uppercase text-[#858585]">
                {product.category}
              </span>
              <span className="text-[10px] bg-[#111111] text-[#C8FF45] font-mono uppercase px-2 py-0.5 rounded">
                3D Collection
              </span>
            </div>
            <h1 className="text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.05] text-[#111111] mb-2">
              {product.name}
            </h1>
            <p className="text-base text-[#858585] mb-4">{product.subtitle}</p>
            <p className="text-3xl font-semibold text-[#111111] mb-6">
              ${product.price}.00
            </p>

            <p className="text-[#858585] leading-relaxed mb-8 max-w-md text-sm">
              {product.description}
            </p>

            {/* Size Selector */}
            <div className="mb-8">
              <p className="text-xs tracking-[0.15em] uppercase text-[#111111] font-semibold mb-3">
                Select Size
              </p>
              <div className="flex gap-2 flex-wrap">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 text-xs tracking-[0.1em] border transition-all cursor-pointer ${
                      selectedSize === size
                        ? 'border-[#111111] bg-[#111111] text-white'
                        : 'border-[#D5D0C8] text-[#111111] hover:border-[#111111]'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href={`/try-on?product=${product.id}`}
                className="btn-accent text-center justify-center cursor-pointer shadow-md hover:scale-[1.02]"
              >
                <Shirt size={16} />
                Try It On (Live 3D)
              </Link>
              <button className="btn-primary justify-center cursor-pointer">
                Add to Bag
              </button>
            </div>

            {/* Features Info */}
            <div className="mt-10 pt-8 border-t border-[#E8E4DD] space-y-2 text-xs text-[#858585]">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[#111111]" />
                <span>Supports live webcam 3D mesh anatomical virtual try-on</span>
              </div>
              <div>Fit: <span className="text-[#111111] uppercase font-medium">{product.fit}</span></div>
              <div>Free express shipping & returns on all orders</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
