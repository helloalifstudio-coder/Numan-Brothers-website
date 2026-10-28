/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { SlidersHorizontal, ArrowUpDown, X, Grid, List, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';
import { CATEGORIES, FABRICS, SIZES } from '../data';
import ProductCard from './ProductCard';

interface PLPProps {
  products: Product[];
  activeCategory: string;
  onSelectProduct: (product: Product) => void;
  wishlistedIds: string[];
  onToggleWishlist: (id: string, e: React.MouseEvent) => void;
  isLoading?: boolean;
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col bg-white rounded-xl overflow-hidden border border-stone-100 relative animate-pulse">
      {/* 1. Image View Container Placeholder */}
      <div className="relative aspect-[3/4] bg-stone-100 w-full" />
      {/* 2. Content Details Placeholder */}
      <div className="p-3 md:p-4 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-2">
          {/* Vendor & Rating Placeholder */}
          <div className="flex items-center justify-between">
            <div className="h-3 bg-stone-100 rounded w-1/3" />
            <div className="h-3 bg-stone-100 rounded w-1/6" />
          </div>
          {/* Title Placeholder */}
          <div className="space-y-1.5">
            <div className="h-4 bg-stone-200 rounded w-full" />
            <div className="h-4 bg-stone-200 rounded w-2/3" />
          </div>
          {/* Fabric Placeholder */}
          <div className="h-3 bg-stone-100 rounded w-1/4" />
        </div>
        {/* Colors & Price Placeholder */}
        <div className="pt-2 border-t border-stone-50 flex items-end justify-between">
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-stone-100" />
            <div className="w-2.5 h-2.5 rounded-full bg-stone-100" />
            <div className="w-2.5 h-2.5 rounded-full bg-stone-100" />
          </div>
          <div className="h-4 bg-stone-200 rounded w-1/4" />
        </div>
      </div>
    </div>
  );
}

type SortOption = 'trending' | 'price-asc' | 'price-desc' | 'rating';

export default function PLP({
  products,
  activeCategory,
  onSelectProduct,
  wishlistedIds,
  onToggleWishlist,
  isLoading = false
}: PLPProps) {
  const [selectedFabric, setSelectedFabric] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>(''); // 'Set', 'Top Only', 'Unstitched'
  const [sortBy, setSortBy] = useState<SortOption>('trending');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (activeCategory !== 'all') {
      if (activeCategory === 'new-arrivals') {
        // Just mock some of them as new
        result = result.filter(p => p.badges.includes('New') || p.badges.includes('Pinterest Pick'));
      } else if (activeCategory === 'best-sellers') {
        result = result.filter(p => p.badges.includes('Best Seller') || p.rating >= 4.8);
      } else if (activeCategory === 'sale') {
        result = result.filter(p => p.mrp > p.price);
      } else {
        result = result.filter(p => p.category === activeCategory);
      }
    }

    // Fabric filter
    if (selectedFabric) {
      result = result.filter(p => p.fabric.toLowerCase().includes(selectedFabric.toLowerCase()));
    }

    // Size filter
    if (selectedSize) {
      result = result.filter(p => p.sizes.includes(selectedSize));
    }

    // Type filter
    if (selectedType) {
      result = result.filter(p => p.type === selectedType);
    }

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else {
      // Trending (default) - Best Sellers or Higher Rating first
      result.sort((a, b) => (b.reviewsCount * b.rating) - (a.reviewsCount * a.rating));
    }

    return result;
  }, [products, activeCategory, selectedFabric, selectedSize, selectedType, sortBy]);

  const activeCategoryName = CATEGORIES.find(c => c.id === activeCategory)?.name || 'All Collections';

  const resetFilters = () => {
    setSelectedFabric('');
    setSelectedSize('');
    setSelectedType('');
  };

  const hasActiveFilters = selectedFabric || selectedSize || selectedType;

  return (
    <>
      <Helmet>
        <title>{activeCategoryName} | Nomaan Brothers — The Designer Sherwani House</title>
        <meta name="description" content={`Explore our curated collection of ${activeCategoryName} at Nomaan Brothers — The Designer Sherwani House, Warangal. High-quality groom sherwanis, festive kurtas & ethnic wear.`} />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-10">
      
      {/* Category Info Header */}
      <div className="mb-6 md:mb-10 text-center md:text-left">
        <h2 className="font-serif text-2xl md:text-4xl text-stone-900 font-semibold tracking-wide">
          {activeCategoryName}
        </h2>
        {isLoading ? (
          <div className="h-4 bg-stone-100 rounded w-48 mt-2.5 animate-pulse mx-auto md:mx-0" />
        ) : (
          <p className="text-xs md:text-sm text-stone-500 font-sans mt-1.5">
            Showing {filteredProducts.length} premium ethnic garments
          </p>
        )}
      </div>

      {/* Desktop Filter Layout: Sidebar + Grid */}
      <div className="flex gap-8 items-start">
        
        {/* Desktop Sidebar Filters (Hidden on Mobile) */}
        {isLoading ? (
          <aside className="hidden lg:block w-64 flex-shrink-0 space-y-6 sticky top-28 bg-white p-5 border border-stone-100 rounded-xl shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <span className="font-sans font-bold text-xs uppercase tracking-wider text-stone-900">Filters</span>
            </div>
            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold text-stone-700 uppercase tracking-wider font-sans">Garment Size</h4>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 bg-stone-100 rounded animate-pulse" />
                ))}
              </div>
            </div>
            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold text-stone-700 uppercase tracking-wider font-sans">Product Type</h4>
              <div className="space-y-1.5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-9 bg-stone-50 rounded animate-pulse" />
                ))}
              </div>
            </div>
            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold text-stone-700 uppercase tracking-wider font-sans">Fabric</h4>
              <div className="space-y-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-9 bg-stone-50 rounded animate-pulse" />
                ))}
              </div>
            </div>
          </aside>
        ) : (
          <aside className="hidden lg:block w-64 flex-shrink-0 space-y-6 sticky top-28 bg-white p-5 border border-stone-100 rounded-xl shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <span className="font-sans font-bold text-xs uppercase tracking-wider text-stone-900">Filters</span>
              {hasActiveFilters && (
                <button
                  id="plp-desktop-reset-btn"
                  onClick={resetFilters}
                  className="text-xs text-red-600 hover:text-red-700 font-medium font-sans flex items-center gap-1"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Size Filter */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold text-stone-700 uppercase tracking-wider font-sans">Garment Size</h4>
              <div className="grid grid-cols-4 gap-2">
                {SIZES.map((size) => (
                  <button
                    id={`filter-size-${size}`}
                    key={size}
                    onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
                    className={`py-2 text-xs font-sans font-bold rounded border transition-all ${
                      selectedSize === size
                        ? 'bg-stone-900 text-stone-100 border-stone-900'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold text-stone-700 uppercase tracking-wider font-sans">Product Type</h4>
              <div className="space-y-1.5">
                {['Set', 'Top Only', 'Unstitched'].map((type) => (
                  <button
                    id={`filter-type-${type.toLowerCase().replace(/\s+/g, '-')}`}
                    key={type}
                    onClick={() => setSelectedType(selectedType === type ? '' : type)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left rounded border transition-all ${
                      selectedType === type
                        ? 'bg-stone-900 text-stone-100 border-stone-900 font-semibold'
                        : 'bg-stone-50 text-stone-600 border-stone-100 hover:bg-stone-100'
                    }`}
                  >
                    <span className="font-sans">{type === 'Set' ? 'Sherwani & Kurta Sets' : type === 'Top Only' ? 'Kurtas & Thoobs (Single)' : 'Sherwani Fabrics'}</span>
                    {selectedType === type && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Fabric Filter */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold text-stone-700 uppercase tracking-wider font-sans">Fabric</h4>
              <div className="space-y-1.5">
                {FABRICS.map((fabric) => (
                  <button
                    id={`filter-fabric-${fabric.toLowerCase().replace(/\s+/g, '-')}`}
                    key={fabric}
                    onClick={() => setSelectedFabric(selectedFabric === fabric ? '' : fabric)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left rounded border transition-all ${
                      selectedFabric === fabric
                        ? 'bg-stone-900 text-stone-100 border-stone-900 font-semibold'
                        : 'bg-stone-50 text-stone-600 border-stone-100 hover:bg-stone-100'
                    }`}
                  >
                    <span className="font-sans">{fabric}</span>
                    {selectedFabric === fabric && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <div className="flex-1 space-y-4">
          
          {/* Controls Bar (Filter toggle, Active filters and Sort dropdown) */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-50 p-3 rounded-xl border border-stone-100">
            {/* Filter Toggle for Mobile / Active indicator */}
            <div className="flex items-center gap-2">
              <button
                id="plp-mobile-filter-btn"
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden flex items-center gap-1.5 px-3.5 py-2 bg-white rounded-lg border border-stone-200 text-xs font-sans font-bold text-stone-800 hover:bg-stone-100 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4 stroke-[1.5]" />
                <span>Filters {hasActiveFilters ? '•' : ''}</span>
              </button>

              <div className="hidden lg:flex items-center gap-1">
                <Grid className="w-4.5 h-4.5 text-stone-800" />
                <span className="text-xs text-stone-400 font-sans">Grid view</span>
              </div>
            </div>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="plp-sort-select" className="text-xs text-stone-500 font-sans hidden sm:inline">Sort by:</label>
              <div className="relative">
                <select
                  id="plp-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="appearance-none bg-white border border-stone-200 rounded-lg pl-3 pr-8 py-2 text-xs font-sans font-semibold text-stone-800 focus:outline-none focus:border-stone-800 cursor-pointer"
                >
                  <option value="trending">Featured & Trending</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
                <ArrowUpDown className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-stone-400">Active:</span>
              
              {selectedSize && (
                <span className="flex items-center gap-1 bg-stone-100 text-stone-800 text-xs py-1 px-2.5 rounded-full font-sans">
                  <span>Size: {selectedSize}</span>
                  <button id="clear-size-chip" onClick={() => setSelectedSize('')} className="text-stone-400 hover:text-stone-700">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedType && (
                <span className="flex items-center gap-1 bg-stone-100 text-stone-800 text-xs py-1 px-2.5 rounded-full font-sans">
                  <span>Type: {selectedType}</span>
                  <button id="clear-type-chip" onClick={() => setSelectedType('')} className="text-stone-400 hover:text-stone-700">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedFabric && (
                <span className="flex items-center gap-1 bg-stone-100 text-stone-800 text-xs py-1 px-2.5 rounded-full font-sans">
                  <span>Fabric: {selectedFabric}</span>
                  <button id="clear-fabric-chip" onClick={() => setSelectedFabric('')} className="text-stone-400 hover:text-stone-700">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                id="plp-clear-all-chips"
                onClick={resetFilters}
                className="text-xs text-stone-400 hover:text-stone-800 underline font-sans"
              >
                Clear all
              </button>
            </div>
          )}

          {/* PLP Product Grid (2-column on mobile, 3/4-column on desktop) */}
          {isLoading ? (
            <div key="skeleton-grid" className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 md:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div key="product-grid" className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 md:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={onSelectProduct}
                  isWishlisted={wishlistedIds.includes(product.id)}
                  onToggleWishlist={onToggleWishlist}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-stone-50 border border-stone-100 rounded-xl">
              <p className="font-serif text-lg text-stone-800">No matching garments found</p>
              <p className="text-xs text-stone-400 mt-1 font-sans">Try widening your search criteria or clearing filters.</p>
              <button
                id="plp-reset-no-results-btn"
                onClick={resetFilters}
                className="mt-4 px-5 py-2.5 bg-stone-900 text-stone-100 text-xs font-sans font-bold uppercase tracking-wider rounded-lg hover:bg-stone-800 transition-all"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer Filters */}
      <AnimatePresence>
        {showMobileFilters && (
          <motion.div
            key="plp-filter-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMobileFilters(false)}
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-50 lg:hidden"
          />
        )}
        {showMobileFilters && (
          <motion.div
            key="plp-filter-sidebar"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-sm bg-white z-50 flex flex-col h-full shadow-2xl lg:hidden"
          >
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <span className="font-serif font-semibold text-lg text-stone-900">Filter Collections</span>
              <button
                id="plp-mobile-filter-close"
                onClick={() => setShowMobileFilters(false)}
                className="p-1.5 hover:bg-stone-50 rounded-full text-stone-400"
              >
                <X className="w-5.5 h-5.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Size Filter */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider font-sans">Garment Size</h4>
                <div className="grid grid-cols-4 gap-2">
                  {SIZES.map((size) => (
                    <button
                      id={`mobile-filter-size-${size}`}
                      key={size}
                      onClick={() => setSelectedSize(selectedSize === size ? '' : size)}
                      className={`py-2 text-xs font-sans font-bold rounded border transition-all ${
                        selectedSize === size
                          ? 'bg-stone-900 text-stone-100 border-stone-900'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type Filter */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider font-sans">Product Type</h4>
                <div className="space-y-1.5">
                  {['Set', 'Top Only', 'Unstitched'].map((type) => (
                    <button
                      id={`mobile-filter-type-${type.toLowerCase().replace(/\s+/g, '-')}`}
                      key={type}
                      onClick={() => setSelectedType(selectedType === type ? '' : type)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left rounded border transition-all ${
                        selectedType === type
                          ? 'bg-stone-900 text-stone-100 border-stone-900 font-semibold'
                          : 'bg-stone-50 text-stone-600 border-stone-100'
                      }`}
                    >
                      <span className="font-sans">{type === 'Set' ? 'Sherwani & Kurta Sets' : type === 'Top Only' ? 'Kurtas & Thoobs (Single)' : 'Sherwani Fabrics'}</span>
                      {selectedType === type && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Fabric Filter */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider font-sans">Fabric</h4>
                <div className="space-y-1.5">
                  {FABRICS.map((fabric) => (
                    <button
                      id={`mobile-filter-fabric-${fabric.toLowerCase().replace(/\s+/g, '-')}`}
                      key={fabric}
                      onClick={() => setSelectedFabric(selectedFabric === fabric ? '' : fabric)}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left rounded border transition-all ${
                        selectedFabric === fabric
                          ? 'bg-stone-900 text-stone-100 border-stone-900 font-semibold'
                          : 'bg-stone-50 text-stone-600 border-stone-100'
                      }`}
                    >
                      <span className="font-sans">{fabric}</span>
                      {selectedFabric === fabric && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-stone-100 bg-stone-50 flex gap-3">
              <button
                id="plp-mobile-filter-reset"
                onClick={() => { resetFilters(); setShowMobileFilters(false); }}
                className="flex-1 py-3 text-xs font-sans font-bold uppercase tracking-wider text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-100 transition-colors"
              >
                Clear All
              </button>
              <button
                id="plp-mobile-filter-apply"
                onClick={() => setShowMobileFilters(false)}
                className="flex-1 py-3 text-xs font-sans font-bold uppercase tracking-wider text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </>
  );
}
