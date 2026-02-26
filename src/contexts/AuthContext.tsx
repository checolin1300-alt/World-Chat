import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface Profile {
    id: string;
    username: string;
    avatar_url: string | null;
    created_at: string;
}

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    error: string | null;
    refreshProfile: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = async (userId: string) => {
        try {
            setError(null);
            const { data, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError) {
                // If it's a 'no rows found' error (PGRST116), it means the user just doesn't have a profile yet
                if (profileError.code === 'PGRST116') {
                    setProfile(null);
                } else {
                    console.error('Error fetching profile:', profileError.message);
                    setError(profileError.message);
                    setProfile(null);
                }
            } else {
                setProfile(data);
            }
        } catch (err: any) {
            console.error('Unexpected error fetching profile:', err);
            setError(err.message || 'Error inesperado al cargar el perfil');
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            setLoading(true);
            // Clear local states immediately for UI responsiveness
            setSession(null);
            setUser(null);
            setProfile(null);
            setError(null);

            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            setLoading(true);
            await fetchProfile(user.id);
        }
    };

    useEffect(() => {
        let mounted = true;

        // Start loading
        setLoading(true);

        const handleAuthEvent = async (event: string, session: Session | null) => {
            if (!mounted) return;

            console.log(`Auth event: ${event}`);
            const currentUser = session?.user ?? null;

            // Set session/user first
            setSession(session);
            setUser(currentUser);

            if (currentUser) {
                // If we have a user, we MUST have a profile before showing the app
                await fetchProfile(currentUser.id);
            } else {
                // No user, no profile
                setProfile(null);
                setLoading(false);
            }
        };

        // Get initial session and subscribe in one go
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            handleAuthEvent(event, session);
        });

        // Safety timeout (8s)
        const timeout = setTimeout(() => {
            if (mounted && loading) {
                console.warn('Auth hang detected, forcing loading=false');
                setLoading(false);
            }
        }, 8000);

        return () => {
            mounted = false;
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    return (
        <AuthContext.Provider value={{ session, user, profile, loading, error, refreshProfile, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
