import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Users, Loader2 } from 'lucide-react';

interface PresenceState {
    user_id: string;
    username: string;
    avatar_url: string | null;
    online_at: string;
}

export function OnlineUsers() {
    const { user, profile } = useAuth();
    const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || !profile) return;

        const channel = supabase.channel('online-users', {
            config: {
                presence: {
                    key: user.id,
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const newState = channel.presenceState();
                const users = Object.values(newState).flat() as any as PresenceState[];

                // Filter unique users by id to avoid duplicates if a user has multiple tabs open
                const uniqueUsers = users.reduce((acc: PresenceState[], current) => {
                    const x = acc.find(item => item.user_id === current.user_id);
                    if (!x) {
                        return acc.concat([current]);
                    } else {
                        return acc;
                    }
                }, []);

                setOnlineUsers(uniqueUsers);
                setLoading(false);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log('join', key, newPresences);
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                console.log('leave', key, leftPresences);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        user_id: user.id,
                        username: profile.username,
                        avatar_url: profile.avatar_url,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, profile]);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
                <Users size={20} className="text-blue-500" />
                <h2 className="font-bold text-slate-900 dark:text-white">Usuarios Online</h2>
                <span className="ml-auto px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-full">
                    {onlineUsers.length}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {loading ? (
                    <div className="flex justify-center items-center h-20">
                        <Loader2 className="animate-spin h-5 w-5 text-blue-500" />
                    </div>
                ) : onlineUsers.length === 0 ? (
                    <p className="text-center text-slate-500 dark:text-slate-400 py-4 text-sm">No hay nadie más...</p>
                ) : (
                    <div className="space-y-1">
                        {onlineUsers.map((onlineUser) => (
                            <div
                                key={onlineUser.user_id}
                                className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                            >
                                <div className="relative">
                                    {onlineUser.avatar_url ? (
                                        <img
                                            src={onlineUser.avatar_url}
                                            alt={onlineUser.username}
                                            className="h-10 w-10 rounded-full object-cover border-2 border-slate-100 dark:border-slate-800 group-hover:border-blue-500/30 transition-colors"
                                        />
                                    ) : (
                                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold border-2 border-slate-100 dark:border-slate-800">
                                            {onlineUser.username.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                                        {onlineUser.username}
                                        {onlineUser.user_id === user?.id && (
                                            <span className="ml-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">(Tú)</span>
                                        )}
                                    </p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                        En línea
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
