'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate elements
      gsap.from('.about-label', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        scrollTrigger: { trigger: '.about-label', start: 'top 85%' },
      });
      gsap.from('.about-heading', {
        y: 60,
        opacity: 0,
        duration: 1,
        scrollTrigger: { trigger: '.about-heading', start: 'top 85%' },
      });
      gsap.from('.about-text', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        scrollTrigger: { trigger: '.about-text', start: 'top 85%' },
      });
      gsap.from('.about-stats', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        scrollTrigger: { trigger: '.about-stats', start: 'top 85%' },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const stats = [
    { value: '300 GSM', label: 'Premium Weight' },
    { value: '100%', label: 'Organic Cotton' },
    { value: 'Zero', label: 'Compromises' },
  ];

  return (
    <section
      ref={sectionRef}
      id="about"
      className="py-32 px-6 md:px-16 lg:px-24 bg-[#111111] text-white overflow-hidden"
    >
      <div className="max-w-7xl mx-auto">
        {/* Two-Column Layout on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Heading + Label */}
          <div className="lg:col-span-6">
            <span className="about-label inline-block tracking-[0.3em] text-[#858585] uppercase text-sm font-medium">
              ABOUT
            </span>
            <h2 className="about-heading text-[clamp(2.5rem,6vw,5rem)] font-bold text-white leading-[1.02] tracking-tight mt-6 whitespace-pre-line">
              {'Precision\nMeets Poetry'}
            </h2>
          </div>

          {/* Right Column: Body Text Paragraphs */}
          <div className="lg:col-span-6 flex flex-col space-y-6 pt-2 lg:pt-8">
            <p className="about-text text-white/80 text-lg md:text-xl font-normal leading-relaxed">
              NOIR was conceived at the threshold where architectural precision meets the visceral emotion of bespoke fashion. We reject the ephemeral noise of fast-turn seasons in favor of permanent forms, sculptural drape, and uncompromising substance.
            </p>
            <p className="about-text text-[#858585] text-base md:text-lg font-normal leading-relaxed">
              Every garment begins with deliberate textile engineering. We source custom-milled organic fibers with substantial weight, creating pieces that command attention through silence and structural integrity rather than loud logos.
            </p>
            <p className="about-text text-[#858585] text-base md:text-lg font-normal leading-relaxed">
              By pairing artisanal tailoring traditions with real-time neural fitting simulations, we erase the uncertainty of online fitting. You experience the silhouette exactly as it was designed to drape against the human body before it ever arrives at your door.
            </p>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-white/10 mt-20 md:mt-24 mb-16" />

        {/* 3 Stat Blocks at the Bottom */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          {stats.map((stat) => (
            <div key={stat.label} className="about-stats flex flex-col">
              <span className="text-[clamp(2.5rem,4.5vw,4.25rem)] font-bold text-[#C8FF45] tracking-tight leading-none mb-3 font-display">
                {stat.value}
              </span>
              <span className="text-xs md:text-sm tracking-[0.2em] uppercase text-[#858585] font-mono">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
