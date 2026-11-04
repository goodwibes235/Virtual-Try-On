'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ArrowLeft, Shirt, Heart, Share2 } from 'lucide-react';
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

  return (
    <div ref={pageRef} className="min-h-screen bg-[#F5F3EF]">
      {/* Back Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 md:px-16 lg:px-24 py-6 flex items-center justify-between bg-[#F5F3EF]/80 backdrop-blur-md">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm tracking-[0.1em] uppercase text-[#858585] hover:text-[#111111] transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <Link href="/" className="text-xl font-bold tracking-[0.3em] text-[#111111]">
          NOIR
        </Link>
        <div className="w-16" /> {/* Spacer for centering */}
      </nav>

      {/* Product Detail Layout */}
      <div className="pt-24 px-6 md:px-16 lg:px-24 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 max-w-7xl mx-auto">
          {/* Product Image */}
          <div className="product-image-area">
            <div className="aspect-[3/4] relative bg-[#E8E4DD] overflow-hidden">
              <div className="product-image-placeholder w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <Shirt size={80} strokeWidth={1} className="text-[#858585]/40 mx-auto mb-4" />
                  <p className="text-sm text-[#858585]/60 tracking-[0.1em] uppercase">
                    {product.name}
                  </p>
                </div>
              </div>
            </div>
            {/* Thumbnail Row */}
            <div className="flex gap-3 mt-4">
              {product.colors.map((color, idx) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(idx)}
                  className={`w-20 h-24 relative bg-[#E8E4DD] transition-all ${
                    selectedColor === idx
                      ? 'ring-2 ring-[#111111] ring-offset-2'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <div
                      className="w-8 h-8 rounded-full"
                      style={{ backgroundColor: color.hex }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="product-info flex flex-col justify-center lg:py-12">
            <p className="text-sm tracking-[0.3em] uppercase text-[#858585] mb-4">
              {product.category}
            </p>
            <h1 className="text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.1] text-[#111111] mb-2">
              {product.name}
            </h1>
            <p className="text-lg text-[#858585] mb-6">{product.subtitle}</p>
            <p className="text-3xl font-semibold text-[#111111] mb-8">
              ${product.price}.00
            </p>

            <p className="text-[#858585] leading-relaxed mb-10 max-w-md">
              {product.description}
            </p>

            {/* Color Selector */}
            <div className="mb-8">
              <p className="text-sm tracking-[0.15em] uppercase text-[#111111] mb-3">
                Color — {product.colors[selectedColor].name}
              </p>
              <div className="flex gap-3">
                {product.colors.map((color, idx) => (
                  <button
                    key={color.name}
                    onClick={() => setSelectedColor(idx)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      selectedColor === idx
                        ? 'border-[#111111] scale-110'
                        : 'border-transparent hover:border-[#858585]'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    aria-label={`Select ${color.name}`}
                  />
                ))}
              </div>
            </div>

            {/* Size Selector */}
            <div className="mb-10">
              <p className="text-sm tracking-[0.15em] uppercase text-[#111111] mb-3">
                Size
              </p>
              <div className="flex gap-2 flex-wrap">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-5 py-2.5 text-sm tracking-[0.1em] border transition-all ${
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
                className="btn-accent text-center justify-center"
              >
                <Shirt size={16} />
                Try It On
              </Link>
              <button className="btn-primary justify-center">
                Add to Bag
              </button>
            </div>

            {/* Secondary Actions */}
            <div className="flex gap-6 mt-8 pt-8 border-t border-[#E8E4DD]">
              <button className="flex items-center gap-2 text-sm text-[#858585] hover:text-[#111111] transition-colors">
                <Heart size={16} />
                Wishlist
              </button>
              <button className="flex items-center gap-2 text-sm text-[#858585] hover:text-[#111111] transition-colors">
                <Share2 size={16} />
                Share
              </button>
            </div>

            {/* Product Details */}
            <div className="mt-10 pt-8 border-t border-[#E8E4DD]">
              <h3 className="text-sm tracking-[0.15em] uppercase text-[#111111] mb-4">Details</h3>
              <ul className="space-y-2 text-sm text-[#858585]">
                <li>Fit: {product.fit.charAt(0).toUpperCase() + product.fit.slice(1)}</li>
                <li>Premium construction</li>
                <li>Ethically sourced materials</li>
                <li>Machine washable</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

