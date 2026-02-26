-- Direct Messaging Setup

-- 1. Create Conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    participant2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_message_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    -- Ensure participant1_id is always "smaller" to avoid duplicate pairs
    CONSTRAINT different_participants CHECK (participant1_id <> participant2_id),
    CONSTRAINT unique_conversation_pair UNIQUE (participant1_id, participant2_id)
);

-- 2. Create Direct Messages table
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Conversations
-- Users can see conversations they are part of
CREATE POLICY "Users can view their own conversations"
ON public.conversations FOR SELECT
USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- Users can create a conversation if they are one of the participants
CREATE POLICY "Users can create conversations they are part of"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- 5. Policies for Direct Messages
-- Users can view messages in conversations they are part of
CREATE POLICY "Users can view messages in their conversations"
ON public.direct_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.conversations
        WHERE id = direct_messages.conversation_id
        AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
    )
);

-- Users can insert messages in conversations they are part of
CREATE POLICY "Users can send messages in their conversations"
ON public.direct_messages FOR INSERT
WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.conversations
        WHERE id = direct_messages.conversation_id
        AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
    )
);

-- Users can mark messages as read in their conversations
CREATE POLICY "Users can update is_read status in their conversations"
ON public.direct_messages FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.conversations
        WHERE id = direct_messages.conversation_id
        AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.conversations
        WHERE id = direct_messages.conversation_id
        AND (participant1_id = auth.uid() OR participant2_id = auth.uid())
    )
);

-- 6. Function to update last_message_at
CREATE OR REPLACE FUNCTION public.handle_new_direct_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET last_message_at = now()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger for new message
DROP TRIGGER IF EXISTS on_direct_message_created ON public.direct_messages;
CREATE TRIGGER on_direct_message_created
    AFTER INSERT ON public.direct_messages
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_direct_message();
