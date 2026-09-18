import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface ActivityItem {
  id: string;
  number: string;
  title: string;
  description: string;
  image: string;
  fallbackImage: string;
  placardCode: string;
  location: string;
}

export const ACTIVITIES: ActivityItem[] = [
  {
    id: 'dev-days',
    number: '01',
    title: 'DEV DAYS',
    description: 'Developer meetups, talks, discussions, demos and networking.',
    image: '/events/01-dev-days.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=85',
    placardCode: 'ACT.01 // MEETUPS & DEMOS',
    location: 'PUNE, IN',
  },
  {
    id: 'workshops',
    number: '02',
    title: 'WORKSHOPS',
    description: 'Hands-on sessions around AI/ML, LLMs, agents and emerging developer technologies.',
    image: '/events/02-workshops.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=85',
    placardCode: 'ACT.02 // CODE LABS & AGENTS',
    location: 'PUNE, IN',
  },
  {
    id: 'hackathons',
    number: '03',
    title: 'HACKATHONS',
    description: 'Collaborative builds, prototypes and real-world problem solving.',
    image: '/events/03-hackathons.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=85',
    placardCode: 'ACT.03 // SPRINT BUILDS',
    location: 'PUNE, IN',
  },
  {
    id: 'knowledge-sharing',
    number: '04',
    title: 'KNOWLEDGE SHARING',
    description: 'Technical sessions, keynotes, community discussions and experiences.',
    image: '/events/04-knowledge-sharing.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=85',
    placardCode: 'ACT.04 // KEYNOTES & DIALOGUE',
    location: 'PUNE, IN',
  },
];

// Resting physical offsets when cards sit in the background stack
const RESTING_CONFIGS = [
  { rot: -3.4, tx: -16, ty: 10, tz: 0 },
  { rot: 2.2, tx: 12, ty: -8, tz: -38 },
  { rot: -1.8, tx: -10, ty: 14, tz: -76 },
  { rot: 2.8, tx: 14, ty: -4, tz: -114 },
];

// Tuning parameters for scroll-locking story progression
const TOTAL_WHEEL_DELTA = 2200; // Total scroll delta across all 4 states
const COMPLETION_THRESHOLD = 280; // Extra deliberate scroll needed after reaching 100% to unlock to Section 3
const ENTRY_THRESHOLD = 280; // Extra deliberate scroll needed after reaching 0% to unlock to Hero
const TOTAL_TOUCH_DELTA = 1100; // Touch drag sensitivity

/**
 * Continuous mapping from normalized progress p in [0, 1]
 * to continuous state position [0, 3] with resting plateaus
 * where each memory is clearly experienced in focus.
 */
function progressToStatePos(p: number): number {
  const clampP = Math.max(0, Math.min(1, p));

  // State 0 (DEV DAYS): 0% to 8% holding plateau
  if (clampP <= 0.08) {
    return 0;
  }
  // Transition 0 -> 1: 8% to 32%
  if (clampP < 0.32) {
    const t = (clampP - 0.08) / (0.32 - 0.08);
    return 0 + t * t * (3 - 2 * t) * 1.0;
  }
  // State 1 (WORKSHOPS): 32% to 42% holding plateau
  if (clampP <= 0.42) {
    return 1.0;
  }
  // Transition 1 -> 2: 42% to 66%
  if (clampP < 0.66) {
    const t = (clampP - 0.42) / (0.66 - 0.42);
    return 1.0 + t * t * (3 - 2 * t) * 1.0;
  }
  // State 2 (HACKATHONS): 66% to 76% holding plateau
  if (clampP <= 0.76) {
    return 2.0;
  }
  // Transition 2 -> 3: 76% to 94%
  if (clampP < 0.94) {
    const t = (clampP - 0.76) / (0.94 - 0.76);
    return 2.0 + t * t * (3 - 2 * t) * 1.0;
  }
  // State 3 (KNOWLEDGE SHARING): 94% to 100% holding plateau
  return 3.0;
}

export const WhatWeDoSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  // Normalized progress: 0.0 (State 1 start) to 1.0 (State 4 complete)
  const [progress, setProgress] = useState(0);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);

  // Lock state
  const [isLocked, setIsLocked] = useState(false);
  const isLockedRef = useRef(false);

  // Scroll completion accumulator to ensure state 4 is savored before unlocking
  const completionHoldRef = useRef(0);
  const entryHoldRef = useRef(0);

  // Touch tracking
  const touchStartYRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // Keep isLockedRef synchronized
  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  // Smooth animation loop interpolating currentProgress towards targetProgress
  useEffect(() => {
    const tick = () => {
      const diff = targetProgressRef.current - currentProgressRef.current;
      if (Math.abs(diff) > 0.0002) {
        currentProgressRef.current += diff * 0.12;
        setProgress(currentProgressRef.current);
      } else if (currentProgressRef.current !== targetProgressRef.current) {
        currentProgressRef.current = targetProgressRef.current;
        setProgress(currentProgressRef.current);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Helper to get exact top position of Section 2
  const getSectionTop = useCallback(() => {
    if (!sectionRef.current) return 0;
    const rect = sectionRef.current.getBoundingClientRect();
    return window.scrollY + rect.top;
  }, []);

  // Monitor viewport position to engage or disengage scroll-lock
  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleWindowScroll = () => {
      const el = sectionRef.current;
      if (!el) return;

      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY >= lastScrollY;
      lastScrollY = currentScrollY;

      const sectionTop = getSectionTop();
      const distance = Math.abs(currentScrollY - sectionTop);

      // If already locked, keep anchored
      if (isLockedRef.current) {
        if (distance > 3) {
          window.scrollTo({ top: sectionTop, behavior: 'instant' });
        }
        return;
      }

      // Check if user is scrolling into Section 2
      // Case 1: Entering from HERO (scrolling down)
      if (scrollingDown && currentScrollY >= sectionTop - 15 && currentScrollY < sectionTop + window.innerHeight * 0.5) {
        if (targetProgressRef.current < 0.98) {
          setIsLocked(true);
          window.scrollTo({ top: sectionTop, behavior: 'instant' });
          completionHoldRef.current = 0;
          entryHoldRef.current = 0;
        }
      }
      // Case 2: Entering from SECTION 3 (scrolling up)
      else if (!scrollingDown && currentScrollY <= sectionTop + 15 && currentScrollY > sectionTop - window.innerHeight * 0.5) {
        if (targetProgressRef.current > 0.02) {
          setIsLocked(true);
          window.scrollTo({ top: sectionTop, behavior: 'instant' });
          targetProgressRef.current = 1.0;
          currentProgressRef.current = 1.0;
          setProgress(1.0);
          completionHoldRef.current = 0;
          entryHoldRef.current = 0;
        }
      }
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, [getSectionTop]);

  // WHEEL & TRACKPAD INTERCEPTION
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (!isLockedRef.current) return;

      const deltaY = e.deltaY;
      if (Math.abs(deltaY) < 0.1) return;

      if (deltaY > 0) {
        // Scrolling forward (down)
        if (targetProgressRef.current < 1.0) {
          e.preventDefault();
          const next = targetProgressRef.current + deltaY / TOTAL_WHEEL_DELTA;
          targetProgressRef.current = Math.min(1.0, next);
          completionHoldRef.current = 0;
        } else {
          // Reached 100% (State 4 KNOWLEDGE SHARING)
          // Require extra intentional scrolling to confirm chapter exit
          completionHoldRef.current += deltaY;
          if (completionHoldRef.current < COMPLETION_THRESHOLD) {
            e.preventDefault();
          } else {
            // UNLOCK to Section 3!
            setIsLocked(false);
            const nextSection = document.getElementById('about-section');
            if (nextSection) {
              nextSection.scrollIntoView({ behavior: 'smooth' });
            } else {
              window.scrollBy({ top: 80, behavior: 'smooth' });
            }
          }
        }
      } else if (deltaY < 0) {
        // Scrolling backward (up)
        if (targetProgressRef.current > 0.0) {
          e.preventDefault();
          const next = targetProgressRef.current + deltaY / TOTAL_WHEEL_DELTA;
          targetProgressRef.current = Math.max(0.0, next);
          entryHoldRef.current = 0;
        } else {
          // Reached 0% (State 1 DEV DAYS)
          // Require extra intentional upward scrolling to confirm return to Hero
          entryHoldRef.current += Math.abs(deltaY);
          if (entryHoldRef.current < ENTRY_THRESHOLD) {
            e.preventDefault();
          } else {
            // UNLOCK to Hero!
            setIsLocked(false);
            const heroSection = document.getElementById('hero-section');
            if (heroSection) {
              heroSection.scrollIntoView({ behavior: 'smooth' });
            } else {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // TOUCH INPUT INTERCEPTION (Mobile & Tablet)
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartYRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isLockedRef.current) return;

      const currentY = e.touches[0].clientY;
      const deltaY = touchStartYRef.current - currentY; // positive = scroll down

      if (Math.abs(deltaY) < 1) return;

      if (deltaY > 0) {
        // Dragging down / forward
        if (targetProgressRef.current < 1.0) {
          if (e.cancelable) e.preventDefault();
          const next = targetProgressRef.current + deltaY / TOTAL_TOUCH_DELTA;
          targetProgressRef.current = Math.min(1.0, next);
          touchStartYRef.current = currentY;
          completionHoldRef.current = 0;
        } else {
          completionHoldRef.current += deltaY;
          if (completionHoldRef.current < COMPLETION_THRESHOLD) {
            if (e.cancelable) e.preventDefault();
          } else {
            setIsLocked(false);
            const nextSection = document.getElementById('about-section');
            if (nextSection) nextSection.scrollIntoView({ behavior: 'smooth' });
          }
        }
      } else if (deltaY < 0) {
        // Dragging up / backward
        if (targetProgressRef.current > 0.0) {
          if (e.cancelable) e.preventDefault();
          const next = targetProgressRef.current + deltaY / TOTAL_TOUCH_DELTA;
          targetProgressRef.current = Math.max(0.0, next);
          touchStartYRef.current = currentY;
          entryHoldRef.current = 0;
        } else {
          entryHoldRef.current += Math.abs(deltaY);
          if (entryHoldRef.current < ENTRY_THRESHOLD) {
            if (e.cancelable) e.preventDefault();
          } else {
            setIsLocked(false);
            const heroSection = document.getElementById('hero-section');
            if (heroSection) heroSection.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  // KEYBOARD NAVIGATION
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLockedRef.current) return;

      if (['ArrowDown', 'PageDown', 'Space'].includes(e.code)) {
        if (targetProgressRef.current < 1.0) {
          e.preventDefault();
          targetProgressRef.current = Math.min(1.0, targetProgressRef.current + 0.12);
        } else {
          completionHoldRef.current += 100;
          if (completionHoldRef.current >= COMPLETION_THRESHOLD) {
            setIsLocked(false);
          }
        }
      } else if (['ArrowUp', 'PageUp'].includes(e.code)) {
        if (targetProgressRef.current > 0.0) {
          e.preventDefault();
          targetProgressRef.current = Math.max(0.0, targetProgressRef.current - 0.12);
        } else {
          entryHoldRef.current += 100;
          if (entryHoldRef.current >= ENTRY_THRESHOLD) {
            setIsLocked(false);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Calculate continuous state position from progress (0.0 to 3.0)
  const statePos = progressToStatePos(progress);

  // Clicking an activity step smoothly navigates directly to that memory
  const handleStepClick = (idx: number) => {
    const stepTargetProgress = [0.04, 0.37, 0.71, 0.98][idx];
    targetProgressRef.current = stepTargetProgress;
    if (!isLockedRef.current) {
      setIsLocked(true);
      const sectionTop = getSectionTop();
      window.scrollTo({ top: sectionTop, behavior: 'smooth' });
    }
  };

  // Hermite interpolation for typography fade/slide
  const hermite = (t: number) => {
    const c = Math.max(0, Math.min(1, t));
    return c * c * (3 - 2 * c);
  };

  // Current active index for counter display
  const activeDisplayIndex = Math.min(3, Math.max(0, Math.round(statePos)));

  return (
    <section
      ref={sectionRef}
      id="what-we-do"
      className="relative w-full h-screen bg-[#020408] text-white overflow-hidden select-none"
    >
      {/* FULL-VIEWPORT STAGE */}
      <div className="h-full w-full flex flex-col justify-between py-6 sm:py-10 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto">
        
        {/* TOP BAR: SECTION TITLE & CONTINUOUS PROGRESS INDICATOR */}
        <div className="w-full flex items-center justify-between pt-2 z-30">
          <div className="flex items-center space-x-3">
            <span
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                isLocked
                  ? 'bg-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.8)] scale-110'
                  : 'bg-zinc-500'
              }`}
            />
            <h2
              id="what-we-do-title"
              className="text-xs sm:text-sm font-semibold tracking-[0.24em] uppercase text-zinc-300"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              What We Do at AIDN
            </h2>
          </div>

          {/* Minimal Story Counter & Lock Status */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-1 text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              <span>Story</span>
              <span className="text-zinc-300 font-semibold">0{activeDisplayIndex + 1}</span>
              <span>/</span>
              <span>04</span>
            </div>

            {/* Continuous thin progress track */}
            <div className="w-20 sm:w-28 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-400 to-zinc-200 transition-all duration-75 ease-out"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* MAIN TWO-PART COMPOSITION:
            LEFT: Physical Stack of AIDN Event Photographs
            RIGHT: Typography & Information (NO CARDS / NO BOXED UI)
        */}
        <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center my-auto py-2">
          
          {/* ========================================================================= */}
          {/* LEFT HALF: PHYSICAL PHOTO STACK (7 columns on desktop)                     */}
          {/* ========================================================================= */}
          <div className="lg:col-span-7 w-full flex items-center justify-center lg:justify-start relative">
            
            {/* Cinematic Directional Light Pool on the Photo Stage */}
            <div
              className="absolute -top-16 -left-12 w-96 h-96 rounded-full pointer-events-none transition-opacity duration-700"
              style={{
                background: 'radial-gradient(circle, rgba(235, 245, 255, 0.06) 0%, rgba(2, 4, 8, 0) 70%)',
                filter: 'blur(40px)',
              }}
            />

            {/* 3D PERSPECTIVE STACK CONTAINER */}
            <div
              className="relative w-[290px] sm:w-[380px] md:w-[440px] xl:w-[490px] aspect-[4/3]"
              style={{
                perspective: '1300px',
                transformStyle: 'preserve-3d',
              }}
            >
              {ACTIVITIES.map((activity, idx) => {
                // delta is how far this photo is from the continuous active position
                const delta = statePos - idx;
                const absDelta = Math.abs(delta);
                const resting = RESTING_CONFIGS[idx];

                let tx = resting.tx;
                let ty = resting.ty;
                let tz = resting.tz;
                let rot = resting.rot;
                let brightness = 0.35;
                let shadowOpacity = 0.65;
                let scale = 0.96;
                let zIndex = 10 - Math.round(absDelta * 3);

                if (absDelta < 1.0) {
                  // In active transition window
                  const t = 1 - absDelta;
                  const smoothT = hermite(t);

                  // Active position: sits slightly farther right within the LEFT half
                  const activeTx = 36;
                  const activeTy = -8;
                  const activeTz = 90;
                  const activeRot = -0.3;

                  tx = resting.tx + (activeTx - resting.tx) * smoothT;
                  ty = resting.ty + (activeTy - resting.ty) * smoothT;
                  tz = resting.tz + (activeTz - resting.tz) * smoothT;
                  rot = resting.rot + (activeRot - resting.rot) * smoothT;

                  scale = 0.96 + 0.07 * smoothT;
                  brightness = 0.35 + 0.71 * smoothT; // 0.35 -> 1.06
                  shadowOpacity = 0.65 * (1 - smoothT); // 0.65 -> 0
                  zIndex = 30 + Math.round(smoothT * 10);
                } else if (delta > 0) {
                  // Receded past photos (user has scrolled forward past them)
                  const pastFactor = Math.min(2, delta);
                  tx = resting.tx - 14 * pastFactor;
                  ty = resting.ty + 10 * pastFactor;
                  tz = resting.tz - 32 * pastFactor;
                  rot = resting.rot - 0.9 * pastFactor;
                  brightness = Math.max(0.22, 0.38 - pastFactor * 0.08);
                  shadowOpacity = Math.min(0.80, 0.62 + pastFactor * 0.1);
                  zIndex = 5 - Math.round(pastFactor);
                }

                const isCurrentActive = absDelta < 0.45;

                return (
                  <div
                    key={activity.id}
                    onClick={() => handleStepClick(idx)}
                    className="absolute inset-0 cursor-pointer group transition-shadow duration-300"
                    style={{
                      transform: `translate3d(${tx}px, ${ty}px, ${tz}px) rotate(${rot}deg) scale(${scale})`,
                      zIndex,
                      willChange: 'transform, filter',
                      transformOrigin: 'bottom left',
                    }}
                    title={`View ${activity.title}`}
                  >
                    {/* PHYSICAL PHOTOGRAPH PLACARD */}
                    <div
                      className="relative w-full h-full rounded-sm p-2 sm:p-2.5 pb-7 sm:pb-8 bg-[#0c0f14] transition-all duration-300"
                      style={{
                        boxShadow: isCurrentActive
                          ? '0 35px 70px -15px rgba(0, 0, 0, 0.95), 0 16px 32px -8px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.12)'
                          : '0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 8px 16px -6px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                        filter: `brightness(${brightness})`,
                      }}
                    >
                      {/* Photo Image Frame */}
                      <div className="relative w-full h-full overflow-hidden rounded-[1px] bg-zinc-950">
                        <img
                          src={activity.image}
                          alt={`AIDN ${activity.title}`}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            if (target.src !== activity.fallbackImage) {
                              target.src = activity.fallbackImage;
                            }
                          }}
                          className="w-full h-full object-cover object-center select-none pointer-events-none"
                        />

                        {/* Physical Shadow Falloff Mask for Rear Cards */}
                        <div
                          className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-200"
                          style={{ opacity: shadowOpacity }}
                        />

                        {/* Subtle Specular Surface Glare on Active Print */}
                        {isCurrentActive && (
                          <div
                            className="absolute inset-0 pointer-events-none"
                            style={{
                              background:
                                'linear-gradient(135deg, rgba(255, 255, 255, 0.11) 0%, rgba(255, 255, 255, 0) 55%)',
                            }}
                          />
                        )}
                      </div>

                      {/* PHYSICAL PLACARD BOTTOM MARGIN (Archival Print Annotation) */}
                      <div className="absolute bottom-1.5 sm:bottom-2 left-3 right-3 flex items-center justify-between text-[9px] sm:text-[10px] font-mono tracking-widest text-zinc-400/80 uppercase">
                        <span className="truncate pr-2">{activity.placardCode}</span>
                        <span className="text-zinc-500 shrink-0">{activity.location}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT HALF: TYPOGRAPHY AND SHORT INFORMATION (5 columns on desktop)       */}
          {/* CRITICAL: Must NOT have any card, glass panel, container, or boxed UI     */}
          {/* ========================================================================= */}
          <div className="lg:col-span-5 w-full flex flex-col justify-center relative min-h-[220px] sm:min-h-[260px] pl-2 lg:pl-6">
            {ACTIVITIES.map((activity, idx) => {
              const delta = statePos - idx;
              const absDelta = Math.abs(delta);

              let opacity = 0;
              let translateY = 32;

              if (absDelta < 1.0) {
                const t = 1 - absDelta;
                opacity = hermite(t);
                // Synchronized to the exact same progress timeline:
                // Current text moves upward (-32px) and fades away
                // Next text enters from below (+32px) and fades in
                translateY = -delta * 32;
              } else if (delta > 0) {
                opacity = 0;
                translateY = -36;
              } else {
                opacity = 0;
                translateY = 36;
              }

              const isVisible = opacity > 0.01;

              return (
                <div
                  key={`text-${activity.id}`}
                  className={`transition-none ${
                    isVisible ? 'pointer-events-auto' : 'pointer-events-none'
                  }`}
                  style={{
                    opacity,
                    transform: `translate3d(0, ${translateY}px, 0)`,
                    position: idx === 0 ? 'relative' : 'absolute',
                    top: idx === 0 ? undefined : 0,
                    left: idx === 0 ? undefined : 0,
                    right: idx === 0 ? undefined : 0,
                    willChange: 'opacity, transform',
                  }}
                  aria-hidden={!isVisible}
                >
                  {/* Category Number and Title */}
                  <div className="flex items-baseline space-x-3 mb-3 sm:mb-4">
                    <span className="text-xs sm:text-sm font-bold tracking-[0.2em] text-zinc-500 font-mono">
                      {activity.number}
                    </span>
                    <h3
                      className="text-2xl sm:text-3xl md:text-4xl xl:text-5xl font-bold tracking-[0.12em] uppercase text-zinc-100 leading-tight"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {activity.title}
                    </h3>
                  </div>

                  {/* Restrained accent line */}
                  <div className="w-10 h-[1px] bg-gradient-to-r from-zinc-500/80 to-transparent mb-4 sm:mb-5" />

                  {/* Concise Description: Pure typography, secondary to visual photo */}
                  <p
                    className="text-base sm:text-lg md:text-xl text-zinc-300/90 leading-relaxed max-w-lg font-normal"
                    style={{
                      fontFamily: 'var(--font-sans)',
                      textShadow: '0 2px 20px rgba(0, 0, 0, 0.8)',
                    }}
                  >
                    {activity.description}
                  </p>
                </div>
              );
            })}
          </div>

        </div>

        {/* BOTTOM BAR: STEP NAVIGATION & SCROLL LOCK CUE */}
        <div className="w-full flex items-center justify-between pb-2 border-t border-zinc-900/60 pt-4 z-20">
          <div className="flex items-center space-x-3">
            {ACTIVITIES.map((act, i) => {
              const active = Math.abs(statePos - i) < 0.5;
              return (
                <button
                  key={act.id}
                  onClick={() => handleStepClick(i)}
                  className="flex items-center space-x-1.5 group cursor-pointer focus:outline-none"
                  title={`Jump to ${act.title}`}
                >
                  <span
                    className={`block h-1 rounded-full transition-all duration-300 ${
                      active
                        ? 'w-7 bg-zinc-200 shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                        : 'w-2 bg-zinc-700/80 group-hover:bg-zinc-500'
                    }`}
                  />
                  <span
                    className={`text-[10px] font-mono transition-colors duration-200 hidden sm:inline ${
                      active ? 'text-zinc-300 font-semibold' : 'text-zinc-600 group-hover:text-zinc-400'
                    }`}
                  >
                    {act.number}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Dynamic Scroll Lock Guidance */}
          <div className="flex items-center space-x-2 text-[11px] tracking-[0.16em] uppercase text-zinc-500">
            {progress >= 0.98 ? (
              <span className="text-zinc-300 font-medium animate-pulse">
                Chapter Complete · Scroll to continue
              </span>
            ) : isLocked ? (
              <span>Scroll to progress chapter</span>
            ) : (
              <span>Scroll to explore</span>
            )}
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-300 ${
                progress >= 0.98 ? 'text-sky-400 animate-bounce' : 'text-zinc-500'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>

      </div>
    </section>
  );
};
