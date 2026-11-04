'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Eye, Shirt } from 'lucide-react';
import type { Product } from '@/types';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface ProductCardProps {
  product: Product;
  index: number;
}

export default function ProductCard({ product, index }: ProductCardProps) {
  const [selectedColor, setSelectedColor] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(cardRef.current, {
        y: 60,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        delay: (index % 4) * 0.1,
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      });
    }, cardRef);

    return () => ctx.revert();
  }, [index]);

  const currentColor = product.colors[selectedColor] || product.colors[0];

  const handleColorSelect = (idx: number) => {
    setSelectedColor(idx);
    setImageError(false);
  };

  return (
    <div
      ref={cardRef}
      className="group relative flex flex-col transition-transform duration-300 ease-out hover:-translate-y-1.5"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image Area */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#E8E4DD] mb-4">
        {/* Editorial Placeholder background */}
        <div className="product-image-placeholder absolute inset-0 flex flex-col items-center justify-center p-6 text-center transition-transform duration-700 ease-out group-hover:scale-105">
          <div
            className="w-16 h-16 rounded-full mb-4 flex items-center justify-center shadow-inner transition-colors duration-300"
            style={{
              backgroundColor: currentColor?.hex || '#111111',
              color:
                currentColor?.hex === '#F5F3EF' || currentColor?.hex === '#E8E4DD'
                  ? '#111111'
                  : '#FFFFFF',
            }}
          >
            <Shirt size={28} strokeWidth={1.5} />
          </div>
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#858585]">
            {currentColor?.name || product.category}
          </p>
          <p className="text-xs font-medium text-[#111111] mt-1 tracking-wider uppercase">
            {product.name}
          </p>
        </div>

        {/* Product Image via Next.js Image component */}
        {currentColor?.image && !imageError && (
          <Image
            src={currentColor.image}
            alt={`${product.name} in ${currentColor.name}`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        )}

        {/* Action Buttons overlaid on image bottom */}
        <div
          className={`absolute bottom-0 inset-x-0 p-3 sm:p-4 flex gap-2.5 transition-all duration-300 ease-out z-10 ${isHovered
              ? 'translate-y-0 opacity-100 pointer-events-auto'
              : 'translate-y-3 opacity-0 pointer-events-none'
            }`}
        >
          <Link
            href={`/product/${product.slug}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white/95 backdrop-blur-md text-[#111111] text-[11px] font-medium tracking-[0.15em] uppercase hover:bg-[#111111] hover:text-white transition-all duration-200 shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View</span>
          </Link>

          <Link
            href={`/try-on?product=${product.id}`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#111111] text-white text-[11px] font-medium tracking-[0.15em] uppercase hover:bg-[#C8FF45] hover:text-[#111111] transition-all duration-200 shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <Shirt className="w-3.5 h-3.5" />
            <span>Try It On</span>
          </Link>
        </div>
      </div>

      {/* Product Details */}
      <div className="flex flex-col gap-2.5">
        {/* Name, Subtitle & Price */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Link
              href={`/product/${product.slug}`}
              className="block group-hover:text-[#858585] transition-colors"
            >
              <h3 className="font-semibold text-[#111111] text-sm md:text-base leading-tight truncate">
                {product.name}
              </h3>
            </Link>
            <p className="text-sm text-[#858585] mt-0.5 tracking-wide">
              {product.subtitle}
            </p>
          </div>
          <span className="font-semibold text-[#111111] text-sm md:text-base whitespace-nowrap">
            ${product.price}
          </span>
        </div>

        {/* Color Swatches Row */}
        <div
          className="flex items-center gap-2 pt-0.5"
          role="radiogroup"
          aria-label="Available colors"
        >
          {product.colors.map((color, idx) => {
            const isSelected = selectedColor === idx;
            return (
              <button
                key={color.name}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleColorSelect(idx);
                }}
                className={`w-4 h-4 rounded-full transition-all duration-200 cursor-pointer ${isSelected
                    ? 'ring-1 ring-offset-2 ring-[#111111] scale-110'
                    : 'hover:scale-110 opacity-70 hover:opacity-100 ring-1 ring-black/10'
                  }`}
                style={{ backgroundColor: color.hex }}
                aria-label={`Select ${color.name} color`}
                aria-checked={isSelected}
                role="radio"
                title={color.name}
              />
            );
          })}
          <span className="text-[11px] text-[#858585] ml-1 uppercase font-mono tracking-wider">
            {currentColor?.name}
          </span>
        </div>

        {/* Size Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {product.sizes.map((size) => (
            <span
              key={size}
              className="px-2 py-0.5 text-[10px] uppercase font-mono tracking-wider text-[#858585] bg-transparent border border-[#111111]/15"
            >
              {size}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
