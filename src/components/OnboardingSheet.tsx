'use client';

import { ConnectButton } from '@mysten/dapp-kit';
import React from 'react';
import ZkLoginButton from './ZkLoginButton';
import PasskeyButton from './PasskeyButton';

type OnboardingSheetProps = {
  open: boolean;
  onClose: () => void;
};

export default function OnboardingSheet({ open, onClose }: OnboardingSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full md:max-w-lg rounded-t-2xl md:rounded-2xl bg-neutral-900 border border-white/10 p-6">
        <h2 className="text-lg font-semibold">Create your Sui account</h2>
        <p className="text-sm text-neutral-400 mt-1">
          Choose a way to start. You can switch later.
        </p>

        <div className="mt-4 space-y-3">
          {/* Wallets (Slush & others) */}
          <div className="rounded-xl border border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Use a Wallet</h3>
                <p className="text-xs text-neutral-400">Slush & other Sui wallets</p>
              </div>
              <ConnectButton connectText="Connect wallet" />
            </div>
            <a
              href="https://slush.app"
              target="_blank"
              rel="noreferrer"
              className="block text-xs text-neutral-400 underline mt-2"
            >
              Don’t have Slush? Install it
            </a>
          </div>

          {/* zkLogin (placeholder button for now) */}
          <div className="rounded-xl border border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Continue with Google/Apple <ZkLoginButton /> </h3>
                <p className="text-xs text-neutral-400">Social sign-in, private by design</p>
              </div>
              <button className="rounded-lg px-3 py-2 bg-white text-black text-sm font-medium">
                Continue
              </button>
            </div>
          </div>

          {/* Passkey (placeholder button) */}
          
         <div className="rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between">
           <div>
            <h3 className="font-medium">Create a Passkey</h3>
             <p className="text-xs text-neutral-400">Sign with Face ID / fingerprint</p>
           </div>
           <a href="/passkey" className="rounded-lg px-3 py-2 bg-white text-black text-sm font-medium">
               Open Passkey Wallet
           </a>

          </div>
         </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button onClick={onClose} className="text-sm text-neutral-400 hover:text-white">
            Skip for now
          </button>
          <a href="/agent" className="text-sm underline">
            Ask the AI Agent
          </a>
        </div>
      </div>
    </div>
  );
}
