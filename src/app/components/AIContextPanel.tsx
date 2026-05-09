import { Brain, Calendar, ListTodo, Music, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';

export function AIContextPanel() {
  const integrations = [
    { name: 'Google Calendar', icon: Calendar, active: true },
    { name: 'Todoist', icon: ListTodo, active: true },
    { name: 'Spotify', icon: Music, active: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="w-80 h-full flex flex-col rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 p-5 shadow-2xl"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/5">
            <Brain className="w-4 h-4 text-white/90" />
          </div>
          <div>
            <h3 className="text-white text-sm font-medium">Contexto Activo</h3>
            <p className="text-white/40 text-xs">Ajustando métricas</p>
          </div>
        </div>
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors cursor-pointer group">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white/90 text-sm truncate">Sprint Planning</p>
              <p className="text-white/40 text-xs truncate">En 45 minutos</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors cursor-pointer group">
          <div className="flex items-center gap-3">
            <ListTodo className="w-4 h-4 text-violet-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white/90 text-sm truncate">Revisión de código</p>
              <p className="text-white/40 text-xs truncate">Prioridad Alta</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <div className="flex items-center gap-3">
            <Music className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white/90 text-sm truncate">Adaptación musical</p>
              <p className="text-cyan-400/80 text-xs truncate">Lo-Fi Focus • 80 BPM</p>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-white/10">
        <div className="flex items-center gap-4">
          {integrations.map((integration) => (
            <div
              key={integration.name}
              className={`flex flex-col items-center gap-1 flex-1`}
              title={integration.name}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                integration.active 
                  ? 'bg-white/10 border-white/20 text-white' 
                  : 'bg-white/5 border-transparent text-white/40'
              }`}>
                <integration.icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] text-white/40 truncate w-full text-center">
                {integration.name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
