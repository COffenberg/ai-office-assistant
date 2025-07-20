-- Add file attachments for categories and courses
CREATE TABLE IF NOT EXISTS public.category_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.course_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id)
);

-- Enable RLS on new tables
ALTER TABLE public.category_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_attachments ENABLE ROW LEVEL SECURITY;

-- Create policies for category_attachments
CREATE POLICY "Admins can manage category attachments" 
ON public.category_attachments 
FOR ALL 
USING (has_role('admin'::app_role))
WITH CHECK (has_role('admin'::app_role));

CREATE POLICY "Employees can view category attachments" 
ON public.category_attachments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid()
));

-- Create policies for course_attachments
CREATE POLICY "Admins can manage course attachments" 
ON public.course_attachments 
FOR ALL 
USING (has_role('admin'::app_role))
WITH CHECK (has_role('admin'::app_role));

CREATE POLICY "Employees can view course attachments" 
ON public.course_attachments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid()
));

-- Create indexes for better performance
CREATE INDEX idx_category_attachments_category_id ON public.category_attachments(category_id);
CREATE INDEX idx_course_attachments_course_id ON public.course_attachments(course_id);