import React, { useState, useEffect } from 'react';

export const Navigation: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isSection2Active, setIsSection2Active] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Reveal navigation only when scrolled past 60% of the Hero viewport
      const threshold = window.innerHeight * 0.6;
      setIsVisible(window.scrollY > threshold);

      // Detect when Section 2 ("What We Do at AIDN") is active in viewport
      const section2 = document.getElementById('what-we-do');
      if (section2) {
        const rect = section2.getBoundingClientRect();
        // Active when Section 2 is at or near top under navbar, and has not scrolled past
        const topThreshold = 140;
        const isActive = rect.top <= topThreshold && rect.bottom > topThreshold;
        setIsSection2Active(isActive);
      } else {
        setIsSection2Active(false);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const handleScrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      id="main-navigation"
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-700 ease-out ${
        isVisible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 -translate-y-full pointer-events-none'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between px-6 py-3 rounded-full bg-zinc-950/80 backdrop-blur-md border border-zinc-800/80 shadow-2xl">
          {/* Brand mark */}
          <div className="flex items-center space-x-3">
            <span
              className="text-sm font-bold tracking-[0.2em] uppercase text-zinc-100"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              AIDN
            </span>
            <span className="text-zinc-600">/</span>
            <span className="text-xs tracking-wider text-zinc-400 font-medium">
              Pune Chapter
            </span>
          </div>

          {/* Minimal Links */}
          <nav className="hidden md:flex items-center space-x-8 text-xs tracking-wider uppercase text-zinc-400 font-medium">
            <a
              href="#hero-section"
              onClick={handleScrollTo('hero-section')}
              className="text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              Hero
            </a>

            {/* WHAT WE DO: Active navigation state with matching sky-400 accent & smooth underline */}
            <a
              href="#what-we-do"
              onClick={handleScrollTo('what-we-do')}
              className={`relative py-1 transition-colors duration-300 font-medium ${
                isSection2Active ? 'text-sky-400' : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              What We Do
              <span
                aria-hidden="true"
                className={`absolute bottom-0 left-0 w-full h-[1.5px] bg-sky-400 rounded-full transition-all duration-300 ease-out origin-center ${
                  isSection2Active ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                }`}
              />
            </a>

            <a
              href="#what-we-do"
              onClick={handleScrollTo('what-we-do')}
              className="text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              Activities
            </a>
          </nav>

          {/* Action indicator */}
          <div className="flex items-center space-x-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium tracking-wider uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20">
              Active Network
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

