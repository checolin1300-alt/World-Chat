import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

interface Message {
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    profiles: {
        username: string;
        avatar_url: string | null;
    };
}

interface MessageItemProps {
    message: Message;
    isOwnMessage: boolean;
}

export const MessageItem = React.memo(({ message, isOwnMessage }: MessageItemProps) => {
    const { content, created_at, profiles } = message;

    const username = profiles?.username || 'Unknown User';
    const avatarUrl = profiles?.avatar_url;

    return (
        <div className={clsx('flex gap-3 mb-4 max-w-[85%]', isOwnMessage ? 'ml-auto flex-row-reverse' : '')}>
            <div className="flex-shrink-0">
                {avatarUrl ? (
                    <img
                        src={avatarUrl}
                        alt={username}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-bold shadow-sm">
                        {username.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>

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
                        'px-4 py-2.5 rounded-2xl shadow-sm leading-relaxed break-words',
                        isOwnMessage
                            ? 'bg-blue-600 text-white rounded-tr-sm'
                            : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-900 dark:text-white rounded-tl-sm'
                    )}
                >
                    {content}
                </div>
            </div>
        </div>
    );
});

MessageItem.displayName = 'MessageItem';
