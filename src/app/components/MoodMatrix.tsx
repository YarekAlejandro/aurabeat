import { useState, useRef, useEffect, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface MoodMatrixProps {
  onMoodChange: (valence: number, energy: number) => void;
  isGenerating?: boolean;
}

export function MoodMatrix({ onMoodChange, isGenerating = false }: MoodMatrixProps) {
  // Posición visual en porcentaje (0-100)
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const matrixRef = useRef<HTMLDivElement>(null);
  
  // Usamos una referencia para tener siempre el último valor en el evento onMouseUp
  const positionRef = useRef(position);
  useEffect(() => { positionRef.current = position; }, [position]);

  const updatePosition = (e: any) => {
    if (!matrixRef.current) return;
    
    const rect = matrixRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = 100 - ((clientY - rect.top) / rect.height) * 100; // Invertimos Y: 100 es arriba
    
    // Clampeamos para no salir del contenedor
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));
    
    setPosition({ x, y });
  };

  const handlePointerDown = (e: ReactMouseEvent | ReactTouchEvent) => {
    if (isGenerating) return; // Bloquear si está cargando
    setIsDragging(true);
    updatePosition(e);
  };

  const handlePointerMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    updatePosition(e);
  };

  const handlePointerUp = () => {
    if (isDragging) {
      setIsDragging(false);
      
      // CONVERSIÓN MATEMÁTICA: De [0, 100] a [-1.0, 1.0]
      const { x, y } = positionRef.current;
      const valence = (x / 50) - 1;
      const energy = (y / 50) - 1;
      
      // Limitamos a 2 decimales para enviar al backend
      onMoodChange(
        parseFloat(valence.toFixed(2)), 
        parseFloat(energy.toFixed(2))
      );
    }
  };

  // Listeners globales para arrastre fluido incluso fuera del div
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handlePointerMove);
      window.addEventListener('touchend', handlePointerUp);
    }
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging]);

  // Labels visuales y colores basados en cuadrantes
  const getMoodInfo = (x: number, y: number) => {
    if (x >= 50 && y >= 50) return { label: 'Energía & Foco', color: 'from-orange-500 to-pink-500' };
    if (x < 50 && y >= 50) return { label: 'Relajado & Positivo', color: 'from-cyan-400 to-blue-500' };
    if (x < 50 && y < 50) return { label: 'Calma & Melancolía', color: 'from-violet-500 to-purple-600' };
    return { label: 'Intenso & Concentrado', color: 'from-rose-500 to-red-600' };
  };

  const moodInfo = getMoodInfo(position.x, position.y);

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto">
      <div className="text-center">
        <h2 className="text-white/90 text-lg font-medium tracking-wide">
          Estado: <span className="text-white font-bold">{moodInfo.label}</span>
        </h2>
        <p className="text-white/40 text-sm mt-1">Arrastra para ajustar Valencia (X) vs Energía (Y)</p>
      </div>

      <div 
        ref={matrixRef}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        className={`relative w-64 h-64 rounded-2xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 shadow-2xl overflow-hidden cursor-crosshair touch-none ${isGenerating ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {/* Líneas de Cuadrante Cartesiano */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-1/2 left-0 w-full h-px bg-white/50" />
          <div className="absolute top-0 left-1/2 w-px h-full bg-white/50" />
        </div>
        
        {/* Backgrounds sutiles por zona */}
        <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-cyan-500/10" />
        <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-orange-500/10" />
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-violet-500/10" />
        <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-rose-500/10" />

        {/* El "Cursor" (Orb Draggable) */}
        <motion.div
          className={`absolute w-12 h-12 -ml-6 -mt-6 rounded-full bg-gradient-to-br ${moodInfo.color} shadow-[0_0_30px_rgba(255,255,255,0.4)] flex items-center justify-center border-2 border-white/30 z-10`}
          animate={{
            left: `${position.x}%`,
            top: `${100 - position.y}%`,
          }}
          transition={{ type: "spring", stiffness: isDragging ? 300 : 100, damping: 20 }}
        >
          <div className="w-8 h-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center">
            {isGenerating ? <div className="w-4 h-4 text-white border-2 border-t-transparent border-white rounded-full animate-spin" /> : <Sparkles className="w-4 h-4 text-white/90" />}
          </div>
        </motion.div>
      </div>
    </div>
  );
}