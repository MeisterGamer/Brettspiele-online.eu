import React, { useState } from 'react';
import { ModerationReport, GameRoom } from '../../types';
import { sound } from '../../services/sound';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  VolumeX, 
  Radio, 
  Send, 
  FileText, 
  X, 
  Users,
  Eye,
  Megaphone
} from 'lucide-react';

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: ModerationReport[];
  rooms: GameRoom[];
  onResolveReport: (reportId: string, action: 'dismiss' | 'mute' | 'warn') => void;
  onBroadcastAnnouncement: (message: string) => void;
}

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  reports,
  rooms,
  onResolveReport,
  onBroadcastAnnouncement,
}) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'rooms' | 'broadcast' | 'guidelines'>('reports');
  const [broadcastText, setBroadcastText] = useState<string>('');
  const [broadcastSuccess, setBroadcastSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleAction = (id: string, action: 'dismiss' | 'mute' | 'warn') => {
    sound.playReward();
    onResolveReport(id, action);
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    sound.playReward();
    onBroadcastAnnouncement(broadcastText.trim());
    setBroadcastText('');
    setBroadcastSuccess(true);
    setTimeout(() => setBroadcastSuccess(false), 3000);
  };

  const pendingReports = reports.filter((r) => r.status === 'pending');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-red-600/20 via-orange-600/20 to-amber-600/20 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">Community Moderation & Admin Command</h2>
              <p className="text-xs text-slate-400">Handle player safety reports, inspect game tables, and broadcast alerts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 gap-2">
          <button
            onClick={() => { sound.playClick(); setActiveTab('reports'); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'reports'
                ? 'border-rose-400 text-rose-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4" /> Reports Queue ({pendingReports.length})
          </button>
          <button
            onClick={() => { sound.playClick(); setActiveTab('rooms'); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'rooms'
                ? 'border-rose-400 text-rose-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> Live Room Inspector ({rooms.length})
          </button>
          <button
            onClick={() => { sound.playClick(); setActiveTab('broadcast'); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'broadcast'
                ? 'border-rose-400 text-rose-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Megaphone className="w-4 h-4" /> System Announcement
          </button>
          <button
            onClick={() => { sound.playClick(); setActiveTab('guidelines'); }}
            className={`py-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'guidelines'
                ? 'border-rose-400 text-rose-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" /> Guidelines
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* TAB 1: Reports Queue */}
          {activeTab === 'reports' && (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div
                  key={rep.id}
                  className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    rep.status === 'pending'
                      ? 'bg-slate-950/70 border-rose-500/40 shadow-md'
                      : 'bg-slate-950/30 border-slate-800 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{rep.reportedUser}</span>
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded font-mono uppercase">
                        {rep.reason.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">Room: {rep.roomCode}</span>
                    </div>

                    <p className="text-xs text-slate-300 mt-1 italic">
                      "{rep.chatSnippet}"
                    </p>

                    <div className="text-[10px] text-slate-500 mt-1">
                      Reported by {rep.reportedBy} • {rep.timestamp} • Status: {rep.status.toUpperCase()}
                    </div>
                  </div>

                  {rep.status === 'pending' ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleAction(rep.id, 'warn')}
                        className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition flex items-center gap-1"
                        title="Send Official Warning"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" /> Warn
                      </button>
                      <button
                        onClick={() => handleAction(rep.id, 'mute')}
                        className="px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-600/40 rounded-xl text-xs font-bold transition flex items-center gap-1"
                        title="Mute for 24 hours"
                      >
                        <VolumeX className="w-3.5 h-3.5" /> Mute 24h
                      </button>
                      <button
                        onClick={() => handleAction(rep.id, 'dismiss')}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                        title="Dismiss false report"
                      >
                        Dismiss
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Handled
                    </span>
                  )}
                </div>
              ))}

              {reports.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Zero pending reports! The arcade community is safe and respectful.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Live Room Inspector */}
          {activeTab === 'rooms' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 mb-2">
                Live oversight of all active gaming tables, players seated, and voice communication channels:
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {rooms.map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{r.name}</span>
                        <span className="font-mono text-indigo-400 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded">
                          {r.code}
                        </span>
                        {r.isPrivate && (
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 rounded">Private</span>
                        )}
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        Game: <strong className="text-amber-400">{r.gameTitle}</strong> • Host: {r.hostName} • Players: {r.currentPlayers}/{r.maxPlayers}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-emerald-400 font-semibold">● Healthy Traffic</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Global System Announcement */}
          {activeTab === 'broadcast' && (
            <form onSubmit={handleSendBroadcast} className="space-y-4 max-w-lg mx-auto py-3">
              <div className="text-center mb-2">
                <h3 className="text-sm font-bold text-white">Broadcast Global Live Alert</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Send a real-time banner notice to all connected players across all tables.
                </p>
              </div>

              <textarea
                required
                rows={3}
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                placeholder="e.g. October Family Grandmaster Tournament begins in 30 minutes! Good luck to all households!"
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
              />

              {broadcastSuccess && (
                <div className="text-xs text-emerald-400 font-bold flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Broadcast dispatched across all gaming rooms!
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
              >
                <Send className="w-4 h-4" /> Send Live Notification
              </button>
            </form>
          )}

          {/* TAB 4: Community Guidelines */}
          {activeTab === 'guidelines' && (
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
              <h4 className="font-bold text-sm text-white flex items-center gap-1.5 text-amber-400">
                <FileText className="w-4 h-4" /> FamPlay Family Safety Code of Conduct
              </h4>
              <ul className="list-disc list-inside space-y-2 mt-2">
                <li><strong>Kindness First:</strong> Every member from age 3 to 99 deserves respect, encouragement, and good sportsmanship.</li>
                <li><strong>Profanity-Free Zone:</strong> Swearing, insults, or derogatory remarks in room chat or voice channels result in automated muting.</li>
                <li><strong>Fair Play & No Griefing:</strong> Intentionally stalling turns or rage-quitting tournaments impacts other families.</li>
                <li><strong>Parental Supervision:</strong> Child accounts are safeguarded with PIN overrides and restricted chat modes.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
