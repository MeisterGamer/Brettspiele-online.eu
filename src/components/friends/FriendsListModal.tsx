import React, { useState, useEffect } from 'react';
import { UserProfile, FamilyFriend, FriendOnlineStatus } from '../../types';
import { friendsService } from '../../services/friendsService';
import { sound } from '../../services/sound';
import { AvatarDisplay } from '../avatar/AvatarDisplay';
import { 
  Users, 
  UserPlus, 
  Copy, 
  Check, 
  Search, 
  Star, 
  Trash2, 
  Gamepad2, 
  X, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  RefreshCw,
  Share2,
  Heart,
  Crown
} from 'lucide-react';

interface FriendsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onInviteToGame?: (friend: FamilyFriend) => void;
}

export const FriendsListModal: React.FC<FriendsListModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onInviteToGame,
}) => {
  const [friends, setFriends] = useState<FamilyFriend[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'online' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Add friend form state
  const [inputTargetId, setInputTargetId] = useState<string>('');
  const [customNickname, setCustomNickname] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('Parent');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Copy ID feedback
  const [copiedOwnId, setCopiedOwnId] = useState<boolean>(false);
  const [copiedFriendId, setCopiedFriendId] = useState<string | null>(null);

  // Load friends on open
  useEffect(() => {
    if (isOpen && currentUser) {
      const loaded = friendsService.getFriends(currentUser.id);
      setFriends(loaded);
      let cancelled = false;
      const refresh = () => friendsService.fetchFriends(currentUser.id).then(items => { if (!cancelled) setFriends(items); }).catch(error => { if (!cancelled) setErrorMessage(error.message); });
      void refresh();
      const timer = setInterval(refresh, 15000);
      setErrorMessage(null);
      setSuccessMessage(null);
      return () => { cancelled = true; clearInterval(timer); };
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const handleCopyOwnId = async () => {
    sound.playChip();
    try {
      await navigator.clipboard.writeText(currentUser.id);
      setCopiedOwnId(true);
      setTimeout(() => setCopiedOwnId(false), 2500);
    } catch {
      // fallback
      setCopiedOwnId(true);
      setTimeout(() => setCopiedOwnId(false), 2500);
    }
  };

  const handleCopyFriendId = async (id: string) => {
    sound.playChip();
    try {
      await navigator.clipboard.writeText(id);
      setCopiedFriendId(id);
      setTimeout(() => setCopiedFriendId(null), 2000);
    } catch {
      setCopiedFriendId(id);
      setTimeout(() => setCopiedFriendId(null), 2000);
    }
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTargetId.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await friendsService.addFriend(
      currentUser.id,
      inputTargetId.trim(),
      customNickname.trim() || undefined,
      selectedRole
    );

    setIsSubmitting(false);

    if (result.success && result.friend) {
      setFriends(friendsService.getFriends(currentUser.id));
      setSuccessMessage(`✓ "${result.friend.name}" wurde erfolgreich zu deiner Freundesliste hinzugefügt!`);
      setInputTargetId('');
      setCustomNickname('');
      setTimeout(() => setSuccessMessage(null), 3500);
    } else {
      sound.playError();
      setErrorMessage(result.error || 'Fehler beim Hinzufügen des Spielers.');
    }
  };

  const handleRemoveFriend = async (friendId: string, friendName: string) => {
    if (window.confirm(`Möchtest du "${friendName}" wirklich aus deiner Familien-Freundesliste entfernen?`)) {
      try {setFriends(await friendsService.removeFriend(currentUser.id,friendId));}
      catch(error){setErrorMessage(error instanceof Error?error.message:'Entfernen fehlgeschlagen.');}
    }
  };

  const handleToggleFavorite = async (friendId: string) => {
    try {setFriends(await friendsService.toggleFavorite(currentUser.id,friendId));}
    catch(error){setErrorMessage(error instanceof Error?error.message:'Speichern fehlgeschlagen.');}
  };

  const handleResetToStarter = async () => {
    try { setFriends(await friendsService.fetchFriends(currentUser.id)); setErrorMessage(null); }
    catch(error) { setErrorMessage(error instanceof Error ? error.message : 'Laden fehlgeschlagen.'); }
  };

  // Filtered list
  const filteredFriends = friends.filter((f) => {
    const matchesSearch = 
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.familyRole && f.familyRole.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (f.currentGame && f.currentGame.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeFilter === 'online') {
      return f.status === 'online' || f.status === 'in-game';
    }
    if (activeFilter === 'favorites') {
      return !!f.isFavorite;
    }
    return true;
  });

  const onlineCount = friends.filter((f) => f.status === 'online' || f.status === 'in-game').length;
  const favoritesCount = friends.filter((f) => f.isFavorite).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-amber-600 via-orange-600 to-indigo-700 p-5 sm:p-6 text-white shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-black/20 hover:bg-black/40 text-white/80 hover:text-white transition"
            title="Schließen"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white flex items-center gap-2">
                <span>Familie & Freunde</span>
                <span className="text-xs bg-black/30 backdrop-blur-md px-2.5 py-0.5 rounded-full font-bold">
                  {friends.length} Kontakte
                </span>
              </h2>
              <p className="text-xs text-white/90">
                Füge Familienmitglieder per ID hinzu und sieh ihren aktuellen Online-Status am Spieletisch.
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          
          {/* User's Own ID Card with 1-Click Copy */}
          <div className="bg-gradient-to-r from-slate-800/90 via-slate-800/60 to-indigo-950/40 border border-slate-700/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="p-0.5 rounded-2xl bg-amber-400/20 ring-1 ring-amber-400/40 shrink-0">
                <AvatarDisplay avatar={currentUser.avatar} size="sm" showBadge={currentUser.familyRole.slice(0, 1)} />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Deine persönliche Spieler-ID</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                </div>
                <div className="text-sm font-mono font-black text-amber-300 truncate">
                  {currentUser.id}
                </div>
              </div>
            </div>

            <button
              onClick={handleCopyOwnId}
              className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shrink-0 shadow ${
                copiedOwnId
                  ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-300'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
              }`}
            >
              {copiedOwnId ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>ID kopiert! ✓</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Meine ID kopieren</span>
                </>
              )}
            </button>
          </div>

          {/* Add Friend Form */}
          <div className="bg-slate-800/50 border border-slate-700/70 rounded-2xl p-4 sm:p-5 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>Familienmitglied per ID hinzufügen</span>
            </h3>

            {errorMessage && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs font-bold text-rose-300 flex items-center gap-2">
                <span className="text-rose-400 text-sm">⚠</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs font-bold text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleAddFriend} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                {/* ID input */}
                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Spieler-ID oder Benutzername *
                  </label>
                  <input
                    type="text"
                    required
                    value={inputTargetId}
                    onChange={(e) => setInputTargetId(e.target.value)}
                    placeholder="z.B. fam_papa_01 oder Mama"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                {/* Nickname / Display Name input */}
                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Spitzname (Optional)
                  </label>
                  <input
                    type="text"
                    value={customNickname}
                    onChange={(e) => setCustomNickname(e.target.value)}
                    placeholder="z.B. Papa Markus"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Role dropdown */}
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Familienrolle
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Parent">👨‍👩‍👧 Eltern</option>
                    <option value="Grandparent">👵 Großeltern</option>
                    <option value="Child">🧒 Kind / Junior</option>
                    <option value="Teen">🎮 Teenager</option>
                    <option value="Family Champion">🏆 Champion</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  Tipp: Frag deine Mitspieler nach ihrer Spieler-ID aus dem Benutzer-Panel.
                </span>

                <button
                  type="submit"
                  disabled={isSubmitting || !inputTargetId.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-black text-xs transition flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Prüfe...' : 'Freund hinzufügen'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => { sound.playClick(); setActiveFilter('all'); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeFilter === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Alle</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeFilter === 'all' ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {friends.length}
                </span>
              </button>

              <button
                onClick={() => { sound.playClick(); setActiveFilter('online'); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeFilter === 'online'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                <span>Online</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeFilter === 'online' ? 'bg-slate-950 text-emerald-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {onlineCount}
                </span>
              </button>

              <button
                onClick={() => { sound.playClick(); setActiveFilter('favorites'); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeFilter === 'favorites'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>Favoriten</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeFilter === 'favorites' ? 'bg-slate-950 text-amber-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  {favoritesCount}
                </span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nach Name, ID oder Spiel suchen..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Friends List Container */}
          <div className="space-y-2.5">
            {filteredFriends.length === 0 ? (
              <div className="p-8 text-center bg-slate-800/30 border border-slate-800 rounded-2xl space-y-3">
                <Users className="w-10 h-10 text-slate-600 mx-auto" />
                <div>
                  <h4 className="font-bold text-sm text-slate-300">Keine Familien-Freunde gefunden</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    {searchQuery
                      ? 'Kein Eintrag entspricht deiner Suchanfrage.'
                      : activeFilter === 'online'
                      ? 'Gerade ist keines deiner Familienmitglieder online.'
                      : 'Füge oben die Spieler-ID deiner Familienmitglieder ein.'}
                  </p>
                </div>
                {friends.length === 0 && (
                  <button
                    onClick={handleResetToStarter}
                    className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Freundesliste aktualisieren</span>
                  </button>
                )}
              </div>
            ) : (
              filteredFriends.map((friend) => {
                const statusBadge = friendsService.getStatusBadge(friend.status);

                return (
                  <div
                    key={friend.id}
                    className="p-3.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition group"
                  >
                    {/* Left: Avatar, Name, Role, Online Status */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar with Status Dot Indicator */}
                      <div className="relative shrink-0">
                        <AvatarDisplay avatar={friend.avatar} size="sm" showBadge={friend.familyRole.slice(0, 1)} />
                        <span 
                          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${statusBadge.dotBg} shadow`}
                          title={`Status: ${statusBadge.label}`}
                        />
                      </div>

                      {/* Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white truncate">{friend.name}</span>
                          {friend.isFavorite && (
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                          )}
                          <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.2 rounded font-semibold shrink-0">
                            Lvl {friend.level}
                          </span>
                        </div>

                        {/* ID & Status Line */}
                        <div className="flex flex-wrap items-center gap-2 text-xs mt-0.5">
                          {/* Online status indicator */}
                          <span className={`font-semibold flex items-center gap-1 text-[11px] ${statusBadge.textClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.colorClass}`} />
                            <span>{statusBadge.label}</span>
                          </span>

                          {/* Current game activity if applicable */}
                          {friend.currentGame && (
                            <span className="text-amber-200/90 text-[11px] font-medium flex items-center gap-1">
                              <span>•</span>
                              <Gamepad2 className="w-3 h-3 text-amber-400" />
                              <span className="truncate max-w-[160px] sm:max-w-none">{friend.currentGame}</span>
                            </span>
                          )}

                          {/* ID badge with copy */}
                          <button
                            onClick={() => handleCopyFriendId(friend.id)}
                            className="text-[10px] text-slate-400 font-mono hover:text-slate-200 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700/60 flex items-center gap-1 transition"
                            title="ID kopieren"
                          >
                            <span>ID: {friend.id}</span>
                            {copiedFriendId === friend.id ? (
                              <Check className="w-2.5 h-2.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-2.5 h-2.5 text-slate-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {/* Invite / Join Button */}
                      {(friend.status === 'online' || friend.status === 'in-game') && onInviteToGame && (
                        <button
                          onClick={() => {
                            sound.playReward();
                            onInviteToGame(friend);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                          title="Einladung zum gemeinsamen Tisch senden"
                        >
                          <Gamepad2 className="w-3.5 h-3.5" />
                          <span>{friend.status === 'in-game' ? 'Zuschauen / Beitritt' : 'Zum Tisch einladen'}</span>
                        </button>
                      )}

                      {/* Favorite Button */}
                      <button
                        onClick={() => handleToggleFavorite(friend.id)}
                        className={`p-2 rounded-xl border transition ${
                          friend.isFavorite
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-amber-400'
                        }`}
                        title={friend.isFavorite ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
                      >
                        <Star className={`w-3.5 h-3.5 ${friend.isFavorite ? 'fill-current' : ''}`} />
                      </button>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveFriend(friend.id, friend.name)}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition"
                        title="Aus Freundesliste entfernen"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Live-Familiennetzwerk verbunden</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition"
          >
            Fertig
          </button>
        </div>

      </div>
    </div>
  );
};
