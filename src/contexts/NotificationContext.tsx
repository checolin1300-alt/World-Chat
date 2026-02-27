import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { messaging } from '../lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';

interface NotificationContextType {
    unreadCount: number;
    requestPermission: () => Promise<void>;
    clearUnreadForConversation: (conversationId: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchUnreadCount = useCallback(async () => {
        if (!user) return;

        // Sum unread messages from all conversations where current user is NOT the sender
        const { data, error } = await supabase
            .from('direct_messages')
            .select('id', { count: 'exact' })
            .neq('sender_id', user.id)
            .eq('is_read', false);

        if (!error) {
            setUnreadCount(data?.length || 0);
        }
    }, [user]);

    const requestPermission = async () => {
        if (!('Notification' in window)) return;

        const permission = await Notification.requestPermission();
        if (permission === 'granted' && messaging && user) {
            try {
                const token = await getToken(messaging, {
                    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
                });

                if (token) {
                    await supabase
                        .from('user_tokens')
                        .upsert([{ user_id: user.id, token, platform: 'web' }], { onConflict: 'token' });
                }
            } catch (err) {
                console.error('Error getting FCM token:', err);
            }
        }
    };

    const spawnBrowserNotification = useCallback((message: any) => {
        if (document.visibilityState === 'visible') return;

        // We'd ideally fetch the sender profile here or pass it in
        const notification = new Notification('Nuevo mensaje', {
            body: message.content || 'Te enviaron una imagen',
            icon: '/icon-192.png'
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }, []);

    useEffect(() => {
        if (!user) {
            setUnreadCount(0);
            return;
        }

        fetchUnreadCount();

        // Subscribe to NEW direct messages to update count and show browser notifications
        const channel = supabase
            .channel('global-dm-notifications')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'direct_messages' },
                (payload) => {
                    if (payload.new.sender_id !== user.id) {
                        setUnreadCount(prev => prev + 1);
                        spawnBrowserNotification(payload.new);
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'direct_messages' },
                () => fetchUnreadCount() // Refresh count if messages are marked as read elsewhere
            )
            .subscribe();

        // Foreground FCM messages
        let unsubscribeFCM: (() => void) | undefined;
        if (messaging) {
            unsubscribeFCM = onMessage(messaging, (payload) => {
                console.log('Message received in foreground: ', payload);
                // The badge will naturally update via the Supabase subscription above
            });
        }

        return () => {
            supabase.removeChannel(channel);
            if (unsubscribeFCM) unsubscribeFCM();
        };
    }, [user, fetchUnreadCount, spawnBrowserNotification]);

    const clearUnreadForConversation = (conversationId: string) => {
        // We know messages in this conversation were likely marked as read in the DB.
        // We refresh the global count to keep it in sync.
        console.log(`Clearing notifications for conversation: ${conversationId}`);
        fetchUnreadCount();
    };

    return (
        <NotificationContext.Provider value={{ unreadCount, requestPermission, clearUnreadForConversation }}>
            {children}
        </NotificationContext.Provider>
    );
}

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
