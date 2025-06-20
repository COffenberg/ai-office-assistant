
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
    console.log('Search results for answer generation:', results.length, 'results found');
    
    if (results.length > 0) {
      const bestMatch = results[0];
      console.log('Best match found:', {
        type: bestMatch.type,
        score: bestMatch.relevanceScore,
        source: bestMatch.source,
        contentPreview: bestMatch.answer.substring(0, 100)
      });
      
      // Check if we have a very high-confidence direct match
      if (bestMatch.relevanceScore > 0.7) {
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
      
      // Check for document-specific answers that might contain exact information
      const documentResults = results.filter(r => r.type === 'document');
      if (documentResults.length > 0) {
        console.log('Found document results, checking for direct answers...');
        
        // Look for direct answers in document content
        const directAnswer = this.findDirectAnswerInDocuments(question, documentResults);
        if (directAnswer) {
          console.log('Found direct answer in documents');
          return directAnswer;
        }
      }
      
      // If we have multiple good matches, try AI synthesis
      if (results.length > 1 && bestMatch.relevanceScore > 0.3) {
        console.log('Attempting AI synthesis with', results.length, 'results');
        
        try {
          const aiResult = await this.generateAIAnswer(question, results.slice(0, 5), conversationHistory);
          console.log('AI synthesis successful');
          
          return {
            answer: aiResult.answer,
            source: `AI-generated from ${aiResult.sources.length} sources`,
            sourceType: 'ai_generated',
            searchResults: results.slice(0, 5),
            aiGenerated: true,
          };
        } catch (aiError) {
          console.error('AI generation failed, using fallback:', aiError);
          
          // Enhanced fallback synthesis
          const topResults = results.slice(0, 3);
          let synthesizedAnswer = 'Based on the available information:\n\n';
          
          topResults.forEach((result, index) => {
            synthesizedAnswer += `${index + 1}. ${result.answer}\n   (Source: ${result.source})\n\n`;
          });
          
          return {
            answer: synthesizedAnswer,
            source: `Multiple sources (${topResults.length} references)`,
            sourceType: 'ai_generated',
            searchResults: topResults,
          };
        }
      }
      
      // Use the best single match
      console.log('Using best single match');
      return {
        answer: bestMatch.answer,
        source: bestMatch.source,
        sourceType: bestMatch.type,
        sourceId: bestMatch.id,
        searchResults: results.slice(0, 3),
      };
    }

    console.log('No good matches found, returning default response');
    // No good match found
    return {
      answer: "I couldn't find a specific answer to your question in the current knowledge base. Here are some suggestions:\n\n1. Try rephrasing your question with different keywords\n2. Check if your question relates to company policies, procedures, or guidelines\n3. Contact your administrator if this topic should be added to the knowledge base",
      sourceType: 'ai_generated',
      searchResults: [],
    };
  }

  private findDirectAnswerInDocuments(question: string, documentResults: SearchResult[]): AnswerGenerationResult | null {
    const questionLower = question.toLowerCase();
    
    // Common patterns for extracting specific information
    const patterns = [
      {
        keywords: ['email', 'send to', 'contact', 'report to'],
        regex: /(?:email|send|report|contact).*?(?:to|at)\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi
      },
      {
        keywords: ['phone', 'call', 'number'],
        regex: /(?:phone|call|number|contact).*?(\b\d{3}[-.]?\d{3}[-.]?\d{4}\b)/gi
      },
      {
        keywords: ['deadline', 'due', 'within', 'hours', 'days'],
        regex: /(?:within|due|deadline|by)\s*(\d+\s*(?:hours?|days?|weeks?))/gi
      }
    ];

    for (const doc of documentResults) {
      const content = doc.answer.toLowerCase();
      
      // Check if the question keywords match the content
      const hasRelevantKeywords = patterns.some(pattern => 
        pattern.keywords.some(keyword => questionLower.includes(keyword) && content.includes(keyword))
      );

      if (hasRelevantKeywords) {
        // Try to extract specific information
        for (const pattern of patterns) {
          if (pattern.keywords.some(keyword => questionLower.includes(keyword))) {
            const matches = [...doc.answer.matchAll(pattern.regex)];
            if (matches.length > 0) {
              // Found a direct match, extract surrounding context
              const match = matches[0];
              const matchIndex = match.index || 0;
              const contextStart = Math.max(0, matchIndex - 100);
              const contextEnd = Math.min(doc.answer.length, matchIndex + match[0].length + 100);
              const context = doc.answer.substring(contextStart, contextEnd).trim();
              
              console.log('Direct answer extracted:', match[0]);
              
              return {
                answer: context,
                source: doc.source,
                sourceType: 'document',
                sourceId: doc.id,
                searchResults: [doc],
              };
            }
          }
        }
      }
    }
    
    return null;
  }
}
