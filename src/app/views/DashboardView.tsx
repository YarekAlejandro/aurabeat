import { useState, useEffect } from 'react';
import { LogOut, Settings, Sparkles, Home, Library, Compass, Music2, BarChart3 } from 'lucide-react';
import { DynamicCheckIn } from '../components/DynamicCheckIn';
import { MusicPlayer } from '../components/MusicPlayer';
import { ExportModule } from '../components/ExportModule';
import { LibraryView } from './LibraryView';
import { DiscoverView } from './DiscoverView';
import { SettingsModal } from '../components/SettingsModal';
import { MusicalProfile } from '../components/MusicalProfile';
import { StatsView } from './StatsView';

interface DashboardViewProps {
  onLogout: () => void;
}

export function DashboardView({ onLogout }: DashboardViewProps) {
  const [currentSong, setCurrentSong] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'home' | 'discover' | 'library' | 'stats'>('home');
  const [showSettings, setShowSettings] = useState(false);
  const [profileAnalysis, setProfileAnalysis] = useState<string>('');
  const [profile, setProfile] = useState<{ name: string, image: string, type: 'spotify' | 'google' | null }>({ 
    name: 'Invitado', 
    image: 'https://i.pravatar.cc/150?u=a042581f4e29026024d',
    type: null
  });

  useEffect(() => {
    // 1. Intentar cargar perfil de Google
    const googleStr = localStorage.getItem('googleProfile');
    if (googleStr) {
      try {
        const gProfile = JSON.parse(googleStr);
        setProfile({ name: gProfile.given_name || gProfile.name, image: gProfile.picture, type: 'google' });
      } catch(e) {}
    }

    // 2. Si hay Spotify, intentar sobrescribir con perfil de Spotify (prioridad musical)
    const fetchSpotifyProfile = async () => {
      const token = localStorage.getItem('spotifyToken');
      if (!token) return;
      try {
        const res = await fetch('/api/spotify/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setProfile({
            name: data.data.display_name,
            image: data.data.images?.[0]?.url || 'https://i.pravatar.cc/150?u=spotify',
            type: 'spotify'
          });
        }
      } catch(e) {}
    };
    fetchSpotifyProfile();
  }, []);

  const handlePlaylistReady = (playlist: any[]) => {
    if (playlist.length > 0) {
      setCurrentSong(playlist[0]);
      setIsPlaying(true);
      setProgress(0);
    }
  };

  return (
    <div className="flex w-full h-screen bg-[#050505] overflow-hidden animate-in fade-in duration-500">
      
      {/* Sidebar (Left) */}
      <div className="w-[280px] bg-[#121212] border-r border-[#27272A] flex flex-col hidden lg:flex relative z-10">
        
        {/* Profile / Brand */}
        <div className="p-6 border-b border-[#27272A]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-white">AuraBeat</span>
          </div>

          <div className="flex items-center gap-3 bg-[#1A1A1A] p-3 rounded-xl border border-[#27272A]">
            <img src={profile.image} alt="Avatar" className="w-10 h-10 rounded-full border border-[#3F3F46] object-cover" />
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-medium text-sm truncate">Hola, {profile.name}</h2>
              {profile.type === 'spotify' && (
                <p className="text-[#1DB954] text-xs font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1DB954]" /> Spotify Sync
                </p>
              )}
              {profile.type === 'google' && (
                <p className="text-[#4285F4] text-xs font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4285F4]" /> Google Auth
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-4 space-y-1">
          <button 
            onClick={() => setActiveTab('home')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'home' ? 'bg-[#1A1A1A] text-white' : 'text-[#A1A1AA] hover:bg-[#1A1A1A] hover:text-white'}`}
          >
            <Home className={`w-5 h-5 ${activeTab === 'home' ? 'text-cyan-400' : ''}`} />
            Inicio
          </button>
          <button 
            onClick={() => setActiveTab('discover')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'discover' ? 'bg-[#1A1A1A] text-white' : 'text-[#A1A1AA] hover:bg-[#1A1A1A] hover:text-white'}`}
          >
            <Compass className={`w-5 h-5 ${activeTab === 'discover' ? 'text-cyan-400' : ''}`} />
            Descubrir
          </button>
          <button 
            onClick={() => setActiveTab('library')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'library' ? 'bg-[#1A1A1A] text-white' : 'text-[#A1A1AA] hover:bg-[#1A1A1A] hover:text-white'}`}
          >
            <Library className={`w-5 h-5 ${activeTab === 'library' ? 'text-cyan-400' : ''}`} />
            Tu Biblioteca
          </button>
          <button 
            onClick={() => setActiveTab('stats')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'stats' ? 'bg-[#1A1A1A] text-white' : 'text-[#A1A1AA] hover:bg-[#1A1A1A] hover:text-white'}`}
          >
            <BarChart3 className={`w-5 h-5 ${activeTab === 'stats' ? 'text-cyan-400' : ''}`} />
            Estadísticas
          </button>
        </div>

        {/* Export Module */}
        <div className="p-6 mt-auto border-t border-[#27272A]">
          <ExportModule currentSong={currentSong} />
        </div>
      </div>

      {/* Main Content (Center) */}
      <div className="flex-1 flex flex-col relative z-0">
        
        {/* Glow Effects Behind Main Content */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Top Header (Mobile only) */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-[#27272A] bg-[#121212]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-white">AuraBeat</span>
          </div>
          <img src={profile.image} alt="Avatar" className="w-8 h-8 rounded-full border border-[#27272A] object-cover" />
        </div>

        {/* Scrollable Center */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-12 pb-32">
          
          {activeTab === 'home' && (
            <div className="max-w-4xl mx-auto">
              
              <MusicalProfile onAnalysisLoaded={setProfileAnalysis} />

              <div className="mb-10 text-center lg:text-left">
                <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4">Sincroniza tu Frecuencia</h1>
                <p className="text-[#A1A1AA] text-lg">Responde unas preguntas rápidas basadas en tu calendario para calibrar tu sesión musical.</p>
              </div>

              <div className="bg-[#121212]/80 backdrop-blur-xl border border-[#27272A] rounded-3xl p-8 lg:p-10 shadow-2xl">
                <DynamicCheckIn onComplete={handlePlaylistReady} profileAnalysis={profileAnalysis} />
              </div>
            </div>
          )}

          {activeTab === 'library' && (
            <div className="max-w-5xl mx-auto">
              <LibraryView />
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="max-w-5xl mx-auto">
              <StatsView />
            </div>
          )}

          {activeTab === 'discover' && (
            <div className="max-w-5xl mx-auto">
              <DiscoverView />
            </div>
          )}

        </div>

      </div>

      {/* Settings / Logout (Top Right Absolute) */}
      <div className="absolute top-6 right-6 hidden lg:flex items-center gap-2 z-20">
        <button onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#27272A] flex items-center justify-center text-[#A1A1AA] hover:text-white hover:bg-[#27272A] transition-colors">
          <Settings className="w-5 h-5" />
        </button>
        <button onClick={onLogout} className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#27272A] flex items-center justify-center text-[#A1A1AA] hover:text-white hover:bg-[#27272A] transition-colors">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Bar Player */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-[#121212] border-t border-[#27272A] z-30 px-6 flex items-center">
        <MusicPlayer 
          currentSong={currentSong} 
          isPlaying={isPlaying} 
          setIsPlaying={setIsPlaying} 
          progress={progress}
          volume={50}
          setVolume={() => {}}
        />
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} onLogout={onLogout} />}
    </div>
  );
}
