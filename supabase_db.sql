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
  tribe_id text,
  CONSTRAINT tribe_photo_pkey PRIMARY KEY (id)
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