/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Gift, X, Star, Sparkles, CheckCircle2, Copy, Trophy, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RewardPoints } from '../types';

interface RewardsBubbleProps {
  points: RewardPoints;
  onClaimCoupon: (cost: number, code: string) => void;
  onEarnPoints: (amount: number, description: string) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function RewardsBubble({
  points,
  onClaimCoupon,
  onEarnPoints,
  onShowToast
}: RewardsBubbleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    if (onShowToast) {
      onShowToast(`✓ Coupon code ${code} copied to clipboard!`, 'success');
    }
    setTimeout(() => setCopiedCode(''), 2500);
  };

  const handleClaim = (cost: number, code: string) => {
    if (points.balance < cost) {
      if (onShowToast) {
        onShowToast('You do not have enough SC Points to claim this reward!', 'error');
      } else {
        alert('You do not have enough SC Points to claim this reward!');
      }
      return;
    }
    onClaimCoupon(cost, code);
    if (onShowToast) {
      onShowToast(`✓ Reward unlocked! Coupon: ${code} (Costs ${cost} SC Points)`, 'success');
    } else {
      alert(`Reward Unlocked! Copy code ${code} and enter it at checkout.`);
    }
  };

  const earnTasks = [
    { id: 't1', desc: 'Create account & join club', points: 100, done: true }
  ];

  const claimRewards = [
    { code: 'NOMAAN10', desc: 'Flat 10% Off coupon', cost: 150 },
    { code: 'WELCOME100', desc: 'Save ₹100 on any sherwani or kurta', cost: 100 },
    { code: 'FESTIVE250', desc: 'Save ₹250 (orders above ₹1999)', cost: 250 }
  ];

  return (
    <div className="fixed bottom-6 left-6 z-40 font-sans">
      
      {/* Floating Pill Trigger */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            id="rewards-trigger-pill"
            initial={{ scale: 0, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0, y: 50 }}
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-4 py-3 bg-stone-900 text-stone-100 rounded-full shadow-lg hover:bg-stone-800 transition-all focus:outline-none border border-stone-800"
          >
            <Gift className="w-5 h-5 text-amber-400 animate-bounce" />
            <span className="text-xs font-bold uppercase tracking-wider">Nomaan Rewards</span>
            <span className="bg-amber-400 text-stone-900 text-[10px] font-sans font-black px-1.5 py-0.5 rounded-full">
              {points.balance} pts
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded Rewards Drawer Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="bg-white rounded-2xl w-80 max-h-[480px] shadow-2xl border border-stone-150 overflow-hidden flex flex-col"
          >
            {/* Header banner */}
            <div className="bg-stone-900 text-stone-100 p-5 relative">
              <button
                id="rewards-close-btn"
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 p-1 rounded-full text-stone-400 hover:text-white transition-colors focus:outline-none"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6 text-amber-400" />
                <span className="font-serif text-base font-semibold tracking-wide text-amber-400">Nomaan Royal Club</span>
              </div>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 mt-0.5">Earn points, unlock free designer wear</p>

              <div className="mt-4 pt-3 border-t border-stone-800 flex justify-between items-end">
                <div>
                  <p className="text-[9px] uppercase font-semibold text-stone-400">Your Current Points Balance</p>
                  <p className="text-2xl font-bold text-white font-sans">{points.balance} NB Points</p>
                </div>
                <span className="bg-amber-400 text-stone-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Club Member
                </span>
              </div>
            </div>

            {/* Content Lists */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[300px]">
              
              {/* How to Earn */}
              <div className="space-y-2">
                <p className="text-[10px] font-sans font-bold uppercase text-stone-400 tracking-wider">How To Earn Points</p>
                <div className="space-y-1.5 text-xs text-stone-700">
                  {earnTasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-2 bg-stone-50 rounded-lg border border-stone-100"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{t.desc}</span>
                        <span className="text-[10px] text-amber-600 font-bold">+{t.points} SC Points</span>
                      </div>
                      
                      {t.done ? (
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0" />
                      ) : null}
                    </div>
                  ))}
                  <div className="p-2 bg-stone-50 rounded-lg border border-stone-100 flex items-center justify-between">
                    <div>
                      <span className="font-medium">Every Purchase</span>
                      <span className="block text-[10px] text-amber-600 font-bold">10 SC Points per ₹100 spent</span>
                    </div>
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </div>
                </div>
              </div>

              {/* Redeem points */}
              <div className="space-y-2">
                <p className="text-[10px] font-sans font-bold uppercase text-stone-400 tracking-wider">Claim Discounts & Coupons</p>
                <div className="space-y-1.5 text-xs">
                  {claimRewards.map((reward) => {
                    const isClaimed = points.claimedRewards?.includes(reward.code);
                    const canClaim = points.balance >= reward.cost;

                    return (
                      <div
                        key={reward.code}
                        className="p-2.5 border border-stone-100 rounded-lg flex items-center justify-between gap-2"
                      >
                        <div className="flex-1">
                          <p className="font-bold text-stone-950 font-mono tracking-wider">{reward.code}</p>
                          <p className="text-[11px] text-stone-500 mt-0.5">{reward.desc}</p>
                          <p className="text-[10px] text-stone-400 italic">Costs {reward.cost} SC Points</p>
                        </div>

                        {isClaimed ? (
                          <button
                            id={`rewards-copy-${reward.code.toLowerCase()}`}
                            onClick={() => handleCopyCode(reward.code)}
                            className="px-2.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase rounded-lg inline-flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedCode === reward.code ? 'Copied' : 'Copy'}</span>
                          </button>
                        ) : (
                          <button
                            id={`rewards-redeem-${reward.code.toLowerCase()}`}
                            onClick={() => handleClaim(reward.cost, reward.code)}
                            disabled={!canClaim}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-colors ${
                              canClaim
                                ? 'bg-stone-900 text-stone-50 hover:bg-stone-800'
                                : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                            }`}
                          >
                            Redeem
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3.5 border-t border-stone-100 bg-stone-50 text-center text-[10px] text-stone-400">
              Nomaan Brothers loyalty members receive exclusive seasonal groom previews ♡
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
