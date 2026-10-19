import React, { useState } from 'react';
import { SystemNotification } from '../../types';
import { sound } from '../../services/sound';
import { Bell, Check, X, Shield, Gift, Trophy, Users, Megaphone } from 'lucide-react';

interface NotificationCenterProps {
  onJoinRoom?: (code: string) => void;
  notifications: SystemNotification[];
  onMarkAllRead: () => void;
  onClear: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAllRead,
  onClear,
  onJoinRoom,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [pushEnabled, setPushEnabled] = useState<boolean>(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleOpen = () => {
    sound.playClick();
    setIsOpen((prev) => !prev);
  };

  const handleRequestPush = async () => {
    sound.playReward();
    if ('Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          setPushEnabled(true);
          new Notification('FamPlay Arcade', {
            body: 'Push notifications activated! You will receive tournament and family game alerts.',
            icon: '🎮',
          });
        }
      } catch (e) {
        setPushEnabled(true);
      }
    } else {
      setPushEnabled(true);
    }
  };

  const getIcon = (type: SystemNotification['type']) => {
    switch (type) {
      case 'reward': return <Gift className="w-4 h-4 text-amber-400" />;
      case 'tournament': return <Trophy className="w-4 h-4 text-rose-400" />;
      case 'invite': return <Users className="w-4 h-4 text-indigo-400" />;
      case 'parental': return <Shield className="w-4 h-4 text-emerald-400" />;
      default: return <Megaphone className="w-4 h-4 text-sky-400" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleOpen}
        className="relative p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white transition border border-slate-700/60"
        title="Activity Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white font-black text-[10px] flex items-center justify-center animate-bounce shadow-md">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl z-50 overflow-hidden text-slate-100 animate-in fade-in duration-150">
          
          {/* Header */}
          <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold font-display text-sm text-white">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-bold">
                  {unreadCount} New
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => {
                  sound.playClick();
                  onMarkAllRead();
                }}
                className="text-slate-400 hover:text-white transition text-[11px]"
              >
                Mark Read
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Web Push Prompt */}
          <div className="px-4 py-2.5 bg-indigo-600/10 border-b border-indigo-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px] text-slate-300">Browser Push Alerts:</span>
            </div>
            {pushEnabled ? (
              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> Enabled
              </span>
            ) : (
              <button
                onClick={handleRequestPush}
                className="text-[11px] font-bold text-indigo-300 hover:text-indigo-200 underline"
              >
                Enable Push
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto p-3 space-y-2">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3 rounded-2xl border transition flex items-start gap-3 ${
                  !notif.read
                    ? 'bg-indigo-600/10 border-indigo-500/30 shadow-sm'
                    : 'bg-slate-950/40 border-slate-800/80 text-slate-300 opacity-80'
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-white leading-snug">{notif.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{notif.message}</p>
                  {notif.roomCode && onJoinRoom && <button className="text-xs text-indigo-300 underline py-2" onClick={()=>{onJoinRoom(notif.roomCode!);setIsOpen(false);}}>Tisch beitreten</button>}
                  <span className="text-[9px] text-slate-500 font-mono mt-1 block">{notif.timestamp}</span>
                </div>
              </div>
            ))}

            {notifications.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-400">
                No recent notifications.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
