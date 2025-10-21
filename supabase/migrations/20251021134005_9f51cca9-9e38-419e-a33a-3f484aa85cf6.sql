-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- Create enum for item status
CREATE TYPE public.item_status AS ENUM ('active', 'matched', 'claimed', 'closed');

-- Create enum for claim status
CREATE TYPE public.claim_status AS ENUM ('pending', 'approved', 'rejected');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create lost_items table
CREATE TABLE public.lost_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  date_lost DATE NOT NULL,
  location TEXT NOT NULL,
  status item_status NOT NULL DEFAULT 'active',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create found_items table
CREATE TABLE public.found_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  date_found DATE NOT NULL,
  location TEXT NOT NULL,
  status item_status NOT NULL DEFAULT 'active',
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create claims table
CREATE TABLE public.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lost_item_id UUID REFERENCES public.lost_items(id) ON DELETE CASCADE,
  found_item_id UUID REFERENCES public.found_items(id) ON DELETE CASCADE,
  claimant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status claim_status NOT NULL DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT claim_item_check CHECK (
    (lost_item_id IS NOT NULL AND found_item_id IS NULL) OR
    (lost_item_id IS NULL AND found_item_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.found_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for lost_items
CREATE POLICY "Lost items are viewable by everyone"
  ON public.lost_items FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own lost items"
  ON public.lost_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lost items"
  ON public.lost_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any lost items"
  ON public.lost_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for found_items
CREATE POLICY "Found items are viewable by everyone"
  ON public.found_items FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own found items"
  ON public.found_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own found items"
  ON public.found_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any found items"
  ON public.found_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for claims
CREATE POLICY "Claims are viewable by admins and involved users"
  ON public.claims FOR SELECT
  USING (
    auth.uid() = claimant_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM public.lost_items
      WHERE id = claims.lost_item_id AND user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.found_items
      WHERE id = claims.found_item_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert claims"
  ON public.claims FOR INSERT
  WITH CHECK (auth.uid() = claimant_id);

CREATE POLICY "Admins can update claims"
  ON public.claims FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    new.email,
    'user'
  );
  RETURN new;
END;
$$;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_lost_items_updated_at BEFORE UPDATE ON public.lost_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_found_items_updated_at BEFORE UPDATE ON public.found_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON public.claims
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();