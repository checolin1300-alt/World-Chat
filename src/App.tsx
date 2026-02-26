import { useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Auth } from './components/Auth';
import { ProfileSetup } from './components/ProfileSetup';
import { ChatRoom } from './components/ChatRoom';
import { UpdatePassword } from './components/UpdatePassword';
import { ProfileSettings } from './components/ProfileSettings';
import { isConfigured } from './lib/supabase';
import { AlertCircle } from 'lucide-react';
import React from 'react';

function App() {
  const { session, profile, loading, error, isPasswordRecovery, signOut, refreshProfile } = useAuth();
  const [showReset, setShowReset] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  React.useEffect(() => {
    let timer: number;
    if (loading) {
      timer = window.setTimeout(() => setShowReset(true), 3000);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl border border-red-100 dark:border-red-900/30 max-w-md w-full text-center">
          <div className="h-20 w-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3">Configuración Requerida</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            Parece que faltan las <strong>Variables de Entorno</strong> de Supabase en tu proyecto.
            Sin estas credenciales, la aplicación no puede conectarse a la base de datos.
          </p>
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-left text-xs font-mono text-slate-500 overflow-x-auto whitespace-nowrap">
              VITE_SUPABASE_URL<br />
              VITE_SUPABASE_ANON_KEY
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
        <div className="flex flex-col items-center gap-6 max-w-sm w-full text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 bg-blue-500/10 rounded-full animate-pulse"></div>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Iniciando World Chat</h2>
            <p className="text-slate-500 dark:text-slate-400 animate-pulse font-medium">Verificando tu sesión segura...</p>
          </div>

          {showReset && (
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <p className="text-sm text-amber-700 dark:text-amber-400 mb-4">
                ¿Sigue cargando? Tu navegador podría tener una sesión antigua trabada.
              </p>
              <button
                type="button"
                onClick={() => {
                  console.log('Botón de Reset pulsado');
                  // Nuclear Reset: Clear all possible storage immediately
                  localStorage.clear();
                  sessionStorage.clear();

                  // Specific cleanup
                  try {
                    for (let i = 0; i < localStorage.length; i++) {
                      const key = localStorage.key(i);
                      if (key?.includes('supabase')) localStorage.removeItem(key);
                    }
                  } catch (e) { }

                  window.location.href = '/';
                }}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
              >
                🔴 Resetear Aplicación Ahora
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main rendering logic
  const renderContent = () => {
    if (isPasswordRecovery) {
      return <UpdatePassword />;
    }

    if (!session) {
      return <Auth />;
    }

    // If we have a session but there was an error fetching the profile
    if (error) {
      return (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 max-w-md w-full text-center mx-auto">
          <div className="h-16 w-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600 dark:text-red-400">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Error de conexión</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            No pudimos cargar tus datos de perfil. Esto puede ser un problema temporal de red.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => refreshProfile()}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all"
            >
              Reintentar Carga
            </button>
            <button
              onClick={() => signOut()}
              className="w-full py-3 px-4 bg-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition-all"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      );
    }

    // If we have a session and NO profile was found (and no error)
    if (!profile) {
      return <ProfileSetup />;
    }

    // Everything is good
    return <ChatRoom />;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 pb-20 pt-16 transition-colors duration-200">
      <Navbar onOpenSettings={() => setIsSettingsOpen(true)} />
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {renderContent()}
      </main>

      {isSettingsOpen && <ProfileSettings onClose={() => setIsSettingsOpen(false)} />}
    </div>
  );
}

export default App;
