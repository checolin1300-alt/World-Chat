-- Notifications Setup

-- 1. Create User Tokens table for FCM
CREATE TABLE IF NOT EXISTS public.user_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    platform TEXT DEFAULT 'web',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;

-- 3. Policies for user_tokens
-- Users can manage their own tokens
CREATE POLICY "Users can manage their own tokens"
ON public.user_tokens FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Index for performance
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON public.user_tokens(user_id);
