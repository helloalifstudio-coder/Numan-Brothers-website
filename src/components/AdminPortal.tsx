import React, { useState, useEffect, useCallback } from 'react';
import { 
  Lock, Settings, Plus, Edit, Trash2, TrendingUp, ShoppingBag, 
  Package, X, Search, Check, AlertCircle, RefreshCw, KeyRound, 
  ChevronRight, Calendar, User, Phone, MapPin, Mail, DollarSign, Sliders, Image
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, ReturnRequest } from '../types';
import { 
  getProductsPaginated, getOrdersPaginated, saveProduct, deleteProduct, saveGlobalOrder, 
  subscribeReturnRequests, saveReturnRequest, subscribeHeroSettings, saveHeroSettings 
} from '../lib/firestoreService';
import { useQuery } from '@tanstack/react-query';
import AdminProductRow from './AdminProductRow';
import AdminOrderRow from './AdminOrderRow';
import AdminReturnRequestRow from './AdminReturnRequestRow';

interface AdminPortalProps {
  isOpen?: boolean;
  onClose: () => void;
  products: Product[];
  orders: any[];
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}


const SECURE_PIN = '990859';

export default function AdminPortal({
  isOpen,
  onClose,
  products,
  orders,
  onShowToast
}: AdminPortalProps) {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('sumera_admin_auth') === 'true';
  });
  
  // Security input & lockout states
  const [pinInput, setPinInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState<number>(() => {
    return Number(localStorage.getItem('sumera_admin_attempts') || '0');
  });
  const [lockoutTime, setLockoutTime] = useState<number | null>(() => {
    const stored = localStorage.getItem('sumera_admin_lockout');
    if (stored) {
      const until = Number(stored);
      if (until > Date.now()) return until;
    }
    return null;
  });
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isErrorShaking, setIsErrorShaking] = useState(false);

  useEffect(() => {
    if (!lockoutTime) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((lockoutTime - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining === 0) {
        setLockoutTime(null);
        setLoginAttempts(0);
        localStorage.removeItem('sumera_admin_attempts');
        localStorage.removeItem('sumera_admin_lockout');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTime]);
  
  // Dashboard navigation
  const [activeTab, setActiveTab] = useState<'metrics' | 'products' | 'orders' | 'returns' | 'customization'>('metrics');
  
  // Homepage Hero customization state
  const [heroImage, setHeroImage] = useState('https://img.youtube.com/vi/HmOWSHSZNtM/maxresdefault.jpg');
  const [heroBadge, setHeroBadge] = useState('Royal Wedding Collection 2026');
  const [heroTitle, setHeroTitle] = useState('The Designer Sherwani House');
  const [heroSubtitle, setHeroSubtitle] = useState('Warangal’s premier destination for bespoke groom sherwanis, sequence kurtas, and Arabic thoobs. Opp. Madras Masjid, Mandi Bazar.');
  const [isSavingHero, setIsSavingHero] = useState(false);

  // Return request states
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [returnsSearch, setReturnsSearch] = useState('');
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    const unsub = subscribeReturnRequests((requests) => {
      setReturnRequests(requests);
    });
    const unsubHero = subscribeHeroSettings((data) => {
      if (data) {
        if (data.heroImage) setHeroImage(data.heroImage);
        if (data.heroBadge) setHeroBadge(data.heroBadge);
        if (data.heroTitle) setHeroTitle(data.heroTitle);
        if (data.heroSubtitle) setHeroSubtitle(data.heroSubtitle);
      }
    });
    return () => {
      unsub();
      unsubHero();
    };
  }, [isAuthenticated]);
  
  // Product search inside dashboard
  const [dashboardSearch, setDashboardSearch] = useState('');
  
  // Product CRUD states
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Form State
  const [formId, setFormId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formPrice, setFormPrice] = useState(0);
  const [formMrp, setFormMrp] = useState(0);
  const [formCategory, setFormCategory] = useState('sherwanis');
  const [formFabric, setFormFabric] = useState('Raw Silk & Zardozi');
  const [formLength, setFormLength] = useState('44 inches');
  const [formDescription, setFormDescription] = useState('');
  const [formSizes, setFormSizes] = useState<string[]>(['38 (M)', '40 (L)', '42 (XL)', '44 (XXL)']);
  const [formType, setFormType] = useState<'Set' | 'Top Only' | 'Unstitched'>('Set');
  const [formBadges, setFormBadges] = useState<string[]>(['New']);
  const [formImages, setFormImages] = useState<string[]>(['https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=800&q=80']);
  const [formColors, setFormColors] = useState<{ name: string; hex: string }[]>([
    { name: 'Royal Ivory Gold', hex: '#FFF8DC' }
  ]);


  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTime && Date.now() < lockoutTime) {
      onShowToast(`🚨 System is locked. Please try again in ${secondsRemaining}s.`, 'error');
      return;
    }

    if (pinInput.trim() === SECURE_PIN) {
      setIsAuthenticated(true);
      localStorage.setItem('sumera_admin_auth', 'true');
      localStorage.removeItem('sumera_admin_attempts');
      localStorage.removeItem('sumera_admin_lockout');
      setLoginAttempts(0);
      setPinInput('');
      onShowToast('✓ Authentication successful. Welcome to Nomaan Admin Portal.', 'success');
    } else {
      const nextAttempts = loginAttempts + 1;
      setLoginAttempts(nextAttempts);
      localStorage.setItem('sumera_admin_attempts', String(nextAttempts));
      setIsErrorShaking(true);
      setTimeout(() => setIsErrorShaking(false), 500);

      if (nextAttempts >= 5) {
        const until = Date.now() + 60 * 1000; // 60 seconds lockout
        setLockoutTime(until);
        localStorage.setItem('sumera_admin_lockout', String(until));
        onShowToast('🚨 System locked out due to multiple failed entry attempts. Try again in 60 seconds.', 'error');
      } else {
        onShowToast(`Incorrect security PIN. ${5 - nextAttempts} attempts remaining.`, 'error');
      }
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('sumera_admin_auth');
    onShowToast('Logged out of Admin Portal.', 'info');
  };

  // Auto-clear admin portal session after 10 minutes of inactivity
  useEffect(() => {
    if (!isAuthenticated) return;

    let timeoutId: any;

    const resetInactivityTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsAuthenticated(false);
        localStorage.removeItem('sumera_admin_auth');
        onShowToast('🚨 Admin session expired due to 10 minutes of inactivity.', 'error');
      }, 10 * 60 * 1000); // 10 minutes
    };

    // Initialize timer on mount or auth change
    resetInactivityTimer();

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetInactivityTimer);
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetInactivityTimer);
      });
    };
  }, [isAuthenticated]);

  // Open Form for Adding
  const handleOpenAddForm = () => {
    const randomSKU = 'NB-' + Math.floor(100000 + Math.random() * 900000);
    setEditingProduct(null);
    setFormId(randomSKU);
    setFormTitle('');
    setFormPrice(4999);
    setFormMrp(8999);
    setFormCategory('sherwanis');
    setFormFabric('Raw Silk & Zardozi');
    setFormLength('44 inches');
    setFormDescription('Handcrafted designer groom wear from Nomaan Brothers Warangal atelier.');
    setFormSizes(['38 (M)', '40 (L)', '42 (XL)', '44 (XXL)']);
    setFormType('Set');
    setFormBadges(['New']);
    setFormImages(['https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=800&q=80']);
    setFormColors([{ name: 'Royal Ivory Gold', hex: '#FFF8DC' }]);
    setIsFormOpen(true);
  };

  // Open Form for Editing
  const handleOpenEditForm = useCallback((product: Product) => {
    setEditingProduct(product);
    setFormId(product.id);
    setFormTitle(product.title);
    setFormPrice(product.price);
    setFormMrp(product.mrp);
    setFormCategory(product.category);
    setFormFabric(product.fabric);
    setFormLength(product.length || '44 inches');
    setFormDescription(product.description);
    setFormSizes(product.sizes);
    setFormType(product.type || 'Set');
    setFormBadges(product.badges || []);
    setFormImages(product.images || []);
    setFormColors(product.colors || []);
    setIsFormOpen(true);
  }, []);

  // Submit Product Form (Create or Update)
  const handleSaveProductForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      onShowToast('Please specify a title for the product.', 'error');
      return;
    }
    if (formImages.length === 0 || !formImages[0]) {
      onShowToast('Please provide at least one product image URL.', 'error');
      return;
    }

    const payload: Product = {
      id: formId,
      title: formTitle,
      price: Number(formPrice),
      mrp: Number(formMrp),
      category: formCategory,
      fabric: formFabric,
      length: formLength,
      sizes: formSizes,
      description: formDescription,
      type: formType,
      badges: formBadges,
      images: formImages.filter(url => !!url),
      colors: formColors.filter(c => !!c.name && !!c.hex),
      hasBottom: formType === 'Set',
      rating: editingProduct?.rating || 4.7,
      reviewsCount: editingProduct?.reviewsCount || 12,
      specs: [
        { label: 'Fabric', value: formFabric },
        { label: 'Length', value: formLength },
        { label: 'Style', value: formType }
      ],
      sizeChart: editingProduct?.sizeChart || {
        top: [
          { size: 'S', chestOrWaist: '36"', length: formLength },
          { size: 'M', chestOrWaist: '38"', length: formLength },
          { size: 'L', chestOrWaist: '40"', length: formLength },
          { size: 'XL', chestOrWaist: '42"', length: formLength },
          { size: 'XXL', chestOrWaist: '44"', length: formLength }
        ]
      },
      reviews: editingProduct?.reviews || [],
      adminPin: SECURE_PIN
    };

    try {
      await saveProduct(payload);
      onShowToast(`✓ Product "${formTitle}" saved successfully.`, 'success');
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
      onShowToast('Failed to save product to database.', 'error');
    }
  };

  // Delete product logic
  const handleDeleteProduct = useCallback(async (id: string) => {
    try {
      await deleteProduct(id);
      onShowToast('✓ Product deleted from database.', 'success');
      setIsDeletingId(null);
    } catch (err) {
      console.error(err);
      onShowToast('Failed to delete product.', 'error');
    }
  }, [onShowToast]);

  // Update order status logic
  const handleUpdateOrderStatus = useCallback(async (order: any, newStatus: string) => {
    try {
      const updatedOrder = { ...order, status: newStatus, adminPin: SECURE_PIN };
      await saveGlobalOrder(updatedOrder);
      onShowToast(`✓ Order ${order.id} status updated to ${newStatus}.`, 'success');
    } catch (err) {
      console.error(err);
      onShowToast('Failed to update order status.', 'error');
    }
  }, [onShowToast]);

  // Pagination states
  const [productPage, setProductPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [returnPage, setReturnPage] = useState(1);
  const [lastProductDoc, setLastProductDoc] = useState<any>(null);
  const [lastOrderDoc, setLastOrderDoc] = useState<any>(null);
  const pageSize = 10;

  const { data: productData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', productPage],
    queryFn: () => getProductsPaginated(productPage === 1 ? null : lastProductDoc, pageSize),
  });

  const { data: orderData, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['orders', orderPage],
    queryFn: () => getOrdersPaginated(orderPage === 1 ? null : lastOrderDoc, pageSize),
  });
  
  useEffect(() => {
    if (productData?.lastVisible) {
      setLastProductDoc(productData.lastVisible);
    }
  }, [productData]);

  useEffect(() => {
    if (orderData?.lastVisible) {
      setLastOrderDoc(orderData.lastVisible);
    }
  }, [orderData]);
  const filteredDashboardProducts = products.filter(p => 
    p.title.toLowerCase().includes(dashboardSearch.toLowerCase()) ||
    p.id.toLowerCase().includes(dashboardSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(dashboardSearch.toLowerCase())
  );
  
  const paginatedProducts = filteredDashboardProducts.slice((productPage - 1) * pageSize, productPage * pageSize);
  const totalProductPages = Math.ceil(filteredDashboardProducts.length / pageSize);

  // Compute stats
  const totalSalesRevenue = orders.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalOrdersCount = orders.length;
  const totalProductsCount = products.length;

  return (
    <div className="w-full min-h-screen bg-stone-50 flex flex-col text-stone-900 font-sans">
      <div className="flex-grow flex flex-col">
        {/* Header bar */}
        <div className="bg-stone-900 px-4 md:px-8 py-4 flex justify-between items-center text-white sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-amber-400 animate-spin-slow" />
            <div>
              <h2 className="font-serif text-base md:text-xl font-bold tracking-wide">Nomaan Admin Control</h2>
              <p className="text-[9px] md:text-[10px] text-stone-400 font-sans font-light">Proprietary Storefront Management Console</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2.5">
            {isAuthenticated && (
              <button
                id="admin-logout-btn"
                onClick={handleLogout}
                                className="text-[10px] md:text-[10px] font-sans font-bold uppercase tracking-wider bg-stone-800 hover:bg-stone-750 px-4 py-3 md:px-2.5 md:py-1.5 rounded-lg text-stone-300 hover:text-white transition-all cursor-pointer"
              >
                Logout
              </button>
            )}
            <button 
              id="admin-exit-console-btn"
              onClick={onClose}
              className="px-5 py-3 md:px-3.5 md:py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 text-[11px] md:text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Exit Console</span>
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-grow overflow-hidden flex flex-col md:flex-row">
          
          {/* SECURE LOGIN VIEW */}
          {!isAuthenticated ? (
            <div className="flex-grow flex flex-col items-center justify-center bg-stone-50/50 p-6">
              <motion.div 
                animate={isErrorShaking ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md bg-white border border-stone-200/80 rounded-3xl p-8 shadow-xl space-y-6"
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-14 h-14 bg-stone-900 text-amber-400 rounded-full flex items-center justify-center shadow-lg">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-stone-900">Security Authentication Required</h3>
                  <p className="text-xs text-stone-500 max-w-sm">
                    Access is restricted strictly to Nomaan Brothers administration. Please enter your 6-digit credential PIN to unlock management features.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">6-Digit Admin PIN</label>
                    <div className="relative">
                      <input
                        type={showPin ? "text" : "password"}
                        maxLength={6}
                        required
                        placeholder="••••••"
                        value={pinInput}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setPinInput(val);
                        }}
                        disabled={!!lockoutTime}
                        className={`w-full bg-stone-50 border ${isErrorShaking ? 'border-red-500' : 'border-stone-200'} rounded-lg p-3 text-center text-lg font-mono tracking-widest focus:outline-none focus:border-stone-850`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 text-[10px] font-bold"
                      >
                        {showPin ? 'HIDE' : 'SHOW'}
                      </button>
                    </div>
                    {loginAttempts > 0 && !lockoutTime && (
                      <p className="text-[10px] text-red-600 text-center font-medium">
                        Incorrect credentials. {5 - loginAttempts} remaining attempts.
                      </p>
                    )}
                    {lockoutTime && (
                      <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center space-y-1">
                        <p className="text-[11px] font-bold text-red-700">🚨 SYSTEM LOCKED OUT</p>
                        <p className="text-[10px] text-red-600 leading-normal">
                          Multiple incorrect credential attempts. Locked out for security defense. Try again in {secondsRemaining} seconds.
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={!!lockoutTime || pinInput.length < 6}
                    className="w-full py-3.5 bg-stone-950 text-white font-sans text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-stone-800 disabled:bg-stone-200 disabled:text-stone-400 transition-colors cursor-pointer shadow-md"
                  >
                    Unlock Dashboard
                  </button>
                </form>
              </motion.div>
            </div>
          ) : (
            
            /* SECURE DASHBOARD FRAMEWORK */
            <>
              {/* Left sidebar nav */}
              <div className="w-full md:w-56 bg-stone-50 border-b md:border-b-0 md:border-r border-stone-200/60 p-2 md:p-4 flex flex-row flex-nowrap md:flex-col gap-1 md:gap-2 overflow-x-auto md:overflow-x-visible no-scrollbar">
                <button
                  onClick={() => setActiveTab('metrics')}
                  className={`flex-shrink-0 md:flex-initial flex items-center justify-center md:justify-start gap-2 px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'metrics' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900'
                  }`}
                >
                  <TrendingUp className="w-4 h-4 flex-shrink-0" />
                  <span>Overview</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('products')}
                  className={`flex-shrink-0 md:flex-initial flex items-center justify-center md:justify-start gap-2 px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                    activeTab === 'products' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900'
                  }`}
                >
                  <Package className="w-4 h-4 flex-shrink-0" />
                  <span>Products ({totalProductsCount})</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex-shrink-0 md:flex-initial flex items-center justify-center md:justify-start gap-2 px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer relative whitespace-nowrap ${
                    activeTab === 'orders' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 flex-shrink-0" />
                  <span>Orders ({totalOrdersCount})</span>
                  {orders.filter(o => o.status === 'Processing').length > 0 && (
                    <span className="absolute top-1 right-1 md:relative md:top-0 md:right-0 ml-auto w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('returns')}
                  className={`flex-shrink-0 md:flex-initial flex items-center justify-center md:justify-start gap-2 px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer relative whitespace-nowrap ${
                    activeTab === 'returns' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900'
                  }`}
                >
                  <RefreshCw className="w-4 h-4 flex-shrink-0" />
                  <span>Returns ({returnRequests.length})</span>
                  {returnRequests.filter(r => r.status === 'pending').length > 0 && (
                    <span className="absolute top-1.5 right-1.5 md:relative md:top-0 md:right-0 ml-auto bg-amber-500 text-stone-950 font-bold text-[9px] px-1.5 py-0.5 rounded-full">
                      {returnRequests.filter(r => r.status === 'pending').length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('customization')}
                  className={`flex-shrink-0 md:flex-initial flex items-center justify-center md:justify-start gap-2 px-3 py-2.5 md:px-4 md:py-3 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer relative whitespace-nowrap ${
                    activeTab === 'customization' ? 'bg-stone-900 text-white shadow-md' : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900'
                  }`}
                >
                  <Sliders className="w-4 h-4 flex-shrink-0" />
                  <span>Customization</span>
                </button>
              </div>

              {/* Main content stage */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-stone-50/20">
                
                {/* 1. METRICS OVERVIEW */}
                {activeTab === 'metrics' && (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-1">
                      <h3 className="font-serif text-2xl font-bold text-stone-900">Performance Summary</h3>
                      <p className="text-xs text-stone-500 font-sans">Business metrics and quick execution tools.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white border border-stone-200/70 p-5 rounded-2xl space-y-2 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Total Sales Vol.</span>
                          <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <DollarSign className="w-4 h-4" />
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-stone-950 font-serif">₹{totalSalesRevenue.toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-stone-400">Sum of overall orders placed via checkout</p>
                      </div>

                      <div className="bg-white border border-stone-200/70 p-5 rounded-2xl space-y-2 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Total Checkout Orders</span>
                          <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <ShoppingBag className="w-4 h-4" />
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-stone-950 font-serif">{totalOrdersCount}</p>
                        <p className="text-[10px] text-stone-400">Real-time submitted purchase records</p>
                      </div>

                      <div className="bg-white border border-stone-200/70 p-5 rounded-2xl space-y-2 shadow-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Active Catalog Products</span>
                          <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                            <Package className="w-4 h-4" />
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-stone-950 font-serif">{totalProductsCount}</p>
                        <p className="text-[10px] text-stone-400">Available items on the public shop</p>
                      </div>
                    </div>

                    {/* Quick Access Actions */}
                    <div className="bg-white border border-stone-200/80 p-6 rounded-2xl space-y-4 shadow-sm">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-stone-800">Quick Operations</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          onClick={handleOpenAddForm}
                          className="flex items-center justify-between p-4 bg-stone-900 text-stone-50 rounded-xl hover:bg-stone-800 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
                        >
                          <span>Add New Product</span>
                          <Plus className="w-4 h-4 text-amber-400" />
                        </button>

                        <button
                          onClick={() => setActiveTab('orders')}
                          className="flex items-center justify-between p-4 bg-stone-50 text-stone-800 border border-stone-250 rounded-xl hover:bg-stone-100 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
                        >
                          <span>View Incoming Orders</span>
                          <ChevronRight className="w-4 h-4 text-stone-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. PRODUCTS MANAGEMENT */}
                {activeTab === 'products' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <h3 className="font-serif text-2xl font-bold text-stone-900">Manage Catalog</h3>
                        <p className="text-xs text-stone-500">Edit, remove or create product specifications.</p>
                      </div>

                      <button
                        onClick={handleOpenAddForm}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Product</span>
                      </button>
                    </div>

                    {/* Search bar */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search products by title, category, or SKU..."
                        value={dashboardSearch}
                        onChange={(e) => setDashboardSearch(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-stone-800 font-sans"
                      />
                      <Search className="absolute left-3.5 top-3 w-4 h-4 text-stone-400" />
                    </div>

                    {/* Product Rows List */}
                    <div className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-sm divide-y divide-stone-100">
                      {isLoadingProducts ? (
                        <div className="text-center py-12 text-stone-400 text-xs">Loading products...</div>
                      ) : productData?.products && productData.products.length > 0 ? (
                        <>
                          {productData.products.map((p: Product) => (
                            <AdminProductRow
                              key={p.id}
                              product={p}
                              onEdit={handleOpenEditForm}
                              onDeleteStart={setIsDeletingId}
                              onDeleteConfirm={handleDeleteProduct}
                              onDeleteCancel={() => setIsDeletingId(null)}
                              isDeleting={isDeletingId === p.id}
                            />
                          ))}
                          <div className="p-4 flex items-center justify-between border-t border-stone-100">
                            <button
                              disabled={productPage === 1}
                              onClick={() => setProductPage(prev => Math.max(prev - 1, 1))}
                              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                            >
                              Previous
                            </button>
                            <span className="text-xs text-stone-500 font-sans">
                              Page {productPage}
                            </span>
                            <button
                              disabled={!productData?.lastVisible}
                              onClick={() => setProductPage(prev => prev + 1)}
                              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                            >
                              Next
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-12 text-stone-400 text-xs">
                          No products found matching "{dashboardSearch}".
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. ORDERS MANAGEMENT */}
                {activeTab === 'orders' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-serif text-2xl font-bold text-stone-900">Incoming Orders</h3>
                      <p className="text-xs text-stone-500 font-sans">Manage customer checkouts and order statuses.</p>
                    </div>

                    {/* Orders List */}
                    <div className="space-y-4">
                      {isLoadingOrders ? (
                        <div className="text-center py-16 bg-white border border-stone-200 rounded-2xl text-stone-400 text-xs">Loading orders...</div>
                      ) : orderData?.orders && orderData.orders.length > 0 ? (
                        <>
                          {orderData.orders.map((order: any) => (
                            <AdminOrderRow
                              key={order.id}
                              order={order}
                              onUpdateStatus={handleUpdateOrderStatus}
                            />
                          ))}
                          <div className="p-4 flex items-center justify-between border-t border-stone-100 bg-white rounded-2xl border border-stone-200">
                            <button
                              disabled={orderPage === 1}
                              onClick={() => setOrderPage(prev => Math.max(prev - 1, 1))}
                              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                            >
                              Previous
                            </button>
                            <span className="text-xs text-stone-500 font-sans">
                              Page {orderPage}
                            </span>
                            <button
                              disabled={!orderData.lastVisible}
                              onClick={() => setOrderPage(prev => prev + 1)}
                              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                            >
                              Next
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-16 bg-white border border-stone-200 rounded-2xl text-stone-400 text-xs">
                          No checkout orders have been placed on the store yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. RETURNS & EXCHANGES PIPELINE MANAGEMENT */}
                {activeTab === 'returns' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-serif text-2xl font-bold text-stone-900">Exchange & Return Requests</h3>
                        <p className="text-xs text-stone-500 font-sans">Approve, update pickup, or message customers on return/exchange pipelines.</p>
                      </div>

                      {/* Search box for return tickets */}
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input
                          type="text"
                          placeholder="Search Ticket, Order, Email..."
                          value={returnsSearch}
                          onChange={(e) => setReturnsSearch(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-stone-500"
                        />
                      </div>
                    </div>

                    {/* Return request cards */}
                    <div className="space-y-4">
                      {returnRequests.length > 0 ? (
                        returnRequests
                          .filter(req => {
                            const term = returnsSearch.toLowerCase();
                            return !term || 
                              req.id.toLowerCase().includes(term) || 
                              req.orderId.toLowerCase().includes(term) || 
                              req.email.toLowerCase().includes(term);
                          })
                          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                          .map((req) => {
                            return (
                              <div key={req.id} className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                                <div className="flex justify-between items-start flex-wrap gap-2 pb-3.5 border-b border-stone-100">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded text-xs">
                                        Ticket: {req.id}
                                      </span>
                                      <span className="font-mono font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded text-xs">
                                        Order: {req.orderId}
                                      </span>
                                      <span className="text-[10px] text-stone-400 font-sans">
                                        {new Date(req.createdAt).toLocaleString(undefined, {dateStyle: 'medium', timeStyle: 'short'})}
                                      </span>
                                    </div>
                                    <p className="text-xs text-stone-500 mt-1">Customer Email: <strong className="text-stone-700">{req.email}</strong></p>
                                  </div>

                                  {/* Status Select dropdown */}
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Pipeline Status:</span>
                                    <select
                                      value={req.status}
                                      onChange={async (e) => {
                                        const nextStatus = e.target.value;
                                        setUpdatingRequestId(req.id);
                                        try {
                                          const updated = {
                                            ...req,
                                            status: nextStatus,
                                            adminPin: SECURE_PIN,
                                            resolvedAt: ['approved', 'rejected'].includes(nextStatus) ? new Date().toISOString() : null
                                          };
                                          await saveReturnRequest(updated);
                                          onShowToast(`✓ Ticket ${req.id} pipeline state updated to ${nextStatus}.`, 'success');
                                        } catch (err) {
                                          onShowToast('Failed to update status.', 'error');
                                        } finally {
                                          setUpdatingRequestId(null);
                                        }
                                      }}
                                      className="py-1 px-2.5 border border-stone-200 rounded-lg text-xs bg-white font-semibold focus:outline-none focus:ring-1 focus:ring-stone-500 cursor-pointer"
                                    >
                                      <option value="pending">Pending Review</option>
                                      <option value="pickup">Reverse Pickup Scheduled</option>
                                      <option value="received">Received at Warehouse</option>
                                      <option value="approved">Completed / Refunded</option>
                                      <option value="rejected">Declined / Rejected</option>
                                    </select>
                                  </div>
                                </div>

                                {/* Requested Items List */}
                                <div className="space-y-2">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Customer Requested items:</p>
                                  <div className="space-y-2">
                                    {req.items?.map((item: any) => (
                                      <div key={item.id} className="p-3 bg-stone-50 border border-stone-150 rounded-xl flex items-center justify-between gap-3 text-xs">
                                        <div className="flex items-center gap-3">
                                          {item.image && (
                                            <img src={item.image} alt="" className="w-9 h-11 object-cover rounded border border-stone-200" />
                                          )}
                                          <div>
                                            <p className="font-semibold text-stone-900">{item.title}</p>
                                            <p className="text-[10px] text-stone-500 mt-0.5">
                                              <span className="font-bold text-stone-700 bg-stone-200 px-1 py-0.2 rounded text-[9px] mr-1.5 uppercase">{item.requestType}</span>
                                              Size: {item.selectedSize} | Color: {item.selectedColor || 'Default'} | Qty: {item.quantity}
                                            </p>
                                            {item.requestType === 'exchange' && (
                                              <p className="text-[10px] text-amber-700 font-bold mt-1">
                                                ➔ Replacement Size: {item.exchangeSize} {item.exchangeColor ? `| Extra Comments: "${item.exchangeColor}"` : ''}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <p className="font-bold text-stone-900 font-mono">₹{item.price * item.quantity}</p>
                                          <p className="text-[10px] text-stone-400 font-sans mt-1">Reason: {item.reason}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Bottom row: Refund method, Optional proof image thumbnail, and message input */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-stone-100">
                                  <div className="space-y-2 text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-stone-400">Refund Method:</span>
                                      <span className="font-bold text-stone-800 uppercase tracking-wider font-mono">{req.refundMethod}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-stone-400">Refund amount:</span>
                                      <span className="font-serif font-bold text-stone-950">₹{req.refundAmount}</span>
                                    </div>

                                    {/* Proof Image display if exists */}
                                    {req.image && (
                                      <div className="pt-2">
                                        <p className="text-[10px] text-stone-400 font-bold mb-1.5">Customer Verification Attachment:</p>
                                        <a href={req.image} target="_blank" rel="noreferrer" className="inline-block relative group">
                                          <img 
                                            src={req.image} 
                                            alt="Verification Proof" 
                                            className="w-20 h-20 object-cover rounded-lg border border-stone-250 cursor-pointer group-hover:opacity-95 transition-all"
                                          />
                                          <span className="absolute inset-0 bg-black/40 text-white text-[9px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">View Full</span>
                                        </a>
                                      </div>
                                    )}
                                  </div>

                                  {/* Message to customer section */}
                                  <div className="space-y-1.5 text-xs">
                                    <label className="font-bold text-stone-500 uppercase tracking-wider text-[10px] block">Customer Communication Log</label>
                                    <div className="flex gap-2">
                                      <input
                                        type="text"
                                        placeholder="Add update note (e.g. Reverse AWB Delhivery #3892794)"
                                        defaultValue={req.adminNotes || ''}
                                        onKeyDown={async (e) => {
                                          if (e.key === 'Enter') {
                                            const val = (e.target as HTMLInputElement).value;
                                            try {
                                              const updated = {
                                                ...req,
                                                adminNotes: val,
                                                adminPin: SECURE_PIN
                                              };
                                              await saveReturnRequest(updated);
                                              onShowToast('✓ Support message logged to ticket.', 'success');
                                            } catch (err) {
                                              onShowToast('Failed to save message.', 'error');
                                            }
                                          }
                                        }}
                                        className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-500 text-xs font-sans"
                                      />
                                      <span className="text-[9px] text-stone-400 self-center whitespace-nowrap">Press Enter</span>
                                    </div>
                                    <p className="text-[10px] text-stone-400">This message is instantly visible on the customer's return tracking portal.</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                      ) : (
                        <div className="text-center py-16 bg-white border border-stone-200 rounded-2xl text-stone-400 text-xs">
                          No return or exchange requests filed yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. HOMEPAGE HERO CUSTOMIZATION */}
                {activeTab === 'customization' && (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-1">
                      <h3 className="font-serif text-2xl font-bold text-stone-900">Homepage Customizer</h3>
                      <p className="text-xs text-stone-500 font-sans">Modify the storefront's hero banner campaign, texts, and imagery in real-time.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left: Edit Form */}
                      <div className="bg-white border border-stone-200/80 rounded-2xl p-5 md:p-6 shadow-sm space-y-5">
                        <h4 className="text-sm font-bold uppercase tracking-wider text-stone-800 pb-2 border-b border-stone-100">Banner Configurations</h4>
                        
                        <div className="space-y-4 font-sans">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Campaign Badge / Tagline</label>
                            <input
                              type="text"
                              value={heroBadge}
                              onChange={(e) => setHeroBadge(e.target.value)}
                              placeholder="e.g. Festive Collection 2026"
                              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-stone-800"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Main Header Title</label>
                            <input
                              type="text"
                              value={heroTitle}
                              onChange={(e) => setHeroTitle(e.target.value)}
                              placeholder="e.g. Everyday Elegance Handcrafted Detail"
                              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-stone-800 font-serif font-semibold"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Hero Description Subtitle</label>
                            <textarea
                              value={heroSubtitle}
                              onChange={(e) => setHeroSubtitle(e.target.value)}
                              placeholder="e.g. Warangal's premier destination for bespoke groom sherwanis, sequence kurtas, and Arabic thoobs."
                              rows={3}
                              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-stone-800 resize-none font-sans"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Hero Background Image URL</label>
                            <input
                              type="text"
                              value={heroImage}
                              onChange={(e) => setHeroImage(e.target.value)}
                              placeholder="Enter image URL..."
                              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-stone-800 font-mono text-stone-600"
                            />
                          </div>
                        </div>

                        {/* Presets */}
                        <div className="space-y-2 pt-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block font-sans">Or Select Premium Suggested Image Preset:</span>
                          <div className="grid grid-cols-2 gap-2 font-sans">
                            {[
                              { label: 'Nomaan Showroom Grand Opening', url: 'https://img.youtube.com/vi/HmOWSHSZNtM/maxresdefault.jpg' },
                              { label: 'Royal Zardozi Groom Sherwani', url: 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=1600&q=80' },
                              { label: 'Velvet Heritage Embroidered Set', url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1600&q=80' },
                              { label: 'Haldi Sequence Mirror Kurta', url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=80' }
                            ].map((preset, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setHeroImage(preset.url)}
                                className="p-2 border border-stone-200 hover:border-stone-800 rounded-lg bg-stone-50/50 hover:bg-stone-50 text-[10px] text-left truncate flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span className="truncate">{preset.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={isSavingHero}
                          onClick={async () => {
                            setIsSavingHero(true);
                            try {
                              await saveHeroSettings({
                                heroImage,
                                heroBadge,
                                heroTitle,
                                heroSubtitle,
                                adminPin: SECURE_PIN
                              });
                              onShowToast('✓ Storefront Hero Customizations saved successfully! All users will instantly see the new banner.', 'success');
                            } catch (error) {
                              onShowToast('Failed to save Hero Customizations.', 'error');
                            } finally {
                              setIsSavingHero(false);
                            }
                          }}
                          className="w-full mt-4 py-3 bg-stone-950 text-white hover:bg-stone-850 text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow flex items-center justify-center gap-2 font-sans"
                        >
                          {isSavingHero ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Saving Settings...</span>
                            </>
                          ) : (
                            <span>Publish to Storefront</span>
                          )}
                        </button>
                      </div>

                      {/* Right: Live Preview */}
                      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col space-y-4 text-stone-100 justify-between overflow-hidden relative min-h-[380px] md:min-h-auto">
                        <div className="absolute inset-0 z-0">
                          <img
                            src={heroImage}
                            alt="Live Hero Preview"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover object-top opacity-30"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-transparent" />
                        </div>

                        <div className="relative z-10 self-start">
                          <span className="bg-amber-400 text-stone-950 text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider font-sans">Live Banner Mockup</span>
                        </div>

                        <div className="relative z-10 space-y-3.5 text-center max-w-md mx-auto pt-16 pb-6">
                          {heroBadge && (
                            <span className="text-[9px] md:text-xs font-sans font-bold tracking-[0.2em] uppercase text-amber-400 bg-stone-950/80 px-3 py-1 rounded-full border border-stone-800">
                              {heroBadge}
                            </span>
                          )}
                          <h3 className="font-serif text-xl md:text-3xl font-bold leading-tight text-white drop-shadow-md">
                            {heroTitle || 'Enter a banner title...'}
                          </h3>
                          <p className="font-sans text-[10px] md:text-xs text-stone-300 tracking-wider font-light leading-relaxed">
                            {heroSubtitle || 'Enter a tagline description...'}
                          </p>

                          <div className="flex gap-2 justify-center pt-2">
                            <button type="button" className="px-4 py-2 bg-stone-100 text-stone-950 font-sans text-[9px] font-bold uppercase tracking-wider rounded-lg pointer-events-none opacity-90">Shop New</button>
                            <button type="button" className="px-4 py-2 bg-transparent text-stone-100 border border-stone-400 font-sans text-[9px] font-bold uppercase tracking-wider rounded-lg pointer-events-none opacity-70">Explore Sets</button>
                          </div>
                        </div>

                        <div className="relative z-10 text-center text-[9px] text-stone-500 font-mono">
                          Image: {heroImage ? 'Configured URL' : 'Fallback Unsplash Image'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </>
          )}

        </div>
      </div>

      {/* COMPREHENSIVE PRODUCT FORM DIALOG (Add/Edit) */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl p-6 border border-stone-100 flex flex-col space-y-4"
            >
              <div className="flex justify-between items-center pb-3 border-b border-stone-100">
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    {editingProduct ? 'Edit Catalog Specifications' : 'Introduce New Product Item'}
                  </h3>
                  <p className="text-[10px] text-stone-400 font-sans">Provide absolute identifiers and properties below.</p>
                </div>
                <button 
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 rounded-full hover:bg-stone-50 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveProductForm} className="space-y-4">
                
                {/* ID & Title Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Unique SKU ID</label>
                    <input
                      type="text"
                      required
                      value={formId}
                      onChange={(e) => setFormId(e.target.value)}
                      placeholder="e.g. SC-102930"
                      disabled={!!editingProduct}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-stone-800 font-mono disabled:opacity-50"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Product Title / Name</label>
                    <input
                      type="text"
                      required
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. Amrapali Handblock Cotton Set"
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-stone-800 font-sans font-semibold text-stone-900"
                    />
                  </div>
                </div>

                {/* Price, MRP, Category, Fabric */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Selling Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-stone-800 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">MRP Value (₹)</label>
                    <input
                      type="number"
                      required
                      value={formMrp}
                      onChange={(e) => setFormMrp(Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-stone-800 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Category Tag</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-stone-800 font-sans"
                    >
                      <option value="sherwanis">Royal Sherwanis</option>
                      <option value="kurtas">Designer Kurtas</option>
                      <option value="thoobs">Arabic Thoobs</option>
                      <option value="indo-western">Indo-Western Suits</option>
                      <option value="accessories">Safas & Accessories</option>
                      <option value="unstitched">Unstitched Weaves</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Type Category</label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as any)}
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-stone-800 font-sans"
                    >
                      <option value="Set">Set</option>
                      <option value="Top Only">Top Only</option>
                      <option value="Unstitched">Unstitched</option>
                    </select>
                  </div>
                </div>

                {/* Fabric, Length, Sizes */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Fabric Description</label>
                    <input
                      type="text"
                      value={formFabric}
                      onChange={(e) => setFormFabric(e.target.value)}
                      placeholder="e.g. Pure Linen Blend"
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-stone-800 font-sans"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Garment Length</label>
                    <input
                      type="text"
                      value={formLength}
                      onChange={(e) => setFormLength(e.target.value)}
                      placeholder="e.g. 44 inches"
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-stone-800 font-sans"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Sizes Available (split with space)</label>
                    <input
                      type="text"
                      value={formSizes.join(' ')}
                      onChange={(e) => setFormSizes(e.target.value.split(/\s+/).filter(Boolean))}
                      placeholder="e.g. S M L XL XXL"
                      className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-stone-800 font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Product Detailed Description</label>
                  <textarea
                    rows={2}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Provide details about the block print, silhouette, occasions, and wash care guidelines..."
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-stone-800 font-sans leading-relaxed"
                  />
                </div>

                {/* Badges */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Badges/Highlights (space-split)</label>
                  <input
                    type="text"
                    value={formBadges.join(' ')}
                    onChange={(e) => setFormBadges(e.target.value.split(/\s+/).filter(Boolean))}
                    placeholder="e.g. Best-Seller Pinterest-Pick New"
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-stone-800 font-mono text-stone-700"
                  />
                </div>

                {/* Colors Management */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Product Colors</label>
                  {formColors.map((color, idx) => (
                    <div key={`color-${idx}`} className="flex gap-2">
                      <input
                        type="text"
                        value={color.name}
                        onChange={(e) => {
                          const updated = [...formColors];
                          updated[idx].name = e.target.value;
                          setFormColors(updated);
                        }}
                        placeholder="Color Name (e.g. Red)"
                        className="flex-grow bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-stone-800 font-sans"
                      />
                      <input
                        type="color"
                        value={color.hex}
                        onChange={(e) => {
                          const updated = [...formColors];
                          updated[idx].hex = e.target.value;
                          setFormColors(updated);
                        }}
                        className="w-10 h-9 rounded-lg cursor-pointer border border-stone-200"
                      />
                      <button
                        type="button"
                        onClick={() => setFormColors(formColors.filter((_, i) => i !== idx))}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormColors([...formColors, { name: '', hex: '#000000' }])}
                    className="w-full py-2 bg-stone-100 text-stone-700 rounded-lg text-xs font-bold hover:bg-stone-200 transition-all"
                  >
                    + Add Another Color
                  </button>
                </div>

                {/* Product Image URLs */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Product Image URLs</label>
                  {formImages.map((url, idx) => (
                    <div key={`image-${idx}`} className="flex gap-2">
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => {
                          const updated = [...formImages];
                          updated[idx] = e.target.value;
                          setFormImages(updated);
                        }}
                        placeholder="Enter image URL"
                        className="flex-grow bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-stone-800 font-mono text-stone-700"
                      />
                      <button
                        type="button"
                        onClick={() => setFormImages(formImages.filter((_, i) => i !== idx))}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormImages([...formImages, ''])}
                    className="w-full py-2 bg-stone-100 text-stone-700 rounded-lg text-xs font-bold hover:bg-stone-200 transition-all"
                  >
                    + Add Another Image URL
                  </button>
                  <span className="text-[9px] text-stone-400 block mt-0.5">Tip: Add as many angles/views as needed.</span>
                </div>

                {/* Action button triggers */}
                <div className="flex gap-3 justify-end pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2.5 bg-stone-100 text-stone-700 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-stone-200 transition-all cursor-pointer"
                  >
                    Cancel Action
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-stone-900 text-stone-50 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition-all cursor-pointer shadow-md"
                  >
                    Save Changes
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
