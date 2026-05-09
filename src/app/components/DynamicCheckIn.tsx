import { useState, useEffect } from 'react';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

interface DynamicCheckInProps {
  onComplete: (playlist: any[]) => void;
  profileAnalysis?: string;
}

export function DynamicCheckIn({ onComplete, profileAnalysis }: DynamicCheckInProps) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPlaylist, setIsGeneratingPlaylist] = useState(false);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch('/api/generate-questions');
        const data = await response.json();
        if (data.success && data.data) {
          setQuestions(data.data);
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const handleSelect = (questionId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleSubmit = async () => {
    setIsGeneratingPlaylist(true);
    
    const spotifyToken = localStorage.getItem('spotifyToken');
    const selectedGenresStr = localStorage.getItem('selectedGenres');
    let selectedGenres = [];
    if (selectedGenresStr) {
       try { selectedGenres = JSON.parse(selectedGenresStr); } catch(e) {}
    }

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, spotifyToken, selectedGenres, profileAnalysis })
      });
      const data = await response.json();
      if (data.success && data.data.playlist) {
        if (data.data.inferred_state) {
          const history = JSON.parse(localStorage.getItem('moodHistory') || '[]');
          history.push({
            date: new Date().toISOString(),
            valence: data.data.inferred_state.valence,
            energy: data.data.inferred_state.energy
          });
          localStorage.setItem('moodHistory', JSON.stringify(history));
        }
        onComplete(data.data.playlist);
      }
    } catch (error) {
      console.error("Error generating playlist:", error);
    } finally {
      setIsGeneratingPlaylist(false);
    }
  };

  const allAnswered = questions.length > 0 && questions.every(q => answers[q.id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-70">
        <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-6" />
        <p className="text-lg text-[#A1A1AA]">AuraBeat está leyendo tu calendario y diseñando tus preguntas...</p>
      </div>
    );
  }

  if (isGeneratingPlaylist) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-full bg-cyan-500/10 flex items-center justify-center mb-6 relative">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 animate-ping" />
          <Sparkles className="w-10 h-10 text-cyan-400" />
        </div>
        <h3 className="text-2xl text-white font-medium">Curando tu frecuencia musical...</h3>
        <p className="text-lg text-[#A1A1AA] mt-2 text-center">Basado en tu contexto y respuestas</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-center gap-2 mb-10">
        <Sparkles className="w-6 h-6 text-cyan-400" />
        <h3 className="text-white font-bold text-xl">¿Cómo va tu día?</h3>
      </div>
      
      <div className="space-y-8 max-w-xl mx-auto w-full">
        {questions.map((q, idx) => (
          <div key={q.id} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 150}ms` }}>
            <p className="text-lg text-white mb-4 font-medium">{q.text}</p>
            <div className="flex flex-wrap gap-3">
              {q.options.map((opt: string) => {
                const isSelected = answers[q.id] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => handleSelect(q.id, opt)}
                    className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all ${
                      isSelected 
                        ? 'bg-cyan-500/20 text-cyan-300 border-2 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.15)] -translate-y-0.5' 
                        : 'bg-[#1A1A1A] border-2 border-[#27272A] text-[#A1A1AA] hover:border-[#3F3F46] hover:bg-[#27272A] hover:text-white'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-14 max-w-xl mx-auto w-full">
        <button
          onClick={handleSubmit}
          disabled={!allAnswered}
          className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-4 rounded-2xl hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(255,255,255,0.15)]"
        >
          <CheckCircle2 className="w-5 h-5" />
          Generar Playlist Mágica
        </button>
      </div>
    </div>
  );
}
