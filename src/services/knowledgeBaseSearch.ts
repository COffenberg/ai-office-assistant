
import { supabase } from '@/integrations/supabase/client';
import { SearchResult, EnhancedSearchResult } from '@/types/knowledgeBase';
import { calculateRelevanceScore } from '@/utils/relevanceScoring';

export class KnowledgeBaseSearchService {
  static async searchEnhanced(query: string, userContext?: any): Promise<SearchResult[]> {
    console.log('Searching knowledge base for:', query);
    
    try {
      // Use the enhanced AI search function from the database
      const { data: results, error } = await supabase.rpc('ai_enhanced_search', {
        search_query: query,
        user_context: userContext || {},
        limit_results: 20
      });

      if (error) {
        console.error('AI enhanced search error:', error);
        console.log('Falling back to basic search');
        return await this.searchBasic(query);
      }

      console.log('AI enhanced search results:', results);

      // Convert database results to SearchResult format
      const searchResults: SearchResult[] = (results as EnhancedSearchResult[])?.map(result => ({
        type: result.result_type,
        id: result.result_id,
        question: result.result_type === 'qa_pair' ? result.title : undefined,
        answer: result.content,
        source: result.source,
        relevanceScore: result.relevance_score + (result.context_match || 0),
      })) || [];

      console.log('Processed search results:', searchResults);
      return searchResults;
    } catch (error) {
      console.error('Knowledge base search error:', error);
      return await this.searchBasic(query);
    }
  }

  static async searchBasic(query: string): Promise<SearchResult[]> {
    console.log('Performing basic search for:', query);
    
    // Basic search using Q&A pairs only
    const { data: qaResults, error } = await supabase
      .from('qa_pairs')
      .select('*')
      .eq('is_active', true)
      .or(`question.ilike.%${query}%,answer.ilike.%${query}%,category.ilike.%${query}%`)
      .order('usage_count', { ascending: false });

    if (error) {
      console.error('Basic search error:', error);
      return [];
    }

    const qaSearchResults: SearchResult[] = qaResults.map(qa => ({
      type: 'qa_pair' as const,
      id: qa.id,
      question: qa.question,
      answer: qa.answer,
      source: `Q&A - ${qa.category}`,
      category: qa.category,
      relevanceScore: calculateRelevanceScore(query, qa.question + ' ' + qa.answer),
    }));

    console.log('Basic search results:', qaSearchResults);
    return qaSearchResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
}
