'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ProductCard from '@/components/ui/ProductCard';
import { products } from '@/data/products';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Collection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      if (headerRef.current) {
        const headerElements = headerRef.current.children;
        gsap.from(headerElements, {
          y: 40,
          opacity: 0,
          duration: 0.9,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: headerRef.current,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="collection"
      className="py-32 px-6 md:px-16 lg:px-24 bg-[#F5F3EF]"
    >
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div ref={headerRef} className="mb-16 md:mb-20">
          <p className="text-sm tracking-[0.3em] text-[#858585] uppercase mb-4 font-mono">
            COLLECTION
          </p>
          <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-bold text-[#111111] leading-[0.95] tracking-tight mb-6">
            Curated
            <br />
            Essentials
          </h2>
          <p className="text-[#858585] text-base md:text-lg max-w-lg leading-relaxed font-normal">
            Each silhouette in our collection is precision-crafted with high-density organic textiles, refined tailoring, and seamless integration for real-time virtual fitting.
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
