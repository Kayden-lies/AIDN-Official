import React, { useEffect, useRef, useState } from 'react';

/**
 * Circle with a Dot custom cursor component.
 * Features a pure white circle with a centrally locked/fixed white dot.
 * The dot is rigidly locked to the center of the circle with 0 lag/drift between them,
 * moving together as a unified precision reticle.
 */
export const CustomCursor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only enable custom cursor if fine pointer (mouse) is present
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (!hasFinePointer) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);

      // Instantly position the fixed circle + dot unit directly at cursor coordinates
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }

      // Check if hovering interactive target
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = Boolean(
          target.closest('button, a, input, textarea, select, [role="button"], .cursor-pointer, #scroll-indicator')
        );
        setIsHovered(interactive);
      }
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);
    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [isVisible]);

  return (
    <div
      ref={cursorRef}
      className={`fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none flex items-center justify-center transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-hidden="true"
      style={{ willChange: 'transform' }}
    >
      {/* Outer White Circle */}
      <div
        className={`rounded-full border border-white/90 flex items-center justify-center transition-[width,height,transform,background-color,border-color,box-shadow] duration-150 ease-out ${
          isHovered
            ? 'w-9 h-9 border-white bg-white/10 scale-110 shadow-[0_0_12px_rgba(255,255,255,0.4)]'
            : isClicking
            ? 'w-5 h-5 border-white bg-white/20 scale-95 shadow-[0_0_8px_rgba(255,255,255,0.5)]'
            : 'w-7 h-7 bg-white/[0.04] shadow-[0_0_8px_rgba(255,255,255,0.2)]'
        }`}
      >
        {/* Fixed Central White Dot inside the Circle */}
        <div
          className={`rounded-full bg-white transition-[width,height,opacity] duration-150 ease-out shadow-[0_0_4px_rgba(255,255,255,0.9)] ${
            isHovered ? 'w-2 h-2' : isClicking ? 'w-1 h-1 opacity-70' : 'w-1.5 h-1.5'
          }`}
        />
      </div>
    </div>
  );
};
