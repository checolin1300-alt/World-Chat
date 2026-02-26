import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MessageItem } from './MessageItem';
import { Send, Loader2, AlertCircle } from 'lucide-react';

export function ChatRoom() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        fetchMessages();

        // Subscribe to realtime messages
        const channel = supabase
            .channel('public:messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                },
                (payload) => {
                    fetchSingleMessage(payload.new.id);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async () => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select(`
          id,
          user_id,
          content,
          created_at,
          profiles (
            username,
            avatar_url
          )
        `)
                .order('created_at', { ascending: true })
                .limit(100);

            if (error) throw error;
            setMessages(data || []);
        } catch (err: any) {
            console.error('Error fetching messages:', err);
            setError('Could not load messages');
        } finally {
            setLoading(false);
        }
    };

    const fetchSingleMessage = async (messageId: string) => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select(`
          id,
          user_id,
          content,
          created_at,
          profiles (
            username,
            avatar_url
          )
        `)
                .eq('id', messageId)
                .single();

            if (error) throw error;

            setMessages((prev) => {
                // Prevent duplicates
                if (prev.find(m => m.id === data.id)) return prev;
                return [...prev, data];
            });
        } catch (err) {
            console.error('Error fetching new message:', err);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        setSending(true);
        try {
            const { error } = await supabase.from('messages').insert([
                {
                    user_id: user.id,
                    content: newMessage.trim(),
                },
            ]);

            if (error) throw error;
            setNewMessage('');
        } catch (err: any) {
            console.error('Error sending message:', err);
            setError('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">

            {error && (
                <div className="bg-red-50 dark:bg-red-900/30 p-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 border-b border-red-200 dark:border-red-900">
                    <AlertCircle size={16} />
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto underline">Dismiss</button>
                </div>
            )}

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-950">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-4">
                            <Send size={32} className="text-slate-300 dark:text-slate-600" />
                        </div>
                        <p className="text-lg font-medium">No messages yet</p>
                        <p className="text-sm mt-1">Be the first to say hello!</p>
                    </div>
                ) : (
                    messages.map((message) => (
                        <MessageItem
                            key={message.id}
                            message={message}
                            isOwnMessage={message.user_id === user?.id}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                <form onSubmit={handleSendMessage} className="relative flex items-center">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="w-full pl-5 pr-14 py-3.5 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 rounded-full text-slate-900 dark:text-white transition-all outline-none"
                        maxLength={500}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="absolute right-2 p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                    >
                        {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="translate-x-0.5" />}
                    </button>
                </form>
            </div>
        </div>
    );
}
