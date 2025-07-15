
import { supabase } from '@/integrations/supabase/client';
import { SearchResult, EnhancedSearchResult } from '@/types/knowledgeBase';
import { calculateRelevanceScore } from '@/utils/relevanceScoring';
import { normalizeQuestion } from './questionNormalization';

export class KnowledgeBaseSearchService {
  static async searchEnhanced(query: string, userContext?: any): Promise<SearchResult[]> {
    console.log('🔍 Searching knowledge base for:', query);
    
    // Normalize the query for better semantic matching
    const normalizedQuery = normalizeQuestion(query);
    console.log('🔄 Normalized query:', normalizedQuery);
    
    try {
      // Use the enhanced AI search function from the database
      const { data: results, error } = await supabase.rpc('ai_enhanced_search', {
        search_query: normalizedQuery,
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
    console.log('🔍 Performing enhanced basic search for:', query);
    
    try {
      // Create query variants for better matching
      const queryTerms = query.toLowerCase().split(' ').filter(term => term.length > 2);
      const queryVariants = [
        query,
        ...queryTerms,
        // Add common equipment/package terms
        ...(query.toLowerCase().includes('equipment') ? ['equipment'] : []),
        ...(query.toLowerCase().includes('package') ? ['package', 'standard package'] : []),
        ...(query.toLowerCase().includes('standard') ? ['standard', 'package'] : [])
      ];

      console.log('🔎 Search query variants:', queryVariants);
      
      // Search Q&A pairs
      const { data: qaResults, error: qaError } = await supabase
        .from('qa_pairs')
        .select('*')
        .eq('is_active', true)
        .or(`question.ilike.%${query}%,answer.ilike.%${query}%,category.ilike.%${query}%`)
        .order('usage_count', { ascending: false });

      if (qaError) {
        console.error('❌ Q&A search error:', qaError);
      }

      // Search document chunks with multiple query variants
      const docSearchQueries = queryVariants.map(variant => 
        supabase
          .from('document_chunks')
          .select(`
            *,
            documents!inner(*)
          `)
          .ilike('content', `%${variant}%`)
          .eq('documents.processing_status', 'processed')
          .order('chunk_index')
          .limit(10)
      );

      const docResultsArray = await Promise.all(docSearchQueries);
      
      // Combine and deduplicate document results
      const allDocResults = docResultsArray
        .filter(result => !result.error)
        .flatMap(result => result.data || []);
      
      const uniqueDocResults = Array.from(
        new Map(allDocResults.map(item => [item.id, item])).values()
      );

      console.log(`📊 Found ${qaResults?.length || 0} Q&A results and ${uniqueDocResults.length} document chunks`);

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
      uniqueDocResults.forEach((chunk: any) => {
        const enhancedScore = this.calculateEnhancedRelevanceScore(query, chunk.content);
        results.push({
          type: 'document' as const,
          id: chunk.documents.id,
          answer: chunk.content,
          source: `Document - ${chunk.documents.name}`,
          relevanceScore: enhancedScore,
        });
      });

      console.log(`✅ Basic search found ${results.length} total results`);
      
      // Sort by relevance and return meaningful results
      const sortedResults = results
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .filter(result => result.relevanceScore > 0.1);
        
      console.log(`🏆 Returning ${sortedResults.length} filtered results`);
      return sortedResults;
    } catch (error) {
      console.error('💥 Basic search error:', error);
      return [];
    }
  }

  private static normalizeQuery(query: string): string {
    const queryLower = query.toLowerCase();
    
    // Enhanced normalization for phone/support related queries
    if (queryLower.includes('number') && (queryLower.includes('call') || queryLower.includes('reach') || queryLower.includes('support'))) {
      console.log('🔄 Normalizing phone number query');
      return queryLower.replace(/what\s+number\s+should\s+i\s+call\s+to\s+reach\s+support/g, 'support phone number')
                      .replace(/what\s+number\s+should\s+i\s+call/g, 'support phone number')
                      .replace(/number\s+to\s+call\s+(?:to\s+)?(?:reach\s+)?support/g, 'support phone number')
                      .replace(/call\s+to\s+reach\s+support/g, 'support phone number')
                      .replace(/support\s+number/g, 'support phone number');
    }
    
    // Enhanced normalization for customer communication queries
    if (queryLower.includes('call') && queryLower.includes('customer')) {
      console.log('🔄 Normalizing customer call query');
      return queryLower.replace(/what\s+should\s+i\s+do\s+when/g, 'when should you call customer')
                      .replace(/why\s+should\s+you\s+call/g, 'call customer before')
                      .replace(/should\s+you\s+call/g, 'call customer')
                      .replace(/when.*wiring.*required/g, 'call customer before wiring');
    }
    
    // Normalize wiring/installation queries
    if (queryLower.includes('wiring') && queryLower.includes('required')) {
      console.log('🔄 Normalizing wiring query');
      return queryLower.replace(/what\s+should\s+i\s+do\s+when\s+wiring\s+is\s+required/g, 'call customer before wiring installation');
    }
    
    return query;
  }

  private static calculateEnhancedRelevanceScore(query: string, content: string): number {
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    
    let score = 0;
    
    // Exact matches get highest score
    if (contentLower.includes(queryLower)) score += 1.0;
    
    // Enhanced scoring for phone/support related content
    if ((queryLower.includes('phone') || queryLower.includes('number') || queryLower.includes('call')) &&
        (contentLower.includes('phone') || contentLower.includes('support') || contentLower.includes('contact'))) {
      score += 0.9;
    }
    
    // Enhanced scoring for customer communication
    if ((queryLower.includes('call') && queryLower.includes('customer')) &&
        (contentLower.includes('customer') && (contentLower.includes('call') || contentLower.includes('contact')))) {
      score += 0.95;
    }
    
    // Enhanced scoring for equipment and package terms
    if ((queryLower.includes('equipment') || queryLower.includes('package') || queryLower.includes('standard')) &&
        (contentLower.includes('equipment') || contentLower.includes('package') || contentLower.includes('standard'))) {
      score += 0.9;
    }
    
    // Word matches
    const queryWords = queryLower.split(' ');
    queryWords.forEach(word => {
      if (word.length > 2 && contentLower.includes(word)) {
        score += 0.3;
      }
    });
    
    return score;
  }
}
