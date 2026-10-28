/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Heart, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../types';
import LazyImage from './LazyImage';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  isWishlisted: boolean;
  onToggleWishlist: (id: string, e: React.MouseEvent) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  isWishlisted,
  onToggleWishlist
}) => {
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const discountPercent = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIdx((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImgIdx((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  return (
    <div
      onClick={() => onSelect(product)}
      className="group cursor-pointer flex flex-col bg-white rounded-xl overflow-hidden border border-stone-100 transition-all duration-300 hover:shadow-md relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setActiveImgIdx(0);
      }}
    >
      {/* 1. Image View Container */}
      <div className="relative aspect-[3/4] bg-stone-50 overflow-hidden w-full">
        {/* Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1.5 max-w-[70%]">
          {product.badges.map((b) => {
            let bgClass = 'bg-stone-950 text-stone-100';
            if (b === 'Set') bgClass = 'bg-emerald-850 bg-emerald-900 text-emerald-50';
            if (b === 'Unstitched') bgClass = 'bg-stone-600 text-stone-100';
            if (b === 'Best Seller') bgClass = 'bg-amber-600 text-amber-50';
            if (b.includes('Colours') || b.includes('Trending')) bgClass = 'bg-stone-200 text-stone-800 font-medium';

            return (
              <span
                key={b}
                className={`text-[9px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${bgClass}`}
              >
                {b}
              </span>
            );
          })}
          {discountPercent > 0 && (
            <span className="text-[9px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-600 text-white">
              {discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          id={`wishlist-toggle-${product.id}`}
          onClick={(e) => onToggleWishlist(product.id, e)}
          className="absolute top-2.5 right-2.5 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-stone-600 hover:text-red-500 hover:scale-105 active:scale-95 shadow-sm transition-all focus:outline-none"
          aria-label="Toggle wishlist"
        >
          <Heart
            className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 stroke-red-500' : 'stroke-stone-700'}`}
          />
        </button>

        {/* Images with subtle transition on hover */}
        <LazyImage
          src={product.images[activeImgIdx]}
          alt={product.title}
          className="w-full h-full"
          imgClassName="transition-transform duration-500 group-hover:scale-[1.03]"
        />

        {/* Swipe indicators (dots) */}
        {product.images.length > 1 && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {product.images.map((_, idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === activeImgIdx ? 'bg-stone-900 scale-125' : 'bg-stone-300'
                }`}
              />
            ))}
          </div>
        )}

        {/* Arrow Navigation (only visible when hovered or on touch) */}
        {product.images.length > 1 && (isHovered || 'ontouchstart' in window) && (
          <>
            <button
              id={`card-prev-img-${product.id}`}
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/70 hover:bg-white text-stone-800 shadow-sm transition-all focus:outline-none"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id={`card-next-img-${product.id}`}
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/70 hover:bg-white text-stone-800 shadow-sm transition-all focus:outline-none"
              aria-label="Next image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {/* 2. Content Details */}
      <div className="p-3 md:p-4 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          {/* Vendor & Rating */}
          <div className="flex items-center justify-between text-[11px] text-stone-400 font-sans">
            <span className="uppercase tracking-wider font-semibold">Nomaan Brothers</span>
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
              <span className="text-stone-700 font-semibold">{product.rating}</span>
            </span>
          </div>

          {/* Title */}
          <h3 className="font-serif text-sm md:text-base text-stone-800 font-medium group-hover:text-stone-900 transition-colors line-clamp-2">
            {product.title}
          </h3>

          {/* Fabric */}
          <p className="text-xs text-stone-400 font-sans italic">{product.fabric} fabric</p>
        </div>

        {/* Colors & Price */}
        <div className="mt-2 pt-2 border-t border-stone-50 flex items-end justify-between gap-1.5">
          {/* Swatches */}
          <div className="flex gap-1 overflow-hidden py-1 max-w-[50%]">
            {product.colors.map((c) => (
              <span
                key={c.name}
                style={{ backgroundColor: c.hex }}
                className="w-2.5 h-2.5 rounded-full border border-stone-200 shadow-xs flex-shrink-0"
                title={c.name}
              />
            ))}
          </div>

          {/* Price */}
          <div className="text-right">
            {product.mrp > product.price && (
              <span className="text-[10px] md:text-xs text-stone-400 line-through mr-1 font-sans">
                ₹{product.mrp}
              </span>
            )}
            <span className="text-xs md:text-sm font-sans font-bold text-stone-950">
              ₹{product.price}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
