import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

interface Message {
    id: string;
    user_id: string;
    content: string | null;
    image_url: string | null;
    created_at: string;
    profiles: {
        username: string;
        avatar_url: string | null;
        theme_color: string | null;
        bio: string | null;
    };
}

interface MessageItemProps {
    message: Message;
    isOwnMessage: boolean;
    onAvatarClick?: (profile: Message['profiles']) => void;
}

export const MessageItem = React.memo(({ message, isOwnMessage, onAvatarClick }: MessageItemProps) => {
    const { content, image_url, created_at, profiles } = message;

    const username = profiles?.username || 'Usuario';
    const avatarUrl = profiles?.avatar_url;
    const themeColor = profiles?.theme_color || 'blue';

    const getThemeClasses = (color: string) => {
        switch (color) {
            case 'green': return 'bg-emerald-600';
            case 'pink': return 'bg-pink-500';
            case 'red': return 'bg-red-600';
            case 'blue':
            default: return 'bg-blue-600';
        }
    };

    return (
        <div className={clsx('flex gap-3 mb-4 max-w-[85%]', isOwnMessage ? 'ml-auto flex-row-reverse' : '')}>
            <button
                onClick={() => onAvatarClick?.(profiles)}
                className="flex-shrink-0 focus:outline-none group/avatar transition-transform active:scale-95"
                aria-label={`View ${username}'s profile`}
            >
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={username}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm group-hover/avatar:border-blue-500 transition-colors"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-bold shadow-sm group-hover/avatar:opacity-80 transition-opacity">
                        {username.charAt(0).toUpperCase()}
                    </div>
                )}
            </button>

            <div className={clsx('flex flex-col', isOwnMessage ? 'items-end' : 'items-start')}>
                <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm flex font-medium text-slate-700 dark:text-slate-300">
                        {username}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {formatDistanceToNow(new Date(created_at), { addSuffix: true })}
                    </span>
                </div>

                <div
                    className={clsx(
                        'px-4 py-2.5 rounded-2xl shadow-sm leading-relaxed break-words overflow-hidden',
                        isOwnMessage
                            ? `${getThemeClasses(themeColor)} text-white rounded-tr-sm`
                            : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white rounded-tl-sm'
                    )}
                >
                    {image_url && (
                        <div className="mb-2 -mx-1">
                            <img
                                src={image_url}
                                alt="Shared"
                                className="max-w-full rounded-lg shadow-sm cursor-pointer hover:opacity-95 transition-opacity"
                                onClick={() => window.open(image_url, '_blank')}
                            />
                        </div>
                    )}
                    {content && <span>{content}</span>}
                </div>
            </div>
        </div>
    );
});

MessageItem.displayName = 'MessageItem';
