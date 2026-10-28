/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, ChevronRight, CornerDownRight, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CATEGORIES } from '../data';

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeCategory: string;
  onSelectCategory: (id: string) => void;
  onOpenStory: () => void;
  onOpenReturns: () => void;
}

export default function MegaMenu({
  isOpen,
  onClose,
  activeCategory,
  onSelectCategory,
  onOpenStory,
  onOpenReturns
}: MegaMenuProps) {
  const handleCategoryClick = (id: string) => {
    onSelectCategory(id);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="megamenu-root" className="fixed inset-0 z-50">
          {/* Backdrop */}
          <motion.div
            key="megamenu-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs cursor-pointer"
          />

          {/* Drawer */}
          <motion.div
            key="megamenu-drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-y-0 left-0 w-full max-w-sm bg-white flex flex-col h-full shadow-2xl border-r border-stone-100"
          >
            {/* Header */}
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div>
                <span className="font-serif font-semibold text-lg text-stone-900">Nomaan Brothers</span>
                <p className="text-[10px] font-sans text-stone-400 uppercase tracking-wider">The Designer Sherwani House • Warangal</p>
              </div>
              <button
                id="megamenu-close-btn"
                onClick={onClose}
                className="p-1.5 hover:bg-stone-50 rounded-full text-stone-400 hover:text-stone-700 transition-all focus:outline-none"
              >
                <X className="w-5.5 h-5.5" />
              </button>
            </div>

            {/* Menu Links */}
            <div className="flex-1 overflow-y-auto px-5 py-4 divide-y divide-stone-100">
              
              {/* Category Listings */}
              <div className="pb-4 space-y-1">
                <p className="text-[10px] font-sans font-bold uppercase text-stone-400 tracking-wider mb-2.5">Shop Categories</p>
                {CATEGORIES.map((cat) => {
                  const isCurrent = activeCategory === cat.id;
                  return (
                    <button
                      id={`megamenu-cat-${cat.id}`}
                      key={cat.id}
                      onClick={() => handleCategoryClick(cat.id)}
                      className={`w-full flex items-center justify-between py-3 text-left transition-colors focus:outline-none ${
                        isCurrent
                          ? 'text-stone-900 font-semibold'
                          : 'text-stone-700 hover:text-stone-900'
                      }`}
                    >
                      <span className="font-sans text-sm">{cat.name}</span>
                      <ChevronRight className={`w-4 h-4 transition-transform ${isCurrent ? 'text-stone-900' : 'text-stone-400'}`} />
                    </button>
                  );
                })}
              </div>

              {/* Utility / Customer Service Links */}
              <div className="py-4 space-y-1">
                <p className="text-[10px] font-sans font-bold uppercase text-stone-400 tracking-wider mb-2.5">Customer Support</p>
                
                <button
                  id="megamenu-utility-story"
                  onClick={() => { onOpenStory(); onClose(); }}
                  className="w-full flex items-center gap-2.5 py-2 text-left font-sans text-xs text-stone-600 hover:text-stone-900 transition-colors"
                >
                  <CornerDownRight className="w-3.5 h-3.5 text-stone-400" />
                  <span>Our Heritage Story</span>
                </button>

                <button
                  id="megamenu-utility-returns"
                  onClick={() => { onOpenReturns(); onClose(); }}
                  className="w-full flex items-center gap-2.5 py-2 text-left font-sans text-xs text-stone-600 hover:text-stone-900 transition-colors"
                >
                  <CornerDownRight className="w-3.5 h-3.5 text-stone-400" />
                  <span>Returns, Exchange & Delivery Details</span>
                </button>

                <div className="flex items-center gap-2.5 py-2 font-sans text-xs text-stone-400">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Need help? WhatsApp +91 99085 97337</span>
                </div>
              </div>
            </div>

            {/* Locale / Switchers Fixed Bottom (Removed Country/Language switchers) */}
            <div className="p-5 border-t border-stone-100 bg-stone-50">
              {/* Trust Tag */}
              <div className="text-[10px] font-sans text-stone-500 font-medium text-center">
                Warangal's Trusted Groom & Ethnic House ♡
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
