-- Create user_points table to track total points per user
CREATE TABLE public.user_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_address TEXT NOT NULL UNIQUE,
  total_points DECIMAL(20, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lock_points table to track points earned per lock
CREATE TABLE public.lock_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_address TEXT NOT NULL,
  lock_index INTEGER NOT NULL,
  token_address TEXT NOT NULL,
  token_amount DECIMAL(30, 0) NOT NULL,
  token_decimals INTEGER NOT NULL,
  lock_duration_days INTEGER NOT NULL,
  usd_value DECIMAL(20, 2) NOT NULL,
  points_earned DECIMAL(20, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_address, lock_index)
);

-- Enable Row Level Security
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lock_points ENABLE ROW LEVEL SECURITY;

-- Create policies for user_points (everyone can view, but only system can update)
CREATE POLICY "Anyone can view user points" 
ON public.user_points 
FOR SELECT 
USING (true);

CREATE POLICY "Service role can insert user points" 
ON public.user_points 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Service role can update user points" 
ON public.user_points 
FOR UPDATE 
USING (true);

-- Create policies for lock_points (everyone can view)
CREATE POLICY "Anyone can view lock points" 
ON public.lock_points 
FOR SELECT 
USING (true);

CREATE POLICY "Service role can insert lock points" 
ON public.lock_points 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_user_points_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_points_updated_at
BEFORE UPDATE ON public.user_points
FOR EACH ROW
EXECUTE FUNCTION public.update_user_points_timestamp();

-- Create index for better performance
CREATE INDEX idx_user_points_address ON public.user_points(user_address);
CREATE INDEX idx_lock_points_user ON public.lock_points(user_address);
CREATE INDEX idx_user_points_total ON public.user_points(total_points DESC);