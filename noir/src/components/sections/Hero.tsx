'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export interface HeroProps {
  onExploreClick?: () => void;
  editionLabel?: string;
  description?: string;
}

export default function Hero({
  onExploreClick,
  editionLabel = 'SS26 COLLECTION // VIRTUAL RUNWAY',
  description = 'Architectural silhouettes engineered with neural-precision fitting. Experience the convergence of haute couture craftsmanship and real-time virtual try-on.',
}: HeroProps) {
  const heroRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLButtonElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);
  const editionRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ensure animation targets exist before animating
    if (!heroRef.current) return;

    const ctx = gsap.context(() => {
      const words = headlineRef.current?.querySelectorAll<HTMLElement>('.headline-word');

      // Initial state setup for smooth entrance
      if (words && words.length > 0) {
        gsap.set(words, { y: 120, opacity: 0 });
      }
      if (subtitleRef.current) gsap.set(subtitleRef.current, { y: 30, opacity: 0 });
      if (descriptionRef.current) gsap.set(descriptionRef.current, { y: 30, opacity: 0 });
      if (ctaRef.current) gsap.set(ctaRef.current, { y: 40, opacity: 0 });
      if (editionRef.current) gsap.set(editionRef.current, { opacity: 0, y: -15 });
      if (lineRef.current) gsap.set(lineRef.current, { scaleX: 0, transformOrigin: 'left center' });
      if (scrollIndicatorRef.current) gsap.set(scrollIndicatorRef.current, { opacity: 0, y: -10 });

      // Entrance animation timeline
      const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
      });

      // 1. Edition header and subtle decorative line
      if (editionRef.current) {
        tl.to(editionRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: 0.1,
        });
      }

      if (lineRef.current) {
        tl.to(
          lineRef.current,
          {
            scaleX: 1,
            duration: 0.9,
            ease: 'expo.out',
          },
          '-=0.5'
        );
      }

      // 2. Headline staggered reveal
      if (words && words.length > 0) {
        tl.to(
          words,
          {
            y: 0,
            opacity: 1,
            duration: 1.1,
            stagger: 0.14,
            ease: 'power4.out',
          },
          '-=0.5'
        );
      }

      // 3. Subtitle fade and slide
      if (subtitleRef.current) {
        tl.to(
          subtitleRef.current,
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
          },
          '-=0.6'
        );
      }

      // 4. Description paragraph
      if (descriptionRef.current) {
        tl.to(
          descriptionRef.current,
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
          },
          '-=0.6'
        );
      }

      // 5. CTA button slide up
      if (ctaRef.current) {
        tl.to(
          ctaRef.current,
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
          },
          '-=0.5'
        );
      }

      // 6. Scroll indicator fade in
      if (scrollIndicatorRef.current) {
        tl.to(
          scrollIndicatorRef.current,
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
          },
          '-=0.4'
        );
      }

      // Continuous subtle bounce on the ArrowDown icon
      if (arrowRef.current) {
        gsap.to(arrowRef.current, {
          y: 6,
          duration: 1.2,
          repeat: -1,
          yoyo: true,
          ease: 'power1.inOut',
        });
      }

      // Parallax fade-out effect as user scrolls down
      if (contentRef.current && heroRef.current) {
        gsap.to(contentRef.current, {
          y: -90,
          opacity: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom 20%',
            scrub: 0.6,
          },
        });
      }
    }, heroRef);

    return () => {
      ctx.revert();
    };
  }, []);

  const handleExplore = (e: React.MouseEvent) => {
    if (onExploreClick) {
      e.preventDefault();
      onExploreClick();
      return;
    }
    const collectionEl = document.getElementById('collection');
    if (collectionEl) {
      e.preventDefault();
      collectionEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollDown = () => {
    const nextTarget =
      document.getElementById('collection') ||
      document.querySelector('main > section:nth-of-type(2)');

    if (nextTarget) {
      nextTarget.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({
        top: window.innerHeight,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section
      ref={heroRef}
      className="relative min-h-screen w-full bg-[#F5F3EF] text-[#111111] flex flex-col justify-between overflow-hidden px-6 md:px-16 lg:px-24 pt-28 md:pt-32 pb-8 md:pb-12"
      aria-label="Hero Section"
    >
      {/* Parallax Content Container */}
      <div
        ref={contentRef}
        className="w-full max-w-7xl mx-auto flex-1 flex flex-col justify-center"
      >
        {/* Top Decorative Header */}
        <div className="mb-8 md:mb-12">
          <div
            ref={editionRef}
            className="flex items-center justify-between gap-4 text-xs tracking-[0.25em] text-[#858585] uppercase font-mono mb-4"
          >
            <span>{editionLabel}</span>
            <span className="hidden sm:inline-block">PARIS / TOKYO / NEW YORK</span>
          </div>
          <div
            ref={lineRef}
            className="w-full h-[1px] bg-[#111111]/15"
            aria-hidden="true"
          />
        </div>

        {/* Subtitle */}
        <p
          ref={subtitleRef}
          className="text-lg md:text-xl text-[#858585] tracking-[0.2em] uppercase font-medium mb-4 md:mb-6"
        >
          The Future of Fashion
        </p>

        {/* Main Headline */}
        <h1
          ref={headlineRef}
          className="text-[clamp(3rem,10vw,9rem)] font-bold leading-[0.9] tracking-tight uppercase text-[#111111] mb-6 md:mb-8 select-none"
        >
          {/* Word: WEAR */}
          <span className="inline-block overflow-hidden mr-[0.25em] align-top">
            <span className="headline-word inline-block">WEAR</span>
          </span>

          {/* Word: THE */}
          <span className="inline-block overflow-hidden mr-[0.25em] align-top">
            <span className="headline-word inline-block">THE</span>
          </span>

          {/* Word: FUTURE. (Editorial Treatment: Outlined Text + Accent Underline) */}
          <span className="inline-block overflow-hidden align-top">
            <span className="headline-word inline-block relative text-transparent [-webkit-text-stroke:2px_#111111] md:[-webkit-text-stroke:3px_#111111] hover:text-[#111111] transition-colors duration-500">
              FUTURE.
              <span
                className="absolute -bottom-1 md:-bottom-2 left-0 w-full h-[3px] md:h-[5px] bg-[#C8FF45]"
                aria-hidden="true"
              />
            </span>
          </span>
        </h1>

        {/* Editorial Description Paragraph */}
        <p
          ref={descriptionRef}
          className="text-base md:text-lg text-[#858585] max-w-xl font-normal leading-relaxed mb-8 md:mb-12"
        >
          {description}
        </p>

        {/* CTA Button */}
        <div ref={ctaRef} className="flex items-center">
          <a
            href="#collection"
            onClick={handleExplore}
            className="group relative inline-flex items-center justify-center px-8 md:px-10 py-4 md:py-5 bg-[#111111] text-white text-xs md:text-sm font-medium tracking-[0.2em] uppercase transition-all duration-300 hover:bg-[#C8FF45] hover:text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#111111] focus:ring-offset-2 focus:ring-offset-[#F5F3EF]"
          >
            <span>EXPLORE COLLECTION</span>
            <span
              className="ml-3 inline-block transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden="true"
            >
              &rarr;
            </span>
          </a>
        </div>
      </div>

      {/* Bottom Row: Editorial Meta & Animated Scroll Indicator */}
      <div className="w-full max-w-7xl mx-auto flex items-end justify-between pt-8 border-t border-[#111111]/10">
        <div className="hidden sm:block text-[11px] uppercase tracking-[0.2em] text-[#858585] font-mono">
          AUTONOMOUS SIZING &bull; NEURAL FIT ENGINE
        </div>

        {/* Scroll Indicator */}
        <button
          ref={scrollIndicatorRef}
          onClick={handleScrollDown}
          type="button"
          className="group flex items-center gap-3 text-xs tracking-[0.2em] uppercase text-[#858585] hover:text-[#111111] transition-colors duration-300 cursor-pointer focus:outline-none ml-auto sm:ml-0"
          aria-label="Scroll down to explore collection"
        >
          <span className="font-mono text-[11px]">SCROLL DOWN</span>
          <span
            ref={arrowRef}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#111111]/20 group-hover:border-[#111111] group-hover:bg-[#111111] group-hover:text-white transition-all duration-300"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </span>
        </button>
      </div>
    </section>
  );
}
