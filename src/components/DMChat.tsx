import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Send, Loader2, AlertCircle, Image as ImageIcon, X, ArrowLeft } from 'lucide-react';
import { MessageItem } from './MessageItem';
import imageCompression from 'browser-image-compression';

interface DMChatProps {
    conversationId: string;
    recipientProfile: any;
    onBack: () => void;
}

export function DMChat({ conversationId, recipientProfile, onBack }: DMChatProps) {
    const { user, profile } = useAuth();
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    const fetchMessages = useCallback(async () => {
        if (!conversationId) return;

        try {
            const { data, error } = await supabase
                .from('direct_messages')
                .select(`
                    *,
                    profiles:sender_id (
                        id,
                        username,
                        avatar_url,
                        theme_color,
                        bio
                    )
                `)
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);

            // Mark messages as read
            await supabase
                .from('direct_messages')
                .update({ is_read: true })
                .eq('conversation_id', conversationId)
                .neq('sender_id', user?.id)
                .eq('is_read', false);

        } catch (err: any) {
            console.error('Error fetching DMs:', err);
            setError('Error al cargar mensajes');
        } finally {
            setLoading(false);
        }
    }, [conversationId, user?.id]);

    const fetchSingleMessage = useCallback(async (messageId: string) => {
        try {
            const { data, error } = await supabase
                .from('direct_messages')
                .select(`
                    *,
                    profiles:sender_id (
                        id,
                        username,
                        avatar_url,
                        theme_color,
                        bio
                    )
                `)
                .eq('id', messageId)
                .single();

            if (error) throw error;

            setMessages((prev) => {
                if (prev.find(m => m.id === data.id)) return prev;
                return [...prev, data];
            });
        } catch (err) {
            console.error('Error fetching new DM:', err);
        }
    }, []);

    useEffect(() => {
        fetchMessages();

        const channel = supabase
            .channel(`dm-${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'direct_messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    fetchSingleMessage(payload.new.id);

                    // Mark as read if it's from the other person
                    if (payload.new.sender_id !== user?.id) {
                        supabase
                            .from('direct_messages')
                            .update({ is_read: true })
                            .eq('id', payload.new.id)
                            .then();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, fetchMessages, user?.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || (!newMessage.trim() && !image)) return;

        setSending(true);
        setError(null);

        try {
            let imageUrl = null;

            if (image) {
                setUploadingImage(true);
                const fileExt = image.name.split('.').pop();
                const fileName = `${user.id}-${Math.random()}.${fileExt}`;
                const filePath = `${fileName}`;

                const options = {
                    maxSizeMB: 0.5,
                    maxWidthOrHeight: 800,
                    useWebWorker: true,
                };

                const compressedFile = await imageCompression(image, options);

                const { error: uploadError } = await supabase.storage
                    .from('chat-images')
                    .upload(filePath, compressedFile);

                if (uploadError) throw uploadError;

                const { data } = supabase.storage.from('chat-images').getPublicUrl(filePath);
                imageUrl = data.publicUrl;
                setUploadingImage(false);
            }

            const { error: sendError } = await supabase
                .from('direct_messages')
                .insert([
                    {
                        conversation_id: conversationId,
                        sender_id: user.id,
                        content: newMessage.trim(),
                        image_url: imageUrl,
                    },
                ]);

            if (sendError) throw sendError;

            setNewMessage('');
            setImage(null);
            setImagePreview(null);
        } catch (err: any) {
            console.error('Error sending DM:', err);
            setError('Error al enviar mensaje');
        } finally {
            setSending(false);
            setUploadingImage(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden relative">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-500" />
                </button>
                <div className="flex items-center gap-3">
                    {recipientProfile.avatar_url ? (
                        <img src={recipientProfile.avatar_url} alt={recipientProfile.username} className="h-10 w-10 rounded-full object-cover shadow-sm" />
                    ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                            {recipientProfile.username.substring(0, 2).toUpperCase()}
                        </div>
                    )}
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-white leading-tight">{recipientProfile.username}</h3>
                        <p className="text-[10px] text-green-500 font-medium">Chat Privado</p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                        <p className="text-slate-400 text-sm">Cargando chat...</p>
                    </div>
                ) : (
                    <>
                        {messages.length === 0 && (
                            <div className="text-center py-10">
                                <p className="text-slate-400 text-sm italic">Comienza una conversación con {recipientProfile.username}</p>
                            </div>
                        )}
                        {messages.map((msg) => (
                            <MessageItem
                                key={msg.id}
                                message={{
                                    ...msg,
                                    profiles: msg.sender_id === user?.id ? profile : recipientProfile
                                }}
                                isOwnMessage={msg.sender_id === user?.id}
                            />
                        ))}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-500 text-xs flex items-center gap-2 border-t border-red-100 dark:border-red-900/50">
                    <AlertCircle size={14} /> {error}
                </div>
            )}

            {/* Footer / Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                {imagePreview && (
                    <div className="mb-4 relative inline-block group">
                        <img src={imagePreview} alt="Preview" className="h-32 rounded-xl object-cover shadow-md border-2 border-white dark:border-slate-700" />
                        <button
                            type="button"
                            onClick={() => { setImage(null); setImagePreview(null); }}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={sending || uploadingImage}
                        className="p-3 text-slate-400 hover:text-blue-500 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50"
                    >
                        {uploadingImage ? <Loader2 className="animate-spin" size={20} /> : <ImageIcon size={20} />}
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                        accept="image/*"
                        className="hidden"
                    />
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje privado..."
                        disabled={sending}
                        className="flex-1 bg-white dark:bg-slate-900 border-none rounded-xl px-5 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                    />
                    <button
                        type="submit"
                        disabled={sending || (!newMessage.trim() && !image)}
                        className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-400 transition-all active:scale-95 shadow-md shadow-blue-500/20"
                    >
                        {sending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                    </button>
                </div>
            </form>
        </div>
    );
}
