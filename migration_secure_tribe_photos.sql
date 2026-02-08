-- Migration: Secure Tribe Photos and Enable Row Level Security (RLS)
-- This script updates an existing database to enforce tribe-based privacy.

-- 1. Fix tribe_photo schema consistency
-- Convert tribe_id from text to uuid and add foreign key reference
ALTER TABLE public.tribe_photo
  ALTER COLUMN tribe_id TYPE uuid USING tribe_id::uuid;

-- Add foreign key if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tribe_photo_tribe_id_fkey') THEN
        ALTER TABLE public.tribe_photo
          ADD CONSTRAINT tribe_photo_tribe_id_fkey FOREIGN KEY (tribe_id) REFERENCES public.tribes(id);
    END IF;
END $$;

-- 2. Create helper function for RLS to avoid recursion on profiles table
CREATE OR REPLACE FUNCTION public.get_my_tribe_id()
RETURNS uuid AS $$
  SELECT tribe_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- 3. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tribe_photo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tribes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.point_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_feedback ENABLE ROW LEVEL SECURITY;

-- 4. Set up SELECT policies (Privacy)

-- Tribes: Authenticated users can see all tribes to join them
DROP POLICY IF EXISTS "Authenticated users can view tribes" ON public.tribes;
CREATE POLICY "Authenticated users can view tribes" ON public.tribes FOR SELECT TO authenticated USING (true);

-- Profiles: Users can see profiles of their tribe members or themselves
DROP POLICY IF EXISTS "Users can view profiles in their tribe" ON public.profiles;
CREATE POLICY "Users can view profiles in their tribe" ON public.profiles FOR SELECT TO authenticated
USING (tribe_id = get_my_tribe_id() OR id = auth.uid());

-- Workout Logs: Visible only to members of the same tribe
DROP POLICY IF EXISTS "Users can view workout logs of their tribe" ON public.workout_logs;
CREATE POLICY "Users can view workout logs of their tribe" ON public.workout_logs FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = workout_logs.user_id
    AND (profiles.tribe_id = get_my_tribe_id() OR profiles.id = auth.uid())
  )
);

-- Tribe Photos: Only tribe members can view their tribe's victory photos
DROP POLICY IF EXISTS "Users can view tribe photos of their tribe" ON public.tribe_photo;
CREATE POLICY "Users can view tribe photos of their tribe" ON public.tribe_photo FOR SELECT TO authenticated
USING (tribe_id = get_my_tribe_id());

-- Notifications: Private to the user
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Comments & Reactions: Visible if the associated log is visible
DROP POLICY IF EXISTS "Users can view comments on accessible logs" ON public.comments;
CREATE POLICY "Users can view comments on accessible logs" ON public.comments FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.workout_logs WHERE workout_logs.id = comments.log_id));

DROP POLICY IF EXISTS "Users can view reactions on accessible logs" ON public.reactions;
CREATE POLICY "Users can view reactions on accessible logs" ON public.reactions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.workout_logs WHERE workout_logs.id = reactions.log_id));

-- Gamification State: Visible to tribe members
DROP POLICY IF EXISTS "Users can view gamification state of their tribe" ON public.gamification_state;
CREATE POLICY "Users can view gamification state of their tribe" ON public.gamification_state FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = gamification_state.user_id
    AND (profiles.tribe_id = get_my_tribe_id() OR profiles.id = auth.uid())
  )
);

-- Gift Transactions: Visible within the tribe
DROP POLICY IF EXISTS "Users can view tribe gifts" ON public.gift_transactions;
CREATE POLICY "Users can view tribe gifts" ON public.gift_transactions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = gift_transactions.from_user_id
    AND profiles.tribe_id = get_my_tribe_id()
  )
);

-- Point/XP Logs & Feedback: Strictly private
DROP POLICY IF EXISTS "Users can view their own point logs" ON public.point_logs;
CREATE POLICY "Users can view their own point logs" ON public.point_logs FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own xp logs" ON public.xp_logs;
CREATE POLICY "Users can view their own xp logs" ON public.xp_logs FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own workout feedback" ON public.workout_feedback;
CREATE POLICY "Users can view their own workout feedback" ON public.workout_feedback FOR SELECT TO authenticated USING (user_id = auth.uid());


-- 5. Set up Data Modification Policies (Security)

-- Profiles
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Workout Logs
DROP POLICY IF EXISTS "Users can insert their own logs" ON public.workout_logs;
CREATE POLICY "Users can insert their own logs" ON public.workout_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own logs" ON public.workout_logs;
CREATE POLICY "Users can update their own logs" ON public.workout_logs FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own logs" ON public.workout_logs;
CREATE POLICY "Users can delete their own logs" ON public.workout_logs FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Tribe Photos
DROP POLICY IF EXISTS "Users can insert tribe photos into their own tribe" ON public.tribe_photo;
CREATE POLICY "Users can insert tribe photos into their own tribe" ON public.tribe_photo FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND tribe_id = get_my_tribe_id());

DROP POLICY IF EXISTS "Users can delete their own tribe photos" ON public.tribe_photo;
CREATE POLICY "Users can delete their own tribe photos" ON public.tribe_photo FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Comments & Reactions
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.comments;
CREATE POLICY "Users can insert their own comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own reactions" ON public.reactions;
CREATE POLICY "Users can insert their own reactions" ON public.reactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete their own reactions" ON public.reactions;
CREATE POLICY "Users can delete their own reactions" ON public.reactions FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Gamification
DROP POLICY IF EXISTS "Users can update their own gamification state" ON public.gamification_state;
CREATE POLICY "Users can update their own gamification state" ON public.gamification_state FOR UPDATE TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own gamification state" ON public.gamification_state;
CREATE POLICY "Users can insert their own gamification state" ON public.gamification_state FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Gifts
DROP POLICY IF EXISTS "Users can insert their own gift transactions" ON public.gift_transactions;
CREATE POLICY "Users can insert their own gift transactions" ON public.gift_transactions FOR INSERT TO authenticated WITH CHECK (from_user_id = auth.uid());

-- Notifications
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Logs & Feedback
DROP POLICY IF EXISTS "Users can insert their own point logs" ON public.point_logs;
CREATE POLICY "Users can insert their own point logs" ON public.point_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own xp logs" ON public.xp_logs;
CREATE POLICY "Users can insert their own xp logs" ON public.xp_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own workout feedback" ON public.workout_feedback;
CREATE POLICY "Users can insert their own workout feedback" ON public.workout_feedback FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
