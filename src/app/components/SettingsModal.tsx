import { X, LogOut, CheckCircle2 } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  onLogout: () => void;
}

export function SettingsModal({ onClose, onLogout }: SettingsModalProps) {
  const spotifyToken = localStorage.getItem('spotifyToken');
  const googleProfile = localStorage.getItem('googleProfile');

  const disconnectSpotify = () => {
    localStorage.removeItem('spotifyToken');
    window.location.reload();
  };

  const handleLogout = () => {
    localStorage.removeItem('spotifyToken');
    localStorage.removeItem('googleProfile');
    localStorage.removeItem('selectedGenres');
    onLogout();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#121212] border border-[#27272A] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#27272A]">
          <h2 className="text-xl font-bold text-white">Ajustes</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#1A1A1A] rounded-full text-[#A1A1AA] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          <div>
            <h3 className="text-sm font-semibold text-[#A1A1AA] uppercase tracking-wider mb-4">Cuentas Conectadas</h3>
            
            <div className="space-y-3">
              {/* Google Status */}
              <div className="flex items-center justify-between p-3 bg-[#1A1A1A] border border-[#27272A] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#27272A] flex items-center justify-center">
                    <span className="text-white font-bold text-xs">G</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Cuenta de Google</p>
                    <p className="text-xs text-[#A1A1AA]">{googleProfile ? 'Conectado' : 'No conectado'}</p>
                  </div>
                </div>
                {googleProfile && <CheckCircle2 className="w-5 h-5 text-green-500" />}
              </div>

              {/* Spotify Status */}
              <div className="flex items-center justify-between p-3 bg-[#1A1A1A] border border-[#27272A] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1DB954] flex items-center justify-center">
                    <span className="text-white font-bold text-xs">S</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">Spotify Premium</p>
                    <p className="text-xs text-[#A1A1AA]">{spotifyToken ? 'Conectado' : 'No conectado'}</p>
                  </div>
                </div>
                {spotifyToken ? (
                  <button onClick={disconnectSpotify} className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors">
                    Desconectar
                  </button>
                ) : (
                  <button onClick={() => window.location.href = '/auth/spotify'} className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
                    Conectar
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#27272A]">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 text-red-500 font-medium hover:bg-red-500/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Cerrar Sesión Completa
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
