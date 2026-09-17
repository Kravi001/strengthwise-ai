-- ==========================================================
-- StrengthWise AI — Row Level Security (RLS) & Access Policies
-- Applied to resolve Supabase Security Advisor "RLS Disabled in Public"
-- ==========================================================

-- 1. Enable Row Level Security on all public tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

-- ==========================================================
-- 2. Policies for public.users
-- ==========================================================
DROP POLICY IF EXISTS "Users can view own user record" ON public.users;
CREATE POLICY "Users can view own user record"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Users can update own user record" ON public.users;
CREATE POLICY "Users can update own user record"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Users can insert own user record" ON public.users;
CREATE POLICY "Users can insert own user record"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = id);

-- ==========================================================
-- 3. Policies for public.profiles
-- ==========================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = "userId");

-- ==========================================================
-- 4. Policies for public.workout_logs
-- ==========================================================
DROP POLICY IF EXISTS "Users can view own workouts" ON public.workout_logs;
CREATE POLICY "Users can view own workouts"
  ON public.workout_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can insert own workouts" ON public.workout_logs;
CREATE POLICY "Users can insert own workouts"
  ON public.workout_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can update own workouts" ON public.workout_logs;
CREATE POLICY "Users can update own workouts"
  ON public.workout_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can delete own workouts" ON public.workout_logs;
CREATE POLICY "Users can delete own workouts"
  ON public.workout_logs
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = "userId");

-- ==========================================================
-- 5. Policies for public.meal_logs
-- ==========================================================
DROP POLICY IF EXISTS "Users can view own meals" ON public.meal_logs;
CREATE POLICY "Users can view own meals"
  ON public.meal_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can insert own meals" ON public.meal_logs;
CREATE POLICY "Users can insert own meals"
  ON public.meal_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can update own meals" ON public.meal_logs;
CREATE POLICY "Users can update own meals"
  ON public.meal_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "Users can delete own meals" ON public.meal_logs;
CREATE POLICY "Users can delete own meals"
  ON public.meal_logs
  FOR DELETE
  TO authenticated
  USING (auth.uid()::text = "userId");
