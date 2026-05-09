import { Play, MoreHorizontal, Clock } from 'lucide-react';

interface PlaylistQueueProps {
  queue: any[];
  currentSong: any;
}

export function PlaylistQueue({ queue, currentSong }: PlaylistQueueProps) {
  
  return (
    <div className="w-80 h-full rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 shadow-2xl flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-medium">Aura Radio</h3>
          <p className="text-white/40 text-sm">Siguientes en cola</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
          <MoreHorizontal className="w-4 h-4 text-white/60" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
        {queue.length === 0 && !currentSong && (
          <div className="text-center text-white/30 text-sm mt-10">
            Ajusta tu ánimo para generar recomendaciones...
          </div>
        )}
        
        {currentSong && (
          <div className="group flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors bg-white/10 border border-white/10 mb-2">
             <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center backdrop-blur-sm">
                  <div className="flex items-end h-3 gap-0.5">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-0.5 bg-cyan-400 rounded-full animate-pulse" style={{ height: `${Math.random() * 100}%` }} />
                    ))}
                  </div>
                </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm truncate text-cyan-400">{currentSong.title}</h4>
              <p className="text-xs text-white/50 truncate">{currentSong.artist}</p>
            </div>
            <div className="text-xs text-white/40 font-mono flex items-center gap-1">
              <span>{currentSong.duration}</span>
            </div>
          </div>
        )}

        {queue.map((track, idx) => (
          <div 
            key={idx} 
            className="group flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors hover:bg-white/5 border border-transparent"
          >
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                <span className="text-xs text-white/30 group-hover:hidden">{idx + 1}</span>
                <Play className="w-4 h-4 text-white/40 hidden group-hover:block transition-opacity" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm truncate text-white/90">{track.title}</h4>
              <p className="text-xs text-white/50 truncate">{track.artist}</p>
            </div>
            
            <div className="text-xs text-white/40 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3 hidden group-hover:block" />
              <span>{track.duration}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}