'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const navLinks = [
    { label: 'Collection', href: '#collection' },
    { label: 'About', href: '#about' },
    { label: 'Try On', href: '#try-on' },
    { label: 'Contact', href: '#contact' },
  ];

  const socialLinks = [
    { name: 'Instagram', href: '#' },
    { name: 'Twitter / X', href: '#' },
    { name: 'TikTok', href: '#' },
    { name: 'Lookbook', href: '#' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const scrollToTop = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#111111] text-white py-20 px-6 md:px-16 lg:px-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        {/* Top Row: Logo & Subtitle on Left, Navigation Links on Right */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-16">
          {/* Brand & Subtitle */}
          <div>
            <Link
              href="/"
              onClick={scrollToTop}
              className="text-3xl md:text-4xl font-bold tracking-[0.3em] uppercase text-white hover:opacity-85 transition-opacity inline-block font-display"
            >
              NOIR
            </Link>
            <p className="text-sm text-[#858585] mt-3 tracking-[0.15em] font-mono uppercase">
              The Future of Fashion
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center gap-6 sm:gap-10">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="relative text-xs md:text-sm text-[#858585] hover:text-[#C8FF45] transition-colors tracking-[0.2em] uppercase font-medium py-1 group"
              >
                <span>{link.label}</span>
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#C8FF45] transition-all duration-300 ease-out group-hover:w-full"
                />
              </a>
            ))}
          </nav>
        </div>

        {/* Middle: Thin Separator Line */}
        <div className="border-t border-white/10" aria-hidden="true" />

        {/* Bottom Row: Copyright on Left, Social Placeholders on Right */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-10">
          <p className="text-xs text-[#858585] tracking-wider font-mono">
            &copy; {currentYear} NOIR. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-6 sm:gap-8">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                className="text-xs text-[#858585] hover:text-[#C8FF45] transition-colors tracking-[0.15em] uppercase font-mono"
              >
                {social.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
