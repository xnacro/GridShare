import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import FaIcon from '../icons/FaIcon';
import NavPill from './NavPill';
import NavUtility from './NavUtility';
import NavMobileDrawer from './NavMobileDrawer';

export default function GridShareNav({
  onOpenDemoModal,
  onOpenHealthModal,
  onOpenLoginModal,
}) {
  // Navigation collapse state with persistent localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('gridshare_nav_collapsed');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('gridshare_nav_collapsed', JSON.stringify(next));
      } catch { }
      return next;
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 ease-out select-none ${isScrolled
            ? 'py-2 sm:py-2.5 bg-white/75 backdrop-blur-2xl border-b border-white/80 shadow-[0_4px_20px_rgba(15,34,51,0.03)]'
            : 'py-3 sm:py-3.5 bg-[#E6FFFD]/60 backdrop-blur-lg'
          }`}
      >
        <div className="mx-auto flex max-w-[1680px] items-center justify-between px-4 sm:px-8">

          {/* LEFT: MODERN BRAND IDENTITY WITH SVG LOGO */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <NavLink
              to="/"
              className="flex items-center space-x-2.5 group focus:outline-none"
              title="GridShare — Intelligent Community Microgrid"
            >
              {/* Premium Geometric GridShare Logo Mark */}
              <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-white via-white/95 to-[#E8F3F1] border border-white/90 shadow-[0_4px_12px_rgba(15,34,51,0.06),inset_0_1px_1px_rgba(255,255,255,1)] flex items-center justify-center p-1.5 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-[0_6px_16px_rgba(21,107,92,0.18)]">
                <svg viewBox="0 0 32 32" fill="none" className="w-full h-full">
                  {/* Energy Wave Nodes */}
                  <circle cx="16" cy="7" r="3" fill="#156B5C" />
                  <circle cx="7" cy="22" r="3" fill="#0F2233" />
                  <circle cx="25" cy="22" r="3" fill="#D99A1F" />
                  
                  {/* Bilateral Sharing Lines */}
                  <path d="M16 7L7 22" stroke="#156B5C" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="1 3" />
                  <path d="M16 7L25 22" stroke="#D99A1F" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M7 22L25 22" stroke="#0F2233" strokeWidth="1.8" strokeLinecap="round" />
                  
                  {/* Center Pulsing Energy Core */}
                  <circle cx="16" cy="17" r="2.2" fill="#156B5C" />
                  <circle cx="16" cy="17" r="4" stroke="#2DD4BF" strokeWidth="0.8" opacity="0.6" />
                </svg>
              </div>

              {/* Typography Wordmark */}
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#0F2233] group-hover:text-[#156B5C] transition-colors">
                    GridShare
                  </span>
                  <span className="text-[10px] font-bold text-[#156B5C] bg-[#E8F3F1] border border-[#156B5C]/20 px-1.5 py-0.2 rounded-md tracking-wider">
                    v5
                  </span>
                </div>
              </div>
            </NavLink>
          </div>

          {/* CENTER: FLOATING PILL NAVIGATION (Desktop / Tablet) */}
          <div className="hidden lg:flex flex-1 items-center justify-center px-4">
            <NavPill
              onOpenDemoModal={onOpenDemoModal}
              onOpenHealthModal={onOpenHealthModal}
            />
          </div>

          {/* RIGHT: MINIMAL UTILITY AREA */}
          <div className="hidden lg:flex items-center space-x-3 flex-shrink-0">
            <NavUtility onOpenLoginModal={onOpenLoginModal} />
          </div>

          {/* MOBILE TOP CONTROLS */}
          <div className="flex items-center space-x-2.5 lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/90 bg-white/80 backdrop-blur-md text-[#0F2233] shadow-xs hover:bg-white transition"
              aria-label="Open Navigation"
            >
              <FaIcon name="bars" className="text-sm" />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE SLIDE-OUT DRAWER */}
      <NavMobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        onOpenDemoModal={onOpenDemoModal}
        onOpenHealthModal={onOpenHealthModal}
        onOpenLoginModal={onOpenLoginModal}
      />
    </>
  );
}
