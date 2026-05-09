import { Download, ExternalLink } from 'lucide-react';

interface ExportModuleProps {
  currentSong: any;
}

export function ExportModule({ currentSong }: ExportModuleProps) {
  return (
    <div className="flex flex-col">
      <h3 className="text-white font-medium text-sm mb-4">Exportar Playlist</h3>
      
      {currentSong ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#121212] border border-[#27272A]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                <span className="text-lg">🎧</span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Focus Session #42</p>
                <p className="text-xs text-[#A1A1AA]">5 canciones • Generada ahora</p>
              </div>
            </div>
            <button className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors">
              <Download className="w-4 h-4" />
            </button>
          </div>
          
          <button className="w-full flex items-center justify-center gap-2 text-[#71717A] text-xs py-2 hover:text-white transition-colors">
            Ver todas las sesiones guardadas
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-xs text-[#71717A]">Responde el check-in para generar tu primera playlist exportable.</p>
        </div>
      )}
    </div>
  );
}
