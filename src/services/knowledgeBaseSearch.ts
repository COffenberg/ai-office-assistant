
import { supabase } from '@/integrations/supabase/client';
import { SearchResult, EnhancedSearchResult } from '@/types/knowledgeBase';
import { calculateRelevanceScore } from '@/utils/relevanceScoring';

export class KnowledgeBaseSearchService {
  static async searchEnhanced(query: string, userContext?: any): Promise<SearchResult[]> {
    console.log('🔍 Searching knowledge base for:', query);
    
    try {
      // Use the enhanced AI search function from the database
      const { data: results, error } = await supabase.rpc('ai_enhanced_search', {
        search_query: query,
        user_context: userContext || {},
        limit_results: 25
      });

      if (error) {
        console.error('❌ AI enhanced search error:', error);
        console.log('🔄 Falling back to basic search');
        return await this.searchBasic(query);
      }

      console.log('✅ AI enhanced search results:', results?.length || 0, 'results found');

      // Convert database results to SearchResult format
      const searchResults: SearchResult[] = (results as EnhancedSearchResult[])?.map(result => {
        const relevanceScore = result.relevance_score + (result.context_match || 0);
        
        console.log(`📄 Result: ${result.result_type} - ${result.title?.substring(0, 50)} - Score: ${relevanceScore.toFixed(3)}`);
        
        return {
          type: result.result_type,
          id: result.result_id,
          question: result.result_type === 'qa_pair' ? result.title : undefined,
          answer: result.content,
          source: result.source,
          relevanceScore: relevanceScore,
        };
      }) || [];

      // Sort by relevance score (highest first)
      searchResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

      console.log('🏆 Top 5 search results:');
      searchResults.slice(0, 5).forEach((result, index) => {
        console.log(`${index + 1}. ${result.type} - Score: ${result.relevanceScore.toFixed(3)} - Content: ${result.answer?.substring(0, 150)}...`);
      });

      // Filter results to ensure we have meaningful content
      const filteredResults = searchResults.filter(result => 
        result.relevanceScore > 0.1 && 
        result.answer && 
        result.answer.trim().length > 10
      );

      console.log(`📊 Filtered to ${filteredResults.length} meaningful results (min score: 0.1)`);

      return filteredResults;
    } catch (error) {
      console.error('💥 Knowledge base search error:', error);
      return await this.searchBasic(query);
    }
  }

  static async searchBasic(query: string): Promise<SearchResult[]> {
    console.log('Performing basic search for:', query);
    
    try {
      // Search Q&A pairs
      const { data: qaResults, error: qaError } = await supabase
        .from('qa_pairs')
        .select('*')
        .eq('is_active', true)
        .or(`question.ilike.%${query}%,answer.ilike.%${query}%,category.ilike.%${query}%`)
        .order('usage_count', { ascending: false });

      if (qaError) {
        console.error('Q&A search error:', qaError);
      }

      // Search document chunks
      const { data: docResults, error: docError } = await supabase
        .from('document_chunks')
        .select(`
          *,
          documents!inner(*)
        `)
        .ilike('content', `%${query}%`)
        .order('chunk_index');

      if (docError) {
        console.error('Document search error:', docError);
      }

      const results: SearchResult[] = [];

      // Add Q&A results
      if (qaResults) {
        qaResults.forEach(qa => {
          results.push({
            type: 'qa_pair' as const,
            id: qa.id,
            question: qa.question,
            answer: qa.answer,
            source: `Q&A - ${qa.category}`,
            category: qa.category,
            relevanceScore: calculateRelevanceScore(query, qa.question + ' ' + qa.answer),
          });
        });
      }

      // Add document results
      if (docResults) {
        docResults.forEach((chunk: any) => {
          results.push({
            type: 'document' as const,
            id: chunk.documents.id,
            answer: chunk.content,
            source: `Document - ${chunk.documents.name}`,
            relevanceScore: calculateRelevanceScore(query, chunk.content),
          });
        });
      }

      console.log(`Basic search found ${results.length} results`);
      return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } catch (error) {
      console.error('Basic search error:', error);
      return [];
    }
  }
}
