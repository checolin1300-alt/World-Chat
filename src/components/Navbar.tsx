import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import { Moon, Sun, LogOut, MessageSquare, Settings } from 'lucide-react';

interface NavbarProps {
    onOpenSettings?: () => void;
}

export function Navbar({ onOpenSettings }: NavbarProps) {
    const { session, profile, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { unreadCount } = useNotifications();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 p-2 rounded-xl text-white relative">
                            <MessageSquare size={24} />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[10px] font-bold items-center justify-center">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                </span>
                            )}
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
                                    <button
                                        onClick={onOpenSettings}
                                        className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group"
                                    >
                                        {profile.avatar_url ? (
                                            <img
                                                src={profile.avatar_url}
                                                alt={profile.username}
                                                className="w-8 h-8 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700 group-hover:border-blue-500 transition-colors"
                                            />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                                                {profile.username.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="hidden sm:flex flex-col items-start leading-tight">
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                                {profile.username}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-medium flex items-center gap-0.5">
                                                <Settings size={10} /> Perfil
                                            </span>
                                        </div>
                                    </button>
                                )}
                                <button
                                    onClick={() => signOut()}
                                    className="p-2 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                    title="Cerrar Sesión"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
