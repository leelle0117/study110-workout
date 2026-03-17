-- Study110 Workout App - Database Schema
-- Run this in Supabase SQL Editor

-- 1. Members table
CREATE TABLE members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '🧑‍💻',
  group_code TEXT NOT NULL DEFAULT 'study110',
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(name, group_code)
);

-- 2. Workout logs table
CREATE TABLE workout_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  routine_id TEXT NOT NULL,
  routine_name TEXT NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT now(),
  duration INTEGER NOT NULL, -- seconds
  message TEXT DEFAULT '',
  emoji TEXT DEFAULT '🔥'
);

-- 3. Cheers table (who cheered which log)
CREATE TABLE cheers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  log_id UUID NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(log_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_workout_logs_user_id ON workout_logs(user_id);
CREATE INDEX idx_workout_logs_completed_at ON workout_logs(completed_at DESC);
CREATE INDEX idx_cheers_log_id ON cheers(log_id);
CREATE INDEX idx_members_group_code ON members(group_code);

-- Enable Row Level Security
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cheers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access (public app with group code protection)
CREATE POLICY "Anyone can read members" ON members FOR SELECT USING (true);
CREATE POLICY "Anyone can insert members" ON members FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read workout_logs" ON workout_logs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert workout_logs" ON workout_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read cheers" ON cheers FOR SELECT USING (true);
CREATE POLICY "Anyone can insert cheers" ON cheers FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete cheers" ON cheers FOR DELETE USING (true);
