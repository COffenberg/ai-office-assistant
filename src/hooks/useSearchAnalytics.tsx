
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface SearchAnalytic {
  id: string;
  user_id: string;
  search_query: string;
  results_count: number;
  clicked_result_id?: string;
  clicked_result_type?: 'qa_pair' | 'document';
  satisfaction_rating?: number;
  created_at: string;
}

export const useSearchAnalytics = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch analytics (admin only gets all, users get their own)
  const { data: analytics = [], isLoading } = useQuery({
    queryKey: ['search-analytics', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('search_analytics')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SearchAnalytic[];
    },
    enabled: !!user,
  });

  // Track search mutation
  const trackSearchMutation = useMutation({
    mutationFn: async (searchData: {
      search_query: string;
      results_count: number;
      clicked_result_id?: string;
      clicked_result_type?: 'qa_pair' | 'document';
    }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('search_analytics')
        .insert({
          user_id: user.id,
          ...searchData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-analytics'] });
    },
    onError: (error) => {
      console.error('Track search error:', error);
    },
  });

  // Rate search result mutation
  const rateSearchMutation = useMutation({
    mutationFn: async ({ analyticId, rating }: { analyticId: string; rating: number }) => {
      const { data, error } = await supabase
        .from('search_analytics')
        .update({ satisfaction_rating: rating })
        .eq('id', analyticId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-analytics'] });
      toast.success('Feedback recorded!');
    },
    onError: (error) => {
      console.error('Rate search error:', error);
      toast.error('Failed to save feedback');
    },
  });

  return {
    analytics,
    isLoading,
    trackSearch: trackSearchMutation.mutate,
    rateSearch: rateSearchMutation.mutate,
    isTracking: trackSearchMutation.isPending,
    isRating: rateSearchMutation.isPending,
  };
};
