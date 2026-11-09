import React, { useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { ErrorText, Field, inputClass, outlineClass, primaryClass } from './StudioShared';

interface Props {
  client: SupabaseClient;
  ownerEmail: string;
  onPasswordChanged: () => Promise<void>;
}

/**
 * No admin service key or elevated RPC is exposed to the browser.
 * Supabase Auth, not CMS database SQL, verifies the current session,
 * owner role, reauthentication nonce and (for passwords) old password.
 */
export default function CmsAccount({client,ownerEmail,onPasswordChanged}:Props){
  const [newEmail,setNewEmail]=useState('');
  const [currentPassword,setCurrentPassword]=useState('');
  const [newPassword,setNewPassword]=useState('');
  const [confirmPassword,setConfirmPassword]=useState('');
  const [nonce,setNonce]=useState('');
  const [busy,setBusy]=useState(false);
  const [sendingCode,setSendingCode]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [message,setMessage]=useState<string|null>(null);

  const requireVerifiedOwner=async()=>{
    // A fresh server-validated Auth user is preferable to trusting a stale
    // client-side role, user_metadata or email in a cached browser session.
    const {data,error}=await client.auth.getUser();
    if(error || !data.user || data.user.app_metadata?.nb_role!=='owner')
      throw new Error('Only a signed-in CMS owner may update account credentials.');
    return data.user;
  };

  const sendCode=async()=>{
    if(busy||sendingCode)return;
    setSendingCode(true);setError(null);setMessage(null);
    try{
      const user=await requireVerifiedOwner();
      const {error}=await client.auth.reauthenticate();
      if(error)throw error;
      setMessage('Security code requested for '+(user.email||ownerEmail)+'. Check the inbox and enter the code below.');
    }catch(cause){
      setError(cause instanceof Error?cause.message:'Could not request a security code.');
    }finally{setSendingCode(false)}
  };

  const changeEmail=async(event:React.FormEvent)=>{
    event.preventDefault();
    if(busy)return;
    setError(null);setMessage(null);
    const target=newEmail.trim().toLowerCase();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)){
      setError('Enter a valid new email address.');return;
    }
    if(target===ownerEmail.trim().toLowerCase()){
      setError('Choose an email address different from the current one.');return;
    }
    if(!/^\d{6,8}$/.test(nonce.trim())){
      setError('Enter the security code emailed to the current owner address.');return;
    }
    setBusy(true);
    try{
      await requireVerifiedOwner();
      // Supabase Secure Email Change may require confirming links in BOTH
      // the old and new mailboxes. Never bypass the Auth confirmation flow.
      const {error}=await client.auth.updateUser({email:target,nonce:nonce.trim()});
      if(error)throw error;
      setNewEmail('');setNonce('');
      setMessage('Email change requested. Confirm the links in the old and new inboxes as required by your Supabase Auth settings, then sign out and back in.');
    }catch(cause){
      setError(cause instanceof Error?cause.message:'Email change could not be requested.');
    }finally{setBusy(false)}
  };

  const changePassword=async(event:React.FormEvent)=>{
    event.preventDefault();
    if(busy)return;
    setError(null);setMessage(null);
    if(newPassword.length<12){
      setError('Choose a new password of at least 12 characters.');return;
    }
    if(currentPassword===newPassword){
      setError('The new password must be different from the current password.');return;
    }
    if(newPassword!==confirmPassword){
      setError('The two new password fields do not match.');return;
    }
    if(!currentPassword){
      setError('Enter your existing password before changing it.');return;
    }
    if(!/^\d{6,8}$/.test(nonce.trim())){
      setError('Request a security code and enter it before changing the password.');return;
    }
    setBusy(true);
    try{
      await requireVerifiedOwner();
      const {error}=await client.auth.updateUser({
        password:newPassword,
        current_password:currentPassword,
        nonce:nonce.trim(),
      });
      if(error)throw error;
      setCurrentPassword('');setNewPassword('');setConfirmPassword('');setNonce('');
      // Expire the CMS session so the new credentials are tested at login.
      await onPasswordChanged();
    }catch(cause){
      setError(cause instanceof Error?cause.message:'Password change failed.'); 
    }finally{setBusy(false)}
  };

  return <section className="mx-auto max-w-3xl space-y-6" aria-labelledby="owner-account-title">
    <div>
      <p className="text-xs font-bold uppercase tracking-[.2em] text-amber-800">Owner account</p>
      <h2 id="owner-account-title" className="mt-2 font-serif text-3xl">Account & security</h2>
      <p className="mt-3 text-sm leading-7 text-stone-600">
        Change your own login email or password without opening the Supabase dashboard.
        These changes require a signed-in owner and verification from Supabase Authentication.
        Your owner role stays attached to the same user account.
      </p>
    </div>
    <div className="flex items-start gap-3 rounded-lg border border-stone-200 bg-white p-5">
      <ShieldCheck size={20} className="mt-1 shrink-0 text-amber-800"/>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-600">Current owner login</p>
        <p className="mt-1 break-all font-semibold">{ownerEmail}</p>
        <p className="mt-2 text-xs leading-6 text-stone-600">Changing your email may require confirmation in both inboxes. Keep access to your current mailbox until the change finishes.</p>
      </div>
    </div>
    <div className="rounded-lg border border-stone-200 bg-white p-5 sm:p-7">
      <h3 className="flex items-center gap-2 font-serif text-xl"><Mail size={20}/> Verify your identity</h3>
      <p className="mt-2 text-xs leading-6 text-stone-600">
        Send a one-time security code to the current owner's email, then enter it below.
        This prevents someone with only an unlocked browser tab from quietly changing credentials.
      </p>
      <button type="button" className={outlineClass+' mt-4'} disabled={busy||sendingCode}
        onClick={()=>void sendCode()}>{sendingCode?'Requesting code…':'Email me a security code'}</button>
      <div className="mt-4">
        <Field label="One-time security code"><input className={inputClass} value={nonce}
          type="text" autoComplete="one-time-code" inputMode="numeric"
          maxLength={8} placeholder="Code from your email"
          onChange={event=>setNonce(event.target.value.replace(/\D/g,''))}/></Field>
      </div>
    </div>
    {message&&<p role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{message}</p>}
    <ErrorText message={error}/>
    <form onSubmit={(event)=>void changeEmail(event)} className="space-y-4 rounded-lg border border-stone-200 bg-white p-5 sm:p-7">
      <h3 className="font-serif text-xl">Change login email</h3>
      <p className="text-xs leading-6 text-stone-600">Use an email address you control. Supabase will send verification links; the login email does not change until its confirmation process completes.</p>
      <Field label="New owner email address"><input className={inputClass} type="email"
        autoComplete="email" required value={newEmail} maxLength={254}
        placeholder="new-owner@example.com" onChange={event=>setNewEmail(event.target.value)}/></Field>
      <button type="submit" className={primaryClass} disabled={busy||sendingCode}>
        {busy?'Saving…':'Request email change'}
      </button>
    </form>
    <form onSubmit={(event)=>void changePassword(event)} className="space-y-4 rounded-lg border border-stone-200 bg-white p-5 sm:p-7">
      <h3 className="flex items-center gap-2 font-serif text-xl"><KeyRound size={20}/> Change login password</h3>
      <p className="text-xs leading-6 text-stone-600">Use a unique password with at least 12 characters. Your current password and email security code are required. You will need to sign in again afterward.</p>
      <Field label="Current password"><input className={inputClass} type="password"
        autoComplete="current-password" required value={currentPassword}
        onChange={event=>setCurrentPassword(event.target.value)}/></Field>
      <Field label="New password"><input className={inputClass} type="password"
        autoComplete="new-password" required minLength={12} value={newPassword}
        onChange={event=>setNewPassword(event.target.value)}/></Field>
      <Field label="Confirm new password"><input className={inputClass} type="password"
        autoComplete="new-password" required minLength={12} value={confirmPassword}
        onChange={event=>setConfirmPassword(event.target.value)}/></Field>
      <button type="submit" className={primaryClass} disabled={busy||sendingCode}>
        {busy?'Updating…':'Update password and sign out'}
      </button>
    </form>
    <p className="text-xs leading-6 text-stone-500">
      This panel cannot create owners, assign roles, show the existing password, or change
      Supabase organization settings. For a lost password or lost email access, use
      the verified Supabase Auth recovery process rather than a database shortcut.
    </p>
  </section>;
}
