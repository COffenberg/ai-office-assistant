
-- Create Q&A pairs table
CREATE TABLE public.qa_pairs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  tags TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0
);

-- Create chat history table
CREATE TABLE public.chat_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  source_type TEXT CHECK (source_type IN ('document', 'qa_pair', 'ai_generated')),
  source_id UUID,
  source_name TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5)
);

-- Create knowledge sources table for tracking document usage
CREATE TABLE public.knowledge_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_type TEXT CHECK (source_type IN ('document', 'qa_pair')) NOT NULL,
  source_id UUID NOT NULL,
  content_excerpt TEXT,
  keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.qa_pairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_sources ENABLE ROW LEVEL SECURITY;

-- RLS policies for qa_pairs (admins can manage, employees can read)
CREATE POLICY "Admins can manage Q&A pairs" 
  ON public.qa_pairs 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Employees can view active Q&A pairs" 
  ON public.qa_pairs 
  FOR SELECT 
  USING (
    is_active = true AND 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'employee'
    )
  );

-- RLS policies for chat_history (users can only see their own history, admins can see all)
CREATE POLICY "Users can view their own chat history" 
  ON public.chat_history 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own chat history" 
  ON public.chat_history 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all chat history" 
  ON public.chat_history 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS policies for knowledge_sources (admins can manage, employees can read)
CREATE POLICY "Admins can manage knowledge sources" 
  ON public.knowledge_sources 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Employees can view knowledge sources" 
  ON public.knowledge_sources 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_qa_pairs_category ON public.qa_pairs(category);
CREATE INDEX idx_qa_pairs_tags ON public.qa_pairs USING GIN(tags);
CREATE INDEX idx_qa_pairs_active ON public.qa_pairs(is_active);
CREATE INDEX idx_chat_history_user_timestamp ON public.chat_history(user_id, timestamp DESC);
CREATE INDEX idx_chat_history_source ON public.chat_history(source_type, source_id);
CREATE INDEX idx_knowledge_sources_type_id ON public.knowledge_sources(source_type, source_id);

-- Add trigger to update updated_at timestamp for qa_pairs
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_qa_pairs_updated_at 
  BEFORE UPDATE ON public.qa_pairs 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment usage count for Q&A pairs
CREATE OR REPLACE FUNCTION public.increment_qa_usage(qa_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.qa_pairs 
  SET usage_count = usage_count + 1 
  WHERE id = qa_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
