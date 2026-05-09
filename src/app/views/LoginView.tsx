import { useState } from 'react';
import { Sparkles, Mail, Lock } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

interface LoginViewProps {
  onLogin: () => void;
}

export function LoginView({ onLogin }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const isValid = email.length > 3 && password.length > 3;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) onLogin();
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await res.json();
        // Save google profile to localStorage
        localStorage.setItem('googleProfile', JSON.stringify(userInfo));
        onLogin();
      } catch (err) {
        console.error('Failed to fetch Google profile', err);
      }
    },
    onError: errorResponse => console.error(errorResponse),
  });

  return (
    <div className="flex w-full h-screen animate-in fade-in duration-500">
      
      {/* Left Panel: Graphic & Brand */}
      <div className="hidden lg:flex flex-col flex-1 bg-[#1A1A1A] relative overflow-hidden items-center justify-center p-12 border-r border-[#27272A]">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-[100px]" />
        
        <div className="relative z-10 text-center max-w-lg">
          <div className="w-24 h-24 mx-auto rounded-[2rem] bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center mb-8 shadow-[0_0_60px_rgba(34,211,238,0.3)]">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight text-white mb-6">El soundtrack perfecto para cada contexto.</h1>
          <p className="text-[#A1A1AA] text-lg">AuraBeat usa IA para entender tu calendario y generar listas de reproducción que potencian tu enfoque, tu relajación o tu energía en tiempo real.</p>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#121212]">
        <div className="w-full max-w-[400px]">
          
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white">Bienvenido de vuelta</h2>
            <p className="text-[#71717A] mt-2">Inicia sesión en tu cuenta de AuraBeat</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="relative">
                 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717A]" />
                 <input 
                   type="email" 
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   placeholder="Correo electrónico" 
                   className="w-full bg-[#1E1E1E] border border-[#27272A] rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-[#71717A] focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                 />
              </div>
              <div className="relative">
                 <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#71717A]" />
                 <input 
                   type="password"
                   value={password}
                   onChange={(e) => setPassword(e.target.value)}
                   placeholder="Contraseña" 
                   className="w-full bg-[#1E1E1E] border border-[#27272A] rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-[#71717A] focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                 />
              </div>
            </div>

            <button 
              type="submit"
              disabled={!isValid}
              className="w-full bg-white text-black font-semibold py-3.5 rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_14px_0_rgba(255,255,255,0.1)]"
            >
              Iniciar Sesión
            </button>
          </form>

          <div className="flex items-center gap-4 py-8">
             <div className="h-px bg-[#27272A] flex-1"></div>
             <span className="text-xs text-[#71717A] uppercase tracking-wider font-medium">O continúa con</span>
             <div className="h-px bg-[#27272A] flex-1"></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <button onClick={() => loginWithGoogle()} className="flex items-center justify-center gap-2 bg-[#1E1E1E] border border-[#27272A] hover:bg-[#27272A] transition-colors py-3 rounded-xl text-sm font-medium">
               Google
             </button>
             <button onClick={onLogin} className="flex items-center justify-center gap-2 bg-[#1E1E1E] border border-[#27272A] hover:bg-[#27272A] transition-colors py-3 rounded-xl text-sm font-medium opacity-50 cursor-not-allowed">
               Apple
             </button>
          </div>

          <p className="text-center text-[#71717A] text-sm mt-10">
            ¿No tienes cuenta? <span className="text-white font-medium cursor-pointer hover:underline">Regístrate</span>
          </p>

        </div>
      </div>
    </div>
  );
}
