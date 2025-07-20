-- Add parent_category_id to categories table to support sub-categories
ALTER TABLE public.categories ADD COLUMN parent_category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE;

-- Update RLS policies to handle sub-categories
-- Drop existing policies first
DROP POLICY "Employees can view categories" ON public.categories;

-- Recreate with better handling for sub-categories
CREATE POLICY "Employees can view categories and sub-categories" 
ON public.categories 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid()
));