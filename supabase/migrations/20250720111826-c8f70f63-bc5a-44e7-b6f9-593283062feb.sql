-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_published BOOLEAN NOT NULL DEFAULT false
);

-- Create course_modules table
CREATE TABLE public.course_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  module_type TEXT NOT NULL DEFAULT 'content',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course_content table
CREATE TABLE public.course_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'document', 'video', 'quiz', 'text'
  content_data JSONB NOT NULL DEFAULT '{}',
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_course_progress table
CREATE TABLE public.user_course_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed'
  progress_percentage INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Create user_module_progress table
CREATE TABLE public.user_module_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module_id UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- Enable Row Level Security
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses
CREATE POLICY "Admins can manage all courses" 
ON public.courses 
FOR ALL 
USING (has_role('admin'::app_role));

CREATE POLICY "Employees can view published courses" 
ON public.courses 
FOR SELECT 
USING (is_published = true AND EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid()
));

-- RLS Policies for course_modules
CREATE POLICY "Admins can manage all course modules" 
ON public.course_modules 
FOR ALL 
USING (has_role('admin'::app_role));

CREATE POLICY "Employees can view modules of published courses" 
ON public.course_modules 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.courses 
  WHERE courses.id = course_modules.course_id 
  AND courses.is_published = true
) AND EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid()
));

-- RLS Policies for course_content
CREATE POLICY "Admins can manage all course content" 
ON public.course_content 
FOR ALL 
USING (has_role('admin'::app_role));

CREATE POLICY "Employees can view content of published courses" 
ON public.course_content 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.course_modules cm
  JOIN public.courses c ON c.id = cm.course_id
  WHERE cm.id = course_content.module_id 
  AND c.is_published = true
) AND EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.uid()
));

-- RLS Policies for user_course_progress
CREATE POLICY "Users can manage their own course progress" 
ON public.user_course_progress 
FOR ALL 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all course progress" 
ON public.user_course_progress 
FOR SELECT 
USING (has_role('admin'::app_role));

-- RLS Policies for user_module_progress
CREATE POLICY "Users can manage their own module progress" 
ON public.user_module_progress 
FOR ALL 
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all module progress" 
ON public.user_module_progress 
FOR SELECT 
USING (has_role('admin'::app_role));

-- Add triggers for updated_at columns
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_modules_updated_at
BEFORE UPDATE ON public.course_modules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_content_updated_at
BEFORE UPDATE ON public.course_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_course_progress_updated_at
BEFORE UPDATE ON public.user_course_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_module_progress_updated_at
BEFORE UPDATE ON public.user_module_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();