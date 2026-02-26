import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MessageItem } from './MessageItem';
import { Send, Loader2, AlertCircle, Image as ImageIcon, X } from 'lucide-react';
import clsx from 'clsx';

export function ChatRoom() {
    const { user, profile } = useAuth();
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [imageUploading, setImageUploading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const getThemeAccent = () => {
        const color = profile?.theme_color || 'blue';
        switch (color) {
            case 'green': return 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500';
            case 'pink': return 'bg-pink-500 hover:bg-pink-600 focus:ring-pink-400';
            case 'red': return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
            case 'blue':
            default: return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
        }
    };

    const getThemeText = () => {
        const color = profile?.theme_color || 'blue';
        switch (color) {
            case 'green': return 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20';
            case 'pink': return 'text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20';
            case 'red': return 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20';
            case 'blue':
            default: return 'text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20';
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const fetchMessages = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select(`
          id,
          user_id,
          content,
          image_url,
          created_at,
          profiles (
            username,
            avatar_url,
            theme_color
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
    }, [setMessages, setError, setLoading]);

    const fetchSingleMessage = useCallback(async (messageId: string) => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select(`
          id,
          user_id,
          content,
          image_url,
          created_at,
          profiles (
            username,
            avatar_url,
            theme_color
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
    }, [setMessages]);

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
    }, [fetchMessages, fetchSingleMessage]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        try {
            setImageUploading(true);
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('chat-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('chat-images').getPublicUrl(filePath);
            setSelectedImage(data.publicUrl);
        } catch (err) {
            console.error('Error uploading chat image:', err);
        } finally {
            setImageUploading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedImage) || !user || sending) return;

        setSending(true);
        try {
            const { error } = await supabase.from('messages').insert([
                {
                    user_id: user.id,
                    content: newMessage.trim() || null,
                    image_url: selectedImage,
                },
            ]);

            if (error) throw error;
            setNewMessage('');
            setSelectedImage(null);
        } catch (err: any) {
            console.error('Error sending message:', err);
            setError('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

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
                {selectedImage && (
                    <div className="mb-3 relative inline-block animate-in slide-in-from-bottom-2 duration-200">
                        <img src={selectedImage} alt="Selected" className="h-20 w-auto rounded-xl shadow-md border-2 border-blue-500" />
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={imageUploading || sending}
                        className={clsx(
                            "p-2 rounded-full transition-all disabled:opacity-50",
                            getThemeText()
                        )}
                        title="Adjuntar imagen"
                    >
                        {imageUploading ? <Loader2 size={24} className="animate-spin" /> : <ImageIcon size={24} />}
                    </button>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                    />

                    <div className="relative flex-1 flex items-center">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder={selectedImage ? "Añade un mensaje..." : "Escribe tu mensaje..."}
                            className="w-full pl-5 pr-14 py-3.5 bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 rounded-full text-slate-900 dark:text-white transition-all outline-none"
                            maxLength={500}
                        />
                        <button
                            type="submit"
                            disabled={(!newMessage.trim() && !selectedImage) || sending || imageUploading}
                            className={clsx(
                                "absolute right-2 p-2.5 text-white rounded-full disabled:opacity-50 disabled:bg-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all",
                                getThemeAccent()
                            )}
                        >
                            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="translate-x-0.5" />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
