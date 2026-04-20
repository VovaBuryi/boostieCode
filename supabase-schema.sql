-- Create enum for role (drop if exists to avoid conflicts)
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('admin', 'user');

-- Profiles table (extended user data)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  is_admin BOOLEAN DEFAULT false,
  role user_role DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Modules table
CREATE TABLE IF NOT EXISTS modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, course_id)
);

-- Lesson progress table
CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_position_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, lesson_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_courses_created_by ON courses(created_by);
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);

-- Enable Row Level Security (RLS)

-- Function to check if current user is admin (avoids RLS recursion)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function for middleware to check admin status
CREATE OR REPLACE FUNCTION get_user_admin_status(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND is_admin = true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (is_admin());

-- RLS Policies for courses
DROP POLICY IF EXISTS "Anyone can view published courses" ON courses;
DROP POLICY IF EXISTS "Only admins can insert courses" ON courses;
DROP POLICY IF EXISTS "Only admins can update courses" ON courses;
DROP POLICY IF EXISTS "Only admins can delete courses" ON courses;

CREATE POLICY "Anyone can view published courses" ON courses
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert courses" ON courses
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only admins can update courses" ON courses
  FOR UPDATE USING (is_admin());

CREATE POLICY "Only admins can delete courses" ON courses
  FOR DELETE USING (is_admin());

-- RLS Policies for modules
DROP POLICY IF EXISTS "Anyone can view modules" ON modules;
DROP POLICY IF EXISTS "Only admins can insert modules" ON modules;
DROP POLICY IF EXISTS "Only admins can update modules" ON modules;
DROP POLICY IF EXISTS "Only admins can delete modules" ON modules;

CREATE POLICY "Anyone can view modules" ON modules
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert modules" ON modules
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only admins can update modules" ON modules
  FOR UPDATE USING (is_admin());

CREATE POLICY "Only admins can delete modules" ON modules
  FOR DELETE USING (is_admin());

-- RLS Policies for lessons
DROP POLICY IF EXISTS "Anyone can view lessons" ON lessons;
DROP POLICY IF EXISTS "Only admins can insert lessons" ON lessons;
DROP POLICY IF EXISTS "Only admins can update lessons" ON lessons;
DROP POLICY IF EXISTS "Only admins can delete lessons" ON lessons;

CREATE POLICY "Anyone can view lessons" ON lessons
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert lessons" ON lessons
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only admins can update lessons" ON lessons
  FOR UPDATE USING (is_admin());

CREATE POLICY "Only admins can delete lessons" ON lessons
  FOR DELETE USING (is_admin());

-- RLS Policies for enrollments
DROP POLICY IF EXISTS "Users can view their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can enroll in courses" ON enrollments;
DROP POLICY IF EXISTS "Users can update their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON enrollments;

CREATE POLICY "Users can view their own enrollments" ON enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll in courses" ON enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments" ON enrollments
  FOR UPDATE USING (auth.uid() = user_id);

-- Admins can view all enrollments
CREATE POLICY "Admins can view all enrollments" ON enrollments
  FOR SELECT USING (is_admin());

-- RLS Policies for lesson_progress
DROP POLICY IF EXISTS "Users can view their own progress" ON lesson_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON lesson_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON lesson_progress;

CREATE POLICY "Users can view their own progress" ON lesson_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" ON lesson_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON lesson_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically create profile on sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, is_admin)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', false);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on auth signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
DROP TRIGGER IF EXISTS update_modules_updated_at ON modules;
DROP TRIGGER IF EXISTS update_lessons_updated_at ON lessons;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_modules_updated_at
  BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON courses TO authenticated;
GRANT ALL ON modules TO authenticated;
GRANT ALL ON lessons TO authenticated;
GRANT ALL ON enrollments TO authenticated;
GRANT ALL ON lesson_progress TO authenticated;
