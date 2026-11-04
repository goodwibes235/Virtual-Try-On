'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getFeaturedProducts } from '@/data/products';
import { ArrowRight, Sparkles } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

export default function FeaturedProduct() {
  const sectionRef = useRef<HTMLElement>(null);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const featured = getFeaturedProducts();
  const product = featured[0];

  useEffect(() => {
    if (!sectionRef.current || !product) return;

    const ctx = gsap.context(() => {
      // Image reveal from a mask/clip
      gsap.fromTo(
        '.featured-image-wrapper',
        {
          clipPath: 'inset(100% 0% 0% 0%)',
          opacity: 0.2,
        },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          opacity: 1,
          duration: 1.2,
          ease: 'power3.inOut',
          scrollTrigger: {
            trigger: '.featured-image-wrapper',
            start: 'top 80%',
          },
        }
      );

      gsap.from('.featured-image-inner', {
        scale: 1.15,
        duration: 1.4,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.featured-image-wrapper',
          start: 'top 80%',
        },
      });

      // Text elements sliding in from the side
      gsap.from('.featured-text-slide', {
        x: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: '.featured-info-col',
          start: 'top 80%',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [product]);

  if (!product) return null;

  const currentColor = product.colors[selectedColorIndex] || product.colors[0];
  const imageSource = currentColor?.image || '/products/obsidian-black.jpg';

  return (
    <section
      ref={sectionRef}
      id="featured-product"
      className="py-32 px-6 md:px-16 lg:px-24 bg-[#F5F3EF] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Pre-header */}
        <div className="flex items-center justify-between mb-12 md:mb-16 border-b border-[#111111]/10 pb-6">
          <span className="tracking-[0.3em] uppercase text-xs md:text-sm font-medium text-[#858585] font-mono">
            HIGHLIGHTED PIECE // 01
          </span>
          <span className="hidden sm:inline-block font-mono text-xs tracking-[0.2em] text-[#858585] uppercase">
            EDITION SS26 &bull; {product.fit.toUpperCase()} FIT
          </span>
        </div>

        {/* Two-Column Asymmetric Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Large Product Image Area (Asymmetric Column: 7 cols) */}
          <div className="lg:col-span-7">
            <div className="featured-image-wrapper aspect-[3/4] relative bg-[#E8E4DD] overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] group">
              {/* Image Container with Reveal and Subtle Zoom */}
              <div className="featured-image-inner relative w-full h-full">
                {!imageError ? (
                  <Image
                    src={imageSource}
                    alt={`${product.name} - ${currentColor.name}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    priority
                    unoptimized
                    onError={() => setImageError(true)}
                    className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                ) : (
                  /* Luxury Garment Fallback Graphics */
                  <div className="w-full h-full flex flex-col items-center justify-center p-12 bg-gradient-to-b from-[#E8E4DD] to-[#D5D0C8] relative">
                    <div className="relative w-64 h-80 sm:w-80 sm:h-96">
                      <Image
                        src="/garments/black-tshirt.svg"
                        alt={product.name}
                        fill
                        unoptimized
                        className="object-contain filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.25)] transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="text-center mt-6">
                      <span className="text-xs uppercase tracking-[0.25em] text-[#858585] font-mono block">
                        ARCHITECTURAL SILHOUETTE
                      </span>
                      <span className="text-sm font-semibold text-[#111111] uppercase tracking-[0.15em] mt-1 block">
                        {currentColor.name} // 300 GSM
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Floating Badges */}
              <div className="absolute top-6 left-6 z-10">
                <span className="px-3.5 py-1.5 bg-[#111111]/90 backdrop-blur-md text-white text-[11px] font-mono uppercase tracking-[0.2em] shadow-sm">
                  CUSTOM 300 GSM
                </span>
              </div>

              <div className="absolute bottom-6 right-6 z-10">
                <span className="px-3.5 py-1.5 bg-white/90 backdrop-blur-md text-[#111111] text-[11px] font-mono uppercase tracking-[0.15em] shadow-sm">
                  {product.fit} SILHOUETTE
                </span>
              </div>
            </div>
          </div>

          {/* Product Info Column (Asymmetric Column: 5 cols) */}
          <div className="lg:col-span-5 featured-info-col flex flex-col justify-center">
            {/* Category Label */}
            <div className="featured-text-slide">
              <span className="inline-block px-3 py-1 bg-[#111111] text-[#C8FF45] text-xs font-mono uppercase tracking-[0.2em]">
                {product.category}
              </span>
            </div>

            {/* Product Name */}
            <h2 className="featured-text-slide text-[clamp(2.25rem,4.5vw,3.75rem)] font-bold text-[#111111] leading-[1.05] tracking-tight mt-5">
              {product.name}
            </h2>

            {/* Subtitle */}
            <p className="featured-text-slide text-sm md:text-base text-[#858585] uppercase tracking-[0.18em] font-medium mt-3">
              {product.subtitle}
            </p>

            {/* Price */}
            <div className="featured-text-slide flex items-baseline gap-3 mt-6">
              <span className="text-3xl md:text-4xl font-bold text-[#111111] font-display">
                {formatPrice(product.price)}
              </span>
              <span className="text-xs uppercase font-mono tracking-widest text-[#858585]">
                USD &bull; COMPLIMENTARY SHIPPING
              </span>
            </div>

            {/* Description */}
            <p className="featured-text-slide text-base md:text-lg text-[#111111]/75 leading-relaxed max-w-lg mt-6">
              {product.description}
            </p>

            {/* Color Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="featured-text-slide mt-8 pt-6 border-t border-[#111111]/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs uppercase tracking-[0.2em] text-[#858585] font-mono">
                    COLORWAY
                  </span>
                  <span className="text-xs uppercase tracking-wider text-[#111111] font-medium font-mono">
                    {currentColor.name}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {product.colors.map((color, idx) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => {
                        setSelectedColorIndex(idx);
                        setImageError(false);
                      }}
                      className={`relative w-8 h-8 rounded-full transition-all duration-200 cursor-pointer focus:outline-none ${
                        selectedColorIndex === idx
                          ? 'ring-2 ring-offset-2 ring-[#111111] scale-105'
                          : 'opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      aria-label={`Select color ${color.name}`}
                      title={color.name}
                    >
                      {color.hex.toLowerCase() === '#ffffff' && (
                        <span className="absolute inset-0 rounded-full border border-black/15" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Buttons: View Product + TRY IT ON */}
            <div className="featured-text-slide flex flex-col sm:flex-row gap-4 mt-10">
              {/* View Product button with ArrowRight icon */}
              <Link
                href={`/products/${product.slug}`}
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#111111] text-white text-xs font-medium uppercase tracking-[0.2em] transition-all duration-300 hover:bg-black/85 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#111111] focus:ring-offset-2"
              >
                <span>View Product</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>

              {/* The "TRY IT ON" button styled with accent color (#C8FF45) background and dark text */}
              <a
                href="#try-on"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-[#C8FF45] text-[#111111] text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-300 hover:bg-[#111111] hover:text-[#C8FF45] shadow-[0_6px_25px_rgba(200,255,69,0.35)] hover:shadow-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#C8FF45] focus:ring-offset-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>TRY IT ON</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
