import { useState, useEffect } from 'react';
import { Sparkles, Loader2, Music2, BrainCircuit, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface MusicalProfileProps {
  onAnalysisLoaded: (analysis: string) => void;
}

export function MusicalProfile({ onAnalysisLoaded }: MusicalProfileProps) {
  const [cards, setCards] = useState<{title: string, desc: string}[]>([]);
  const [topGenres, setTopGenres] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    // Check localStorage on mount
    const savedCards = localStorage.getItem('musicalAnalysisCards');
    const savedGenres = localStorage.getItem('musicalAnalysisGenres');
    if (savedCards) {
      try {
        const parsedCards = JSON.parse(savedCards);
        setCards(parsedCards);
        if (savedGenres) setTopGenres(JSON.parse(savedGenres));
        setHasData(true);
        onAnalysisLoaded(JSON.stringify(parsedCards));
      } catch(e) {}
    }
  }, [onAnalysisLoaded]);

  const handleAnalyze = async () => {
    const token = localStorage.getItem('spotifyToken');
    if (!token) {
      alert("Necesitas conectar Spotify primero.");
      return;
    }
    
    setIsAnalyzing(true);
    setIsExpanded(true); // Auto expand on new analysis
    try {
      const response = await fetch('/api/spotify/profile-analysis', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.cards) {
        setCards(data.cards);
        setTopGenres(data.topGenres || []);
        setHasData(true);
        localStorage.setItem('musicalAnalysisCards', JSON.stringify(data.cards));
        localStorage.setItem('musicalAnalysisGenres', JSON.stringify(data.topGenres || []));
        onAnalysisLoaded(JSON.stringify(data.cards));
      }
    } catch (error) {
      console.error("Failed to fetch profile analysis", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!hasData && !isAnalyzing) {
    return (
      <div className="bg-[#121212]/80 backdrop-blur-xl border border-[#27272A] rounded-3xl p-8 shadow-2xl mb-10 flex flex-col items-center text-center">
        <BrainCircuit className="w-12 h-12 text-cyan-400 mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Conoce tu mente musical</h3>
        <p className="text-[#A1A1AA] mb-6 max-w-md">La IA de AuraBeat puede analizar profundamente tu historial y revelar por qué te atraen ciertos sonidos.</p>
        <button onClick={handleAnalyze} className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-bold rounded-xl hover:scale-105 transition-transform shadow-lg shadow-cyan-500/20 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Analizar mi Perfil Musical con IA
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#1A1A1A] to-[#121212] border border-[#27272A] rounded-3xl overflow-hidden shadow-2xl mb-10 relative animate-in fade-in duration-700 transition-all">
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Header / Collapse Toggle */}
      <div 
        onClick={() => !isAnalyzing && setIsExpanded(!isExpanded)}
        className={`p-6 flex items-center justify-between z-20 relative cursor-pointer hover:bg-white/5 transition-colors ${isExpanded ? 'border-b border-[#27272A]' : ''}`}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center shadow-lg">
            {isAnalyzing ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <BrainCircuit className="w-6 h-6 text-white" />}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              {isAnalyzing ? "Analizando tus frecuencias..." : "Mi Análisis Musical"}
            </h2>
            <p className="text-[#A1A1AA] text-sm">Descubre tus curiosidades musicales</p>
          </div>
        </div>
        {!isAnalyzing && (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-cyan-400 hidden sm:inline">{isExpanded ? 'Ocultar' : 'Ver tarjeta'}</span>
            {isExpanded ? <ChevronUp className="w-5 h-5 text-[#A1A1AA]" /> : <ChevronDown className="w-5 h-5 text-[#A1A1AA]" />}
          </div>
        )}
      </div>

      {/* Expanded Content */}
      {isExpanded && !isAnalyzing && (
        <div className="p-6 md:p-8 relative z-10 animate-in slide-in-from-top-4 duration-300">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {cards.map((card, i) => (
              <div key={i} className="bg-[#27272A]/30 backdrop-blur-md border border-[#3F3F46]/50 rounded-2xl p-6 hover:bg-[#27272A]/50 transition-colors">
                <h4 className="text-cyan-400 font-bold mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> {card.title}
                </h4>
                <p className="text-[#E4E4E7] text-sm leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-[#27272A] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {topGenres.map(genre => (
                <span key={genre} className="px-3 py-1.5 bg-[#27272A]/50 border border-[#3F3F46] rounded-full text-xs font-semibold text-white capitalize flex items-center gap-1.5">
                  <Music2 className="w-3.5 h-3.5 text-cyan-400" />
                  {genre}
                </span>
              ))}
            </div>
            
            <button onClick={handleAnalyze} className="flex items-center justify-center gap-2 px-4 py-2 bg-[#27272A] hover:bg-[#3F3F46] text-white text-sm font-medium rounded-lg transition-colors w-full md:w-auto">
              <RefreshCw className="w-4 h-4" />
              Re-analizar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
