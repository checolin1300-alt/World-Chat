import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MessageItem } from './MessageItem';
import { UserProfileModal } from './UserProfileModal';
import { OnlineUsers } from './OnlineUsers';
import { DMChat } from './DMChat';
import { ConversationsInbox } from './ConversationsInbox';
import { Send, Loader2, AlertCircle, Image as ImageIcon, X, Users, MessageSquare } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import clsx from 'clsx';

import { useNotifications } from '../contexts/NotificationContext';

export function ChatRoom() {
    const { user, profile } = useAuth();
    const { requestPermission, clearUnreadForConversation } = useNotifications();
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        requestPermission();
    }, [requestPermission]);
    const [imageUploading, setImageUploading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewedProfile, setViewedProfile] = useState<any>(null);
    const [showOnlineUsers, setShowOnlineUsers] = useState(false);
    const [activeTab, setActiveTab] = useState<'global' | 'dms'>('global');
    const [activeDM, setActiveDM] = useState<{ id: string; recipient: any } | null>(null);

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
            theme_color,
            bio
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
            theme_color,
            bio
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

            // Image Compression
            const options = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 800,
                useWebWorker: true,
            };

            const compressedFile = await imageCompression(file, options);

            const { error: uploadError } = await supabase.storage
                .from('chat-images')
                .upload(filePath, compressedFile);

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

    const handleSelectUser = async (targetUserId: string, targetProfile: any) => {
        if (!user) return;

        try {
            // Sort participants to match the DB storage logic (always participant1 < participant2)
            const participants = [user.id, targetUserId].sort();

            // Check if conversation already exists using the sorted pair
            const { data: convs, error: convError } = await supabase
                .from('conversations')
                .select('id')
                .eq('participant1_id', participants[0])
                .eq('participant2_id', participants[1])
                .maybeSingle();

            if (convError) throw convError;

            let conversationId;
            if (convs) {
                conversationId = convs.id;
            } else {
                // Create new conversation using already sorted participants
                const { data: newConv, error: createError } = await supabase
                    .from('conversations')
                    .insert([{
                        participant1_id: participants[0],
                        participant2_id: participants[1]
                    }])
                    .select()
                    .single();

                if (createError) throw createError;
                conversationId = newConv.id;
            }

            setActiveDM({ id: conversationId, recipient: targetProfile });
            setActiveTab('dms');
            clearUnreadForConversation(conversationId);
            setShowOnlineUsers(false);
        } catch (err) {
            console.error('Error opening DM:', err);
            setError('No se pudo abrir el chat privado');
        }
    };

    const handleSelectConversation = (conversation: any) => {
        setActiveDM(conversation);
        setActiveTab('dms');
        clearUnreadForConversation(conversation.id);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-10rem)]">
            {/* Mobile Online Users Toggle */}
            <div className="lg:hidden flex justify-end mb-2">
                <button
                    onClick={() => setShowOnlineUsers(!showOnlineUsers)}
                    className={clsx(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm border",
                        showOnlineUsers
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                    )}
                >
                    <Users size={18} />
                    {showOnlineUsers ? 'Ocultar Online' : 'Ver Online'}
                </button>
            </div>

            {/* Online Users Sidebar (Mobile Overlay/Collapsible) */}
            <div className={clsx(
                "lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300",
                showOnlineUsers ? "opacity-100" : "opacity-0 pointer-events-none"
            )} onClick={() => setShowOnlineUsers(false)}>
                <div
                    className={clsx(
                        "absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 ease-out",
                        showOnlineUsers ? "translate-x-0" : "translate-x-full"
                    )}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="p-4 flex justify-between items-center border-b dark:border-slate-800">
                        <h3 className="font-bold">Usuarios en línea</h3>
                        <button onClick={() => setShowOnlineUsers(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="h-[calc(100vh-4rem)]">
                        <OnlineUsers onSelectUser={handleSelectUser} />
                    </div>
                </div>
            </div>

            {/* Sidebar Left: Conversations Inbox (Desktop) */}
            <div className="hidden lg:block w-72 h-full flex-shrink-0">
                <div className="flex flex-col h-full gap-4">
                    <button
                        onClick={() => setActiveTab('global')}
                        className={clsx(
                            "w-full flex items-center justify-center gap-2 p-4 rounded-2xl font-bold transition-all shadow-md",
                            activeTab === 'global'
                                ? "bg-blue-600 text-white shadow-blue-500/20"
                                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 border border-slate-200 dark:border-slate-800"
                        )}
                    >
                        <Users size={20} /> Chat Global
                    </button>
                    <div className="flex-1 min-h-0">
                        <ConversationsInbox
                            onSelectConversation={(id, recipient) => {
                                handleSelectConversation({ id, recipient });
                                setActiveTab('dms');
                            }}
                            activeConversationId={activeTab === 'dms' ? activeDM?.id : null}
                        />
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full">
                {activeTab === 'global' ? (
                    <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden min-w-0">
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
                                        onAvatarClick={(profile) => setViewedProfile(profile)}
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
                ) : (
                    <div className="flex-1">
                        {activeDM ? (
                            <DMChat
                                conversationId={activeDM.id}
                                recipientProfile={activeDM.recipient}
                                onBack={() => setActiveTab('global')}
                            />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                                <MessageSquare size={48} className="text-slate-200 dark:text-slate-700 mb-4" />
                                <p className="text-slate-500">Selecciona una conversación para empezar</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Desktop Sidebar Right: Online Users */}
            <div className="hidden xl:block w-72 h-full flex-shrink-0">
                <OnlineUsers onSelectUser={handleSelectUser} />
            </div>

            {viewedProfile && (
                <UserProfileModal
                    profile={viewedProfile}
                    onClose={() => setViewedProfile(null)}
                    onSendMessage={(userId, profile) => {
                        handleSelectUser(userId, profile);
                        setViewedProfile(null);
                    }}
                />
            )}
        </div>
    );
}
