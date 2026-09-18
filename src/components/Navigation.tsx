import React, { useState, useEffect } from 'react';

export const Navigation: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState<'hero' | 'the-idea' | 'what-we-do' | 'activities'>('the-idea');

  useEffect(() => {
    const handleScroll = () => {
      // Reveal navigation when scrolled past 40% of the Hero viewport
      const threshold = window.innerHeight * 0.4;
      setIsVisible(window.scrollY > threshold);

      const theIdea = document.getElementById('the-idea');
      const whatWeDo = document.getElementById('what-we-do');
      const nextSection = document.getElementById('next-section');

      // Check section positions relative to viewport
      const topOffset = 220;
      if (nextSection && nextSection.getBoundingClientRect().top <= topOffset) {
        setActiveSection('activities');
      } else if (whatWeDo && whatWeDo.getBoundingClientRect().top <= topOffset) {
        setActiveSection('what-we-do');
      } else if (theIdea && theIdea.getBoundingClientRect().top <= topOffset) {
        setActiveSection('the-idea');
      } else {
        setActiveSection('hero');
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

  const navItems = [
    { id: 'hero-section', label: 'HERO', key: 'hero' },
    { id: 'the-idea', label: 'THE IDEA', key: 'the-idea' },
    { id: 'what-we-do', label: 'WHAT WE DO', key: 'what-we-do' },
    { id: 'next-section', label: 'ACTIVITIES', key: 'activities' },
  ];

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
          {/* Brand mark with reference typography */}
          <div className="flex items-center space-x-3.5">
            <span
              className="text-sm font-bold tracking-[0.25em] uppercase text-zinc-100"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              AIDN
            </span>
            <span className="h-4 w-[1px] bg-zinc-800" />
            <div className="hidden sm:flex flex-col text-[8.5px] font-sans tracking-[0.16em] uppercase text-zinc-400 leading-tight">
              <span>Artificial Intelligence</span>
              <span>Developer Network</span>
              <span className="text-zinc-500">Pune</span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center space-x-8 text-xs tracking-wider uppercase font-medium">
            {navItems.map((item) => {
              const isActive = activeSection === item.key;
              return (
                <a
                  key={item.key}
                  href={`#${item.id}`}
                  onClick={handleScrollTo(item.id)}
                  className={`relative py-1 transition-colors duration-300 ${
                    isActive ? 'text-sky-400' : 'text-zinc-400 hover:text-zinc-100'
                  }`}
                >
                  {item.label}
                  <span
                    aria-hidden="true"
                    className={`absolute -bottom-1 left-0 w-full h-[1.5px] bg-sky-400 rounded-full transition-all duration-300 ease-out origin-center ${
                      isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
                    }`}
                  />
                </a>
              );
            })}
          </nav>

          {/* Join Us action button matching visual reference */}
          <div className="flex items-center space-x-3">
            <a
              href="#join-us"
              onClick={(e) => {
                e.preventDefault();
                const target = document.getElementById('next-section') || document.getElementById('what-we-do');
                if (target) target.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase bg-transparent text-zinc-200 border border-zinc-700/80 hover:border-zinc-500 hover:text-white transition-all duration-300 cursor-pointer"
            >
              <span>Join Us</span>
              <span className="text-zinc-400 group-hover:text-white text-xs">→</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

