'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Camera, Shirt } from 'lucide-react';
import { getProductBySlug, products } from '@/data/products';

function TryOnContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('product');
  const product = productId
    ? products.find((p) => p.id === productId)
    : products[0];

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      {/* Header */}
      <nav className="px-6 md:px-16 py-6 flex items-center justify-between border-b border-white/10">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm tracking-[0.1em] uppercase text-[#858585] hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Store
        </Link>
        <span className="text-xl font-bold tracking-[0.3em]">NOIR</span>
        <div className="w-24" />
      </nav>

      {/* Fitting Room Placeholder */}
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
        <div className="w-full max-w-2xl text-center">
          {/* Virtual Fitting Room Preview */}
          <div className="relative aspect-[3/4] max-h-[60vh] w-full max-w-lg mx-auto bg-[#1a1a1a] rounded-lg overflow-hidden border border-white/10 mb-8">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
              <div className="w-20 h-20 rounded-full border-2 border-[#C8FF45] flex items-center justify-center">
                <Camera size={32} className="text-[#C8FF45]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Virtual Fitting Room</h3>
                <p className="text-sm text-[#858585] max-w-xs mx-auto">
                  The live virtual try-on experience will be available in the next phase.
                </p>
              </div>
              <button
                disabled
                className="btn-accent opacity-50 cursor-not-allowed"
              >
                <Camera size={16} />
                Coming Soon
              </button>
            </div>
          </div>

          {/* Selected Product */}
          {product && (
            <div className="flex items-center justify-center gap-4 text-[#858585]">
              <Shirt size={20} />
              <span className="text-sm tracking-[0.1em]">
                Selected: {product.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TryOnPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#111111] flex items-center justify-center">
          <div className="text-white text-sm tracking-[0.2em]">LOADING...</div>
        </div>
      }
    >
      <TryOnContent />
    </Suspense>
  );
}

