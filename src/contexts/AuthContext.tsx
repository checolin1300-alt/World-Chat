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
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setProfile(null);
        } catch (error) {
            console.error('Error signing out:', error);
        } finally {
            setLoading(false);
        }
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    useEffect(() => {
        let mounted = true;

        // Safety timeout to prevent infinite loading screen (8s)
        const safetyTimeout = setTimeout(() => {
            if (mounted && loading) {
                console.warn('Auth initialization taking too long, forcing loading=false');
                setLoading(false);
            }
        }, 8000);

        const initializeAuth = async () => {
            try {
                console.log('Iniciando verificación de sesión...');
                const { data: { session: initialSession }, error } = await supabase.auth.getSession();
                if (error) throw error;

                if (mounted) {
                    setSession(initialSession);
                    setUser(initialSession?.user ?? null);

                    if (initialSession?.user) {
                        console.log('Sesión encontrada, obteniendo perfil...');
                        await fetchProfile(initialSession.user.id);
                    } else {
                        console.log('No hay sesión activa.');
                        setProfile(null);
                        setLoading(false);
                    }
                }
            } catch (error) {
                console.error('Error durante la inicialización de auth:', error);
                if (mounted) {
                    setProfile(null);
                    setLoading(false);
                }
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, newSession) => {
                if (!mounted) return;

                setSession(newSession);
                setUser(newSession?.user ?? null);

                // Ignore INITIAL_SESSION to avoid duplicate fetches on boot
                if (_event !== 'INITIAL_SESSION') {
                    if (newSession?.user) {
                        await fetchProfile(newSession.user.id);
                    } else {
                        setProfile(null);
                        setLoading(false);
                    }
                }
            }
        );

        return () => {
            mounted = false;
            clearTimeout(safetyTimeout);
            subscription.unsubscribe();
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
