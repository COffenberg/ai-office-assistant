
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface KnowledgeGap {
  id: string;
  search_query: string;
  frequency: number;
  last_searched: string;
  suggested_action?: string;
  status: 'open' | 'addressed' | 'ignored';
  created_at: string;
}

export const useKnowledgeGaps = () => {
  const { user, profile } = useAuth();

  const { data: knowledgeGaps = [], isLoading } = useQuery({
    queryKey: ['knowledge-gaps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_gaps')
        .select('*')
        .order('frequency', { ascending: false });
      
      if (error) throw error;
      return data as KnowledgeGap[];
    },
    enabled: !!user && profile?.role === 'admin',
  });

  return {
    knowledgeGaps,
    isLoading,
  };
};
