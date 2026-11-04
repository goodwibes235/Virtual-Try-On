'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ShoppingBag } from 'lucide-react';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Collection', href: '#collection' },
    { label: 'About', href: '#about' },
    { label: 'Try On', href: '#try-on' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
      setIsMobileMenuOpen(false);
    }
  };

  const scrollToTop = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
        isScrolled
          ? 'bg-[#F5F3EF]/80 backdrop-blur-md shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border-b border-black/5 py-4'
          : 'bg-transparent backdrop-blur-[2px] py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex-1 flex justify-start">
            <Link
              href="/"
              onClick={scrollToTop}
              className="font-bold text-xl tracking-[0.3em] uppercase text-[#111111] hover:opacity-80 transition-opacity select-none"
            >
              NOIR
            </Link>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center space-x-10">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="relative py-1 text-xs uppercase tracking-[0.2em] font-medium text-[#111111] transition-colors duration-200 group"
              >
                <span className="relative z-10 transition-colors duration-200 group-hover:text-black">
                  {link.label}
                </span>
                {/* Minimal animated underline indicator with #C8FF45 accent */}
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 w-0 h-[2px] bg-[#C8FF45] transition-all duration-300 ease-out group-hover:w-full"
                />
              </Link>
            ))}
          </nav>

          {/* Right Actions: Shopping Bag & Mobile Hamburger */}
          <div className="flex-1 flex items-center justify-end space-x-4">
            {/* Shopping Bag Icon (Decorative Only) */}
            <button
              type="button"
              aria-label="Shopping Bag (0 items)"
              className="relative p-2 text-[#111111] hover:opacity-80 transition-all duration-200 group cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5 transition-transform duration-200 group-hover:scale-105" />
              {/* Subtle accent indicator */}
              <span
                aria-hidden="true"
                className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#C8FF45] ring-2 ring-[#F5F3EF]"
              />
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              className="md:hidden p-2 text-[#111111] hover:opacity-80 transition-opacity focus:outline-none cursor-pointer"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 transition-transform duration-200 rotate-0 hover:rotate-90" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Slide-down Navigation Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen
            ? 'max-h-80 opacity-100 border-b border-black/5 bg-[#F5F3EF]/95 backdrop-blur-xl shadow-lg mt-3'
            : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <nav className="px-6 py-6 flex flex-col space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="flex items-center justify-between text-xs uppercase tracking-[0.25em] font-medium text-[#111111] py-2 border-b border-black/5 group"
            >
              <span className="transition-transform duration-200 group-hover:translate-x-1">
                {link.label}
              </span>
              <span className="w-2 h-2 rounded-full bg-[#C8FF45] opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </Link>
          ))}
          <div className="pt-2 flex items-center justify-between text-[11px] tracking-[0.2em] uppercase text-black/50">
            <span>Bag</span>
            <span className="inline-flex items-center gap-1.5 text-[#111111] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C8FF45]" />
              0 Items
            </span>
          </div>
        </nav>
      </div>
    </header>
  );
}
