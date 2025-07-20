-- Create student access permissions table
CREATE TABLE public.student_category_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  granted_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id)
);

-- Enable RLS
ALTER TABLE public.student_category_access ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage all student access" 
ON public.student_category_access 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can view their own access" 
ON public.student_category_access 
FOR SELECT 
USING (user_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_student_category_access_updated_at
  BEFORE UPDATE ON public.student_category_access
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();