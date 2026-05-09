import { useState, useEffect } from 'react';
import { LoginView } from './views/LoginView';
import { OnboardingView } from './views/OnboardingView';
import { DashboardView } from './views/DashboardView';

export type ViewState = 'login' | 'onboarding' | 'dashboard';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('login');
  
  useEffect(() => {
    // Capturar token de Spotify desde la URL tras el callback de OAuth
    const params = new URLSearchParams(window.location.search);
    const token = params.get('spotifyToken');
    if (token) {
      localStorage.setItem('spotifyToken', token);
      window.history.replaceState({}, document.title, window.location.pathname);
      setCurrentView('onboarding'); // Asumimos que viene del onboarding
    }
  }, []);

  return (
    <div className="dark bg-[#121212] min-h-screen w-full flex font-sans text-white overflow-hidden relative">
      {/* Efecto sutil de gradiente global */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />
      
      {/* Contenedor fluido para ocupar toda la pantalla */}
      <div className="flex-1 w-full h-full relative z-10 flex">
          {currentView === 'login' && <LoginView onLogin={() => setCurrentView('onboarding')} />}
          {currentView === 'onboarding' && <OnboardingView onComplete={() => setCurrentView('dashboard')} />}
          {currentView === 'dashboard' && <DashboardView onLogout={() => setCurrentView('login')} />}
      </div>
    </div>
  );
}