
import { supabase } from '@/integrations/supabase/client';
import { SearchResult, EnhancedSearchResult } from '@/types/knowledgeBase';
import { calculateRelevanceScore } from '@/utils/relevanceScoring';

export class KnowledgeBaseSearchService {
  static async searchEnhanced(query: string, userContext?: any): Promise<SearchResult[]> {
    console.log('🔍 Searching knowledge base for:', query);
    
    // Normalize the query for better semantic matching
    const normalizedQuery = this.normalizeQuery(query);
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
      
      // Enhanced sorting that prioritizes Q&A pairs over documents for good semantic matches
      const sortedResults = results
        .sort((a, b) => {
          // If both are above threshold, prioritize Q&A pairs
          if (a.relevanceScore > 0.6 && b.relevanceScore > 0.6) {
            if (a.type === 'qa_pair' && b.type !== 'qa_pair') return -1;
            if (b.type === 'qa_pair' && a.type !== 'qa_pair') return 1;
          }
          return b.relevanceScore - a.relevanceScore;
        })
        .filter(result => result.relevanceScore > 0.1);
        
      console.log(`🏆 Returning ${sortedResults.length} filtered results`);
      console.log('Top 3 results:', sortedResults.slice(0, 3).map(r => ({
        type: r.type,
        score: r.relevanceScore.toFixed(3),
        preview: r.answer.substring(0, 80) + '...'
      })));
      
      return sortedResults;
    } catch (error) {
      console.error('💥 Basic search error:', error);
      return [];
    }
  }

  private static normalizeQuery(query: string): string {
    const queryLower = query.toLowerCase().trim();
    console.log('🔄 Original query:', query);
    
    // Comprehensive normalization for phone/support contact queries
    if (this.isPhoneSupportQuery(queryLower)) {
      console.log('📞 Detected phone/support query - normalizing for semantic matching');
      return this.normalizePhoneSupportQuery(queryLower);
    }
    
    // Enhanced normalization for customer communication queries
    if (this.isCustomerCommunicationQuery(queryLower)) {
      console.log('🗣️ Detected customer communication query - normalizing');
      return this.normalizeCustomerCommunicationQuery(queryLower);
    }
    
    // Normalize equipment/installation queries
    if (this.isEquipmentQuery(queryLower)) {
      console.log('🔧 Detected equipment query - normalizing');
      return this.normalizeEquipmentQuery(queryLower);
    }
    
    // General semantic normalization
    return this.applyGeneralNormalization(queryLower);
  }

  private static isPhoneSupportQuery(query: string): boolean {
    return (
      (query.includes('phone') || query.includes('number') || query.includes('contact')) &&
      (query.includes('support') || query.includes('call') || query.includes('reach') || query.includes('department'))
    ) || 
    !!query.match(/(how.*contact.*support|what.*number.*call|number.*available.*support|phone.*number.*support)/);
  }

  private static normalizePhoneSupportQuery(query: string): string {
    return query
      .replace(/how\s+can\s+i\s+contact\s+.*?support.*?by\s+phone/g, 'support phone number')
      .replace(/what\s+number\s+should\s+i\s+call\s+to\s+reach\s+support/g, 'support phone number')
      .replace(/is\s+there\s+a\s+phone\s+number\s+available\s+for.*?support/g, 'support phone number')
      .replace(/what.*phone\s+number.*support\s+department/g, 'support phone number')
      .replace(/contact.*support.*phone/g, 'support phone number')
      .replace(/support.*phone.*number/g, 'support phone number')
      .replace(/phone.*support/g, 'support phone number')
      .replace(/call.*support/g, 'support phone number');
  }

  private static isCustomerCommunicationQuery(query: string): boolean {
    return (query.includes('call') && query.includes('customer')) ||
           query.includes('wiring') && (query.includes('required') || query.includes('before'));
  }

  private static normalizeCustomerCommunicationQuery(query: string): string {
    return query
      .replace(/what\s+should\s+i\s+do\s+when.*wiring.*required/g, 'call customer before wiring')
      .replace(/should.*call.*customer/g, 'call customer before')
      .replace(/call.*customer.*before/g, 'call customer before')
      .replace(/customer.*before.*wiring/g, 'call customer before wiring');
  }

  private static isEquipmentQuery(query: string): boolean {
    return query.includes('equipment') || query.includes('package') || 
           query.includes('standard') || query.includes('installation');
  }

  private static normalizeEquipmentQuery(query: string): string {
    return query
      .replace(/what.*equipment.*included/g, 'standard equipment package')
      .replace(/standard.*package/g, 'standard equipment package')
      .replace(/installation.*equipment/g, 'equipment installation');
  }

  private static applyGeneralNormalization(query: string): string {
    // Apply general semantic transformations
    return query
      .replace(/how\s+do\s+i/g, 'how to')
      .replace(/what\s+is\s+the\s+process/g, 'process')
      .replace(/can\s+you\s+tell\s+me/g, '')
      .replace(/\s+/g, ' ')
      .trim();
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
