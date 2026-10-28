/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TRUST_ANNOUNCEMENTS } from '../data';

interface HeaderProps {
  cartCount: number;
  onMenuOpen: () => void;
  onCartOpen: () => void;
  onSearch: (query: string) => void;
  onNavigateHome: () => void;
  onOpenAboutModal: () => void;
}

export default function Header({
  cartCount,
  onMenuOpen,
  onCartOpen,
  onSearch,
  onNavigateHome,
  onOpenAboutModal
}: HeaderProps) {
  const [announcementIdx, setAnnouncementIdx] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Rotate announcements every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIdx((prev) => (prev + 1) % TRUST_ANNOUNCEMENTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
    setIsSearchOpen(false);
  };

  return (
    <>
      {/* 1. Announcement Bar */}
      <div className="bg-stone-900 text-stone-100 py-2.5 text-center text-xs tracking-wider transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center min-h-[16px]">
          <AnimatePresence mode="wait">
            <motion.p
              key={announcementIdx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="font-sans font-medium flex items-center gap-1.5"
            >
              {TRUST_ANNOUNCEMENTS[announcementIdx]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      {/* 2. Main Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-100 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          
          {/* Left: Hamburger menu */}
          <div className="flex items-center gap-4">
            <button
              id="header-hamburger-btn"
              onClick={onMenuOpen}
              className="p-2 -ml-2 text-stone-800 hover:text-stone-600 transition-colors focus:outline-none"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6 stroke-[1.5]" />
            </button>
          </div>

          {/* Center: Branding (Heritage Serif paired with clean tracked sans-serif) */}
          <div className="text-center select-none cursor-pointer" onClick={onNavigateHome}>
            <h1 className="font-serif text-xl md:text-2xl lg:text-3xl font-semibold text-stone-900 tracking-wide leading-none">
              Nomaan
            </h1>
            <p className="font-sans text-[9px] md:text-[10px] uppercase font-semibold text-stone-500 tracking-[0.25em] mt-0.5 md:mt-1">
              Brothers • The Designer Sherwani House
            </p>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1 md:gap-2">
            <button
              id="header-search-btn"
              onClick={() => setIsSearchOpen(true)}
              className="p-2 text-stone-800 hover:text-stone-600 transition-colors focus:outline-none"
              aria-label="Search products"
            >
              <Search className="w-5.5 h-5.5 stroke-[1.5]" />
            </button>

            <button
              id="header-account-btn"
              onClick={onOpenAboutModal}
              className="p-2 text-stone-800 hover:text-stone-600 transition-colors focus:outline-none"
              aria-label="Account / Brand Story"
            >
              <User className="w-5.5 h-5.5 stroke-[1.5]" />
            </button>

            <button
              id="header-cart-btn"
              onClick={onCartOpen}
              className="p-2 text-stone-800 hover:text-stone-600 transition-colors focus:outline-none relative"
              aria-label="Shopping cart"
            >
              <ShoppingBag className="w-5.5 h-5.5 stroke-[1.5]" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 bg-stone-900 text-stone-100 text-[10px] font-sans font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white shadow"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* 3. Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-start justify-center pt-20 px-4"
          >
            <motion.div
              initial={{ y: -30, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: -30, scale: 0.95 }}
              className="bg-white w-full max-w-xl rounded-xl shadow-xl overflow-hidden p-4 border border-stone-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                <span className="font-serif font-medium text-stone-900 text-lg">Search Collections</span>
                <button
                  id="search-close-btn"
                  onClick={() => setIsSearchOpen(false)}
                  className="p-1.5 hover:bg-stone-50 rounded-full text-stone-400 hover:text-stone-600 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    id="search-input-field"
                    type="text"
                    placeholder="Search sherwanis, kurtas, arabic thoobs, jodhpuri suits..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-stone-800 font-sans"
                    autoFocus
                  />
                  <Search className="absolute right-3.5 top-3.5 w-4.5 h-4.5 text-stone-400 pointer-events-none" />
                </div>
                <button
                  id="search-submit-btn"
                  type="submit"
                  className="px-5 bg-stone-900 text-white font-sans text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-stone-800 transition-colors"
                >
                  Search
                </button>
              </form>

              <div className="mt-4">
                <p className="text-[11px] uppercase font-semibold text-stone-400 tracking-wider mb-2">Popular Searches</p>
                <div className="flex flex-wrap gap-2">
                  {['Groom Sherwani', 'Sequence Kurta', 'Arabic Thoob', 'Jodhpuri Suit', 'Silk Safa & Mala'].map((tag) => (
                    <button
                      id={`search-popular-${tag.toLowerCase().replace(/\s+/g, '-')}`}
                      key={tag}
                      type="button"
                      onClick={() => {
                        setSearchQuery(tag);
                        onSearch(tag);
                        setIsSearchOpen(false);
                      }}
                      className="text-xs text-stone-600 bg-stone-50 hover:bg-stone-100 px-3 py-1.5 rounded-full transition-colors font-sans"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
