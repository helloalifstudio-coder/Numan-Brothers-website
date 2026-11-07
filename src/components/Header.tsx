/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isSearchOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsSearchOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isSearchOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
    setIsSearchOpen(false);
  };

  return (
    <>
      {/* A single, stable message avoids distraction and unverified claims. */}
      <div className="bg-stone-950 px-4 py-2.5 text-center text-[11px] font-medium tracking-[0.12em] text-stone-200">
        Discover traditional menswear in Mandi Bazar, Warangal
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

          {/* Accessible brand/home action */}
          <button
            type="button"
            className="min-w-0 flex-1 cursor-pointer select-none text-center md:flex-none"
            onClick={onNavigateHome}
            aria-label="Nomaan Brothers - return to home"
          >
            <span className="block font-serif text-xl font-semibold leading-none tracking-wide text-stone-900 md:text-2xl lg:text-3xl">
              Nomaan
            </span>
            <span className="mt-1 block max-w-[210px] text-[8px] font-semibold uppercase tracking-[0.19em] text-stone-500 md:max-w-none md:text-[10px] md:tracking-[0.25em]">
              Brothers · The Designer Sherwani House
            </span>
          </button>

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
            role="dialog"
            aria-modal="true"
            aria-label="Search collections"
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
                  aria-label="Close search"
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
