import { useState, useEffect } from 'react';
import { Loader2, Sparkles, Play, Pause } from 'lucide-react';

interface DiscoverViewProps {
  onPlaySong: (track: any) => void;
}

export function DiscoverView({ onPlaySong }: DiscoverViewProps) {
  const [tracks, setTracks] = useState<any[]>([]);
  const [aiDescription, setAiDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // Get saved genres from localStorage
        const savedGenresStr = localStorage.getItem('selectedGenres');
        let genreQuery = '';
        if (savedGenresStr) {
          try { genreQuery = JSON.parse(savedGenresStr).join(','); } catch (e) {}
        }
        
        const response = await fetch(`/api/discover${genreQuery ? `?genres=${encodeURIComponent(genreQuery)}` : ''}`);
        const data = await response.json();
        if (data.success) {
          setTracks(data.tracks || []);
          setAiDescription(data.aiDescription || 'Frecuencias curadas para ti.');
        }
      } catch (error) {
        console.error("Failed to fetch discovery", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  const handlePlay = (track: any) => {
    setPlayingId(track.id);
    onPlaySong(track);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-4" />
        <p className="text-[#A1A1AA]">Explorando nuevas frecuencias para ti...</p>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Sparkles className="w-16 h-16 text-[#27272A] mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Sin recomendaciones aún</h3>
        <p className="text-[#A1A1AA] max-w-md">No pudimos cargar recomendaciones. Intenta más tarde.</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          Descubrimiento <Sparkles className="w-6 h-6 text-cyan-400" />
        </h2>
        <p className="text-[#A1A1AA] italic text-lg border-l-2 border-cyan-400 pl-4 py-1">"{aiDescription}"</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
        {tracks.map((track, idx) => {
          const isCurrentlyPlaying = playingId === track.id;
          return (
            <div
              key={`${track.id}-${idx}`}
              onClick={() => handlePlay(track)}
              className="flex flex-col gap-3 p-4 rounded-2xl bg-[#1A1A1A] border border-[#27272A] hover:bg-[#27272A] hover:-translate-y-1 transition-all group cursor-pointer"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden w-full shadow-lg">
                <img
                  src={track.artwork || 'https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=300&h=300&fit=crop'}
                  alt={track.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=300&h=300&fit=crop'; }}
                />
                <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl ${isCurrentlyPlaying ? 'bg-cyan-400' : 'bg-white'}`}>
                    {isCurrentlyPlaying
                      ? <Pause className="w-6 h-6 fill-black text-black" />
                      : <Play className="w-6 h-6 fill-black text-black translate-x-0.5" />
                    }
                  </div>
                </div>
                {!track.previewUrl && (
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-[9px] text-[#A1A1AA]">sin preview</div>
                )}
              </div>
              <div>
                <h4 className={`font-bold text-sm truncate ${isCurrentlyPlaying ? 'text-cyan-400' : 'text-white'}`}>{track.title}</h4>
                <p className="text-[#A1A1AA] text-xs truncate mt-0.5">{track.artist}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
