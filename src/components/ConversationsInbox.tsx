import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquare, Loader2, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ConversationsInboxProps {
    onSelectConversation: (conversationId: string, recipientProfile: any) => void;
    activeConversationId?: string | null;
}

export function ConversationsInbox({ onSelectConversation, activeConversationId }: ConversationsInboxProps) {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchConversations = useCallback(async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('conversations')
                .select(`
                    *,
                    participant1:participant1_id(id, username, avatar_url),
                    participant2:participant2_id(id, username, avatar_url),
                    direct_messages(content, created_at, is_read, sender_id)
                `)
                .or(`participant1_id.eq.${user.id},participant2_id.eq.${user.id}`)
                .order('last_message_at', { ascending: false });

            if (error) throw error;

            const formattedConversations = (data || []).map(conv => {
                const recipient = conv.participant1_id === user.id ? conv.participant2 : conv.participant1;
                const lastMsg = conv.direct_messages && conv.direct_messages.length > 0
                    ? conv.direct_messages.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
                    : null;

                const unreadCount = conv.direct_messages.filter((m: any) => !m.is_read && m.sender_id !== user.id).length;

                return {
                    ...conv,
                    recipient,
                    lastMessage: lastMsg,
                    unreadCount
                };
            });

            setConversations(formattedConversations);
        } catch (err) {
            console.error('Error fetching conversations:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchConversations();

        // Subscribe to changes in conversations and direct_messages
        const channel = supabase
            .channel('inbox-updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'conversations' },
                () => fetchConversations()
            )
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'direct_messages' },
                () => fetchConversations()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchConversations]);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-2">
                <MessageSquare size={20} className="text-blue-500" />
                <h2 className="font-bold text-slate-900 dark:text-white">Mensajes Directos</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {loading ? (
                    <div className="flex justify-center items-center h-20">
                        <Loader2 className="animate-spin h-5 w-5 text-blue-500" />
                    </div>
                ) : conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                        <MessageSquare size={32} className="text-slate-200 dark:text-slate-700 mb-2" />
                        <p className="text-slate-500 dark:text-slate-400 text-sm">No tienes conversaciones activas</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {conversations.map((conv) => (
                            <button
                                key={conv.id}
                                onClick={() => onSelectConversation(conv.id, conv.recipient)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${activeConversationId === conv.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                            >
                                <div className="relative">
                                    {conv.recipient.avatar_url ? (
                                        <img
                                            src={conv.recipient.avatar_url}
                                            alt={conv.recipient.username}
                                            className="h-12 w-12 rounded-full object-cover border-2 border-slate-100 dark:border-slate-800"
                                        />
                                    ) : (
                                        <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold border-2 border-slate-100 dark:border-slate-800">
                                            <User size={20} />
                                        </div>
                                    )}
                                    {conv.unreadCount > 0 && (
                                        <div className="absolute -top-1 -right-1 h-5 w-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm animate-bounce">
                                            {conv.unreadCount}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                            {conv.recipient.username}
                                        </p>
                                        {conv.lastMessage && (
                                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                                {formatDistanceToNow(new Date(conv.lastMessage.created_at), { addSuffix: false, locale: es })}
                                            </span>
                                        )}
                                    </div>
                                    <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {conv.lastMessage ? conv.lastMessage.content : 'Iniciaste una conversación'}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
