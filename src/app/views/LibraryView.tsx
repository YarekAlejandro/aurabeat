import { useState, useEffect } from 'react';
import { Loader2, Music2, Play, Pause, Heart } from 'lucide-react';

interface LibraryViewProps {
  onPlaySong: (track: any) => void;
}

export function LibraryView({ onPlaySong }: LibraryViewProps) {
  const [tracks, setTracks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const savedGenresStr = localStorage.getItem('selectedGenres');
        let genreQuery = 'top hits';
        if (savedGenresStr) {
          try {
            const genres = JSON.parse(savedGenresStr);
            genreQuery = genres.join(' ') || 'top hits';
          } catch (e) {}
        }
        const response = await fetch(`/api/library?genres=${encodeURIComponent(genreQuery)}`);
        const data = await response.json();
        if (data.success) {
          setTracks(data.tracks || []);
        }
      } catch (error) {
        console.error("Failed to fetch library", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLibrary();
  }, []);

  const handlePlay = (track: any) => {
    setPlayingId(track.id);
    onPlaySong(track);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-4" />
        <p className="text-[#A1A1AA]">Cargando tu biblioteca musical...</p>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Music2 className="w-16 h-16 text-[#27272A] mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">No se cargaron canciones</h3>
        <p className="text-[#A1A1AA] max-w-md">Intenta recargar la página.</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          Tu Biblioteca <Heart className="w-6 h-6 text-cyan-400" />
        </h2>
        <p className="text-[#A1A1AA]">Canciones curadas para tu perfil musical.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pb-20">
        {tracks.map((track, idx) => {
          const isCurrentlyPlaying = playingId === track.id;
          return (
            <div
              key={`${track.id}-${idx}`}
              onClick={() => handlePlay(track)}
              className={`flex items-center gap-4 p-3 rounded-xl border transition-all group cursor-pointer ${
                isCurrentlyPlaying
                  ? 'bg-cyan-500/10 border-cyan-500/40'
                  : 'bg-[#1A1A1A] border-[#27272A] hover:bg-[#27272A]'
              }`}
            >
              <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={track.artwork || 'https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=100&h=100&fit=crop'}
                  alt={track.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=100&h=100&fit=crop'; }}
                />
                <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${isCurrentlyPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {isCurrentlyPlaying
                    ? <Pause className="w-5 h-5 text-cyan-400 fill-cyan-400" />
                    : <Play className="w-5 h-5 text-white fill-white" />
                  }
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`font-semibold text-sm truncate ${isCurrentlyPlaying ? 'text-cyan-400' : 'text-white'}`}>{track.title}</h4>
                <p className="text-[#A1A1AA] text-xs truncate">{track.artist}</p>
                {track.duration && <p className="text-[#3F3F46] text-[10px] mt-0.5">{track.duration}</p>}
              </div>
              {!track.previewUrl && (
                <span className="text-[9px] text-[#3F3F46] flex-shrink-0">sin audio</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
