import { useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Auth } from './components/Auth';
import { ProfileSetup } from './components/ProfileSetup';
import { ChatRoom } from './components/ChatRoom';

function App() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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
