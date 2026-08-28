import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import FaIcon from '../icons/FaIcon';
import NavPill from './NavPill';
import NavUtility from './NavUtility';
import NavMobileDrawer from './NavMobileDrawer';

export default function GridShareNav({
  onOpenDemoModal,
  onOpenHealthModal,
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
      } catch {}
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
        className={`sticky top-0 z-40 w-full transition-all duration-200 ease-out select-none ${
          isScrolled
            ? 'py-2 sm:py-2.5 bg-[#F5F6F2]/90 backdrop-blur-md'
            : 'py-3 sm:py-3.5 bg-[#F5F6F2]'
        }`}
      >
        <div className="mx-auto flex max-w-[1680px] items-center justify-between px-4 sm:px-8">
          
          {/* LEFT: BRAND IDENTITY */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <NavLink
              to="/"
              className="flex items-center space-x-2.5 group focus:outline-none"
              title="GridShare AI Operating Platform"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#12251D] text-white shadow-sm group-hover:bg-[#173C2B] transition-colors">
                <FaIcon name="energy" className="text-base text-[#39C985]" />
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-base font-extrabold tracking-tight text-[#142019]">
                  GRID<span className="text-[#1C9A67]">SHARE</span>
                </span>
              </div>
            </NavLink>
          </div>

          {/* CENTER: FLOATING PILL NAVIGATION (Desktop / Tablet) */}
          <div className="hidden lg:flex flex-1 items-center justify-center px-4">
            <NavPill
              isCollapsed={isCollapsed}
              onToggleCollapse={toggleCollapse}
              onOpenDemoModal={onOpenDemoModal}
              onOpenHealthModal={onOpenHealthModal}
            />
          </div>

          {/* RIGHT: MINIMAL UTILITY AREA */}
          <div className="hidden lg:flex items-center space-x-3 flex-shrink-0">
            <NavUtility />
          </div>

          {/* MOBILE TOP CONTROLS */}
          <div className="flex items-center space-x-2.5 lg:hidden">
            <div className="flex items-center px-2 py-0.5 rounded-full bg-[#E7F5EE] text-[#1C9A67] text-[10px] font-bold border border-[#DDE4DF]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1C9A67] animate-pulse mr-1" />
              <span>LIVE</span>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#DDE4DF] bg-white text-[#142019] shadow-subtle hover:bg-[#F5F6F2] transition"
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
      />
    </>
  );
}
