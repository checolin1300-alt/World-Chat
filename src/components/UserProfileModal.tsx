import { X, User, Calendar, MessageSquare, Palette, Info } from 'lucide-react';
import clsx from 'clsx';

interface UserProfileModalProps {
    profile: {
        username: string;
        avatar_url: string | null;
        bio: string | null;
        theme_color: string | null;
        created_at?: string;
    };
    onClose: () => void;
}

export function UserProfileModal({ profile, onClose }: UserProfileModalProps) {
    const themeColor = profile.theme_color || 'blue';

    const getThemeClasses = (color: string) => {
        switch (color) {
            case 'green': return 'from-emerald-600 to-emerald-400 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
            case 'pink': return 'from-pink-500 to-rose-400 text-pink-500 bg-pink-50 dark:bg-pink-900/20';
            case 'red': return 'from-red-600 to-orange-500 text-red-600 bg-red-50 dark:bg-red-900/20';
            case 'blue':
            default: return 'from-blue-600 to-indigo-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20';
        }
    };

    const themeStyles = getThemeClasses(themeColor);
    const [gradient, textColor, bgColor] = themeStyles.split(' ');

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-sm bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header/Banner */}
                <div className={clsx("h-24 bg-gradient-to-r", gradient)} />

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors z-10"
                >
                    <X size={20} />
                </button>

                {/* Profile Info */}
                <div className="px-6 pb-8 -mt-12 overflow-y-auto max-h-[70vh]">
                    <div className="flex flex-col items-center text-center">
                        {/* Avatar */}
                        <div className="relative mb-4">
                            <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-lg">
                                {profile.avatar_url ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt={profile.username}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500">
                                        <User size={40} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Name & Badge */}
                        <div className="mb-2">
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 justify-center">
                                @{profile.username}
                            </h3>
                            <div className={clsx("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-2", bgColor, textColor)}>
                                <Palette size={12} /> Tema {themeColor.charAt(0).toUpperCase() + themeColor.slice(1)}
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="w-full mt-6 text-left">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                                <Info size={14} /> Sobre mí
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap italic">
                                {profile.bio || "Este usuario prefiere mantener el misterio... No hay biografía disponible."}
                            </div>
                        </div>

                        {/* Social/Stats Placeholder */}
                        <div className="w-full mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-center gap-8">
                            <div className="text-center">
                                <div className="text-xl font-bold text-slate-900 dark:text-white">
                                    <MessageSquare size={18} className="mx-auto text-slate-400" />
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Mensajear</div>
                            </div>
                            <div className="text-center">
                                <div className="text-xl font-bold text-slate-900 dark:text-white">
                                    <Calendar size={18} className="mx-auto text-slate-400" />
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Miembro</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
