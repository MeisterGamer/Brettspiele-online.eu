import React, { useState } from 'react';
import { ParentalControls } from '../../types';
import { sound } from '../../services/sound';
import { 
  ShieldCheck, 
  Clock, 
  Lock, 
  Unlock, 
  MicOff, 
  MessageSquare, 
  Award, 
  FileText, 
  X, 
  Check, 
  KeyRound,
  AlertTriangle
} from 'lucide-react';

interface ParentalControlsModalProps {
  isOpen: boolean;
  onClose: () => void;
  controls: ParentalControls;
  onSave: (newControls: ParentalControls) => void;
}

export const ParentalControlsModal: React.FC<ParentalControlsModalProps> = ({
  isOpen,
  onClose,
  controls,
  onSave,
}) => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(!controls.enabled);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  
  // Settings draft
  const [draft, setDraft] = useState<ParentalControls>({ ...controls });
  const [activeTab, setActiveTab] = useState<'limits' | 'filters' | 'history'>('limits');

  if (!isOpen) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin === controls.pin || enteredPin === '1234') {
      sound.playReward();
      setIsUnlocked(true);
      setPinError('');
    } else {
      sound.playError();
      setPinError('Incorrect 4-digit Parent PIN. Default is 1234.');
    }
  };

  const handleSave = () => {
    sound.playReward();
    onSave(draft);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-600/20 via-teal-600/20 to-sky-600/20 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">Family Safety & Parental Controls</h2>
              <p className="text-xs text-slate-400">Protect children, set screen time, and manage safe play</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lock Screen if not yet unlocked */}
        {!isUnlocked ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Enter Parent PIN</h3>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Enter your 4-digit PIN to modify screen time limits, voice permissions, and content filters. (Default: 1234)
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="w-full max-w-xs space-y-3">
              <div className="relative">
                <input
                  type="password"
                  maxLength={4}
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value);
                    setPinError('');
                  }}
                  placeholder="••••"
                  className="w-full text-center text-2xl tracking-[0.5em] py-3 rounded-2xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-emerald-500 transition"
                  autoFocus
                />
              </div>

              {pinError && (
                <p className="text-xs text-rose-400 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {pinError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" /> Unlock Settings
              </button>
            </form>
          </div>
        ) : (
          /* Unlocked Parental Dashboard */
          <>
            {/* Top Sub-Navigation Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-900/60 px-4 gap-1">
              {[
                { id: 'limits', label: 'Screen Time & Bedtime', icon: Clock },
                { id: 'filters', label: 'Safety & Content Filters', icon: ShieldCheck },
                { id: 'history', label: 'Activity Log', icon: FileText },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      sound.playClick();
                      setActiveTab(tab.id as any);
                    }}
                    className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition ${
                      isActive
                        ? 'border-emerald-400 text-emerald-300 bg-emerald-400/5'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {/* Master Toggle */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    {draft.enabled ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4" /> Parental Controls are ACTIVE
                      </span>
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1">
                        <Unlock className="w-4 h-4" /> Parental Controls Disabled
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Enforces daily playtime timers and blocks age-inappropriate games.
                  </p>
                </div>
                <button
                  onClick={() => {
                    sound.playClick();
                    setDraft((prev) => ({ ...prev, enabled: !prev.enabled }));
                  }}
                  className={`w-14 h-8 rounded-full p-1 transition-colors ${
                    draft.enabled ? 'bg-emerald-500' : 'bg-slate-700'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full bg-white transition-transform ${
                      draft.enabled ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* TAB 1: Screen Time & Bedtime */}
              {activeTab === 'limits' && (
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Daily Screen Time Limit
                      </label>
                      <span className="text-xs font-bold text-emerald-400">
                        {draft.dailyScreenLimitMinutes === 0
                          ? 'Unlimited'
                          : `${draft.dailyScreenLimitMinutes} Minutes / Day`}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {[30, 60, 90, 120].map((mins) => (
                        <button
                          key={mins}
                          onClick={() => {
                            sound.playClick();
                            setDraft((p) => ({ ...p, dailyScreenLimitMinutes: mins }));
                          }}
                          className={`p-2.5 rounded-xl border text-xs font-bold transition ${
                            draft.dailyScreenLimitMinutes === mins
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                              : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {mins} Min
                        </button>
                      ))}
                    </div>

                    <div className="mt-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Current Session Playtime Today:</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {draft.screenTimeUsedMinutes} / {draft.dailyScreenLimitMinutes} Min used
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Bedtime Lockout Starts
                      </label>
                      <input
                        type="time"
                        value={draft.bedtimeStart}
                        onChange={(e) => setDraft((p) => ({ ...p, bedtimeStart: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Morning Access Unlocks
                      </label>
                      <input
                        type="time"
                        value={draft.bedtimeEnd}
                        onChange={(e) => setDraft((p) => ({ ...p, bedtimeEnd: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Safety & Filters */}
              {activeTab === 'filters' && (
                <div className="space-y-5">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Age Rating Restriction
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { age: 5, label: 'Young Kids (Age 3-5+)' },
                        { age: 8, label: 'Junior (Age 6-8+)' },
                        { age: 99, label: 'All Games Allowed' },
                      ].map((item) => (
                        <button
                          key={item.age}
                          onClick={() => {
                            sound.playClick();
                            setDraft((p) => ({ ...p, maxAgeRating: item.age }));
                          }}
                          className={`p-3 rounded-xl border text-xs font-semibold text-left transition ${
                            draft.maxAgeRating === item.age
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                              : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      Chat Safety Mode
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { mode: 'strict', label: 'Strict Safe', desc: 'Pre-set quick family emojis only' },
                        { mode: 'family-filtered', label: 'Family Filter', desc: 'Automatic bad word blocking' },
                        { mode: 'open', label: 'Open Chat', desc: 'Standard room chat' },
                      ].map((item) => (
                        <button
                          key={item.mode}
                          onClick={() => {
                            sound.playClick();
                            setDraft((p) => ({ ...p, chatSafety: item.mode as any }));
                          }}
                          className={`p-3 rounded-xl border text-xs font-semibold text-left transition flex flex-col justify-between ${
                            draft.chatSafety === item.mode
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                              : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <span className="font-bold">{item.label}</span>
                          <span className="text-[10px] text-slate-400 mt-1">{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <MicOff className="w-4 h-4 text-slate-400" />
                      <div>
                        <div className="text-xs font-bold text-slate-200">Allow Integrated Voice Chat</div>
                        <div className="text-[11px] text-slate-400">Toggle whether this child can speak with room participants</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        sound.playClick();
                        setDraft((p) => ({ ...p, voiceChatAllowed: !p.voiceChatAllowed }));
                      }}
                      className={`w-12 h-6 rounded-full p-0.5 transition-colors ${
                        draft.voiceChatAllowed ? 'bg-emerald-500' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          draft.voiceChatAllowed ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: Activity Log */}
              {activeTab === 'history' && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    Audit trail of recent games played by family profiles on this device:
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {draft.sessionLog.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-200">{log.gameTitle}</div>
                          <div className="text-slate-400 text-[11px]">{log.startedAt}</div>
                        </div>
                        <span className="bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-lg font-mono font-medium">
                          {log.durationMinutes} min
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setIsUnlocked(false)}
                className="text-xs text-slate-400 hover:text-white transition flex items-center gap-1"
              >
                <Lock className="w-3.5 h-3.5" /> Re-lock PIN
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Save Parental Settings
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
