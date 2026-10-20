// MultiplayerModal Component
import React, { useState } from 'react';
import { Wifi, Users, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { myPCService } from '../services/mypc';

interface MultiplayerModalProps {
  onHost: () => void;
  onJoin: () => void;
  onBack: () => void;
  statusText?: string;
  isConnecting?: boolean;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  onHost,
  onJoin,
  onBack,
  statusText,
  isConnecting,
}) => {
  const isSupported = myPCService.isMultiplayerSupported();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center animate-in fade-in zoom-in-95 duration-150">
        <div className="mx-auto w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center text-blue-400 mb-4 shadow-lg shadow-blue-500/10">
          <Wifi size={32} />
        </div>

        <h2 className="text-3xl font-black text-white mb-1 tracking-tight">Online Multiplayer</h2>
        <p className="text-sm text-slate-400 mb-6">
          Connect with friends on the same local network or Wi-Fi via MyPC
        </p>

        {isConnecting ? (
          <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col items-center justify-center gap-3 mb-6">
            <Loader2 size={32} className="animate-spin text-blue-400" />
            <span className="text-sm font-semibold text-slate-200">
              {statusText || 'Connecting to room...'}
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mb-6">
            <button
              onClick={onHost}
              className="flex items-center justify-center gap-3 w-full py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 font-bold text-white shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Users size={20} />
              Host Match (Open Room)
            </button>

            <button
              onClick={onJoin}
              className="flex items-center justify-center gap-3 w-full py-4 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 font-semibold text-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Wifi size={20} />
              Join Match (Find Room)
            </button>
          </div>
        )}

        {!isSupported && (
          <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/50 flex items-center gap-2 text-xs text-amber-300 text-left mb-4">
            <AlertCircle size={16} className="shrink-0" />
            <span>
              Direct browser preview active. Testing between two tabs will automatically establish local peer connection.
            </span>
          </div>
        )}

        <button
          onClick={onBack}
          className="flex items-center justify-center gap-2 w-full py-2.5 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          Back to Main Menu
        </button>
      </div>
    </div>
  );
};
