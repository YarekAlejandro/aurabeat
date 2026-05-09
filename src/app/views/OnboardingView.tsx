import { useState, useEffect } from 'react';
import { CheckCircle2, ChevronRight, Music2, Code, BookOpen, Coffee, Headphones, Check } from 'lucide-react';

interface OnboardingViewProps {
  onComplete: () => void;
}

export function OnboardingView({ onComplete }: OnboardingViewProps) {
  const [step, setStep] = useState(1);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [connectedServices, setConnectedServices] = useState<Set<string>>(new Set());
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());

  // Detectar si venimos de conectar Spotify
  useEffect(() => {
    if (localStorage.getItem('spotifyToken')) {
      setConnectedServices(prev => new Set(prev).add('spotify'));
      setStep(2); // Saltar al paso 2 automáticamente
    }
  }, []);

  const tags = [
    { id: 'dev', label: 'Desarrollador', icon: Code },
    { id: 'student', label: 'Estudiante', icon: BookOpen },
    { id: 'designer', label: 'Diseñador', icon: Coffee },
    { id: 'creator', label: 'Creador', icon: Headphones },
  ];

  const genres = ['Electrónica', 'Lo-Fi', 'Clásica', 'Jazz', 'Ambient', 'Rock', 'Pop', 'Indie', 'Synthwave', 'Acoustic', 'Focus Beats', 'Nature'];

  const connectSpotify = () => {
    if (connectedServices.has('spotify')) {
      // Disconnect
      localStorage.removeItem('spotifyToken');
      setConnectedServices(prev => {
        const newSet = new Set(prev);
        newSet.delete('spotify');
        return newSet;
      });
    } else {
      // Redirect to Backend OAuth route
      window.location.href = '/auth/spotify';
    }
  };

  const toggleService = (id: string) => {
    if (id === 'spotify') {
      connectSpotify();
      return;
    }
    setConnectedServices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => {
      const newSet = new Set(prev);
      if (newSet.has(genre)) newSet.delete(genre);
      else newSet.add(genre);
      return newSet;
    });
  };

  return (
    <div className="flex w-full h-screen items-center justify-center p-8 bg-[#121212] animate-in fade-in duration-500">
      
      <div className="w-full max-w-3xl bg-[#1A1A1A] border border-[#27272A] rounded-3xl p-10 lg:p-14 shadow-2xl relative overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-cyan-500/20 rounded-full blur-[80px] pointer-events-none" />

        {/* Progress */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex flex-col">
            <span className="text-cyan-400 font-bold text-sm tracking-wider uppercase mb-1">Paso {step} de 3</span>
            <h2 className="text-3xl font-extrabold">Configuración inicial</h2>
          </div>
          <div className="flex items-center gap-3 w-48">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-2 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-cyan-500' : 'bg-[#27272A]'}`} />
            ))}
          </div>
        </div>

        <div className="min-h-[300px]">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <h3 className="text-2xl font-bold mb-2">¿A qué te dedicas?</h3>
              <p className="text-[#A1A1AA] text-base mb-8">Esto nos ayuda a entender tus patrones de enfoque y relajo diarios.</p>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {tags.map((tag) => {
                  const Icon = tag.icon;
                  const isSelected = selectedTag === tag.id;
                  return (
                    <button
                      key={tag.id}
                      onClick={() => setSelectedTag(tag.id)}
                      className={`flex flex-col items-center justify-center gap-4 p-6 rounded-2xl border-2 transition-all hover:-translate-y-1 ${
                        isSelected 
                          ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.2)] text-white' 
                          : 'bg-[#1E1E1E] border-[#27272A] text-[#A1A1AA] hover:bg-[#27272A] hover:text-white hover:border-[#3F3F46]'
                      }`}
                    >
                      <Icon className={`w-8 h-8 ${isSelected ? 'text-cyan-400' : ''}`} />
                      <span className="font-semibold text-sm">{tag.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <h3 className="text-2xl font-bold mb-2">Conecta tu música</h3>
              <p className="text-[#A1A1AA] text-base mb-8">Sincroniza tus servicios para reproducir directamente.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Spotify */}
                <button 
                  onClick={() => toggleService('spotify')}
                  className={`flex items-center p-5 rounded-2xl border-2 transition-all ${
                    connectedServices.has('spotify')
                    ? 'bg-[#1DB954]/10 border-[#1DB954] shadow-[0_0_20px_rgba(29,185,84,0.2)]'
                    : 'bg-[#1E1E1E] border-[#27272A] hover:border-[#3F3F46] hover:bg-[#27272A]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-[#1DB954] flex items-center justify-center flex-shrink-0">
                    <Music2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="ml-4 flex-1 text-left">
                    <span className="block font-bold text-white text-lg">Spotify</span>
                    <span className="block text-sm text-[#A1A1AA]">{connectedServices.has('spotify') ? 'Conectado' : 'Conectar cuenta'}</span>
                  </div>
                  {connectedServices.has('spotify') && <CheckCircle2 className="w-6 h-6 text-[#1DB954]" />}
                </button>

                {/* YouTube */}
                <button 
                  onClick={() => toggleService('youtube')}
                  className={`flex items-center p-5 rounded-2xl border-2 transition-all ${
                    connectedServices.has('youtube')
                    ? 'bg-[#FF0000]/10 border-[#FF0000] shadow-[0_0_20px_rgba(255,0,0,0.2)]'
                    : 'bg-[#1E1E1E] border-[#27272A] hover:border-[#3F3F46] hover:bg-[#27272A]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-[#FF0000] flex items-center justify-center flex-shrink-0">
                    <PlayIcon className="w-5 h-5 text-white ml-1" />
                  </div>
                  <div className="ml-4 flex-1 text-left">
                    <span className="block font-bold text-white text-lg">YouTube Music</span>
                    <span className="block text-sm text-[#A1A1AA]">{connectedServices.has('youtube') ? 'Conectado' : 'Conectar cuenta'}</span>
                  </div>
                  {connectedServices.has('youtube') && <CheckCircle2 className="w-6 h-6 text-[#FF0000]" />}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
              <h3 className="text-2xl font-bold mb-2">Tus géneros base</h3>
              <p className="text-[#A1A1AA] text-base mb-8">En caso de no conectar cuentas o para arrancar la radio inicial.</p>
              
              <div className="flex flex-wrap gap-3">
                {genres.map((genre) => {
                  const isSelected = selectedGenres.has(genre);
                  return (
                    <button 
                      key={genre} 
                      onClick={() => toggleGenre(genre)}
                      className={`flex items-center gap-2 px-5 py-3 rounded-full border-2 transition-all text-sm font-semibold hover:-translate-y-0.5 ${
                        isSelected
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-[#1E1E1E] border-[#27272A] text-white hover:border-[#3F3F46] hover:bg-[#27272A]'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4" />}
                      {genre}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="mt-12 pt-8 border-t border-[#27272A] flex items-center justify-between">
          <button 
            onClick={() => setStep(step - 1)}
            className={`text-[#A1A1AA] hover:text-white font-medium transition-colors ${step === 1 ? 'invisible' : ''}`}
          >
            Atrás
          </button>
          
          <div className="flex items-center gap-4">
            {step === 2 && connectedServices.size === 0 && (
               <button onClick={() => setStep(3)} className="text-[#71717A] hover:text-white transition-colors text-sm font-medium">
                 Saltar
               </button>
            )}
            <button 
              onClick={() => {
                if (step < 3) {
                   setStep(step + 1);
                } else {
                   localStorage.setItem('selectedGenres', JSON.stringify(Array.from(selectedGenres)));
                   onComplete();
                }
              }}
              disabled={(step === 1 && !selectedTag) || (step === 3 && selectedGenres.size === 0)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-bold py-3 px-8 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(34,211,238,0.2)]"
            >
              {step === 3 ? 'Comenzar a usar AuraBeat' : 'Continuar'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// Simple play icon
function PlayIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
