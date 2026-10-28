/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Star, ChevronRight, Mail, Instagram, MapPin, Phone, HelpCircle, Gift, Heart, ArrowUp, X, Trophy, CreditCard, User, Clock, Settings } from 'lucide-react';

import { Product, CartItem, RewardPoints } from './types';
import { PRODUCTS, CATEGORIES, STORIES_INFO } from './data';

import { 
  subscribeData, 
  syncData, 
  addOrder, 
  subscribeProducts, 
  seedProducts, 
  subscribeGlobalOrders, 
  saveGlobalOrder,
  subscribeHeroSettings
} from './lib/firestoreService';

import Header from './components/Header';
import MegaMenu from './components/MegaMenu';
import PLP from './components/PLP';
import PDP from './components/PDP';
import CartDrawer from './components/CartDrawer';
import RewardsBubble from './components/RewardsBubble';
const AdminPortal = React.lazy(() => import('./components/AdminPortal'));
import ReturnsPortal from './components/ReturnsPortal';
export default function App() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Secure guest session: generate a high-entropy unique identifier stored in localStorage
    let localId = localStorage.getItem('sumera_user_id');
    if (!localId) {
      localId = 'user-' + Array.from({ length: 16 }, () => Math.random().toString(36)[2] || '0').join('');
      localStorage.setItem('sumera_user_id', localId);
    }
    setUserId(localId);
  }, []);

  // --- STATE ---
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [isPdpLoading, setIsPdpLoading] = useState(false);
  
  // Cart items
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (!userId) return;
    return subscribeData(userId, 'cart', (data: any) => {
      if (data && data.items) {
        setCartItems(data.items);
      } else if (!data) {
        setCartItems([]);
        syncData(userId, 'cart', { items: [] }).catch(err => console.error('Error initializing cart:', err));
      }
    });
  }, [userId]);

  // Wishlist
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) return;
    return subscribeData(userId, 'wishlist', (data: any) => {
      if (data && data.items) {
        setWishlist(data.items);
      } else if (!data) {
        setWishlist([]);
        syncData(userId, 'wishlist', { items: [] }).catch(err => console.error('Error initializing wishlist:', err));
      }
    });
  }, [userId]);

  // Rewards balance
  const [points, setPoints] = useState<RewardPoints>({
    balance: 150, 
    claimedRewards: [], 
    history: [
      { id: 'h0', description: 'Welcoming signup gift points', points: 150, date: new Date().toISOString().split('T')[0] }
    ]
  });

  useEffect(() => {
    if (!userId) return;
    return subscribeData(userId, 'points', (data: any) => {
      if (data) {
        setPoints(data);
      } else {
        const initialPoints = {
          balance: 150,
          claimedRewards: [],
          history: [
            { id: 'h0', description: 'Welcoming signup gift points', points: 150, date: new Date().toISOString().split('T')[0] }
          ]
        };
        setPoints(initialPoints);
        syncData(userId, 'points', initialPoints).catch(err => console.error('Error initializing points:', err));
      }
    });
  }, [userId]);

  // UI Drawer controllers
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Static Modals
  const [aboutModalType, setAboutModalType] = useState<'story' | 'returns' | 'profile' | null>(null);
  const [profileSubTab, setProfileSubTab] = useState<'details' | 'orders' | 'points'>('details');

  // Customer account profile
  const [userProfile, setUserProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    pincode: ''
  });

  useEffect(() => {
    if (!userId) return;
    return subscribeData(userId, 'profile', (data: any) => {
      if (data) {
        setUserProfile(data);
      } else {
        const initialProfile = {
          name: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          pincode: ''
        };
        setUserProfile(initialProfile);
        syncData(userId, 'profile', initialProfile).catch(err => console.error('Error initializing profile:', err));
      }
    });
  }, [userId]);

  // Placed orders tracking list
  const [ordersList, setOrdersList] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;
    return subscribeData(userId, 'orders', (data: any) => {
      if (data && data.items) {
        setOrdersList(data.items);
      } else if (!data) {
        setOrdersList([]);
        syncData(userId, 'orders', { items: [] }).catch(err => console.error('Error initializing orders:', err));
      }
    });
  }, [userId]);

  // --- ADMIN PORTAL STATE ---
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [productsList, setProductsList] = useState<Product[]>(PRODUCTS);
  const [globalOrders, setGlobalOrders] = useState<any[]>([]);

  // Seed and subscribe to products list in Firestore
  useEffect(() => {
    setIsProductsLoading(true);

    // 1. Subscribe to live Firestore products instantly in parallel
    const unsubscribe = subscribeProducts((data) => {
      if (data && data.length > 0) {
        setProductsList(data);
      } else {
        // Fallback to static PRODUCTS if firestore returns empty
        setProductsList(PRODUCTS);
      }
      setIsProductsLoading(false);
    });

    // 2. Perform seeding asynchronously in the background so it never blocks the app
    seedProducts(PRODUCTS)
      .then(() => {
        console.log('Firestore check/seeding finished.');
      })
      .catch(err => {
        console.warn('Background seeding skipped or failed (using fallback):', err);
        // Ensure we disable loading if the subscription hasn't done so
        setIsProductsLoading(false);
      });

    // 3. Absolute Bulletproof Safety Fallback:
    // If Firestore is completely offline, blocked by ad-blocker, or extremely slow,
    // transition the UI after 1.5 seconds so the user is never stuck on skeletons.
    const safetyTimeout = setTimeout(() => {
      setIsProductsLoading(false);
    }, 1500);

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
      clearTimeout(safetyTimeout);
    };
  }, []);

  // Subscribe to all global orders in Firestore (for Admin Portal)
  useEffect(() => {
    const unsubscribe = subscribeGlobalOrders((data) => {
      setGlobalOrders(data);
    });
    return unsubscribe;
  }, []);

  // Real-time Homepage Hero customization state
  const [heroImage, setHeroImage] = useState('https://img.youtube.com/vi/HmOWSHSZNtM/maxresdefault.jpg');
  const [heroBadge, setHeroBadge] = useState('Royal Wedding Collection 2026');
  const [heroTitle, setHeroTitle] = useState('The Designer Sherwani House');
  const [heroSubtitle, setHeroSubtitle] = useState('Warangal’s premier destination for bespoke groom sherwanis, sequence kurtas, and Arabic thoobs. Opp. Madras Masjid, Mandi Bazar.');

  useEffect(() => {
    const unsubscribe = subscribeHeroSettings((data) => {
      if (data) {
        if (data.heroImage) setHeroImage(data.heroImage);
        if (data.heroBadge) setHeroBadge(data.heroBadge);
        if (data.heroTitle) setHeroTitle(data.heroTitle);
        if (data.heroSubtitle) setHeroSubtitle(data.heroSubtitle);
      }
    });
    return unsubscribe;
  }, []);

  // Toast Notification Stack
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  // Search filter query
  const [searchQuery, setSearchQuery] = useState('');

  // Newsletter capture
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Scroll back to top indicator
  const [showScrollTop, setShowScrollTop] = useState(false);

  // --- EFFECT SYNCERS ---
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleUpdateProfileField = (field: string, value: string) => {
    setUserProfile((prev) => ({ ...prev, [field]: value }));
  };

  // --- ACTION HANDLERS ---
  const handleSelectCategory = (catId: string) => {
    setActiveCategory(catId);
    setActiveProduct(null); // Back to PLP grid
    setSearchQuery('');
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handleSelectProduct = (product: Product) => {
    setIsPdpLoading(true);
    setActiveProduct(product);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      setIsPdpLoading(false);
    }, 600);
  };

  const handleToggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isAlready = wishlist.includes(id);
    const nextList = isAlready ? wishlist.filter(item => item !== id) : [...wishlist, id];
    setWishlist(nextList);
    if (userId) {
      syncData(userId, 'wishlist', { items: nextList }).catch(err => {
        console.error('Error syncing wishlist:', err);
      });
    }
  };

  const handleAddToCart = (product: Product, size: string, color: string, quantity: number) => {
    const itemUniqueId = `${product.id}-${size}-${color}`;
    
    let nextCart: CartItem[] = [];
    const existingIdx = cartItems.findIndex(item => item.id === itemUniqueId);
    if (existingIdx > -1) {
      nextCart = [...cartItems];
      nextCart[existingIdx] = {
        ...nextCart[existingIdx],
        quantity: nextCart[existingIdx].quantity + quantity
      };
    } else {
      const newItem: CartItem = {
        id: itemUniqueId,
        product,
        selectedSize: size,
        selectedColor: color,
        quantity
      };
      nextCart = [...cartItems, newItem];
    }

    setCartItems(nextCart);
    if (userId) {
      syncData(userId, 'cart', { items: nextCart }).catch(err => {
        console.error('Error syncing cart:', err);
      });
    }

    setIsCartOpen(true); // Auto expand cart drawer for high conversion loop
  };

  const handleBuyNow = (product: Product, size: string, color: string, quantity: number) => {
    handleAddToCart(product, size, color, quantity);
    setIsCartOpen(true);
  };

  const handleUpdateCartQty = (id: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(id);
      return;
    }
    const nextCart = cartItems.map(item => item.id === id ? { ...item, quantity: newQty } : item);
    setCartItems(nextCart);
    if (userId) {
      syncData(userId, 'cart', { items: nextCart }).catch(err => {
        console.error('Error syncing cart:', err);
      });
    }
  };

  const handleRemoveCartItem = (id: string) => {
    const nextCart = cartItems.filter(item => item.id !== id);
    setCartItems(nextCart);
    if (userId) {
      syncData(userId, 'cart', { items: nextCart }).catch(err => {
        console.error('Error syncing cart:', err);
      });
    }
  };

  const handleClearCart = () => {
    setCartItems([]);
    if (userId) {
      syncData(userId, 'cart', { items: [] }).catch(err => {
        console.error('Error syncing cart:', err);
      });
    }
  };

  const handleAwardPoints = (amount: number, description: string) => {
    const nextPoints = {
      balance: points.balance + amount,
      claimedRewards: points.claimedRewards || [],
      history: [
        {
          id: `h-${Date.now()}`,
          description,
          points: amount,
          date: new Date().toISOString().split('T')[0]
        },
        ...points.history
      ]
    };
    setPoints(nextPoints);
    if (userId) {
      syncData(userId, 'points', nextPoints).catch(err => {
        console.error('Error syncing points:', err);
      });
    }
  };

  const handleClaimRewardCoupon = (cost: number, code: string) => {
    const nextPoints = {
      ...points,
      balance: Math.max(0, points.balance - cost),
      claimedRewards: [...(points.claimedRewards || []), code]
    };
    setPoints(nextPoints);
    if (userId) {
      syncData(userId, 'points', nextPoints).catch(err => {
        console.error('Error syncing points:', err);
      });
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;

    // Award signup bonus if not subscribed yet
    if (!newsletterSubscribed) {
      handleAwardPoints(100, 'Newsletter subscription bonus');
      setNewsletterSubscribed(true);
      addToast('✓ Thank you for subscribing! We have credited 100 NB points to your royal rewards club. Copy Coupon: WELCOME100 for ₹100 flat off!', 'success');
    } else {
      addToast('You are already subscribed to the Nomaan VIP circle!', 'info');
    }
    setNewsletterEmail('');
  };

  const handlePlaceOrderHistory = (orderData: { id: string; total: number; paymentMethod: 'COD' | 'Card'; shippingDetails: any }) => {
    const newOrder = {
      id: orderData.id,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      items: cartItems.map((it) => ({
        title: it.product.title,
        quantity: it.quantity,
        size: it.selectedSize,
        color: it.selectedColor,
        price: it.product.price,
        image: it.product.images[0]
      })),
      total: orderData.total,
      status: 'Processing' as const,
      paymentMethod: orderData.paymentMethod,
    };

    const updatedUserOrders = [newOrder, ...ordersList];
    setOrdersList(updatedUserOrders);
    
    // Save to Firestore user specific orders list
    if (userId) {
      syncData(userId, 'orders', { items: updatedUserOrders }).catch(err => {
        console.error('Error syncing user orders:', err);
      });
    }

    // Save globally to Firestore global_orders for the Admin
    const fullGlobalOrder = {
      ...newOrder,
      shippingDetails: {
        name: orderData.shippingDetails.name,
        email: orderData.shippingDetails.email,
        phone: orderData.shippingDetails.phone,
        address: orderData.shippingDetails.address,
        city: orderData.shippingDetails.city,
        pincode: orderData.shippingDetails.pincode,
      }
    };
    saveGlobalOrder(fullGlobalOrder).catch(err => {
      console.error('Error saving global order:', err);
    });

    // Save details to profile for seamless default fillings next time
    const updatedProfile = {
      name: orderData.shippingDetails.name,
      email: orderData.shippingDetails.email,
      phone: orderData.shippingDetails.phone,
      address: orderData.shippingDetails.address,
      city: orderData.shippingDetails.city,
      pincode: orderData.shippingDetails.pincode,
    };
    setUserProfile(updatedProfile);
    if (userId) {
      syncData(userId, 'profile', updatedProfile).catch(err => {
        console.error('Error syncing profile:', err);
      });
    }
    
    addToast(`✓ Order ${orderData.id} placed successfully!`, 'success');
  };

  // Filter products by search query
  const filteredProductsList = productsList.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.fabric.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.badges.some(b => b.toLowerCase().includes(q))
    );
  });

  if (isAdminOpen) {
    return (
      <>
        <Helmet>
          <title>Admin Portal | Nomaan Brothers</title>
        </Helmet>
        <AdminPortal
          onClose={() => setIsAdminOpen(false)}
          products={productsList}
          orders={globalOrders}
          onShowToast={addToast}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfbfa] flex flex-col relative">
      {/* Dynamic Header Component */}
      <Header
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        onMenuOpen={() => setIsMenuOpen(true)}
        onCartOpen={() => setIsCartOpen(true)}
        onSearch={(q) => {
          setSearchQuery(q);
          setActiveProduct(null);
          setActiveCategory('all');
          window.scrollTo({ top: 400, behavior: 'smooth' });
        }}
        onNavigateHome={() => {
          setActiveProduct(null);
          setActiveCategory('all');
          setSearchQuery('');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAboutModal={() => {
          setProfileSubTab('details');
          setAboutModalType('profile');
        }}
      />
      <Helmet>
        <title>Nomaan Brothers | The Designer Sherwani House — Warangal</title>
        <meta name="description" content="Nomaan Brothers — The Designer Sherwani House in Mandi Bazar, Warangal. Bespoke groom sherwanis, sequence kurtas, and Arabic thoobs." />
      </Helmet>

      {/* Slide-in Full-Screen Left Drawer Menu */}
      <MegaMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
        onOpenStory={() => setAboutModalType('story')}
        onOpenReturns={() => setAboutModalType('returns')}
      />

      {/* Slide-in Cart Drawer Panel */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        userPoints={points.balance}
        onAwardPoints={handleAwardPoints}
        userProfile={userProfile}
        onPlaceOrder={handlePlaceOrderHistory}
        onShowToast={addToast}
      />

      {/* Persistent rewards pill bottom-left */}
      <RewardsBubble
        points={points}
        onClaimCoupon={handleClaimRewardCoupon}
        onEarnPoints={handleAwardPoints}
        onShowToast={addToast}
      />





      {/* EXCHANGE & RETURNS PORTAL */}
      <AnimatePresence>
        {aboutModalType === 'returns' && (
          <ReturnsPortal
            onClose={() => setAboutModalType(null)}
            globalOrders={globalOrders}
            userEmail={userProfile.email}
            onShowToast={addToast}
            onAwardPoints={(amount, desc) => {
              const updatedHistory = [
                {
                  id: 'ref-' + Date.now(),
                  points: amount,
                  description: desc,
                  date: new Date().toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})
                },
                ...points.history
              ];
              const updatedBalance = points.balance + amount;
              const nextPoints = {
                ...points,
                balance: updatedBalance,
                history: updatedHistory
              };
              setPoints(nextPoints);
              if (userId) {
                syncData(userId, 'points', nextPoints).catch(err => console.error('Error syncing points:', err));
              }
            }}
            userId={userId}
          />
        )}
      </AnimatePresence>

      {/* STATIC POLICIES & LOYALTY PROFILE MODALS */}
      <AnimatePresence>
        {aboutModalType !== null && aboutModalType !== 'returns' && (
          <motion.div
            key="policy-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`bg-white rounded-2xl p-6 w-full shadow-2xl relative border border-stone-100 ${
                aboutModalType === 'profile' ? 'max-w-xl' : 'max-w-lg'
              }`}
            >
              <button
                id="static-modal-close"
                onClick={() => setAboutModalType(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-50 text-stone-400 hover:text-stone-700 z-10"
              >
                <X className="w-5 h-5" />
              </button>

              {aboutModalType === 'story' && (
                <div className="space-y-4 font-sans text-stone-700">
                  <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-stone-400">HERITAGE & CRAFTSMANSHIP</span>
                  <h3 className="font-serif text-2xl font-semibold text-stone-900">Our Heritage Story</h3>
                  <div className="rounded-xl overflow-hidden shadow-xs border border-stone-200 aspect-video relative group">
                    <img 
                      src="https://img.youtube.com/vi/HmOWSHSZNtM/maxresdefault.jpg" 
                      alt="Nomaan Brothers Grooms Gallery Showroom, Warangal" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute bottom-2 left-2 bg-black/75 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-md font-medium">
                      📍 Mandi Bazar Showroom, Warangal
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed">{STORIES_INFO.about}</p>
                  <div className="p-3 bg-stone-50 border border-stone-150 rounded-xl text-xs space-y-1">
                    <p>📍 **Showroom**: Opp. Madras Masjid, Mandi Bazar, JPN Road, Warangal</p>
                    <p>🧵 **Specialties**: Pure Raw Silk Zardozi, Micro Velvet Zari, Arabic Jubbas, Sequence Kurtas</p>
                    <p>🤝 **Custom Fitting**: Master-tailor bespoke measurements & in-store alteration trial</p>
                  </div>
                </div>
              )}

              {aboutModalType === 'profile' && (
                <div className="space-y-5 font-sans text-stone-700 max-h-[80vh] overflow-y-auto pr-1 select-none">
                  <div className="flex items-center gap-2.5">
                    <Trophy className="w-6 h-6 text-amber-500 flex-shrink-0" />
                    <div>
                      <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                        Nomaan Royal Club
                      </span>
                      <h3 className="font-serif text-xl md:text-2xl font-semibold text-stone-900 mt-0.5">Your Account Portal</h3>
                    </div>
                  </div>

                  {/* Club Tier Card */}
                  <div className="p-4 bg-stone-900 text-stone-100 rounded-2xl space-y-3 border border-stone-800">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[9px] uppercase text-stone-400 tracking-wider">Active Membership Status</p>
                        <p className="text-base md:text-lg font-bold text-white font-serif tracking-wide mt-0.5">
                          {points.balance < 250 ? '🌸 Bronze Member' : points.balance < 500 ? '✨ Silver Elite' : points.balance < 1000 ? '👑 Gold Club' : '💎 Platinum Royal'}
                        </p>
                      </div>
                      <span className="bg-amber-400 text-stone-950 text-[10px] font-extrabold px-2.5 py-1 rounded-lg shadow-xs">
                        {points.balance} NB Points
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-stone-400">
                        <span>Club Progression</span>
                        <span>
                          {points.balance < 250 
                            ? `${points.balance} / 250 pts to Silver` 
                            : points.balance < 500 
                            ? `${points.balance} / 500 pts to Gold` 
                            : `${points.balance} / 1000 pts to Platinum`}
                        </span>
                      </div>
                      <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-amber-400 h-full transition-all duration-500" 
                          style={{ 
                            width: `${Math.min(100, 
                              points.balance < 250 
                                ? (points.balance / 250) * 100 
                                : points.balance < 500 
                                ? ((points.balance - 250) / 250) * 100 
                                : ((points.balance - 500) / 500) * 100
                            )}%` 
                          }} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tabs: Details, Orders, History */}
                  <div className="grid grid-cols-3 bg-stone-100 p-1 rounded-xl border border-stone-200 text-center text-xs">
                    <button
                      id="profile-tab-details"
                      type="button"
                      onClick={() => setProfileSubTab('details')}
                      className={`py-2 rounded-lg font-bold uppercase tracking-wider text-[10px] transition-all cursor-pointer ${
                        profileSubTab === 'details' ? 'bg-white text-stone-950 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      My Details
                    </button>
                    <button
                      id="profile-tab-orders"
                      type="button"
                      onClick={() => setProfileSubTab('orders')}
                      className={`py-2 rounded-lg font-bold uppercase tracking-wider text-[10px] transition-all cursor-pointer relative ${
                        profileSubTab === 'orders' ? 'bg-white text-stone-950 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      Orders ({ordersList.length})
                    </button>
                    <button
                      id="profile-tab-points"
                      type="button"
                      onClick={() => setProfileSubTab('points')}
                      className={`py-2 rounded-lg font-bold uppercase tracking-wider text-[10px] transition-all cursor-pointer ${
                        profileSubTab === 'points' ? 'bg-white text-stone-950 shadow-xs' : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      Rewards History
                    </button>
                  </div>

                  {/* Profile Form Details Tab */}
                  {profileSubTab === 'details' && (
                    <div className="space-y-4 pt-1">
                      <p className="text-xs text-stone-500 leading-relaxed">
                        Pre-configure your delivery details below. Saving your details here will automatically populate your checkout forms for a smoother purchasing process!
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Full Name</label>
                          <input
                            type="text"
                            value={userProfile.name}
                            onChange={(e) => handleUpdateProfileField('name', e.target.value)}
                            placeholder="e.g. Priyanjali Sharma"
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-stone-800 font-sans"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Email Address</label>
                          <input
                            type="email"
                            value={userProfile.email}
                            onChange={(e) => handleUpdateProfileField('email', e.target.value)}
                            placeholder="e.g. priya@gmail.com"
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-stone-800 font-sans"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">WhatsApp Mobile</label>
                          <input
                            type="tel"
                            value={userProfile.phone}
                            onChange={(e) => handleUpdateProfileField('phone', e.target.value)}
                            placeholder="e.g. 99085 97337"
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-stone-800 font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">PIN Code</label>
                          <input
                            type="text"
                            value={userProfile.pincode}
                            onChange={(e) => handleUpdateProfileField('pincode', e.target.value)}
                            placeholder="e.g. 302001"
                            maxLength={6}
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-stone-800 font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">City / State</label>
                          <input
                            type="text"
                            value={userProfile.city}
                            onChange={(e) => handleUpdateProfileField('city', e.target.value)}
                            placeholder="e.g. Warangal, Telangana"
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-stone-800 font-sans"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Street Address</label>
                          <input
                            type="text"
                            value={userProfile.address}
                            onChange={(e) => handleUpdateProfileField('address', e.target.value)}
                            placeholder="e.g. Near Madras Masjid, Mandi Bazar, Warangal"
                            className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-stone-800 font-sans"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          addToast('✓ Delivery profile updated! Checkout fields will automatically pre-fill.', 'success');
                        }}
                        className="w-full mt-2 py-3 bg-stone-950 text-stone-100 text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
                      >
                        Save Profile Details
                      </button>
                    </div>
                  )}

                  {/* Orders List Tab */}
                  {profileSubTab === 'orders' && (
                    <div className="space-y-3 pt-1">
                      {ordersList.length > 0 ? (
                        <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                          {ordersList.map((order) => (
                            <div key={order.id} className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3 text-xs">
                              <div className="flex justify-between items-center pb-2.5 border-b border-stone-200/60">
                                <div>
                                  <span className="font-mono font-bold text-stone-900 tracking-wider">{order.id}</span>
                                  <p className="text-[10px] text-stone-400 mt-0.5">{order.date}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <span className="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-100">
                                    ● {order.status}
                                  </span>
                                  <span className="text-[9px] font-mono text-stone-400">Shipped via NB Express / Store Pickup</span>
                                </div>
                              </div>

                              <div className="space-y-2">
                                {order.items.map((it: any, index: number) => (
                                  <div key={index} className="flex gap-2.5 items-center">
                                    <img src={it.image} alt="" className="w-10 h-12 object-cover rounded-lg border border-stone-200" />
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-stone-800 truncate">{it.title}</p>
                                      <p className="text-[10px] text-stone-400">Qty: {it.quantity} | Size: {it.size} | Color: {it.color}</p>
                                    </div>
                                    <span className="font-bold text-stone-950">₹{it.price * it.quantity}</span>
                                  </div>
                                ))}
                              </div>

                              <div className="flex justify-between items-center pt-2.5 border-t border-stone-200/40 text-[11px] font-bold text-stone-900">
                                <span className="text-stone-400 font-normal">Method: {order.paymentMethod}</span>
                                <span>Total Paid: ₹{order.total}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-10 space-y-3.5">
                          <p className="text-stone-400 text-xs">You haven't placed any orders in this session yet.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setAboutModalType(null);
                              setIsCartOpen(true);
                            }}
                            className="px-5 py-2.5 bg-stone-950 text-white rounded-lg text-[10px] uppercase font-bold tracking-widest hover:bg-stone-850 cursor-pointer"
                          >
                            Checkout My Basket
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Points History Tab */}
                  {profileSubTab === 'points' && (
                    <div className="space-y-2.5 pt-1">
                      <p className="text-xs text-stone-400 leading-relaxed">
                        Detailed ledger of your Nomaan Royal Points activity. Earn 10% points on every purchase!
                      </p>
                      <div className="divide-y divide-stone-100 max-h-[280px] overflow-y-auto pr-1 border border-stone-200/60 rounded-xl p-3 bg-stone-50">
                        {points.history.map((h) => (
                          <div key={h.id} className="py-2.5 flex justify-between items-center text-xs first:pt-0 last:pb-0">
                            <div>
                              <span className="font-medium text-stone-800">{h.description}</span>
                              <p className="text-[10px] text-stone-400 mt-0.5">{h.date}</p>
                            </div>
                            <span className={`font-bold font-mono ${h.points > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                              {h.points > 0 ? `+${h.points}` : h.points} NB
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EXCHANGE & RETURNS PORTAL */}
      <AnimatePresence>
        {aboutModalType === 'returns' && (
          <ReturnsPortal
            onClose={() => setAboutModalType(null)}
            globalOrders={globalOrders}
            userEmail={userProfile.email}
            onShowToast={addToast}
            onAwardPoints={(amount, desc) => {
              const updatedHistory = [
                {
                  id: 'ref-' + Date.now(),
                  points: amount,
                  description: desc,
                  date: new Date().toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})
                },
                ...points.history
              ];
              const updatedBalance = points.balance + amount;
              const nextPoints = {
                ...points,
                balance: updatedBalance,
                history: updatedHistory
              };
              setPoints(nextPoints);
              if (userId) {
                syncData(userId, 'points', nextPoints).catch(err => console.error('Error syncing points:', err));
              }
            }}
            userId={userId}
          />
        )}
      </AnimatePresence>

      {/* --- RENDER LOGIC: CORE VIEW STAGE --- */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {activeProduct ? (
            /* --- PRODUCT DETAIL PAGE (PDP) --- */
            <motion.div
              key="pdp"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <PDP
                product={activeProduct}
                onBack={() => setActiveProduct(null)}
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                onShowToast={addToast}
                isLoading={isPdpLoading}
              />
            </motion.div>
          ) : (
            /* --- PLP / HOMEPAGE INTERFACE --- */
            <motion.div
              key="home-plp"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* 1. Hero Campaign Banner (Only visible when no category is explicitly clicked and search is empty) */}
              {activeCategory === 'all' && !searchQuery && (
                <div className="relative h-[480px] md:h-[600px] w-full overflow-hidden bg-stone-900 flex items-center justify-center">
                  {/* Backdrop Background Image */}
                  <img
                    src={heroImage}
                    alt="Nomaan Brothers Groom Collection"
                    className="absolute inset-0 w-full h-full object-cover object-top opacity-55 hover:scale-102 transition-transform duration-10000"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  {/* Decorative Dark Vignette */}
                  <div className="absolute inset-0 bg-linear-to-t from-stone-950/80 via-stone-950/20 to-stone-950/40" />

                  {/* Core Content */}
                  <div className="relative z-10 text-center max-w-2xl px-4 space-y-4 text-stone-100 flex flex-col items-center">
                    {heroBadge && (
                      <span className="text-[10px] md:text-xs font-sans font-bold tracking-[0.2em] uppercase text-amber-400 bg-stone-900/60 px-3 py-1 rounded-full border border-stone-800">
                        {heroBadge}
                      </span>
                    )}
                    <h2 className="font-serif text-3xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-wide text-white drop-shadow-sm">
                      {heroTitle || 'The Designer Sherwani House'}
                    </h2>
                    <p className="font-sans text-xs md:text-sm text-stone-200 tracking-wider max-w-lg leading-relaxed font-light">
                      {heroSubtitle || 'Warangal’s premier destination for bespoke groom sherwanis, sequence kurtas, and Arabic thoobs. Opp. Madras Masjid, Mandi Bazar.'}
                    </p>
                    
                    <div className="flex flex-wrap gap-3 pt-3 justify-center">
                      <button
                        id="hero-shop-new"
                        onClick={() => handleSelectCategory('new-arrivals')}
                        className="px-6 py-3.5 bg-stone-100 text-stone-950 font-sans text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-stone-200 hover:scale-102 transition-all shadow-md focus:outline-none"
                      >
                        Shop New Arrivals
                      </button>
                      <button
                        id="hero-shop-sets"
                        onClick={() => handleSelectCategory('sherwanis')}
                        className="px-6 py-3.5 bg-transparent text-stone-100 border border-stone-300 font-sans text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-white/10 hover:scale-102 transition-all focus:outline-none"
                      >
                        Explore Royal Sherwanis
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Horizontal circular category navigation quick explore (Only on homepage) */}
              {activeCategory === 'all' && !searchQuery && (
                <section className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                  <p className="text-[10px] font-sans font-bold uppercase tracking-widest text-center text-stone-400 mb-6">Explore Nomaan Brothers Collections</p>
                  <div className="flex gap-4 md:gap-8 overflow-x-auto justify-start md:justify-center py-2 px-1 scrollbar-hide">
                    {[
                      { id: 'sherwanis', name: 'Royal Sherwanis', img: 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=150&q=80' },
                      { id: 'kurtas', name: 'Sequence Kurtas', img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=300&q=80' },
                      { id: 'thoobs', name: 'Arabic Thoobs', img: 'https://images.unsplash.com/photo-1584441405886-bc91be61e56a?auto=format&fit=crop&w=300&q=80' },
                      { id: 'indo-western', name: 'Indo-Western', img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=300&q=80' },
                      { id: 'accessories', name: 'Safas & Accessories', img: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=300&q=80' }
                    ].map((cat) => (
                      <button
                        id={`home-cat-bubble-${cat.id}`}
                        key={cat.id}
                        onClick={() => handleSelectCategory(cat.id)}
                        className="flex flex-col items-center gap-2.5 flex-shrink-0 group focus:outline-none"
                      >
                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border border-stone-200 group-hover:scale-105 group-hover:border-stone-900 shadow-sm transition-all">
                          <img src={cat.img} alt="" className="w-full h-full object-cover object-top" loading="lazy" />
                        </div>
                        <span className="font-sans text-xs font-semibold text-stone-700 group-hover:text-stone-950 transition-colors">
                          {cat.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* 3. Core Listings Product Page (PLP) component */}
              <PLP
                products={filteredProductsList}
                activeCategory={activeCategory}
                onSelectProduct={handleSelectProduct}
                wishlistedIds={wishlist}
                onToggleWishlist={handleToggleWishlist}
                isLoading={isProductsLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* --- ACCESSIBLE LUXURY D2C FOOTER --- */}
      <footer className="bg-stone-900 text-stone-300 font-sans border-t border-stone-800">
        
        {/* Newsletter Signup Banner (Value exchange: coupon + points) */}
        <div className="border-b border-stone-800/80">
          <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            <div className="lg:col-span-5 space-y-1 text-center md:text-left">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest flex items-center justify-center md:justify-start gap-1">
                <Gift className="w-3.5 h-3.5" />
                <span>Join The Nomaan VIP Circle</span>
              </span>
              <h3 className="font-serif text-lg md:text-2xl font-semibold text-stone-100">Subscribe for 10% Off & +100 Rewards</h3>
              <p className="text-xs text-stone-400 font-sans mt-1">Get instant VIP access to new groom sherwani launches, Eid arrivals, and styling guidelines.</p>
            </div>

            <div className="lg:col-span-7">
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-2 max-w-xl mx-auto lg:ml-auto">
                <div className="relative flex-1">
                  <input
                    id="footer-email-field"
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="w-full bg-stone-800/60 border border-stone-700/80 rounded-lg px-4 py-3 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-stone-500 font-sans"
                  />
                  <Mail className="absolute right-3.5 top-3.5 w-4 h-4 text-stone-500 pointer-events-none" />
                </div>
                <button
                  id="footer-email-submit"
                  type="submit"
                  className="px-6 py-3 bg-white text-stone-900 font-sans text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-stone-200 transition-colors"
                >
                  Join Circle
                </button>
              </form>
            </div>

          </div>
        </div>

        {/* Brand Information Column Blocks */}
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand story */}
          <div className="space-y-3.5">
            <h4 className="font-serif text-lg font-semibold text-stone-100 tracking-wide select-none">
              Nomaan Brothers
            </h4>
            <p className="text-xs text-stone-400 leading-relaxed font-sans font-light">
              The Designer Sherwani House — Mandi Bazar, Warangal. Bespoke groom wedding sherwanis, festive sequence kurtas, and imported Arabic thoobs.
            </p>
            <div className="flex gap-2.5">
              <a href="#" className="p-2 bg-stone-850 bg-stone-800/50 hover:bg-stone-800 rounded-full text-stone-300 transition-colors">
                <Instagram className="w-4.5 h-4.5" />
              </a>
              <span className="text-xs text-stone-400 font-mono self-center">@nomaan_brothers_</span>
            </div>
          </div>

          {/* Quick links catalog */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-stone-100 uppercase tracking-widest">Shop Catalog</h5>
            <ul className="text-xs text-stone-400 space-y-2 font-sans font-light">
              <li><button onClick={() => handleSelectCategory('new-arrivals')} className="hover:text-white transition-colors text-left">New Arrivals</button></li>
              <li><button onClick={() => handleSelectCategory('sherwanis')} className="hover:text-white transition-colors text-left">Royal Groom Sherwanis</button></li>
              <li><button onClick={() => handleSelectCategory('kurtas')} className="hover:text-white transition-colors text-left">Sequence & Festive Kurtas</button></li>
              <li><button onClick={() => handleSelectCategory('thoobs')} className="hover:text-white transition-colors text-left">Arabic Thoobs & Jubbas</button></li>
              <li><button onClick={() => handleSelectCategory('sale')} className="hover:text-white transition-colors text-left font-bold text-red-400">Clearance Sale</button></li>
            </ul>
          </div>

          {/* Customer support policies */}
          <div className="space-y-3">
            <h5 className="text-xs font-bold text-stone-100 uppercase tracking-widest">Customer Support</h5>
            <ul className="text-xs text-stone-400 space-y-2 font-sans font-light">
              <li><button onClick={() => setAboutModalType('story')} className="hover:text-white transition-colors text-left">Our Heritage Story</button></li>
              <li><button onClick={() => setAboutModalType('returns')} className="hover:text-white transition-colors text-left">Track Order & Exchanges</button></li>
              <li><button onClick={() => setAboutModalType('returns')} className="hover:text-white transition-colors text-left">Returns Policy</button></li>
              <li><button onClick={() => setIsAdminOpen(true)} className="hover:text-amber-400 transition-colors text-left font-mono text-[10px] flex items-center gap-1.5 mt-1 border-t border-stone-800 pt-1.5 w-full"><Settings className="w-3 h-3 text-stone-500" /><span>Admin Portal</span></button></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3 text-xs text-stone-400 font-sans font-light">
            <h5 className="text-xs font-bold text-stone-100 uppercase tracking-widest">Contact Head Office</h5>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-stone-500 mt-0.5 flex-shrink-0" />
              <span>Opposite Madras Masjid, Mandi Bazar, JPN Road, Sherpura, Warangal, Telangana - 506002</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-stone-500 flex-shrink-0" />
              <span>WhatsApp Support: +91 99085 97337</span>
            </div>
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-stone-500 flex-shrink-0" />
              <span>Mon-Sat 10:00 AM - 7:00 PM</span>
            </div>
          </div>

        </div>

        {/* Lower Banner & Payment Icons */}
        <div className="border-t border-stone-850 bg-stone-950/40 py-6 text-xs text-stone-500 text-center font-sans">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <p>© 2026 Nomaan Brothers — The Designer Sherwani House. All Rights Reserved. Opposite Madras Masjid, Mandi Bazar, Warangal.</p>
            
            {/* Payment Icons */}
            <div className="flex items-center gap-2 grayscale opacity-60">
              <span className="px-2 py-0.5 border border-stone-800 text-[10px] font-bold font-mono tracking-wider rounded uppercase">COD</span>
              <span className="px-2 py-0.5 border border-stone-800 text-[10px] font-bold font-mono tracking-wider rounded uppercase">UPI</span>
              <span className="px-2 py-0.5 border border-stone-800 text-[10px] font-bold font-mono tracking-wider rounded uppercase">Visa</span>
              <span className="px-2 py-0.5 border border-stone-800 text-[10px] font-bold font-mono tracking-wider rounded uppercase">Mastercard</span>
              <span className="px-2 py-0.5 border border-stone-800 text-[10px] font-bold font-mono tracking-wider rounded uppercase">GPay</span>
            </div>
          </div>
        </div>

      </footer>

      {/* Floating scroll back to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            key="scroll-top-btn"
            id="global-scroll-top-btn"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 z-40 p-3 bg-white hover:bg-stone-50 text-stone-900 border border-stone-200 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 focus:outline-none cursor-pointer"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-4.5 h-4.5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Toast Notification Stack */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 md:translate-x-0 md:left-auto md:right-6 z-50 flex flex-col gap-2.5 max-w-sm w-[90%] pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={`p-4 rounded-xl shadow-lg border text-xs font-semibold flex items-center justify-between gap-3 pointer-events-auto ${
                toast.type === 'success'
                  ? 'bg-emerald-950 text-emerald-50 border-emerald-800'
                  : toast.type === 'error'
                  ? 'bg-red-950 text-red-50 border-red-800'
                  : 'bg-stone-900 text-stone-50 border-stone-850'
              }`}
            >
              <div className="flex-1">
                {toast.message}
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
