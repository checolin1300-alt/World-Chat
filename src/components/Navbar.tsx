import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun, LogOut, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function Navbar() {
    const { session, profile } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-2 rounded-xl text-white">
                            <MessageSquare size={24} />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
                            WorldChat
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        {session && (
                            <div className="flex items-center gap-4">
                                {profile && (
                                    <div className="hidden sm:flex items-center gap-2">
                                        {profile.avatar_url ? (
                                            <img
                                                src={profile.avatar_url}
                                                alt={profile.username}
                                                className="w-8 h-8 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold">
                                                {profile.username.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                            {profile.username}
                                        </span>
                                    </div>
                                )}
                                <button
                                    onClick={handleSignOut}
                                    className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                >
                                    <LogOut size={18} />
                                    <span className="hidden sm:inline">Sign Out</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
