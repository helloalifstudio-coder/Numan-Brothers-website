/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, ShoppingBag, CreditCard, ChevronLeft, ChevronRight, Check, Sparkles, MessageSquare, Truck, ShieldCheck, Ruler } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, CartItem, Review } from '../types';

interface PDPProps {
  product?: Product;
  onBack: () => void;
  onAddToCart: (product: Product, size: string, color: string, quantity: number) => void;
  onBuyNow: (product: Product, size: string, color: string, quantity: number) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isLoading?: boolean;
}

export default function PDP({
  product,
  onBack,
  onAddToCart,
  onBuyNow,
  onShowToast,
  isLoading = false
}: PDPProps) {
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState(product?.colors?.[0]?.name || '');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'shipping'>('desc');
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [sizeChartTab, setSizeChartTab] = useState<'top' | 'bottom'>('top');
  
  // Local Reviews State
  const [reviewsList, setReviewsList] = useState<Review[]>(product?.reviews || []);
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Sticky bottom bar visibility trigger state
  const [showStickyBar, setShowStickyBar] = useState(false);

  useEffect(() => {
    if (!product) return;
    // Reset selection when product changes
    setSelectedSize(product.sizes.length === 1 && product.sizes[0] === 'Unstitched' ? 'Unstitched' : '');
    setSelectedColor(product.colors[0]?.name || '');
    setQuantity(1);
    setActiveImgIdx(0);
    setReviewsList(product.reviews || []);
    setReviewSuccess(false);
  }, [product]);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar once user scrolls past 400px
      if (window.scrollY > 400) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isLoading || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-8 font-sans animate-pulse">
        {/* Back Button Placeholder */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-stone-500 hover:text-stone-900 mb-6 transition-colors font-medium text-xs md:text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to products</span>
        </button>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left Columns: Image Gallery Placeholder */}
          <div className="lg:col-span-7 space-y-4">
            <div className="aspect-[3/4] bg-stone-100 rounded-2xl w-full" />
            {/* Gallery Thumbnails row */}
            <div className="flex gap-2.5 justify-center md:justify-start py-1">
              <div className="w-18 h-24 rounded-lg bg-stone-100 animate-pulse" />
              <div className="w-18 h-24 rounded-lg bg-stone-100 animate-pulse" />
              <div className="w-18 h-24 rounded-lg bg-stone-100 animate-pulse" />
            </div>
            {/* Value props */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-stone-100">
              <div className="h-16 bg-stone-100 rounded-xl" />
              <div className="h-16 bg-stone-100 rounded-xl" />
              <div className="h-16 bg-stone-100 rounded-xl" />
            </div>
          </div>

          {/* Right Column: Details Placeholder */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <div className="h-3 bg-stone-200 rounded w-1/4" />
              <div className="h-8 bg-stone-200 rounded w-3/4" />
              <div className="h-4 bg-stone-200 rounded w-1/3" />
            </div>

            {/* Pricing Box */}
            <div className="h-20 bg-stone-100 rounded-xl" />

            {/* Color Selector */}
            <div className="space-y-2.5">
              <div className="h-3 bg-stone-200 rounded w-1/4" />
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-stone-100" />
                <div className="w-8 h-8 rounded-full bg-stone-100" />
                <div className="w-8 h-8 rounded-full bg-stone-100" />
              </div>
            </div>

            {/* Size Selector */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <div className="h-3 bg-stone-200 rounded w-1/4" />
                <div className="h-3 bg-stone-200 rounded w-1/3" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="h-12 bg-stone-100 rounded-lg" />
                <div className="h-12 bg-stone-100 rounded-lg" />
                <div className="h-12 bg-stone-100 rounded-lg" />
                <div className="h-12 bg-stone-100 rounded-lg" />
              </div>
            </div>

            {/* Stepper qty */}
            <div className="space-y-2.5">
              <div className="h-3 bg-stone-200 rounded w-1/6" />
              <div className="h-11 bg-stone-50 border border-stone-100 rounded-lg w-36" />
            </div>

            {/* Actions buttons */}
            <div className="space-y-3 pt-2">
              <div className="h-12 bg-stone-100 border-2 border-stone-200 rounded-lg" />
              <div className="h-12 bg-stone-200 rounded-lg" />
              <div className="h-12 bg-stone-100 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  


  const discountPercent = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  const incrementQty = () => setQuantity((prev) => prev + 1);
  const decrementQty = () => setQuantity((prev) => Math.max(1, prev - 1));

  const handleAddToCart = () => {
    if (!selectedSize) {
      if (onShowToast) {
        onShowToast('Please select a size first!', 'error');
      } else {
        alert('Please select a size first!');
      }
      return;
    }
    onAddToCart(product, selectedSize, selectedColor, quantity);
    if (onShowToast) {
      onShowToast(`✓ Added ${product.title} to your basket!`, 'success');
    }
  };

  const handleBuyNow = () => {
    if (!selectedSize) {
      if (onShowToast) {
        onShowToast('Please select a size first!', 'error');
      } else {
        alert('Please select a size first!');
      }
      return;
    }
    onBuyNow(product, selectedSize, selectedColor, quantity);
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName || !reviewComment) {
      if (onShowToast) {
        onShowToast('Please fill out all review fields!', 'error');
      } else {
        alert('Please fill out all fields!');
      }
      return;
    }

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      name: reviewName,
      rating: reviewRating,
      date: new Date().toISOString().split('T')[0],
      comment: reviewComment,
      verified: true
    };

    setReviewsList([newReview, ...reviewsList]);
    setReviewName('');
    setReviewComment('');
    setReviewRating(5);
    setReviewSuccess(true);
    setShowReviewForm(false);

    if (onShowToast) {
      onShowToast('✓ Thank you! Your review has been submitted for approval.', 'success');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 md:py-8 font-sans">
      
      {/* Back Button */}
      <button
        id="pdp-back-btn"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-stone-600 hover:text-stone-900 mb-6 transition-colors focus:outline-none"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to collections</span>
      </button>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* Left Columns: Image Gallery (Span 7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[3/4] bg-stone-100 rounded-2xl overflow-hidden shadow-xs">
            
            {/* Sale Indicator Badges */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
              {product.badges.map((b) => (
                <span key={b} className="text-[10px] font-sans font-bold uppercase tracking-wider px-3 py-1 bg-stone-950 text-stone-50 rounded-full">
                  {b}
                </span>
              ))}
              {discountPercent > 0 && (
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider px-3 py-1 bg-red-600 text-white rounded-full">
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            <img
              src={product.images[activeImgIdx]}
              alt={product.title}
              className="w-full h-full object-cover object-top transition-all duration-300"
            />

            {/* Gallery Arrow Controls */}
            <button
              id="pdp-gallery-prev"
              onClick={() => setActiveImgIdx((prev) => (prev - 1 + product.images.length) % product.images.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 hover:bg-white text-stone-800 shadow-md transition-all focus:outline-none"
              aria-label="Previous gallery image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              id="pdp-gallery-next"
              onClick={() => setActiveImgIdx((prev) => (prev + 1) % product.images.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 hover:bg-white text-stone-800 shadow-md transition-all focus:outline-none"
              aria-label="Next gallery image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* 3-Thumbnail Strip Below */}
          <div className="flex gap-2.5 overflow-x-auto justify-center md:justify-start py-1">
            {product.images.map((img, idx) => (
              <button
                id={`pdp-gallery-thumb-${idx}`}
                key={idx}
                onClick={() => setActiveImgIdx(idx)}
                className={`w-18 h-24 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                  idx === activeImgIdx ? 'border-stone-950 scale-102 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover object-top" />
              </button>
            ))}
          </div>

          {/* Trust Value Propositions (Crucial for D2C) */}
          <div className="grid grid-cols-3 gap-3 pt-6 border-t border-stone-100 text-center">
            <div className="flex flex-col items-center p-3 bg-stone-50 rounded-xl border border-stone-200/50">
              <Truck className="w-5 h-5 text-stone-700 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-800">Express Delivery</span>
              <p className="text-[10px] text-stone-400 mt-0.5">2-4 Business Days</p>
            </div>
            <div className="flex flex-col items-center p-3 bg-stone-50 rounded-xl border border-stone-200/50">
              <ShieldCheck className="w-5 h-5 text-stone-700 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-800">COD Available</span>
              <p className="text-[10px] text-stone-400 mt-0.5">Pay at Doorstep</p>
            </div>
            <div className="flex flex-col items-center p-3 bg-stone-50 rounded-xl border border-stone-200/50">
              <Sparkles className="w-5 h-5 text-stone-700 mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-800">100% Premium</span>
              <p className="text-[10px] text-stone-400 mt-0.5">Raw Silk & Zardozi</p>
            </div>
          </div>
        </div>

        {/* Right Column: Order Selection & Details (Span 5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Nomaan Brothers — The Designer Sherwani House</p>
            <h1 className="font-serif text-2xl md:text-3xl font-semibold text-stone-900 leading-tight">
              {product.title}
            </h1>

            {/* Rating Stars Link */}
            <div className="flex items-center gap-2">
              <div className="flex text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < Math.floor(product.rating) ? 'fill-amber-400' : 'text-stone-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-stone-500 font-semibold">{product.rating} / 5.0 ({reviewsList.length} reviews)</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-stone-400 font-sans uppercase tracking-wider">Special Retail Price</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold font-sans text-stone-950">₹{product.price}</span>
                {product.mrp > product.price && (
                  <span className="text-sm font-sans text-stone-400 line-through">₹{product.mrp}</span>
                )}
              </div>
            </div>
            {discountPercent > 0 && (
              <span className="bg-red-50 text-red-700 border border-red-200 text-xs font-bold font-sans uppercase tracking-wider px-3 py-1.5 rounded-lg">
                Save {discountPercent}% Instant
              </span>
            )}
          </div>

          {/* Color Selector */}
          {product.colors.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Colour: <span className="text-stone-950 font-normal">{selectedColor}</span>
              </span>
              <div className="flex gap-2">
                {product.colors.map((c) => (
                  <button
                    id={`pdp-color-swatch-${c.name.toLowerCase().replace(/\s+/g, '-')}`}
                    key={c.name}
                    onClick={() => setSelectedColor(c.name)}
                    style={{ backgroundColor: c.hex }}
                    className={`w-8 h-8 rounded-full border-2 shadow-xs transition-transform ${
                      selectedColor === c.name ? 'border-stone-900 scale-110' : 'border-stone-200 hover:scale-105'
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size Selector Button Grid (Replicating Modest Essentials size button design) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Select Size: <span className="text-stone-950 font-normal">{selectedSize || 'Choose size'}</span>
              </span>
              
              {/* Size Chart Toggle Trigger */}
              <button
                id="pdp-toggle-size-chart-btn"
                onClick={() => setShowSizeChart(!showSizeChart)}
                className="text-xs text-stone-600 hover:text-stone-900 underline inline-flex items-center gap-1 font-semibold"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Size Chart & Measurements</span>
              </button>
            </div>

            {/* Buttons Grid */}
            <div className="grid grid-cols-4 gap-2">
              {product.sizes.map((size) => (
                <button
                  id={`pdp-size-btn-${size}`}
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-3 text-sm font-bold font-sans rounded-lg border transition-all ${
                    selectedSize === size
                      ? 'bg-stone-900 text-white border-stone-900 shadow-sm scale-[1.02]'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            {!selectedSize && (
              <p className="text-[11px] text-red-600 font-medium font-sans">
                ⚠️ Sizing error prevention: Please select a size to activate cart actions.
              </p>
            )}
          </div>

          {/* Size Chart Module (Expandable contrast element inline, as requested) */}
          <AnimatePresence>
            {showSizeChart && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-stone-900 text-stone-100 p-5 rounded-2xl space-y-4 shadow-inner border border-stone-800">
                  <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                    <div>
                      <span className="font-serif text-sm font-semibold tracking-wide text-stone-100">Standard Size Guide (Inches)</span>
                      <p className="text-[9px] text-stone-400 uppercase tracking-widest mt-0.5">Measurement of garment body part</p>
                    </div>
                    
                    {/* Top/Bottom Toggle */}
                    {product.sizeChart.bottom && (
                      <div className="flex gap-1 bg-stone-800 p-0.5 rounded-lg">
                        <button
                          id="pdp-sizechart-tab-top"
                          onClick={() => setSizeChartTab('top')}
                          className={`px-3 py-1 text-[10px] font-bold uppercase rounded ${
                            sizeChartTab === 'top' ? 'bg-white text-stone-900' : 'text-stone-400'
                          }`}
                        >
                          Top
                        </button>
                        <button
                          id="pdp-sizechart-tab-bottom"
                          onClick={() => setSizeChartTab('bottom')}
                          className={`px-3 py-1 text-[10px] font-bold uppercase rounded ${
                            sizeChartTab === 'bottom' ? 'bg-white text-stone-900' : 'text-stone-400'
                          }`}
                        >
                          Bottom
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Size Table Grid */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans">
                      <thead>
                        <tr className="border-b border-stone-800 text-stone-400 font-semibold">
                          <th className="py-2">Size Tag</th>
                          <th className="py-2">{sizeChartTab === 'top' ? 'Chest/Bust' : 'Waist (Stretch)'}</th>
                          <th className="py-2">Length</th>
                          <th className="py-2">Fit/Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-800/50">
                        {sizeChartTab === 'top' ? (
                          product.sizeChart.top.map((row) => (
                            <tr key={row.size} className="text-stone-200">
                              <td className="py-2.5 font-bold text-stone-100">{row.size}</td>
                              <td className="py-2.5">{row.chestOrWaist}</td>
                              <td className="py-2.5">{row.length}</td>
                              <td className="py-2.5 text-stone-400 text-[11px]">{row.extra}</td>
                            </tr>
                          ))
                        ) : (
                          product.sizeChart.bottom?.map((row) => (
                            <tr key={row.size} className="text-stone-200">
                              <td className="py-2.5 font-bold text-stone-100">{row.size}</td>
                              <td className="py-2.5">{row.chestOrWaist}</td>
                              <td className="py-2.5">{row.length}</td>
                              <td className="py-2.5 text-stone-400 text-[11px]">{row.extra}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[10px] text-stone-400 italic">
                    *Tip: For sherwanis and kurtas, allow 2-3 inches ease over exact body chest measurement for royal drape and comfort.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quantity Selector Stepper */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">Quantity</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-stone-200 rounded-lg overflow-hidden bg-stone-50">
                <button
                  id="pdp-qty-decrement"
                  onClick={decrementQty}
                  className="w-11 h-11 flex items-center justify-center text-stone-600 hover:bg-stone-100 font-bold transition-colors focus:outline-none"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-12 text-center text-sm font-bold text-stone-800">{quantity}</span>
                <button
                  id="pdp-qty-increment"
                  onClick={incrementQty}
                  className="w-11 h-11 flex items-center justify-center text-stone-600 hover:bg-stone-100 font-bold transition-colors focus:outline-none"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Checkout Conversion Actions (Add to Cart / Buy It Now) */}
          <div className="space-y-3 pt-2">
            {/* Outline Add to Cart */}
            <button
              id="pdp-add-to-cart-btn"
              onClick={handleAddToCart}
              className="w-full py-3.5 border-2 border-stone-900 hover:bg-stone-50 text-stone-900 text-xs font-sans font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Shopping Cart</span>
            </button>

            {/* Solid Buy It Now */}
            <button
              id="pdp-buy-it-now-btn"
              onClick={handleBuyNow}
              className="w-full py-4 bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs font-sans font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Express Buy It Now</span>
            </button>

            {/* WhatsApp direct order / query button */}
            <button
              id="pdp-whatsapp-enquire-btn"
              onClick={() => {
                const sizeText = selectedSize || '(Size not selected yet)';
                const colorText = selectedColor || '(Color not selected yet)';
                const message = `Hello Nomaan Brothers (The Designer Sherwani House, Warangal)!\n\nI am interested in buying / inquiring about this designer piece:\n\n*Product:* ${product.title}\n*Price:* ₹${product.price}\n*Color:* ${colorText}\n*Size:* ${sizeText}\n*Quantity:* ${quantity}\n\n*Product Link:* ${window.location.origin}/?product=${product.id}\n\nPlease let me know if it is available or if I can visit your Mandi Bazar showroom for trial! Thank you.`;
                const whatsappUrl = `https://wa.me/919908597337?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
                if (onShowToast) {
                  onShowToast('Redirecting you to WhatsApp to ask about this product!', 'success');
                }
              }}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-sans font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 fill-white/10" />
              <span>Inquire / Order on WhatsApp</span>
            </button>
          </div>

          {/* Tabs Accordion for descriptions, specs, and details */}
          <div className="border border-stone-200 rounded-xl overflow-hidden mt-6 divide-y divide-stone-100">
            {/* Header Tabs */}
            <div className="grid grid-cols-3 bg-stone-50 border-b border-stone-100">
              {(['desc', 'specs', 'shipping'] as const).map((tab) => (
                <button
                  id={`pdp-tab-trigger-${tab}`}
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 text-[10px] md:text-xs font-bold uppercase tracking-wider font-sans border-b-2 transition-all ${
                    activeTab === tab
                      ? 'border-stone-900 text-stone-950 bg-white'
                      : 'border-transparent text-stone-400 hover:text-stone-700'
                  }`}
                >
                  {tab === 'desc' ? 'Overview' : tab === 'specs' ? 'Garment Specs' : 'Shipping'}
                </button>
              ))}
            </div>

            {/* Content pane */}
            <div className="p-4 text-stone-600 text-sm leading-relaxed font-sans">
              {activeTab === 'desc' && (
                <div className="space-y-2">
                  <p>{product.description}</p>
                  <p className="text-xs text-stone-400 italic">Length: {product.length}. Standard high-quality embroidery stitching.</p>
                </div>
              )}

              {activeTab === 'specs' && (
                <table className="w-full text-left text-xs divide-y divide-stone-100">
                  <tbody>
                    {product.specs.map((spec) => (
                      <tr key={spec.label} className="border-b border-stone-50">
                        <td className="py-2 font-bold text-stone-500 w-2/5 pr-2">{spec.label}</td>
                        <td className="py-2 text-stone-800">{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'shipping' && (
                <div className="space-y-2 text-xs">
                  <p>✓ **Dispatched within 24 hours** from our warehouse.</p>
                  <p>✓ **Free Express Delivery** for prepaid & COD orders above ₹999.</p>
                  <p>✓ **Hassle-free 7-day exchanges & returns** through our dedicated returns portal.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <section className="mt-14 pt-10 border-t border-stone-200">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="font-serif text-xl md:text-2xl font-semibold text-stone-900">Verified Customer Reviews</h2>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <span className="text-sm text-stone-600 font-semibold">{product.rating} average based on {reviewsList.length} reviews</span>
              </div>
            </div>

            <button
              id="pdp-write-review-toggle"
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs font-sans font-bold uppercase tracking-wider rounded-lg transition-colors inline-flex items-center gap-2 self-start"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Write A Customer Review</span>
            </button>
          </div>

          {/* Interactive Review Writing Form */}
          <AnimatePresence>
            {showReviewForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <form onSubmit={handleReviewSubmit} className="bg-stone-50 border border-stone-200 p-5 rounded-xl space-y-4">
                  <h3 className="font-serif font-medium text-stone-900">Share Your Experience</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="pdp-review-name" className="text-xs font-bold uppercase text-stone-500 tracking-wider">Your Name</label>
                      <input
                        id="pdp-review-name"
                        type="text"
                        required
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full bg-white border border-stone-200 rounded-lg p-3 text-sm focus:outline-none focus:border-stone-800 font-sans"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase text-stone-500 tracking-wider">Star Rating</label>
                      <div className="flex gap-1.5 py-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            id={`review-star-select-${star}`}
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="text-amber-400 hover:scale-110 transition-transform focus:outline-none"
                          >
                            <Star className={`w-6 h-6 ${star <= reviewRating ? 'fill-amber-400' : 'text-stone-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="pdp-review-comment" className="text-xs font-bold uppercase text-stone-500 tracking-wider">Your Review</label>
                    <textarea
                      id="pdp-review-comment"
                      required
                      rows={4}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="What did you think of the fabric quality, embroidery details, and size fit?"
                      className="w-full bg-white border border-stone-200 rounded-lg p-3 text-sm focus:outline-none focus:border-stone-800 font-sans"
                    />
                  </div>

                  <button
                    id="pdp-review-submit-btn"
                    type="submit"
                    className="px-6 py-3 bg-stone-900 text-white font-sans text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-stone-800 transition-colors"
                  >
                    Submit Verified Review
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success review toast */}
          {reviewSuccess && (
            <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-100 text-xs font-sans font-medium">
              ✓ Thank you! Your review has been added to our system as a verified purchase review.
            </div>
          )}

          {/* Reviews List */}
          <div className="divide-y divide-stone-150 space-y-6">
            {reviewsList.map((rev) => (
              <div key={rev.id} className="pt-6 first:pt-0 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-sans font-bold text-sm text-stone-900 mr-2">{rev.name}</span>
                    {rev.verified && (
                      <span className="bg-stone-100 text-stone-600 text-[9px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                        ✓ Verified Buyer
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-stone-400 font-sans">{rev.date}</span>
                </div>

                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}`} />
                  ))}
                </div>

                <p className="text-stone-600 text-sm leading-relaxed font-sans">{rev.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Sticky Add to Cart Conversion Bar (Mobile-only, once scrolled past fold) */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 80 }}
            animate={{ y: 0 }}
            exit={{ y: 80 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-stone-200 p-3 md:hidden flex items-center justify-between gap-3 shadow-lg"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase font-bold text-stone-400 tracking-wider truncate">Nomaan Brothers</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold font-sans text-stone-950">₹{product.price}</span>
                {product.mrp > product.price && (
                  <span className="text-[10px] font-sans text-stone-400 line-through">₹{product.mrp}</span>
                )}
              </div>
            </div>

            <div className="flex gap-2 flex-shrink-0">
              {/* If no size, prompt user */}
              {!selectedSize ? (
                <button
                  id="pdp-sticky-no-size"
                  onClick={() => {
                    setSelectedSize(product.sizes[0]);
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                  className="px-4 py-2.5 bg-stone-900 text-white text-[11px] font-sans font-bold uppercase tracking-wider rounded-lg"
                >
                  Choose Size
                </button>
              ) : (
                <>
                  <button
                    id="pdp-sticky-add"
                    onClick={handleAddToCart}
                    className="px-3.5 py-2.5 border border-stone-900 text-stone-900 text-[11px] font-sans font-bold uppercase tracking-wider rounded-lg"
                  >
                    Add
                  </button>
                  <button
                    id="pdp-sticky-buy"
                    onClick={handleBuyNow}
                    className="px-5 py-2.5 bg-stone-900 text-white text-[11px] font-sans font-bold uppercase tracking-wider rounded-lg"
                  >
                    Buy Now
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
