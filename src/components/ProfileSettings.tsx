import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Camera, Loader2, Check, X, Palette, UserCircle, AlignLeft } from 'lucide-react';
import imageCompression from 'browser-image-compression';

interface ProfileSettingsProps {
    onClose: () => void;
}

const THEME_OPTIONS = [
    { id: 'green', name: 'Esmeralda', color: 'bg-emerald-600', dark: 'dark:bg-emerald-500' },
    { id: 'blue', name: 'Océano', color: 'bg-blue-600', dark: 'dark:bg-blue-500' },
    { id: 'pink', name: 'Rosa Pastel', color: 'bg-pink-500', dark: 'dark:bg-pink-400' },
    { id: 'red', name: 'Pasión', color: 'bg-red-600', dark: 'dark:bg-red-500' },
];

export function ProfileSettings({ onClose }: ProfileSettingsProps) {
    const { profile, user, updateProfile } = useAuth();
    const [username, setUsername] = useState(profile?.username || '');
    const [bio, setBio] = useState(profile?.bio || '');
    const [themeColor, setThemeColor] = useState(profile?.theme_color || 'blue');
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null);

    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setError(null);
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) return;

            const file = event.target.files[0];
            const MAX_SIZE = 2 * 1024 * 1024; // 2MB

            if (file.size > MAX_SIZE) {
                throw new Error('La imagen es demasiado grande. El tamaño máximo permitido es 2MB.');
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Image Compression
            const options = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 800,
                useWebWorker: true,
            };

            const compressedFile = await imageCompression(file, options);

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, compressedFile);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setAvatarUrl(data.publicUrl);
        } catch (err: any) {
            setError(err.message || 'Error al subir la imagen');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(false);

        const { error: updateError } = await updateProfile({
            username,
            bio,
            theme_color: themeColor,
            avatar_url: avatarUrl
        });

        if (updateError) {
            setError(typeof updateError === 'string' ? updateError : (updateError as any).message || 'Error al actualizar perfil');
        } else {
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <UserCircle className="text-blue-500" /> Mi Perfil
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto max-h-[80vh] space-y-8">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-800">
                            {error}
                        </div>
                    )}

                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-28 h-28 rounded-full border-4 border-white dark:border-slate-700 shadow-xl overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center transition-transform group-hover:scale-105">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={40} className="text-slate-300 dark:text-slate-600" />
                                )}
                                {uploading && (
                                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                                        <Loader2 className="animate-spin text-white" />
                                    </div>
                                )}
                            </div>
                            <div className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full text-white shadow-lg border-2 border-white dark:border-slate-800">
                                <Camera size={14} />
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarUpload}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                        <p className="mt-2 text-xs font-medium text-slate-500">Haz clic para cambiar foto</p>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <span className="text-blue-500 ring-1 ring-blue-500/20 rounded-md p-1">@</span> Nombre de Usuario
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                                placeholder="tu_usuario"
                                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl px-5 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <AlignLeft size={16} className="text-blue-500" /> Bio / Descripción
                            </label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Escribe algo sobre ti..."
                                rows={3}
                                maxLength={160}
                                className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-2xl px-5 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all font-medium resize-none"
                            />
                            <div className="text-[10px] text-right text-slate-500 font-mono">
                                {bio.length}/160
                            </div>
                        </div>

                        {/* Theme Selection */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <Palette size={16} className="text-blue-500" /> Color de Tema
                            </label>
                            <div className="grid grid-cols-4 gap-3">
                                {THEME_OPTIONS.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => setThemeColor(option.id)}
                                        className={`relative h-12 rounded-xl transition-all ${option.color} ${option.dark} shadow-md border-4 ${themeColor === option.id ? 'border-white dark:border-slate-400 scale-105 ring-2 ring-blue-500/50' : 'border-transparent opacity-70 hover:opacity-100'}`}
                                        title={option.name}
                                    >
                                        {themeColor === option.id && (
                                            <div className="absolute inset-0 flex items-center justify-center text-white">
                                                <Check size={20} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-2xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || uploading}
                        className={`flex-1 py-3 px-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${success ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400'}`}
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : success ? <><Check size={20} /> Guardado</> : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
}
