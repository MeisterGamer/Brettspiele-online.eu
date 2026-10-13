import React from 'react';
import { Smartphone, Download, Check } from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';
import { sound } from '../../services/sound';

interface PWAInstallButtonProps {
  onOpenModal: () => void;
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ onOpenModal, className = '' }) => {
  const { isInstallable, isStandalone, isAndroid } = usePWAInstall();

  // If already running standalone, show a small badge or subtle indicator
  if (isStandalone) {
    return (
      <button
        onClick={() => {
          sound.playClick();
          onOpenModal();
        }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold hover:bg-emerald-500/25 transition cursor-pointer ${className}`}
        title="FamPlay Android App aktiv"
      >
        <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">Android App</span>
        <Check className="w-3 h-3 text-emerald-400" />
      </button>
    );
  }

  return (
    <button
      onClick={() => {
        sound.playClick();
        onOpenModal();
      }}
      className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/35 active:scale-95 transition cursor-pointer ${className}`}
      title="FamPlay als Android App installieren"
    >
      <Smartphone className="w-3.5 h-3.5 text-emerald-100" />
      <span>Android App</span>
      <Download className="w-3 h-3 text-emerald-200" />
      {isInstallable && (
        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
        </span>
      )}
    </button>
  );
};
