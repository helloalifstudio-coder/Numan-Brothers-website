/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, CheckCircle2, Ticket, CreditCard, Sparkles, Truck, Heart, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CartItem, OrderDetails } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQty: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  userPoints: number;
  onAwardPoints: (pts: number, desc: string) => void;
  userProfile?: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    pincode: string;
  };
  onPlaceOrder?: (orderData: { id: string; total: number; paymentMethod: 'COD' | 'Card'; shippingDetails: any }) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  userPoints,
  onAwardPoints,
  userProfile,
  onPlaceOrder,
  onShowToast
}: CartDrawerProps) {
  // Steps: 'cart' | 'shipping' | 'success'
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'shipping' | 'success'>('cart');
  
  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; type: 'percent' | 'flat'; value: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  // Shipping Form State
  const [shippingDetails, setShippingDetails] = useState<OrderDetails>(() => {
    return {
      name: userProfile?.name || '',
      email: userProfile?.email || '',
      phone: userProfile?.phone || '',
      address: userProfile?.address || '',
      city: userProfile?.city || '',
      pincode: userProfile?.pincode || '',
      paymentMethod: 'COD'
    };
  });

  // Keep shipping details in sync when drawer opens and userProfile is filled
  React.useEffect(() => {
    if (isOpen && userProfile) {
      setShippingDetails((prev) => ({
        ...prev,
        name: prev.name || userProfile.name || '',
        email: prev.email || userProfile.email || '',
        phone: prev.phone || userProfile.phone || '',
        address: prev.address || userProfile.address || '',
        city: prev.city || userProfile.city || '',
        pincode: prev.pincode || userProfile.pincode || '',
      }));
    }
  }, [isOpen, userProfile]);

  // Success Order ID state
  const [placedOrderId, setPlacedOrderId] = useState('');

  // Pricing calculations
  const subtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  
  // Discount
  const discountAmount = appliedDiscount
    ? appliedDiscount.type === 'percent'
      ? Math.round(subtotal * (appliedDiscount.value / 100))
      : appliedDiscount.value
    : 0;

  const finalSubtotal = Math.max(0, subtotal - discountAmount);
  
  // Shipping: Free above ₹999, else ₹80
  const shippingFee = finalSubtotal >= 999 || finalSubtotal === 0 ? 0 : 80;
  
  // COD Fee: ₹40 only if paymentMethod is COD, else 0
  const codFee = shippingDetails.paymentMethod === 'COD' && finalSubtotal > 0 ? 40 : 0;
  
  const totalAmount = finalSubtotal + shippingFee + codFee;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const code = couponCode.trim().toUpperCase();

    if (code === 'NOMAAN10' || code === 'SUMERA10') {
      setAppliedDiscount({ code: 'NOMAAN10', type: 'percent', value: 10 });
      setCouponCode('');
      if (onShowToast) onShowToast('✓ Coupon NOMAAN10 applied! Saved 10% off your subtotal.', 'success');
    } else if (code === 'WELCOME100') {
      setAppliedDiscount({ code: 'WELCOME100', type: 'flat', value: 100 });
      setCouponCode('');
      if (onShowToast) onShowToast('✓ Coupon WELCOME100 applied! Saved ₹100 flat off.', 'success');
    } else if (code === 'FESTIVE250' && subtotal >= 1999) {
      setAppliedDiscount({ code: 'FESTIVE250', type: 'flat', value: 250 });
      setCouponCode('');
      if (onShowToast) onShowToast('✓ Coupon FESTIVE250 applied! Saved ₹250 off festive sets.', 'success');
    } else if (code === 'FESTIVE250') {
      const errMsg = 'FESTIVE250 requires a minimum purchase of ₹1999';
      setCouponError(errMsg);
      if (onShowToast) onShowToast(errMsg, 'error');
    } else {
      const errMsg = 'Invalid coupon code. Try NOMAAN10 (10% off) or WELCOME100';
      setCouponError(errMsg);
      if (onShowToast) onShowToast(errMsg, 'error');
    }
  };

  const getWhatsAppUrl = (orderIdStr?: string) => {
    const itemsText = cartItems.map((item) => {
      return `• *${item.product.title}*
  SKU: ${item.product.id}
  Type: ${item.product.type}
  Size: ${item.selectedSize}
  Color: ${item.selectedColor}
  Qty: ${item.quantity}
  Price: ₹${item.product.price * item.quantity}`;
    }).join('\n\n');

    const discountText = discountAmount > 0 
      ? `\n- Discount: −₹${discountAmount} (${appliedDiscount?.code})` 
      : '';

    const deliveryText = shippingFee === 0 ? 'FREE' : `₹${shippingFee}`;
    const codText = shippingDetails.paymentMethod === 'COD' && checkoutStep === 'shipping' ? `\n- COD Collection Fee: ₹${codFee}` : '';

    const idSection = orderIdStr ? `*Order ID:* ${orderIdStr}\n` : '';

    let customerDetails = '';
    if (shippingDetails.name || shippingDetails.phone || shippingDetails.address) {
      customerDetails = `*Customer Details:*\n` +
        (shippingDetails.name ? `👤 *Name:* ${shippingDetails.name}\n` : '') +
        (shippingDetails.email ? `📧 *Email:* ${shippingDetails.email}\n` : '') +
        (shippingDetails.phone ? `📱 *Phone:* ${shippingDetails.phone}\n` : '') +
        (shippingDetails.address ? `📍 *Address:* ${shippingDetails.address}, ${shippingDetails.city} - ${shippingDetails.pincode}\n` : '') +
        `\n`;
    }

    const message = `🌟 *NEW ORDER / ENQUIRY - NOMAAN BROTHERS* 🌟\n*The Designer Sherwani House — Mandi Bazar, Warangal*\n\n` +
      idSection +
      `*Date:* ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}\n\n` +
      customerDetails +
      `*Ordered Items:*\n${itemsText}\n\n` +
      `*Order Summary:*\n` +
      `- Subtotal: ₹${subtotal}` +
      discountText +
      `\n- Delivery: ${deliveryText}` +
      codText +
      `\n- *Absolute Total: ₹${totalAmount}*\n` +
      (shippingDetails.name ? `- Payment Method: ${shippingDetails.paymentMethod === 'COD' ? 'Cash On Delivery (COD)' : 'Prepaid (Card/UPI)'}\n` : '') +
      `\nPlease confirm my order! Thank you.`;

    return `https://wa.me/919908597337?text=${encodeURIComponent(message)}`;
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShippingDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate form
    const { name, email, phone, address, city, pincode } = shippingDetails;
    if (!name || !email || !phone || !address || !city || !pincode) {
      if (onShowToast) {
        onShowToast('Please fill out all checkout fields!', 'error');
      } else {
        alert('Please fill out all checkout fields!');
      }
      return;
    }

    // Generate random Order ID
    const orderId = `NB-${Math.floor(100000 + Math.random() * 900000)}`;

    // Generate WhatsApp Redirect Link
    const waUrl = getWhatsAppUrl(orderId);

    // Invoke order history logger callback
    if (onPlaceOrder) {
      onPlaceOrder({
        id: orderId,
        total: totalAmount,
        paymentMethod: shippingDetails.paymentMethod,
        shippingDetails
      });
    }

    // Award rewards points on purchase (10% of cart total as points)
    const ptsEarned = Math.round(totalAmount / 10);
    onAwardPoints(ptsEarned, `Earned points for Order ${orderId}`);

    // Auto-redirect to WhatsApp
    window.open(waUrl, '_blank');

    setPlacedOrderId(orderId);
    setCheckoutStep('success');
  };

  const handleResetCheckout = () => {
    onClearCart();
    setCheckoutStep('cart');
    setAppliedDiscount(null);
    setShippingDetails({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      pincode: '',
      paymentMethod: 'COD'
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-50"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-50 flex flex-col h-full shadow-2xl border-l border-stone-100"
          >
            {/* Header */}
            <div className="p-5 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5.5 h-5.5 text-stone-900" />
                <div>
                  <span className="font-serif font-semibold text-lg text-stone-900">Your Basket</span>
                  <span className="text-xs text-stone-400 font-sans ml-2">({cartItems.length} items)</span>
                </div>
              </div>
              <button
                id="cart-drawer-close"
                onClick={onClose}
                className="p-1.5 hover:bg-stone-50 rounded-full text-stone-400 hover:text-stone-700 transition-all focus:outline-none"
              >
                <X className="w-5.5 h-5.5" />
              </button>
            </div>

            {/* Main Content Pane */}
            <div className="flex-1 overflow-y-auto p-5">
              
              {/* STEP 1: CART LIST VIEW */}
              {checkoutStep === 'cart' && (
                <div className="space-y-6">
                  {cartItems.length > 0 ? (
                    <>
                      {/* Products list */}
                      <div className="space-y-4">
                        {cartItems.map((item) => (
                          <div key={item.id} className="flex gap-3 pb-4 border-b border-stone-100 last:border-0 last:pb-0">
                            {/* Product thumb */}
                            <div className="w-16 h-20 bg-stone-50 rounded-lg overflow-hidden flex-shrink-0">
                              <img src={item.product.images[0]} alt="" className="w-full h-full object-cover object-top" loading="lazy" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-sans font-bold text-stone-400 uppercase tracking-wider">Nomaan Brothers</span>
                              <h4 className="text-xs font-serif font-medium text-stone-800 line-clamp-1">{item.product.title}</h4>
                              <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                                Size: <span className="font-semibold text-stone-700">{item.selectedSize}</span> | Color: <span className="font-semibold text-stone-700">{item.selectedColor}</span>
                              </p>

                              {/* Quantity Stepper & Remove */}
                              <div className="flex items-center justify-between mt-2.5">
                                <div className="flex items-center border border-stone-200 rounded bg-stone-50">
                                  <button
                                    id={`cart-qty-dec-${item.id}`}
                                    onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                                    className="px-2 py-0.5 text-stone-500 hover:text-stone-900 font-bold"
                                  >
                                    −
                                  </button>
                                  <span className="px-2 text-xs font-semibold text-stone-800">{item.quantity}</span>
                                  <button
                                    id={`cart-qty-inc-${item.id}`}
                                    onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                                    className="px-2 py-0.5 text-stone-500 hover:text-stone-900 font-bold"
                                  >
                                    +
                                  </button>
                                </div>

                                <button
                                  id={`cart-item-remove-${item.id}`}
                                  onClick={() => onRemoveItem(item.id)}
                                  className="text-stone-400 hover:text-red-600 p-1.5 rounded hover:bg-stone-50 transition-colors"
                                  title="Remove item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Price */}
                            <div className="text-right font-sans text-xs">
                              <p className="font-bold text-stone-900">₹{item.product.price * item.quantity}</p>
                              {item.product.mrp > item.product.price && (
                                <p className="text-[10px] text-stone-400 line-through">₹{item.product.mrp * item.quantity}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Coupon Application Block */}
                      <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 space-y-2.5">
                        <span className="text-[10px] font-sans font-bold uppercase text-stone-400 tracking-wider flex items-center gap-1">
                          <Ticket className="w-3.5 h-3.5 text-stone-400" />
                          <span>Apply Discount Coupon</span>
                        </span>
                        
                        <form onSubmit={handleApplyCoupon} className="flex gap-2">
                          <input
                            id="cart-coupon-input"
                            type="text"
                            placeholder="Try NOMAAN10 or WELCOME100"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            className="flex-1 bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-stone-800 font-mono font-bold uppercase tracking-wider"
                          />
                          <button
                            id="cart-coupon-submit"
                            type="submit"
                            className="bg-stone-900 hover:bg-stone-800 text-stone-100 px-4 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors"
                          >
                            Apply
                          </button>
                        </form>

                        {appliedDiscount && (
                          <div className="flex items-center justify-between text-xs font-sans text-emerald-800 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-md mt-1">
                            <span>✓ Code **{appliedDiscount.code}** Active! ({appliedDiscount.type === 'percent' ? `${appliedDiscount.value}%` : `₹${appliedDiscount.value}`} off)</span>
                            <button
                              id="cart-coupon-remove"
                              onClick={() => setAppliedDiscount(null)}
                              className="text-[10px] uppercase font-bold text-emerald-700 underline"
                            >
                              Remove
                            </button>
                          </div>
                        )}

                        {couponError && (
                          <p className="text-[10px] text-red-600 font-sans font-medium">{couponError}</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-16 space-y-4">
                      <ShoppingBag className="w-12 h-12 text-stone-200 mx-auto" />
                      <p className="font-serif text-stone-700 text-base">Your shopping basket is empty</p>
                      <p className="text-xs text-stone-400">Discover handpicked, Pinterest-worthy kurtis & bottoms now.</p>
                      <button
                        id="cart-empty-browse-btn"
                        onClick={onClose}
                        className="px-5 py-2.5 bg-stone-900 text-stone-100 text-xs font-sans font-bold uppercase tracking-wider rounded-lg"
                      >
                        Start Shopping
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: SHIPPING AND DETAILS FORM */}
              {checkoutStep === 'shipping' && (
                <form onSubmit={handlePlaceOrder} className="space-y-4 font-sans">
                  <div className="flex items-center gap-1 text-xs text-stone-400 uppercase tracking-wider mb-2 font-bold">
                    <span>Contact & Delivery Address</span>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="shipping-name" className="text-[10px] font-bold uppercase text-stone-500">FullName</label>
                    <input
                      id="shipping-name"
                      name="name"
                      type="text"
                      required
                      value={shippingDetails.name}
                      onChange={handleFormChange}
                      placeholder="Jane Doe"
                      className="w-full bg-white border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-stone-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label htmlFor="shipping-email" className="text-[10px] font-bold uppercase text-stone-500">Email Address</label>
                      <input
                        id="shipping-email"
                        name="email"
                        type="email"
                        required
                        value={shippingDetails.email}
                        onChange={handleFormChange}
                        placeholder="jane@example.com"
                        className="w-full bg-white border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-stone-800"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="shipping-phone" className="text-[10px] font-bold uppercase text-stone-500">WhatsApp Mobile</label>
                      <input
                        id="shipping-phone"
                        name="phone"
                        type="tel"
                        required
                        value={shippingDetails.phone}
                        onChange={handleFormChange}
                        placeholder="e.g. 99085 97337"
                        className="w-full bg-white border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-stone-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="shipping-address" className="text-[10px] font-bold uppercase text-stone-500">Street Address</label>
                    <input
                      id="shipping-address"
                      name="address"
                      type="text"
                      required
                      value={shippingDetails.address}
                      onChange={handleFormChange}
                      placeholder="Apartment, suite, house number, street"
                      className="w-full bg-white border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-stone-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label htmlFor="shipping-city" className="text-[10px] font-bold uppercase text-stone-500">City / State</label>
                      <input
                        id="shipping-city"
                        name="city"
                        type="text"
                        required
                        value={shippingDetails.city}
                        onChange={handleFormChange}
                        placeholder="Warangal, Telangana"
                        className="w-full bg-white border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-stone-800"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="shipping-pincode" className="text-[10px] font-bold uppercase text-stone-500">PIN Code</label>
                      <input
                        id="shipping-pincode"
                        name="pincode"
                        type="text"
                        required
                        value={shippingDetails.pincode}
                        onChange={handleFormChange}
                        placeholder="400001"
                        className="w-full bg-white border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-stone-800 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label htmlFor="shipping-paymentMethod" className="text-[10px] font-bold uppercase text-stone-500">Payment Option</label>
                    <select
                      id="shipping-paymentMethod"
                      name="paymentMethod"
                      value={shippingDetails.paymentMethod}
                      onChange={handleFormChange}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-stone-800 cursor-pointer"
                    >
                      <option value="COD">💵 Cash On Delivery (COD) (+₹40)</option>
                      <option value="Card">💳 Prepaid Card / UPI Mock Payment (FREE)</option>
                    </select>
                  </div>

                  <p className="text-[10px] text-stone-400">
                    *We use standard 256-bit encryption. Nomaan Brothers guarantees safe parcel delivery & perfect fit.
                  </p>

                  <button
                    id="cart-submit-order-form"
                    type="submit"
                    className="hidden" // Handled by trigger button below
                  />
                </form>
              )}

              {/* STEP 3: ORDER SUCCESS STATE */}
              {checkoutStep === 'success' && (
                <div className="text-center py-10 space-y-5 font-sans">
                  <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto stroke-[1.5]" />
                  <div>
                    <span className="text-[10px] font-sans font-bold uppercase text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full">
                      ✓ Order Placed Successfully
                    </span>
                    <h3 className="font-serif text-xl font-bold text-stone-900 mt-3">Thank you for your order!</h3>
                    <p className="text-xs text-stone-400 mt-1">Your order ID is <span className="font-mono font-bold text-stone-900">{placedOrderId}</span></p>
                  </div>

                  {/* Summary Box */}
                  <div className="p-4 bg-stone-50 rounded-2xl border border-stone-150 text-left space-y-3">
                    <p className="text-xs font-bold uppercase text-stone-400 tracking-wider">Shipment Details</p>
                    <div className="text-xs text-stone-600 space-y-1">
                      <p>👤 **Name**: {shippingDetails.name}</p>
                      <p>📍 **Deliver to**: {shippingDetails.address}, {shippingDetails.city} - {shippingDetails.pincode}</p>
                      <p>📱 **Mobile**: {shippingDetails.phone}</p>
                      <p>💼 **Payment**: {shippingDetails.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Prepaid UPI/Card'}</p>
                      <p>💰 **Final Total**: ₹{totalAmount}</p>
                    </div>
                  </div>

                  {/* WhatsApp confirmation step */}
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-left space-y-2">
                    <span className="text-[10px] font-bold uppercase text-emerald-800 flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                      <span>Final Action Required</span>
                    </span>
                    <p className="text-[11px] text-emerald-950 font-medium leading-relaxed">
                      To guarantee prompt processing and dispatch, please click below to send your complete order summary to Nomaan Brothers support on WhatsApp (*9908597337*):
                    </p>
                    <a
                      href={getWhatsAppUrl(placedOrderId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full mt-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer text-center"
                    >
                      <MessageSquare className="w-4 h-4 fill-white/10" />
                      <span>Confirm Order on WhatsApp</span>
                    </a>
                  </div>

                  <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100 text-left">
                    <span className="text-[10px] font-bold uppercase text-emerald-800 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Loyalty Reward Points Credited!</span>
                    </span>
                    <p className="text-[10px] text-stone-500 mt-0.5">
                      Since you spent ₹{totalAmount}, we credited **{Math.round(totalAmount/10)} NB points** to your Nomaan Royal Rewards bubble!
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      id="cart-success-reset-btn"
                      onClick={handleResetCheckout}
                      className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs font-sans font-bold uppercase tracking-wider rounded-lg transition-colors"
                    >
                      Continue Browsing Catalog
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Sticky Pricing Summary & Primary Actions (Not shown in Success state) */}
            {checkoutStep !== 'success' && cartItems.length > 0 && (
              <div className="p-5 border-t border-stone-150 bg-stone-50 space-y-4">
                {/* Breakdowns */}
                <div className="space-y-2 text-xs font-sans">
                  <div className="flex justify-between text-stone-500">
                    <span>Basket Subtotal</span>
                    <span>₹{subtotal}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Applied Discount ({appliedDiscount?.code})</span>
                      <span>−₹{discountAmount}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-stone-500">
                    <span>Express Delivery fee</span>
                    <span>{shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</span>
                  </div>

                  {shippingDetails.paymentMethod === 'COD' && checkoutStep === 'shipping' && (
                    <div className="flex justify-between text-stone-500">
                      <span>Cash On Delivery collection fee</span>
                      <span>₹{codFee}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-bold text-sm text-stone-900 pt-2 border-t border-stone-200">
                    <span>Absolute Total</span>
                    <span>₹{totalAmount}</span>
                  </div>
                </div>

                {/* Shipping progression banner */}
                {subtotal < 999 && checkoutStep === 'cart' && (
                  <div className="bg-amber-50 text-amber-800 border border-amber-100 p-2 rounded text-[10px] text-center">
                    Add **₹{999 - subtotal}** more to unlock **FREE Express Shipping**!
                  </div>
                )}

                {subtotal >= 999 && checkoutStep === 'cart' && (
                  <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-2 rounded text-[10px] text-center font-semibold">
                    🎉 You have unlocked FREE Express Shipping!
                  </div>
                )}

                {/* Primary Action Button */}
                {checkoutStep === 'cart' ? (
                  <div className="flex flex-col gap-2">
                    <button
                      id="cart-proceed-checkout-btn"
                      onClick={() => setCheckoutStep('shipping')}
                      className="w-full py-4 bg-stone-900 hover:bg-stone-800 text-stone-100 text-xs font-sans font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Proceed to Delivery & Checkout</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <button
                      id="cart-whatsapp-order-btn"
                      type="button"
                      onClick={() => {
                        const waUrl = getWhatsAppUrl();
                        window.open(waUrl, '_blank');
                      }}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-sans font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <MessageSquare className="w-4 h-4 fill-white/10" />
                      <span>Order via WhatsApp</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-3">
                      <button
                        id="cart-back-to-basket-btn"
                        type="button"
                        onClick={() => setCheckoutStep('cart')}
                        className="flex-1 py-3 border border-stone-300 text-stone-700 text-xs font-sans font-bold uppercase rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        id="cart-final-checkout-place"
                        type="button"
                        onClick={() => {
                          const formTrigger = document.getElementById('cart-submit-order-form');
                          if (formTrigger) {
                            formTrigger.click();
                          }
                        }}
                        className="flex-1 py-3 bg-stone-900 text-white text-xs font-sans font-bold uppercase rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
                      >
                        Place COD Order
                      </button>
                    </div>
                    <button
                      id="cart-whatsapp-order-shipping-btn"
                      type="button"
                      onClick={() => {
                        const waUrl = getWhatsAppUrl();
                        window.open(waUrl, '_blank');
                      }}
                      className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-sans font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <MessageSquare className="w-4 h-4 fill-white/10" />
                      <span>Order via WhatsApp</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
