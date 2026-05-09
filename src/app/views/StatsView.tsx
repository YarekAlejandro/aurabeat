import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Activity, Music2 } from 'lucide-react';

export function StatsView() {
  const [moodHistory, setMoodHistory] = useState<any[]>([]);
  const [topGenres, setTopGenres] = useState<string[]>([]);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('moodHistory') || '[]');
    setMoodHistory(history.reverse()); // Show newest first
    
    const genres = JSON.parse(localStorage.getItem('musicalAnalysisGenres') || '[]');
    setTopGenres(genres);
  }, []);

  const getMoodColor = (valence: number) => {
    if (valence > 0.3) return 'bg-green-500';
    if (valence < -0.3) return 'bg-blue-500';
    return 'bg-yellow-500';
  };

  const getMoodLabel = (valence: number, energy: number) => {
    if (valence > 0.3 && energy > 0.3) return 'Eufórico';
    if (valence > 0.3 && energy < -0.3) return 'Relajado';
    if (valence < -0.3 && energy > 0.3) return 'Tenso';
    if (valence < -0.3 && energy < -0.3) return 'Melancólico';
    return 'Equilibrado';
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          Estadísticas <BarChart3 className="w-6 h-6 text-cyan-400" />
        </h2>
        <p className="text-[#A1A1AA]">Tu actividad musical y estados de ánimo a lo largo del tiempo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 pb-20">
        
        {/* Generos */}
        <div className="bg-[#121212]/80 backdrop-blur-xl border border-[#27272A] rounded-2xl p-6 shadow-xl h-fit">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Music2 className="w-5 h-5 text-violet-400" /> Géneros Frecuentes
          </h3>
          {topGenres.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {topGenres.map(g => (
                <span key={g} className="px-3 py-1 bg-[#27272A] border border-[#3F3F46] rounded-full text-xs font-semibold text-white capitalize">
                  {g}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[#A1A1AA] text-sm">Realiza tu análisis musical para ver tus géneros.</p>
          )}
        </div>

        {/* Resumen */}
        <div className="bg-[#121212]/80 backdrop-blur-xl border border-[#27272A] rounded-2xl p-6 shadow-xl lg:col-span-2">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" /> Historial de Ánimo
          </h3>
          
          {moodHistory.length > 0 ? (
            <div className="space-y-4">
              {moodHistory.map((mood, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-4 bg-[#1A1A1A] p-4 rounded-xl border border-[#27272A]">
                  <div className={`w-full sm:w-3 h-2 sm:h-10 rounded-full ${getMoodColor(mood.valence)}`} />
                  <div className="flex-1">
                    <h4 className="text-white font-bold">{getMoodLabel(mood.valence, mood.energy)}</h4>
                    <p className="text-[#A1A1AA] text-xs">{new Date(mood.date).toLocaleString()}</p>
                  </div>
                  <div className="text-left sm:text-right flex sm:block gap-4">
                    <div className="text-xs text-[#A1A1AA]">Valencia: {mood.valence.toFixed(2)}</div>
                    <div className="text-xs text-[#A1A1AA]">Energía: {mood.energy.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <TrendingUp className="w-10 h-10 text-[#3F3F46] mx-auto mb-3" />
              <p className="text-[#A1A1AA]">No hay historial aún. ¡Genera tu primera Playlist Mágica!</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
