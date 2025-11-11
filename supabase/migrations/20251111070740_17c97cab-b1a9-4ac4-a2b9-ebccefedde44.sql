-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies - users can read all profiles but only update their own
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add user_id to comparisons table
ALTER TABLE public.comparisons
ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update RLS policies for comparisons to be user-specific
DROP POLICY IF EXISTS "Allow public read access to comparisons" ON public.comparisons;
DROP POLICY IF EXISTS "Allow public insert access to comparisons" ON public.comparisons;
DROP POLICY IF EXISTS "Allow public update access to comparisons" ON public.comparisons;
DROP POLICY IF EXISTS "Allow public delete access to comparisons" ON public.comparisons;

-- New user-specific policies for comparisons
CREATE POLICY "Users can view their own comparisons"
ON public.comparisons FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own comparisons"
ON public.comparisons FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comparisons"
ON public.comparisons FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comparisons"
ON public.comparisons FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();