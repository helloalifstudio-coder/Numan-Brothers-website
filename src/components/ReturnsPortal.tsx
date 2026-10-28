import React, { useState, useEffect } from 'react';
import { 
  X, Search, ArrowLeft, CheckCircle2, AlertCircle, UploadCloud, 
  RefreshCw, Truck, CreditCard, Coins, ChevronRight, Sparkles, History,
  FileText, Check, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { saveReturnRequest, getReturnRequestsByOrder } from '../lib/firestoreService';
import { ReturnRequest, SelectedItemDetail } from '../types';

interface ReturnsPortalProps {
  onClose: () => void;
  globalOrders: any[];
  userEmail?: string;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onAwardPoints?: (amount: number, description: string) => void;
  userId?: string | null;
}

export default function ReturnsPortal({
  onClose,
  globalOrders,
  userEmail = '',
  onShowToast,
  onAwardPoints,
  userId
}: ReturnsPortalProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'track'>('create');
  
  // Create Return request state
  const [orderIdInput, setOrderIdInput] = useState('');
  const [emailInput, setEmailInput] = useState(userEmail || '');
  const [matchedOrder, setMatchedOrder] = useState<any | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [searching, setSearching] = useState(false);

  // Selected items to return/exchange
  const [selectedItems, setSelectedItems] = useState<Record<string, SelectedItemDetail>>({});

  // Refund option
  const [refundMethod, setRefundMethod] = useState<'original' | 'points'>('points');
  
  // Image upload
  const [itemImage, setItemImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [successRequestId, setSuccessRequestId] = useState<string | null>(null);

  // Track state
  const [trackOrderId, setTrackOrderId] = useState('');
  const [trackEmail, setTrackEmail] = useState('');
  const [trackedRequests, setTrackedRequests] = useState<ReturnRequest[]>([]);
  const [fetchingTrack, setFetchingTrack] = useState(false);
  const [trackSearchAttempted, setTrackSearchAttempted] = useState(false);

  // Search order to return
  const handleSearchOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderIdInput.trim() || !emailInput.trim()) {
      onShowToast('Please enter both Order ID and Email address.', 'error');
      return;
    }

    setSearching(true);
    setSearchAttempted(true);

    setTimeout(() => {
      const idSearch = orderIdInput.trim().toUpperCase();
      const emailSearch = emailInput.trim().toLowerCase();

      // Look in globalOrders (which includes local & guest orders synced from Firestore)
      const found = globalOrders.find(
        (o) => o.id.toUpperCase() === idSearch && 
        (o.shippingDetails?.email?.toLowerCase() === emailSearch || o.email?.toLowerCase() === emailSearch)
      );

      if (found) {
        setMatchedOrder(found);
        // Pre-populate empty selected items structure
        setSelectedItems({});
        onShowToast('✓ Order details fetched successfully!', 'success');
      } else {
        setMatchedOrder(null);
        onShowToast('No matching order found. Please verify details.', 'error');
      }
      setSearching(false);
    }, 600);
  };

  // Toggle item selection
  const handleToggleItemSelect = (itemId: string, item: any) => {
    setSelectedItems((prev) => {
      const copy = { ...prev };
      if (copy[itemId]) {
        delete copy[itemId];
      } else {
        copy[itemId] = {
          type: 'return',
          reason: 'Too small/tight',
          exchangeSize: item.selectedSize || 'M',
          exchangeColor: item.selectedColor || ''
        };
      }
      return copy;
    });
  };

  // Handle parameter changes for an item
  const handleItemParamChange = (itemId: string, field: string, value: any) => {
    setSelectedItems((prev) => {
      if (!prev[itemId]) return prev;
      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          [field]: value
        }
      };
    });
  };

  // Image upload handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      onShowToast('Please upload an image file.', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      onShowToast('Image size should be less than 2MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setItemImage(reader.result as string);
      onShowToast('✓ Image uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Submit request
  const handleSubmitReturn = async () => {
    const selectedKeys = Object.keys(selectedItems);
    if (selectedKeys.length === 0) {
      onShowToast('Please select at least one item to return or exchange.', 'error');
      return;
    }

    setSubmitting(true);
    const requestId = 'RTN-' + Math.floor(100000 + Math.random() * 900000);

    const itemsList = selectedKeys.map((key) => {
      const orderItem = matchedOrder.items.find((it: any) => (it.id || it.product?.id) === key);
      const details = selectedItems[key];
      return {
        id: key,
        title: orderItem?.product?.title || orderItem?.title || 'Unknown Product',
        price: orderItem?.product?.price || orderItem?.price || 0,
        selectedSize: orderItem?.selectedSize || '',
        selectedColor: orderItem?.selectedColor || '',
        quantity: orderItem?.quantity || 1,
        image: orderItem?.product?.images?.[0] || '',
        requestType: details.type, // 'return' or 'exchange'
        reason: details.reason,
        exchangeSize: details.type === 'exchange' ? details.exchangeSize : null,
        exchangeColor: details.type === 'exchange' ? details.exchangeColor : null,
      };
    });

    // Calculate refund total
    const refundTotal = itemsList
      .filter(i => i.requestType === 'return')
      .reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

    const newRequest = {
      id: requestId,
      orderId: matchedOrder.id,
      email: emailInput.toLowerCase().trim(),
      userId: userId || 'guest',
      items: itemsList,
      refundMethod: refundTotal > 0 ? refundMethod : 'n/a',
      refundAmount: refundTotal,
      status: 'pending',
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      image: itemImage,
      adminNotes: '',
      adminPin: '990859' // To verify rules
    };

    try {
      await saveReturnRequest(newRequest);
      
      // If refunded via store loyalty points instantly!
      if (refundTotal > 0 && refundMethod === 'points' && onAwardPoints && userId) {
        // Award 1.1x points (10% extra) as incentive for keeping points
        const pointsToAward = Math.round(refundTotal * 1.1);
        onAwardPoints(pointsToAward, `Instant refund credit + 10% bonus for Return request ${requestId}`);
        onShowToast(`✓ Points refund processed! Added ${pointsToAward} SC Points to your wallet.`, 'success');
      }

      setSuccessRequestId(requestId);
      onShowToast('✓ Return request filed successfully!', 'success');
    } catch (err) {
      console.error(err);
      onShowToast('Error submitting request. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Search existing requests for tracking on-demand (highly scalable query)
  const handleTrackRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackOrderId.trim()) {
      onShowToast('Please enter your Order ID.', 'error');
      return;
    }

    setFetchingTrack(true);
    setTrackSearchAttempted(true);
    const searchId = trackOrderId.trim().toUpperCase();
    const searchEmail = trackEmail.trim().toLowerCase();

    try {
      const matches = await getReturnRequestsByOrder(searchId, searchEmail || undefined);
      setTrackedRequests(matches);
      if (matches.length > 0) {
        onShowToast(`✓ Successfully fetched tracking details!`, 'success');
      } else {
        onShowToast('No active return/exchange request matches these details.', 'info');
      }
    } catch (err) {
      console.error('Error fetching ticket status:', err);
      onShowToast('Failed to check request status. Please try again.', 'error');
    } finally {
      setFetchingTrack(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Pending Review</span>;
      case 'pickup':
        return <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Pickup Scheduled</span>;
      case 'received':
        return <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Received at Warehouse</span>;
      case 'approved':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Completed / Refunded</span>;
      case 'rejected':
        return <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Declined</span>;
      default:
        return <span className="bg-stone-50 text-stone-700 border border-stone-200 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl w-full max-w-2xl h-[85vh] shadow-2xl relative border border-stone-150 flex flex-col overflow-hidden"
      >
        {/* Header Header */}
        <div className="p-5 border-b border-stone-150 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-900 text-white rounded-lg">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900">Exchange & Return Pipeline</h3>
              <p className="text-[11px] text-stone-500 font-sans mt-0.5">Automated hassle-free pickups, real-time tracking, & instant wallet refunds.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 text-stone-400 hover:text-stone-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-150 bg-stone-50 px-4">
          <button
            onClick={() => {
              setActiveTab('create');
              setSuccessRequestId(null);
              setMatchedOrder(null);
              setSearchAttempted(false);
            }}
            className={`py-3 px-4 font-sans text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'create' 
                ? 'border-stone-900 text-stone-900' 
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            File Return or Exchange
          </button>
          <button
            onClick={() => {
              setActiveTab('track');
              setTrackedRequests([]);
              setTrackSearchAttempted(false);
            }}
            className={`py-3 px-4 font-sans text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'track' 
                ? 'border-stone-900 text-stone-900' 
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Track Request Status
          </button>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-white font-sans text-stone-800">
          {activeTab === 'create' ? (
            <AnimatePresence mode="wait">
              {successRequestId ? (
                // Success State Screen
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 text-center py-8 px-4"
                >
                  <div className="inline-flex items-center justify-center p-4 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-serif text-xl font-bold text-stone-900">Request Submitted Successfully!</h4>
                    <p className="text-sm text-stone-600 max-w-md mx-auto">
                      Your return request <strong className="font-mono text-stone-900 bg-stone-100 px-1.5 py-0.5 rounded text-xs">{successRequestId}</strong> has been created and queued for review.
                    </p>
                  </div>

                  <div className="bg-stone-50 border border-stone-150 rounded-xl p-4 max-w-md mx-auto text-left text-xs space-y-3">
                    <h5 className="font-bold text-stone-800 uppercase tracking-wide">Next steps in our automated pipeline:</h5>
                    <div className="flex gap-2.5">
                      <div className="w-5 h-5 bg-stone-200 text-stone-700 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0">1</div>
                      <p className="text-stone-600"><strong className="text-stone-800">Warehouse Approval</strong>: Our support team will review details in 12–24 hours.</p>
                    </div>
                    <div className="flex gap-2.5">
                      <div className="w-5 h-5 bg-stone-200 text-stone-700 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0">2</div>
                      <p className="text-stone-600"><strong className="text-stone-800">Free Reverse Pickup</strong>: Courier service will fetch the packet directly from your home address.</p>
                    </div>
                    {refundMethod === 'points' && (
                      <div className="flex gap-2.5 p-2 bg-amber-50 rounded border border-amber-100 text-amber-800">
                        <Sparkles className="w-4 h-4 flex-shrink-0 text-amber-500" />
                        <p className="text-[11px] font-medium leading-normal">
                          <strong>Instant loyalty refund applied!</strong> We have credited the total with a +10% retention bonus directly to your Nomaan Royal Club wallet!
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex gap-3 justify-center">
                    <button
                      onClick={() => {
                        setSuccessRequestId(null);
                        setMatchedOrder(null);
                        setOrderIdInput('');
                        setSearchAttempted(false);
                      }}
                      className="px-5 py-2.5 border border-stone-200 rounded-xl hover:bg-stone-50 text-xs font-semibold transition-all"
                    >
                      File Another Return
                    </button>
                    <button
                      onClick={async () => {
                        setActiveTab('track');
                        setTrackOrderId(matchedOrder?.id || '');
                        setTrackEmail(emailInput);
                        setFetchingTrack(true);
                        setTrackSearchAttempted(true);
                        try {
                          const matches = await getReturnRequestsByOrder(matchedOrder?.id || '', emailInput);
                          setTrackedRequests(matches);
                        } catch (e) {
                          console.error(e);
                        } finally {
                          setFetchingTrack(false);
                          setSuccessRequestId(null);
                        }
                      }}
                      className="px-5 py-2.5 bg-stone-900 text-white rounded-xl hover:bg-stone-800 text-xs font-semibold transition-all"
                    >
                      Track Request Status
                    </button>
                  </div>
                </motion.div>
              ) : !matchedOrder ? (
                // Search Form Screen
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="p-4 bg-amber-50/55 border border-amber-100/70 rounded-xl flex gap-3 text-amber-800 text-xs leading-relaxed">
                    <Sparkles className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <div>
                      <p className="font-bold">Nomaan Brothers Fitting & Exchange Pledge</p>
                      <p className="mt-0.5 text-amber-700">Not quite the perfect look or size? Choose direct exchanges or instant refund to store credits (with a bonus +10% loyalty gift) to bypass bank transfer latency.</p>
                    </div>
                  </div>

                  <form onSubmit={handleSearchOrder} className="space-y-4 max-w-md mx-auto py-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-stone-600 block">Order ID *</label>
                      <div className="relative">
                        <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. SC-10024"
                          value={orderIdInput}
                          onChange={(e) => setOrderIdInput(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-stone-500 focus:bg-white transition-all font-mono placeholder:font-sans placeholder:text-stone-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-stone-600 block">Email Address Used for Order *</label>
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                        <input
                          type="email"
                          required
                          placeholder="e.g. customer@example.com"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-stone-500 focus:bg-white transition-all placeholder:text-stone-400"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={searching}
                      className="w-full bg-stone-900 text-white font-semibold py-3 rounded-xl text-sm hover:bg-stone-800 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {searching ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Searching Database...</span>
                        </>
                      ) : (
                        <span>Verify & Fetch Order Items</span>
                      )}
                    </button>
                  </form>

                  {searchAttempted && !matchedOrder && !searching && (
                    <div className="p-3.5 bg-rose-50 border border-rose-150 rounded-xl flex gap-2.5 text-xs text-rose-800 max-w-md mx-auto">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500 mt-0.5" />
                      <div>
                        <p className="font-bold">No Order Match Found</p>
                        <p className="mt-0.5 leading-relaxed">Ensure the order ID corresponds to your email address exactly. If you checked out as guest, match with the email address entered during checkout.</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                // Match Found: Selection & Reason Form
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {/* Order Overview */}
                  <div className="flex items-center justify-between p-3.5 bg-stone-50 border border-stone-150 rounded-xl text-xs">
                    <div>
                      <p className="text-stone-400">Order ID</p>
                      <p className="font-mono font-bold text-stone-950 mt-0.5">{matchedOrder.id}</p>
                    </div>
                    <div>
                      <p className="text-stone-400">Placed Date</p>
                      <p className="font-bold text-stone-800 mt-0.5">{matchedOrder.date ? new Date(matchedOrder.date).toLocaleDateString(undefined, {dateStyle: 'medium'}) : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-stone-400">Order Total</p>
                      <p className="font-extrabold text-stone-950 mt-0.5">₹{matchedOrder.total}</p>
                    </div>
                    <button
                      onClick={() => setMatchedOrder(null)}
                      className="text-[10px] text-stone-500 hover:text-stone-900 flex items-center gap-1 font-semibold border border-stone-200 rounded px-2 py-1 bg-white hover:bg-stone-50 transition-all"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      Change Order
                    </button>
                  </div>

                  {/* Step Title */}
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">STEP 1: SELECT ITEMS FOR RETURN/EXCHANGE</p>
                    <p className="text-xs text-stone-500">Check the items you want to initiate return/exchange operations on.</p>
                  </div>

                  {/* Order items listing */}
                  <div className="space-y-3">
                    {matchedOrder.items?.map((item: any) => {
                      const itemId = item.id || item.product?.id;
                      const isSelected = !!selectedItems[itemId];
                      const itemDetails = selectedItems[itemId];
                      const productTitle = item.product?.title || item.title || 'Product Item';
                      const productPrice = item.product?.price || item.price || 0;
                      const productImg = item.product?.images?.[0] || 'https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?auto=format&fit=crop&w=150&q=80';

                      return (
                        <div 
                          key={itemId}
                          className={`p-4 border rounded-xl transition-all ${
                            isSelected 
                              ? 'border-stone-900 bg-stone-50/50 shadow-xs' 
                              : 'border-stone-200 hover:border-stone-350 bg-white'
                          }`}
                        >
                          <div className="flex items-start gap-3.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleItemSelect(itemId, item)}
                              className="mt-1 w-4.5 h-4.5 accent-stone-950 cursor-pointer rounded"
                            />
                            
                            <img
                              src={productImg}
                              alt={productTitle}
                              className="w-16 h-16 object-cover rounded-lg border border-stone-150 flex-shrink-0"
                            />

                            <div className="flex-1 min-w-0">
                              <h5 className="text-sm font-semibold text-stone-900 truncate">{productTitle}</h5>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-500">
                                <span>Size: {item.selectedSize}</span>
                                <span>•</span>
                                <span>Color: {item.selectedColor || 'Default'}</span>
                                <span>•</span>
                                <span>Qty: {item.quantity}</span>
                              </div>
                              <p className="text-xs font-bold text-stone-900 mt-1">₹{productPrice}</p>
                            </div>
                          </div>

                          {/* Options if checked */}
                          <AnimatePresence>
                            {isSelected && itemDetails && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden mt-3.5 pt-3.5 border-t border-dashed border-stone-200 space-y-3 text-xs"
                              >
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1.5">
                                    <label className="font-bold text-stone-600 block">Operation Type</label>
                                    <div className="flex bg-stone-100 rounded-lg p-0.5">
                                      <button
                                        type="button"
                                        onClick={() => handleItemParamChange(itemId, 'type', 'return')}
                                        className={`flex-1 py-1 px-2 rounded-md font-semibold text-center transition-colors ${
                                          itemDetails.type === 'return' 
                                            ? 'bg-white text-stone-900 shadow-xs' 
                                            : 'text-stone-500 hover:text-stone-800'
                                        }`}
                                      >
                                        Return for Refund
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleItemParamChange(itemId, 'type', 'exchange')}
                                        className={`flex-1 py-1 px-2 rounded-md font-semibold text-center transition-colors ${
                                          itemDetails.type === 'exchange' 
                                            ? 'bg-white text-stone-900 shadow-xs' 
                                            : 'text-stone-500 hover:text-stone-800'
                                        }`}
                                      >
                                        Exchange Product
                                      </button>
                                    </div>
                                  </div>

                                  <div className="space-y-1.5">
                                    <label className="font-bold text-stone-600 block">Reason for Request</label>
                                    <select
                                      value={itemDetails.reason}
                                      onChange={(e) => handleItemParamChange(itemId, 'reason', e.target.value)}
                                      className="w-full py-1.5 px-2 border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-stone-500"
                                    >
                                      <option value="Too small/tight">Too small / Tight fit</option>
                                      <option value="Too large/loose">Too large / Loose fit</option>
                                      <option value="Fabric not as expected">Fabric quality / Texture</option>
                                      <option value="Received damaged item">Arrived with damage / defects</option>
                                      <option value="Wrong item sent">Incorrect design/color received</option>
                                      <option value="Changed my mind">Changed my mind / No longer need</option>
                                    </select>
                                  </div>
                                </div>

                                {itemDetails.type === 'exchange' && (
                                  <div className="p-3 bg-stone-50 border border-stone-150 rounded-lg space-y-2">
                                    <div className="flex gap-1 items-center text-stone-800 font-bold">
                                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                      <span>Specify Exchange Replacement Specifications:</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="text-[10px] text-stone-500 font-bold block mb-0.5">Desired Replacement Size</label>
                                        <select
                                          value={itemDetails.exchangeSize}
                                          onChange={(e) => handleItemParamChange(itemId, 'exchangeSize', e.target.value)}
                                          className="w-full py-1 px-2 border border-stone-200 rounded bg-white text-xs"
                                        >
                                          {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map(sz => (
                                            <option key={sz} value={sz}>Replacement Size: {sz}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-stone-500 font-bold block mb-0.5">Color Preference / Instructions (Optional)</label>
                                        <input
                                          type="text"
                                          placeholder="e.g. Please send the Olive Green variant if possible"
                                          value={itemDetails.exchangeColor || ''}
                                          onChange={(e) => handleItemParamChange(itemId, 'exchangeColor', e.target.value)}
                                          className="w-full py-1 px-2 border border-stone-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-stone-500"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>

                  {/* Refund Options & Proof upload visible only when items are selected */}
                  {Object.keys(selectedItems).length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4 pt-4 border-t border-stone-200"
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">STEP 2: REFUND TYPE & VERIFICATION PHOTO</p>
                      </div>

                      {/* Refund Mode Selection */}
                      {(Object.values(selectedItems) as SelectedItemDetail[]).some(item => item.type === 'return') && (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-stone-600 block">Preferred Mode of Refund Payment</label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setRefundMethod('points')}
                              className={`p-3.5 border rounded-xl text-left transition-all ${
                                refundMethod === 'points' 
                                  ? 'border-amber-400 bg-amber-50/20' 
                                  : 'border-stone-200 hover:border-stone-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 font-bold text-stone-900 text-xs">
                                <Coins className="w-4 h-4 text-amber-500" />
                                <span>Nomaan Royal wallet credit</span>
                                <span className="bg-amber-400 text-[9px] text-stone-950 font-extrabold px-1.5 py-0.5 rounded ml-auto">+10% BONUS</span>
                              </div>
                              <p className="text-[10px] text-stone-500 mt-1 leading-normal">Instant. Add total return price + an additional 10% bonus immediately to your customer wallet for instant store checkout.</p>
                            </button>

                            <button
                              type="button"
                              onClick={() => setRefundMethod('original')}
                              className={`p-3.5 border rounded-xl text-left transition-all ${
                                refundMethod === 'original' 
                                  ? 'border-stone-900 bg-stone-50' 
                                  : 'border-stone-200 hover:border-stone-300'
                              }`}
                            >
                              <div className="flex items-center gap-2 font-bold text-stone-900 text-xs">
                                <CreditCard className="w-4 h-4 text-stone-600" />
                                <span>Original Payment Mode</span>
                              </div>
                              <p className="text-[10px] text-stone-500 mt-1 leading-normal">Refunded back to UPI, Netbanking, or Debit/Credit card. Takes 5 to 7 business days to reflect in your bank account post warehouse verification.</p>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Drag & Drop Photo verification zone */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-stone-600 block">Attach Image of Item (Optional but accelerates pipeline approval)</label>
                        <div 
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                            isDragging 
                              ? 'border-stone-800 bg-stone-50' 
                              : itemImage 
                                ? 'border-emerald-300 bg-emerald-50/10' 
                                : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                          }`}
                        >
                          <input
                            type="file"
                            accept="image/*"
                            id="return-image-upload"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <label htmlFor="return-image-upload" className="cursor-pointer block">
                            {itemImage ? (
                              <div className="flex items-center gap-3 justify-center">
                                <img
                                  src={itemImage}
                                  alt="Return Preview"
                                  className="w-14 h-14 object-cover rounded-lg border border-emerald-200"
                                />
                                <div className="text-left">
                                  <p className="text-xs font-bold text-emerald-800">✓ Item photo linked successfully</p>
                                  <p className="text-[10px] text-stone-500 mt-0.5">Click to replace or select another file</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setItemImage(null); }}
                                  className="text-stone-400 hover:text-stone-600 text-xs font-bold p-1 border border-stone-200 bg-white rounded ml-4"
                                >
                                  Remove
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-1.5 text-stone-500">
                                <UploadCloud className="w-6 h-6 mx-auto text-stone-400" />
                                <p className="text-xs font-medium text-stone-700">Drag and drop item photo, or <span className="text-stone-900 underline font-semibold">browse files</span></p>
                                <p className="text-[10px] text-stone-400">Supports PNG, JPG up to 2MB. Helps our team approve the pickup instantly.</p>
                              </div>
                            )}
                          </label>
                        </div>
                      </div>

                      {/* Form submission controls */}
                      <div className="pt-4 flex gap-3">
                        <button
                          type="button"
                          onClick={() => setMatchedOrder(null)}
                          className="flex-1 py-3 border border-stone-200 rounded-xl hover:bg-stone-50 text-xs font-semibold text-stone-700 transition-all text-center"
                        >
                          Back to Search
                        </button>
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={handleSubmitReturn}
                          className="flex-1 bg-stone-900 text-white font-semibold py-3 rounded-xl text-xs hover:bg-stone-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                        >
                          {submitting ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Submitting Ticket...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Submit Returns Request</span>
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          ) : (
            // Tracking Tab Screen
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              <div className="p-4 bg-stone-50 border border-stone-150 rounded-xl text-xs text-stone-600 leading-normal">
                <p className="font-bold text-stone-800 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-stone-700" />
                  <span>Real-time Ticket Tracking</span>
                </p>
                <p className="mt-0.5">Enter your order identifier below to view the warehouse inspection status, scheduled reverse pickup times, and completed refund dates.</p>
              </div>

              <form onSubmit={handleTrackRequest} className="space-y-3 max-w-md mx-auto py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide block">Order ID *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SC-10024"
                      value={trackOrderId}
                      onChange={(e) => setTrackOrderId(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-stone-500 focus:bg-white font-mono placeholder:font-sans uppercase"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide block">Email Address (Optional)</label>
                    <input
                      type="email"
                      placeholder="e.g. customer@example.com"
                      value={trackEmail}
                      onChange={(e) => setTrackEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-stone-500 focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={fetchingTrack}
                  className="w-full bg-stone-900 text-white font-semibold py-2.5 rounded-xl text-xs hover:bg-stone-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {fetchingTrack ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                      <span>Fetching Ticket Status...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>Fetch Ticket Status</span>
                    </>
                  )}
                </button>
              </form>

              {/* Search Result display */}
              <div className="space-y-4">
                {trackSearchAttempted && !fetchingTrack && trackedRequests.length === 0 && (
                  <div className="p-8 text-center border border-stone-150 rounded-xl bg-stone-50 space-y-2 max-w-sm mx-auto">
                    <AlertCircle className="w-8 h-8 text-stone-400 mx-auto" />
                    <h5 className="font-bold text-stone-800">No Return Request Found</h5>
                    <p className="text-xs text-stone-500 leading-normal">We couldn't find any return or exchange requests lodged for order ID <strong className="font-mono text-stone-800">{trackOrderId.toUpperCase()}</strong>.</p>
                  </div>
                )}

                {trackedRequests.map((req) => (
                  <div 
                    key={req.id}
                    className="border border-stone-200 rounded-xl p-5 bg-white space-y-4 shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-150">
                      <div>
                        <span className="text-[10px] text-stone-400">Request Ticket ID</span>
                        <p className="text-sm font-bold font-mono text-stone-900 mt-0.5">{req.id}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-stone-400">Lodged Date</span>
                        <p className="text-xs font-bold text-stone-700 mt-0.5">{new Date(req.createdAt).toLocaleDateString(undefined, {dateStyle: 'medium'})}</p>
                      </div>
                      <div>
                        {getStatusBadge(req.status)}
                      </div>
                    </div>

                    {/* Items requested for return */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Requested Items</p>
                      <div className="space-y-2">
                        {req.items?.map((item: any) => (
                          <div key={item.id} className="flex gap-3 items-center text-xs p-2.5 bg-stone-50 rounded-lg">
                            {item.image && (
                              <img src={item.image} alt={item.title} className="w-10 h-10 object-cover rounded border border-stone-200" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-stone-800 truncate">{item.title}</p>
                              <p className="text-[10px] text-stone-500 mt-0.5">
                                <span className="bg-stone-200 px-1 py-0.2 rounded text-[9px] font-bold text-stone-700 uppercase mr-1.5">{item.requestType}</span>
                                Qty: {item.quantity} • Size: {item.selectedSize} {item.exchangeSize ? `→ Exchange Size: ${item.exchangeSize}` : ''}
                              </p>
                            </div>
                            <span className="font-bold text-stone-900">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Timeline Pipeline status tracker */}
                    <div className="p-3.5 bg-stone-50 rounded-xl space-y-2 text-xs border border-stone-150">
                      <p className="font-bold text-stone-800">Pipeline Timeline Status</p>
                      <div className="flex items-center gap-4 py-2 overflow-x-auto">
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] ${req.status !== 'rejected' ? 'bg-emerald-500 text-white' : 'bg-stone-300 text-stone-500'}`}>✓</div>
                          <span className="font-semibold text-stone-800">Submitted</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-300 flex-shrink-0" />
                        
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] ${['pickup', 'received', 'approved'].includes(req.status) ? 'bg-emerald-500 text-white' : req.status === 'pending' ? 'bg-amber-400 text-stone-950 animate-pulse' : 'bg-stone-200 text-stone-400'}`}>
                            {['pickup', 'received', 'approved'].includes(req.status) ? '✓' : '2'}
                          </div>
                          <span className={`${['pickup', 'received', 'approved'].includes(req.status) ? 'font-semibold text-stone-800' : 'text-stone-400'}`}>Verification</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-300 flex-shrink-0" />

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] ${['received', 'approved'].includes(req.status) ? 'bg-emerald-500 text-white' : req.status === 'pickup' ? 'bg-amber-400 text-stone-950 animate-pulse' : 'bg-stone-200 text-stone-400'}`}>
                            {['received', 'approved'].includes(req.status) ? '✓' : '3'}
                          </div>
                          <span className={`${['received', 'approved'].includes(req.status) ? 'font-semibold text-stone-800' : 'text-stone-400'}`}>Pickup & Transit</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-stone-300 flex-shrink-0" />

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] ${req.status === 'approved' ? 'bg-emerald-500 text-white' : req.status === 'received' ? 'bg-amber-400 text-stone-950 animate-pulse' : 'bg-stone-200 text-stone-400'}`}>
                            {req.status === 'approved' ? '✓' : '4'}
                          </div>
                          <span className={`${req.status === 'approved' ? 'font-semibold text-stone-800' : 'text-stone-400'}`}>Resolved</span>
                        </div>
                      </div>

                      {/* Refund detail if resolved or details */}
                      {req.refundAmount > 0 && (
                        <div className="pt-2 border-t border-stone-200 flex justify-between text-[11px] text-stone-600">
                          <span>Refund amount details:</span>
                          <span className="font-bold text-stone-900">
                            ₹{req.refundAmount} via {req.refundMethod === 'points' ? 'Nomaan Wallet points (instant)' : 'Original Payment Mode'}
                          </span>
                        </div>
                      )}

                      {/* Admin comment section */}
                      {req.adminNotes && (
                        <div className="p-2 bg-stone-100 border border-stone-250 rounded text-[11px] text-stone-700 mt-2">
                          <p className="font-bold flex items-center gap-1">
                            <HelpCircle className="w-3 h-3 text-stone-500" />
                            <span>Support Representative Message:</span>
                          </p>
                          <p className="mt-0.5 leading-normal italic font-medium">"{req.adminNotes}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
