import React, { useState } from 'react';
import { AvatarConfig, AvatarFlair, UserProfile } from '../../types';
import { AvatarDisplay } from './AvatarDisplay';
import { sound } from '../../services/sound';
import { Sparkles, Palette, Crown, Check, X, Smile, Shirt, Scissors } from 'lucide-react';

interface AvatarStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSave: (newAvatar: AvatarConfig, newRole: UserProfile['familyRole']) => void;
}

const SKIN_TONES = ['#FCD34D', '#FDE047', '#FBBF24', '#D97706', '#B45309', '#78350F', '#FED7AA'];
const HAIR_COLORS = ['#451A03', '#1E293B', '#D97706', '#E2E8F0', '#DC2626', '#7C3AED', '#2563EB'];
const OUTFIT_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#0F172A'];

const HAIR_STYLES: { id: AvatarConfig['hairStyle']; label: string }[] = [
  { id: 'spiky', label: 'Spiky Cool' },
  { id: 'curly', label: 'Curly Joy' },
  { id: 'straight', label: 'Classic Straight' },
  { id: 'bun', label: 'Top Bun' },
  { id: 'cap', label: 'Baseball Cap' },
  { id: 'ponytail', label: 'Ponytail' },
  { id: 'grandpa', label: 'Grandpa Whiskers' },
  { id: 'afro', label: 'Afro Cloud' },
];

const EYE_STYLES: { id: AvatarConfig['eyes']; label: string }[] = [
  { id: 'happy', label: 'Happy' },
  { id: 'sparkle', label: 'Sparkle' },
  { id: 'cool', label: 'Shades' },
  { id: 'glasses', label: 'Glasses' },
  { id: 'wink', label: 'Wink' },
];

const MOUTH_STYLES: { id: AvatarConfig['mouth']; label: string }[] = [
  { id: 'smile', label: 'Friendly Smile' },
  { id: 'grin', label: 'Big Grin' },
  { id: 'laugh', label: 'Open Laugh' },
  { id: 'neutral', label: 'Calm' },
];

const OUTFITS: { id: AvatarConfig['outfit']; label: string }[] = [
  { id: 'jersey', label: 'Gamer Jersey' },
  { id: 'hoodie', label: 'Cozy Hoodie' },
  { id: 'tshirt', label: 'Casual Tee' },
  { id: 'royal', label: 'Royal Cape' },
  { id: 'dino', label: 'Dino Suit' },
  { id: 'wizard', label: 'Star Robe' },
];

const ACCESSORIES: { id: AvatarConfig['accessory']; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'crown', label: 'Gold Crown' },
  { id: 'headphones', label: 'Gaming Headset' },
  { id: 'party-hat', label: 'Party Cone' },
  { id: 'mustache', label: 'Fun Mustache' },
  { id: 'star', label: 'Magic Star' },
];

const FLAIRS: { id: AvatarFlair; label: string; vipOnly?: boolean }[] = [
  { id: 'none', label: 'Classic Slate' },
  { id: 'wood', label: 'Mahogany Wood' },
  { id: 'gold-vip', label: 'Gold VIP Crown', vipOnly: true },
  { id: 'neon', label: 'Cyber Neon', vipOnly: true },
  { id: 'diamond', label: 'Diamond Halo', vipOnly: true },
  { id: 'rainbow', label: 'Rainbow Sparkle', vipOnly: true },
];

const FAMILY_ROLES: UserProfile['familyRole'][] = [
  'Child',
  'Teen',
  'Parent',
  'Grandparent',
  'Family Champion',
];

export const AvatarStudioModal: React.FC<AvatarStudioModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSave,
}) => {
  const [avatar, setAvatar] = useState<AvatarConfig>({ ...currentUser.avatar });
  const [role, setRole] = useState<UserProfile['familyRole']>(currentUser.familyRole);
  const [activeTab, setActiveTab] = useState<'face' | 'hair' | 'outfit' | 'flair' | 'role'>('face');

  if (!isOpen) return null;

  const handleUpdate = (field: keyof AvatarConfig, val: any) => {
    sound.playClick();
    setAvatar((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = () => {
    sound.playReward();
    onSave(avatar, role);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-500/20 via-purple-600/20 to-indigo-600/20 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">Custom Avatar Studio</h2>
              <p className="text-xs text-slate-400">Personalize your family gamer look & profile flair</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Area */}
        <div className="p-6 bg-slate-950/40 flex flex-col items-center justify-center border-b border-slate-800">
          <AvatarDisplay avatar={avatar} size="2xl" showBadge={role} />
          <div className="mt-3 flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-200">{currentUser.name}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-amber-300 font-medium">
              {role}
            </span>
            {currentUser.isVip && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold flex items-center gap-1">
                <Crown className="w-3 h-3" /> VIP Member
              </span>
            )}
          </div>
        </div>

        {/* Studio Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-4 gap-1 overflow-x-auto">
          {[
            { id: 'face', label: 'Face & Skin', icon: Smile },
            { id: 'hair', label: 'Hair Style', icon: Scissors },
            { id: 'outfit', label: 'Outfits', icon: Shirt },
            { id: 'flair', label: 'Frames & VIP', icon: Crown },
            { id: 'role', label: 'Family Role', icon: Palette },
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
                className={`flex items-center gap-2 py-3 px-3.5 text-xs font-semibold border-b-2 transition whitespace-nowrap ${
                  isActive
                    ? 'border-amber-400 text-amber-300 bg-amber-400/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Controls Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: Face & Skin */}
          {activeTab === 'face' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Skin Tone
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {SKIN_TONES.map((tone) => (
                    <button
                      key={tone}
                      onClick={() => handleUpdate('skinTone', tone)}
                      className={`w-9 h-9 rounded-full border-2 transition-transform ${
                        avatar.skinTone === tone
                          ? 'border-white scale-110 shadow-lg'
                          : 'border-slate-700 hover:scale-105'
                      }`}
                      style={{ backgroundColor: tone }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Eyes & Expression
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {EYE_STYLES.map((eye) => (
                    <button
                      key={eye.id}
                      onClick={() => handleUpdate('eyes', eye.id)}
                      className={`p-2.5 rounded-xl border text-xs font-medium transition text-left flex items-center justify-between ${
                        avatar.eyes === eye.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{eye.label}</span>
                      {avatar.eyes === eye.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Mouth & Smile
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {MOUTH_STYLES.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleUpdate('mouth', m.id)}
                      className={`p-2.5 rounded-xl border text-xs font-medium transition text-left flex items-center justify-between ${
                        avatar.mouth === m.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{m.label}</span>
                      {avatar.mouth === m.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Hair Style */}
          {activeTab === 'hair' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Hair Style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {HAIR_STYLES.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => handleUpdate('hairStyle', h.id)}
                      className={`p-2.5 rounded-xl border text-xs font-medium transition text-left flex items-center justify-between ${
                        avatar.hairStyle === h.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{h.label}</span>
                      {avatar.hairStyle === h.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Hair Color
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {HAIR_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleUpdate('hairColor', color)}
                      className={`w-9 h-9 rounded-full border-2 transition-transform ${
                        avatar.hairColor === color
                          ? 'border-white scale-110 shadow-lg'
                          : 'border-slate-700 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Outfits & Accessories */}
          {activeTab === 'outfit' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Clothing Outfit
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {OUTFITS.map((outfit) => (
                    <button
                      key={outfit.id}
                      onClick={() => handleUpdate('outfit', outfit.id)}
                      className={`p-2.5 rounded-xl border text-xs font-medium transition text-left flex items-center justify-between ${
                        avatar.outfit === outfit.id
                          ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{outfit.label}</span>
                      {avatar.outfit === outfit.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Outfit Color
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {OUTFIT_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleUpdate('outfitColor', color)}
                      className={`w-9 h-9 rounded-full border-2 transition-transform ${
                        avatar.outfitColor === color
                          ? 'border-white scale-110 shadow-lg'
                          : 'border-slate-700 hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Special Accessory
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ACCESSORIES.map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => handleUpdate('accessory', acc.id)}
                      className={`p-2.5 rounded-xl border text-xs font-medium transition text-left flex items-center justify-between ${
                        avatar.accessory === acc.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>{acc.label}</span>
                      {avatar.accessory === acc.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Flairs & VIP Borders */}
          {activeTab === 'flair' && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-amber-300 flex items-center gap-1.5">
                    <Crown className="w-4 h-4 text-amber-400" /> Exclusive Profile Flairs
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Glowing holographic rings and VIP borders make you stand out at every table.
                  </p>
                </div>
                {!currentUser.isVip && (
                  <span className="text-[11px] bg-amber-500 text-slate-950 px-2 py-1 rounded-lg font-bold">
                    Unlock VIP
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FLAIRS.map((f) => {
                  const isLocked = f.vipOnly && !currentUser.isVip;
                  return (
                    <button
                      key={f.id}
                      disabled={isLocked}
                      onClick={() => handleUpdate('flair', f.id)}
                      className={`p-3 rounded-2xl border text-xs font-semibold transition text-left flex items-center justify-between ${
                        avatar.flair === f.id
                          ? 'bg-amber-400/20 border-amber-400 text-amber-200'
                          : isLocked
                          ? 'bg-slate-900 border-slate-800 opacity-60 cursor-not-allowed text-slate-500'
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{f.label}</span>
                        {f.vipOnly && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded font-bold">
                            VIP
                          </span>
                        )}
                      </div>
                      {avatar.flair === f.id && <Check className="w-4 h-4 text-amber-400" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: Family Role */}
          {activeTab === 'role' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Choose your badge on the family team scoreboard and room seats:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FAMILY_ROLES.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      sound.playClick();
                      setRole(r);
                    }}
                    className={`p-3.5 rounded-2xl border text-sm font-semibold transition text-left flex items-center justify-between ${
                      role === r
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300'
                        : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{r}</span>
                    {role === r && <Check className="w-4 h-4 text-indigo-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Save Avatar & Profile
          </button>
        </div>
      </div>
    </div>
  );
};
