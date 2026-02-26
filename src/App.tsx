import { useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Auth } from './components/Auth';
import { ProfileSetup } from './components/ProfileSetup';
import { ChatRoom } from './components/ChatRoom';
import { isConfigured } from './lib/supabase';
import { AlertCircle } from 'lucide-react';

function App() {
  const { session, profile, loading } = useAuth();

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="text-slate-500 animate-pulse font-medium">Iniciando sesión segura...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 pb-20 pt-16 transition-colors duration-200">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {!session ? (
          <Auth />
        ) : !profile ? (
          <ProfileSetup />
        ) : (
          <ChatRoom />
        )}
      </main>
    </div>
  );
}

export default App;
