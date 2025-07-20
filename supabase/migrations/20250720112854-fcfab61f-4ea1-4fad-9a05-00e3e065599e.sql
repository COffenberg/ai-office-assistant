-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Add category_id to courses table
ALTER TABLE public.courses ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE;

-- Enable Row Level Security for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Admins can manage all categories" 
ON public.categories 
FOR ALL 
USING (has_role('admin'::app_role));

CREATE POLICY "Employees can view categories" 
ON public.categories 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid()
));

-- Add trigger for updated_at column
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();