import React, { useState } from 'react';
import { sound } from '../../services/sound';
import { Share2, Copy, Check, QrCode, X, Users, MessageSquare } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  roomName: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  roomName,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}?room=${roomCode}`;

  const handleCopyLink = () => {
    sound.playReward();
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = () => {
    sound.playReward();
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    sound.playClick();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join our family game in FamPlay Arcade!`,
          text: `We are playing in room "${roomName}"! Join with room code ${roomCode} or click the link:`,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md p-6 shadow-2xl text-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-display text-white">Invite Family & Friends</h3>
            <p className="text-xs text-slate-400">Share your room to play cross-platform together</p>
          </div>
        </div>

        {/* 6-Digit Room Code Card */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 text-center my-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Room Code
          </span>
          <div className="text-3xl font-mono font-black text-amber-400 tracking-widest my-1">
            {roomCode}
          </div>
          <button
            onClick={handleCopyCode}
            className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center justify-center gap-1 mx-auto"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Code Copied!' : 'Copy Code'}
          </button>
        </div>

        {/* Visual Simulated QR Code */}
        <div className="bg-white p-4 rounded-2xl w-40 h-40 mx-auto flex flex-col items-center justify-center shadow-lg my-4">
          <div className="w-full h-full border-4 border-slate-900 p-1 flex flex-col justify-between">
            <div className="flex justify-between">
              <div className="w-7 h-7 bg-slate-950 rounded-sm flex items-center justify-center">
                <div className="w-3 h-3 bg-white" />
              </div>
              <div className="w-7 h-7 bg-slate-950 rounded-sm flex items-center justify-center">
                <div className="w-3 h-3 bg-white" />
              </div>
            </div>
            <div className="text-slate-950 text-center font-mono font-black text-xs">
              FAMPLAY
            </div>
            <div className="flex justify-between items-end">
              <div className="w-7 h-7 bg-slate-950 rounded-sm flex items-center justify-center">
                <div className="w-3 h-3 bg-white" />
              </div>
              <div className="w-5 h-5 bg-amber-500 rounded-sm" />
            </div>
          </div>
        </div>
        <p className="text-center text-[11px] text-slate-400 mb-4">
          Scan on mobile or tablet camera to join instant room
        </p>

        {/* Share buttons */}
        <div className="space-y-2">
          <button
            onClick={handleNativeShare}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" /> Share via Apps / AirDrop
          </button>

          <button
            onClick={handleCopyLink}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-2 border border-slate-700"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Link Copied!' : 'Copy Direct Link'}
          </button>
        </div>
      </div>
    </div>
  );
};
