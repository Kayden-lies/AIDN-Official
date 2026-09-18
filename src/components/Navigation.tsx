import React, { useState, useEffect, useCallback, useRef } from 'react';

type SectionKey =
  | 'hero'
  | 'the-idea'
  | 'what-we-do'
  | 'the-network'
  | 'events'
  | 'partners'
  | 'campus-connect'
  | 'get-involved';

interface SectionItem {
  id: string;
  aliasId?: string;
  key: SectionKey;
  label: string;
}

const SECTIONS: SectionItem[] = [
  { id: 'hero-section', key: 'hero', label: 'HERO' },
  { id: 'the-idea', key: 'the-idea', label: 'THE IDEA' },
  { id: 'what-we-do', key: 'what-we-do', label: 'WHAT WE DO' },
  { id: 'the-network', key: 'the-network', label: 'THE NETWORK' },
  { id: 'events', aliasId: 'signature-events', key: 'events', label: 'EVENTS' },
  { id: 'partners', aliasId: 'partners-collaborators', key: 'partners', label: 'PARTNERS' },
  { id: 'campus-connect', key: 'campus-connect', label: 'CAMPUS CONNECT' },
  { id: 'get-involved', key: 'get-involved', label: 'GET INVOLVED' },
];

// Top activation zone: top 32px of the viewport.
// The navbar settles at top: 36px (pt-9), strictly BELOW the cursor/activation area.
// The cursor remains above the navbar when it appears.
const ACTIVATION_ZONE_HEIGHT = 32;

export const Navigation: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>('hero');

  const navContainerRef = useRef<HTMLDivElement | null>(null);

  // The two exclusive triggers
  const cursorInAreaRef = useRef(false);
  const scrollingUpRef = useRef(false);

  const lastScrollYRef = useRef(0);
  const upwardAccumulatorRef = useRef(0);
  const downwardAccumulatorRef = useRef(0);
  const cursorHideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollIdleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Master visibility evaluator (ONLY Condition 1 OR Condition 2)
  const evaluateVisibility = useCallback(() => {
    const currentScrollY = window.scrollY;
    const heroThreshold = window.innerHeight * 0.6;

    // HERO EXCEPTION: The navbar must remain COMPLETELY INVISIBLE throughout the Hero
    if (currentScrollY <= heroThreshold) {
      setIsVisible(false);
      return;
    }

    const shouldShow = cursorInAreaRef.current || scrollingUpRef.current;
    setIsVisible(shouldShow);
  }, []);

  // Section detector: updates active item in the background without triggering visibility
  const updateActiveSection = useCallback((currentScrollY: number) => {
    const heroThreshold = window.innerHeight * 0.6;
    if (currentScrollY <= heroThreshold * 0.75) {
      setActiveSection('hero');
      return;
    }

    const probeY = window.innerHeight * 0.35;
    let detectedSection: SectionKey = 'hero';

    for (let i = SECTIONS.length - 1; i >= 0; i--) {
      const item = SECTIONS[i];
      const el =
        document.getElementById(item.id) ||
        (item.aliasId ? document.getElementById(item.aliasId) : null);

      if (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= probeY && rect.bottom > probeY) {
          detectedSection = item.key;
          break;
        }
      }
    }

    const scrollBottom = window.innerHeight + currentScrollY;
    const docHeight = document.documentElement.scrollHeight;
    if (scrollBottom >= docHeight - 60) {
      detectedSection = 'get-involved';
    }

    if (detectedSection === 'hero' && currentScrollY > heroThreshold) {
      detectedSection = 'the-idea';
    }

    setActiveSection(detectedSection);
  }, []);

  // CONDITION 1: CURSOR NEAR TOP
  // Interaction Model:
  // 1. User moves cursor into top activation zone (0 - 32px)
  // 2. NAVBAR appears BELOW cursor (resting at top: 36px)
  // 3. Cursor remains strictly ABOVE the navbar when it appears
  // 4. Once revealed, activation zone + navbar area are logically connected without gaps
  // 5. Moving cursor down onto the navbar keeps it open
  // 6. Only hides when cursor leaves the connected area (after a 400ms delay) and not scrolling up
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const currentScrollY = window.scrollY;
      const heroThreshold = window.innerHeight * 0.6;

      // In Hero: completely inactive
      if (currentScrollY <= heroThreshold) {
        if (cursorInAreaRef.current) {
          cursorInAreaRef.current = false;
          if (cursorHideTimerRef.current) {
            clearTimeout(cursorHideTimerRef.current);
            cursorHideTimerRef.current = null;
          }
          evaluateVisibility();
        }
        return;
      }

      // STATE A: Navbar is not currently triggered by cursor
      if (!cursorInAreaRef.current) {
        // Only entering the top activation zone can trigger it
        if (e.clientY >= 0 && e.clientY <= ACTIVATION_ZONE_HEIGHT) {
          cursorInAreaRef.current = true;
          if (cursorHideTimerRef.current) {
            clearTimeout(cursorHideTimerRef.current);
            cursorHideTimerRef.current = null;
          }
          evaluateVisibility();
        }
      }
      // STATE B: Navbar is currently triggered by cursor (already revealed or revealing)
      else {
        // Calculate the bottom extent of the navbar pill to create a seamless continuous hover envelope
        let maxBottom = 110;
        if (navContainerRef.current) {
          const rect = navContainerRef.current.getBoundingClientRect();
          if (rect.bottom > 0) {
            maxBottom = rect.bottom + 16;
          }
        }

        // Inside the connected activation zone + navbar envelope (0px to bottom of navbar + 16px)
        const isInsideConnectedEnvelope = e.clientY >= 0 && e.clientY <= maxBottom;

        if (isInsideConnectedEnvelope) {
          // Cursor is in the activation zone or on the navbar pill: cancel any hide timer immediately
          if (cursorHideTimerRef.current) {
            clearTimeout(cursorHideTimerRef.current);
            cursorHideTimerRef.current = null;
          }
        } else {
          // Cursor left the connected area: begin graceful dismissal timer
          if (!cursorHideTimerRef.current) {
            cursorHideTimerRef.current = setTimeout(() => {
              cursorInAreaRef.current = false;
              cursorHideTimerRef.current = null;
              evaluateVisibility();
            }, 400);
          }
        }
      }
    },
    [evaluateVisibility]
  );

  // CONDITION 2: SCROLLING UP
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    const heroThreshold = window.innerHeight * 0.6;
    const scrollDelta = currentScrollY - lastScrollYRef.current;
    lastScrollYRef.current = currentScrollY;

    // Update section highlighting silently in the background
    updateActiveSection(currentScrollY);

    // HERO EXCEPTION
    if (currentScrollY <= heroThreshold) {
      scrollingUpRef.current = false;
      upwardAccumulatorRef.current = 0;
      downwardAccumulatorRef.current = 0;
      if (scrollIdleTimerRef.current) {
        clearTimeout(scrollIdleTimerRef.current);
        scrollIdleTimerRef.current = null;
      }
      evaluateVisibility();
      return;
    }

    if (scrollDelta < 0) {
      // SCROLLING UP
      const upDelta = Math.abs(scrollDelta);
      upwardAccumulatorRef.current += upDelta;
      downwardAccumulatorRef.current = 0;

      // Small debounce threshold (18px) to prevent tiny jitter
      if (upwardAccumulatorRef.current > 18) {
        if (!scrollingUpRef.current) {
          scrollingUpRef.current = true;
          evaluateVisibility();
        }

        // Keep visible while scrolling upward; allow subtle hide if idle
        if (scrollIdleTimerRef.current) {
          clearTimeout(scrollIdleTimerRef.current);
        }
        scrollIdleTimerRef.current = setTimeout(() => {
          scrollingUpRef.current = false;
          scrollIdleTimerRef.current = null;
          evaluateVisibility();
        }, 1800);
      }
    } else if (scrollDelta > 0) {
      // SCROLLING DOWN -> immediately dismiss upward trigger
      downwardAccumulatorRef.current += scrollDelta;
      upwardAccumulatorRef.current = 0;

      if (downwardAccumulatorRef.current > 15) {
        if (scrollingUpRef.current) {
          scrollingUpRef.current = false;
          if (scrollIdleTimerRef.current) {
            clearTimeout(scrollIdleTimerRef.current);
            scrollIdleTimerRef.current = null;
          }
          evaluateVisibility();
        }
      }
    }
  }, [updateActiveSection, evaluateVisibility]);

  useEffect(() => {
    lastScrollYRef.current = window.scrollY;
    updateActiveSection(window.scrollY);
    evaluateVisibility();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    return () => {
      if (cursorHideTimerRef.current) clearTimeout(cursorHideTimerRef.current);
      if (scrollIdleTimerRef.current) clearTimeout(scrollIdleTimerRef.current);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleScroll);
    };
  }, [handleScroll, handleMouseMove, updateActiveSection, evaluateVisibility]);

  const handleScrollTo = (id: string, key: SectionKey) => (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveSection(key);

    window.dispatchEvent(new CustomEvent('aidn-nav-unlock'));

    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      id="main-navigation"
      className={`fixed top-0 inset-x-0 z-50 pointer-events-none transition-all duration-300 ease-out ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 -translate-y-2'
      }`}
    >
      {/* 
        Container with top padding of 36px (pt-9) so the navbar pill sits strictly BELOW
        the 32px top activation zone. When cursor enters activation zone, it remains above
        the navbar pill as the navbar appears smoothly beneath it.
      */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-9 pb-4">
        <div
          ref={navContainerRef}
          onMouseEnter={() => {
            cursorInAreaRef.current = true;
            if (cursorHideTimerRef.current) {
              clearTimeout(cursorHideTimerRef.current);
              cursorHideTimerRef.current = null;
            }
            evaluateVisibility();
          }}
          className={`relative w-full h-[60px] flex items-center justify-between px-5 sm:px-6 md:px-7 rounded-[30px] bg-[#06080d]/85 backdrop-blur-md border border-zinc-800/80 shadow-none ${
            isVisible ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        >
          {/* LEFT SECTION: Static branding AIDN / Pune Chapter */}
          <div className="flex items-center space-x-2.5 sm:space-x-3.5 z-10 shrink-0 select-none">
            <a
              href="#hero-section"
              onClick={handleScrollTo('hero-section', 'hero')}
              className="text-[13px] sm:text-[14px] font-bold tracking-[0.24em] uppercase text-white hover:text-sky-400 transition-colors cursor-pointer"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              AIDN
            </a>
            <span className="text-zinc-600 font-light select-none text-xs sm:text-sm">/</span>
            <span className="text-zinc-400 text-xs sm:text-[13px] font-normal tracking-wide whitespace-nowrap">
              Pune Chapter
            </span>
          </div>

          {/* CENTER NAVIGATION: All major single-page sections */}
          <nav className="hidden md:flex items-center space-x-3 lg:space-x-4 xl:space-x-5 text-[9.5px] lg:text-[10px] xl:text-[10.5px] tracking-[0.09em] lg:tracking-[0.12em] uppercase font-medium overflow-x-auto no-scrollbar max-w-[64%] px-2 py-1 select-none">
            {SECTIONS.map((item) => {
              const isActive = activeSection === item.key;
              return (
                <a
                  key={item.key}
                  href={`#${item.id}`}
                  onClick={handleScrollTo(item.id, item.key)}
                  className={`relative py-1 whitespace-nowrap transition-colors duration-200 cursor-pointer ${
                    isActive ? 'text-sky-400 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-1 left-0 w-full h-[1.5px] bg-sky-400 rounded-full"
                    />
                  )}
                </a>
              );
            })}
          </nav>

          {/* RIGHT CTA: JOIN US -> button */}
          <div className="flex items-center justify-end z-10 shrink-0 select-none">
            <a
              href="#get-involved"
              onClick={handleScrollTo('get-involved', 'get-involved')}
              className="inline-flex items-center space-x-1.5 sm:space-x-2 px-3.5 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-medium tracking-wider uppercase bg-transparent text-zinc-200 border border-zinc-700/80 hover:border-zinc-500 hover:text-white transition-all duration-200 cursor-pointer whitespace-nowrap group"
            >
              <span>JOIN US</span>
              <span className="text-zinc-400 group-hover:text-white text-xs transition-colors">→</span>
            </a>
          </div>
        </div>

        {/* Responsive mobile sub-navigation strip */}
        <div
          className={`flex md:hidden items-center justify-start space-x-4 overflow-x-auto no-scrollbar pt-2 px-2 text-[9.5px] tracking-[0.1em] uppercase font-medium ${
            isVisible ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        >
          {SECTIONS.map((item) => {
            const isActive = activeSection === item.key;
            return (
              <a
                key={item.key}
                href={`#${item.id}`}
                onClick={handleScrollTo(item.id, item.key)}
                className={`relative py-0.5 whitespace-nowrap transition-colors ${
                  isActive ? 'text-sky-400 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-0.5 left-0 w-full h-[1.5px] bg-sky-400 rounded-full"
                  />
                )}
              </a>
            );
          })}
        </div>
      </div>
    </header>
  );
};
