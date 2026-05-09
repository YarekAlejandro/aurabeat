import { useState, useEffect } from 'react';
import { Loader2, Music, Play } from 'lucide-react';

export function LibraryView() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLibrary = async () => {
      const token = localStorage.getItem('spotifyToken');
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch('/api/spotify/library', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success) {
          setTracks(data.tracks);
        }
      } catch (error) {
        console.error("Failed to fetch library", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLibrary();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mb-4" />
        <p className="text-[#A1A1AA]">Sincronizando con tu biblioteca de Spotify...</p>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Music className="w-16 h-16 text-[#27272A] mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Tu biblioteca está vacía o no estás conectado</h3>
        <p className="text-[#A1A1AA] max-w-md">Conecta tu cuenta de Spotify en la configuración para importar tus canciones favoritas.</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Tus Canciones Favoritas</h2>
        <p className="text-[#A1A1AA]">Importadas directamente desde tus "Me Gusta" de Spotify.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-20">
        {tracks.map((track, idx) => (
          <div key={`${track.id}-${idx}`} className="flex items-center gap-4 p-3 rounded-xl bg-[#1A1A1A] border border-[#27272A] hover:bg-[#27272A] transition-colors group cursor-pointer">
            <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
              <img src={track.artwork || 'https://images.unsplash.com/photo-1614149162883-504ce4d13909?w=100&h=100&fit=crop'} alt={track.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-6 h-6 text-white fill-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium text-sm truncate">{track.title}</h4>
              <p className="text-[#A1A1AA] text-xs truncate">{track.artist}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
