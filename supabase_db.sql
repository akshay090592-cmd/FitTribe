-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  log_id bigint NOT NULL,
  user_id text NOT NULL,
  user_name text NOT NULL,
  text text NOT NULL,
  date timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT comments_pkey PRIMARY KEY (id)
);
CREATE TABLE public.gamification_state (
  user_id uuid NOT NULL,
  display_name text,
  badges ARRAY,
  inventory jsonb,
  points integer DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  unlocked_themes ARRAY DEFAULT ARRAY['default'::text],
  active_theme text DEFAULT 'default'::text,
  lifetime_xp integer DEFAULT 0,
  CONSTRAINT gamification_state_pkey PRIMARY KEY (user_id),
  CONSTRAINT gamification_state_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.gift_transactions (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  from_user_id uuid,
  from_name text,
  to_name text,
  gift_id text,
  gift_name text,
  gift_emoji text,
  message text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT gift_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT gift_transactions_from_user_id_fkey FOREIGN KEY (from_user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.notifications (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  image_data text,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.point_logs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid,
  amount integer NOT NULL,
  type text NOT NULL,
  source text NOT NULL,
  source_id text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT point_logs_pkey PRIMARY KEY (id),
  CONSTRAINT point_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text,
  display_name text,
  created_at timestamp with time zone DEFAULT now(),
  fcm_token text,
  height numeric,
  weight numeric,
  gender text,
  dob date,
  custom_challenge jsonb,
  completed_challenges jsonb DEFAULT '[]'::jsonb,
  goals jsonb DEFAULT '{}'::jsonb,
  tribe_id uuid,
  fitness_level text CHECK (fitness_level = ANY (ARRAY['beginner'::text, 'advanced'::text])),
  avatar_id text DEFAULT 'male'::text,
  workout_templates jsonb DEFAULT '[]'::jsonb,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_tribe_id_fkey FOREIGN KEY (tribe_id) REFERENCES public.tribes(id)
);
CREATE TABLE public.reactions (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  log_id bigint,
  user_id uuid,
  user_name text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reactions_pkey PRIMARY KEY (id),
  CONSTRAINT reactions_log_id_fkey FOREIGN KEY (log_id) REFERENCES public.workout_logs(id),
  CONSTRAINT reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.tribe_photo (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid,
  user_name text,
  image_data text,
  created_at timestamp with time zone DEFAULT now(),
  tribe_id uuid,
  CONSTRAINT tribe_photo_pkey PRIMARY KEY (id),
  CONSTRAINT tribe_photo_tribe_id_fkey FOREIGN KEY (tribe_id) REFERENCES public.tribes(id)
);
CREATE TABLE public.tribes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tribes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.workout_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  log_id bigint,
  user_id uuid,
  feedback_text text,
  difficulty_rating integer CHECK (difficulty_rating >= 1 AND difficulty_rating <= 5),
  exercises_skipped ARRAY,
  pain_points ARRAY,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT workout_feedback_pkey PRIMARY KEY (id),
  CONSTRAINT workout_feedback_log_id_fkey FOREIGN KEY (log_id) REFERENCES public.workout_logs(id),
  CONSTRAINT workout_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.workout_logs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid,
  display_name text,
  log_data jsonb,
  date timestamp with time zone DEFAULT now(),
  CONSTRAINT workout_logs_pkey PRIMARY KEY (id),
  CONSTRAINT workout_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.xp_logs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid,
  amount integer NOT NULL,
  source text NOT NULL,
  source_id text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT xp_logs_pkey PRIMARY KEY (id),
  CONSTRAINT xp_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);

-- ROW LEVEL SECURITY POLICIES

-- Helper function to get current user's tribe_id without recursion
CREATE OR REPLACE FUNCTION public.get_my_tribe_id()
RETURNS uuid AS $$
  SELECT tribe_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Enable RLS on all tables
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

-- Tribes: Everyone can see tribes (to join them), but only authenticated
CREATE POLICY "Authenticated users can view tribes"
ON public.tribes FOR SELECT TO authenticated USING (true);

-- Profiles: Users can see profiles of their tribe members
CREATE POLICY "Users can view profiles in their tribe"
ON public.profiles FOR SELECT TO authenticated
USING (
  tribe_id = get_my_tribe_id()
  OR id = auth.uid()
);

-- Workout Logs: Only tribe members can view logs
CREATE POLICY "Users can view workout logs of their tribe"
ON public.workout_logs FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = workout_logs.user_id
    AND (profiles.tribe_id = get_my_tribe_id() OR profiles.id = auth.uid())
  )
);

-- Tribe Photos: Only tribe members can view their tribe's latest victory photo
CREATE POLICY "Users can view tribe photos of their tribe"
ON public.tribe_photo FOR SELECT TO authenticated
USING (
  tribe_id = get_my_tribe_id()
);

-- Notifications: Only the user can see their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Comments: Accessible if the user can see the workout log
CREATE POLICY "Users can view comments on accessible logs"
ON public.comments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workout_logs
    WHERE workout_logs.id = comments.log_id
  )
);

-- Reactions: Accessible if the user can see the workout log
CREATE POLICY "Users can view reactions on accessible logs"
ON public.reactions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workout_logs
    WHERE workout_logs.id = reactions.log_id
  )
);

-- Gamification State: Users can view state of their tribe members
CREATE POLICY "Users can view gamification state of their tribe"
ON public.gamification_state FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = gamification_state.user_id
    AND (profiles.tribe_id = get_my_tribe_id() OR profiles.id = auth.uid())
  )
);

-- Gift Transactions: Users can view gifts sent within their tribe
CREATE POLICY "Users can view tribe gifts"
ON public.gift_transactions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = gift_transactions.from_user_id
    AND profiles.tribe_id = get_my_tribe_id()
  )
);

-- Point and XP Logs: Private to user
CREATE POLICY "Users can view their own point logs" ON public.point_logs FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can view their own xp logs" ON public.xp_logs FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Workout Feedback: Private to user
CREATE POLICY "Users can view their own workout feedback" ON public.workout_feedback FOR SELECT TO authenticated USING (user_id = auth.uid());

-- INSERT/UPDATE/DELETE policies

-- Profiles
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

-- Workout Logs
CREATE POLICY "Users can insert their own logs" ON public.workout_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own logs" ON public.workout_logs FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own logs" ON public.workout_logs FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Tribe Photos
CREATE POLICY "Users can insert tribe photos into their own tribe"
ON public.tribe_photo FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  tribe_id = get_my_tribe_id()
);
CREATE POLICY "Users can delete their own tribe photos" ON public.tribe_photo FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Comments
CREATE POLICY "Users can insert their own comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Reactions
CREATE POLICY "Users can insert their own reactions" ON public.reactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete their own reactions" ON public.reactions FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Gamification State
CREATE POLICY "Users can update their own gamification state" ON public.gamification_state FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own gamification state" ON public.gamification_state FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Gift Transactions
CREATE POLICY "Users can insert their own gift transactions" ON public.gift_transactions FOR INSERT TO authenticated WITH CHECK (from_user_id = auth.uid());

-- Notifications (System usually inserts, but if app does it:)
CREATE POLICY "Users can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true); -- Usually restricted to service role in practice
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Point and XP Logs
CREATE POLICY "Users can insert their own point logs" ON public.point_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can insert their own xp logs" ON public.xp_logs FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Workout Feedback
CREATE POLICY "Users can insert their own workout feedback" ON public.workout_feedback FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());