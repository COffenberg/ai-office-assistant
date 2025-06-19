
import { supabase } from '@/integrations/supabase/client';
import { SearchResult, AnswerGenerationResult } from '@/types/knowledgeBase';
import { KnowledgeBaseSearchService } from './knowledgeBaseSearch';

export class AnswerGenerationService {
  constructor(
    private generateAIAnswer: (question: string, results: SearchResult[], history: any[]) => Promise<any>
  ) {}

  async generateAnswer(
    question: string,
    conversationHistory: any[] = []
  ): Promise<AnswerGenerationResult> {
    console.log('Generating answer for:', question);
    
    // Search for relevant content
    const results = await KnowledgeBaseSearchService.searchEnhanced(question);
    console.log('Search results for answer generation:', results);
    
    if (results.length > 0) {
      const bestMatch = results[0];
      console.log('Best match found:', bestMatch);
      
      // If we have a high-confidence match, use it directly
      if (bestMatch.relevanceScore > 0.8) {
        console.log('Using high-confidence direct match');
        
        // Increment usage count for Q&A pairs
        if (bestMatch.type === 'qa_pair') {
          await supabase.rpc('increment_qa_usage', { qa_id: bestMatch.id });
        }
        
        return {
          answer: bestMatch.answer,
          source: bestMatch.source,
          sourceType: bestMatch.type,
          sourceId: bestMatch.id,
          searchResults: results.slice(0, 3),
        };
      }
      
      // If we have moderate matches, try AI synthesis
      if (results.length > 1 && bestMatch.relevanceScore > 0.4) {
        console.log('Attempting AI synthesis with', results.length, 'results');
        
        try {
          const aiResult = await this.generateAIAnswer(question, results.slice(0, 5), conversationHistory);
          console.log('AI synthesis successful:', aiResult);
          
          return {
            answer: aiResult.answer,
            source: `AI-generated from ${aiResult.sources.length} sources`,
            sourceType: 'ai_generated',
            searchResults: results.slice(0, 5),
            aiGenerated: true,
          };
        } catch (aiError) {
          console.error('AI generation failed, using fallback:', aiError);
          // Fall back to manual synthesis
          const topResults = results.slice(0, 3);
          const synthesizedAnswer = `Based on available information:\n\n${topResults.map((result, index) => 
            `${index + 1}. ${result.answer} (Source: ${result.source})`
          ).join('\n\n')}`;
          
          return {
            answer: synthesizedAnswer,
            source: `Multiple sources (${topResults.length} references)`,
            sourceType: 'ai_generated',
            searchResults: topResults,
          };
        }
      }
    }

    console.log('No good matches found, returning default response');
    // No good match found
    return {
      answer: "I couldn't find a specific answer to your question in the current knowledge base. Here are some suggestions:\n\n1. Try rephrasing your question with different keywords\n2. Check if your question relates to company policies, procedures, or guidelines\n3. Contact your administrator if this topic should be added to the knowledge base",
      sourceType: 'ai_generated',
      searchResults: results.slice(0, 5),
    };
  }
}
