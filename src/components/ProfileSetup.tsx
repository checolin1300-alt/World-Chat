import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Camera, Loader2, ArrowRight } from 'lucide-react';

export function ProfileSetup() {
    const { user, signOut, refreshProfile } = useAuth();
    const [username, setUsername] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setError(null);
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const MAX_SIZE = 2 * 1024 * 1024; // 2MB

            if (file.size > MAX_SIZE) {
                throw new Error('La imagen es demasiado grande. El tamaño máximo permitido es 2MB.');
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setAvatarUrl(data.publicUrl);
        } catch (err: any) {
            setError(err.message || 'Error uploading image');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: user.id,
                        username,
                        avatar_url: avatarUrl,
                        bio: bio.trim() || null,
                        theme_color: 'blue'
                    },
                ]);

            if (error) {
                if (error.code === '23505') {
                    throw new Error('This username is already taken. Please choose another one.');
                }
                throw error;
            }

            await refreshProfile();
        } catch (err: any) {
            setError(err.message || 'Error creating profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto mt-16 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Complete your profile</h2>
                <p className="text-slate-500 dark:text-slate-400">
                    Choose a username and an avatar to identify yourself in the chat
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-200 dark:border-red-800">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center">
                    <div className="relative mb-4 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className={`w-32 h-32 rounded-full border-4 border-slate-100 dark:border-slate-700 overflow-hidden flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-all ${uploading ? 'opacity-50' : 'group-hover:border-blue-400'}`}>
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar preview" className="w-full h-full object-cover" />
                            ) : (
                                <User size={48} className="text-slate-300 dark:text-slate-600" />
                            )}
                        </div>

                        <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 text-white rounded-full shadow-lg transform group-hover:scale-110 transition-transform">
                            {uploading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleAvatarUpload}
                            accept="image/png, image/jpeg, image/gif"
                            className="hidden"
                        />
                    </div>
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {uploading ? 'Uploading...' : 'Click to upload avatar (optional)'}
                    </span>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Username
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-slate-400 font-medium">@</span>
                        </div>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                            required
                            maxLength={20}
                            className="pl-8 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="choose_a_username"
                        />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">
                        Only letters, numbers, and underscores (max 20 characters)
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                        Biography / About you
                    </label>
                    <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        maxLength={160}
                        rows={3}
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                        placeholder="Tell the world something about yourself..."
                    />
                    <div className="mt-1 flex justify-end">
                        <span className="text-[10px] text-slate-400 font-mono">{bio.length}/160</span>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading || !username || uploading}
                    className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? (
                        <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                        <>
                            Start Chatting <ArrowRight size={18} />
                        </>
                    )}
                </button>

                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={() => signOut()}
                        className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-medium transition-colors"
                    >
                        ¿No eres tú? Cerrar Sesión
                    </button>
                </div>
            </form>
        </div>
    );
}
