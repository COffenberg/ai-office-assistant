
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
    console.log('🤖 Generating answer for:', question);
    
    // Search for relevant content
    const results = await KnowledgeBaseSearchService.searchEnhanced(question);
    console.log('📊 Search results for answer generation:', results.length, 'results found');
    
    if (results.length > 0) {
      const bestMatch = results[0];
      console.log('🏆 Best match found:', {
        type: bestMatch.type,
        score: bestMatch.relevanceScore.toFixed(3),
        source: bestMatch.source,
        contentPreview: bestMatch.answer.substring(0, 100) + '...'
      });
      
      // Check for document-specific answers first (prioritize document content)
      const documentResults = results.filter(r => r.type === 'document');
      if (documentResults.length > 0) {
        console.log('📄 Found document results, checking for direct answers...');
        
        // Look for direct answers in document content
        const directAnswer = this.findDirectAnswerInDocuments(question, documentResults);
        if (directAnswer) {
          console.log('✅ Found direct answer in documents');
          return directAnswer;
        }
      }
      
      // Check if we have a very high-confidence direct match from Q&A
      if (bestMatch.relevanceScore > 0.8 && bestMatch.type === 'qa_pair') {
        console.log('✅ Using high-confidence Q&A match');
        
        await supabase.rpc('increment_qa_usage', { qa_id: bestMatch.id });
        
        return {
          answer: bestMatch.answer,
          source: bestMatch.source,
          sourceType: bestMatch.type,
          sourceId: bestMatch.id,
          searchResults: results.slice(0, 3),
        };
      }
      
      // If we have multiple good matches, try AI synthesis
      if (results.length > 0 && bestMatch.relevanceScore > 0.2) {
        console.log('🧠 Attempting AI synthesis with', results.length, 'results');
        
        try {
          const aiResult = await this.generateAIAnswer(question, results.slice(0, 5), conversationHistory);
          console.log('✅ AI synthesis successful');
          
          return {
            answer: aiResult.answer,
            source: `AI-generated from ${aiResult.sources.length} sources`,
            sourceType: 'ai_generated',
            searchResults: results.slice(0, 5),
            aiGenerated: true,
          };
        } catch (aiError) {
          console.error('❌ AI generation failed, using fallback:', aiError);
          
          // Enhanced fallback synthesis for documents
          if (documentResults.length > 0) {
            const topDocResult = documentResults[0];
            console.log('📄 Using top document result as fallback');
            
            return {
              answer: `Based on the document "${topDocResult.source}":\n\n${topDocResult.answer}`,
              source: topDocResult.source,
              sourceType: 'document',
              sourceId: topDocResult.id,
              searchResults: results.slice(0, 3),
            };
          }
          
          // Standard fallback synthesis
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
      console.log('✅ Using best single match');
      return {
        answer: bestMatch.answer,
        source: bestMatch.source,
        sourceType: bestMatch.type,
        sourceId: bestMatch.id,
        searchResults: results.slice(0, 3),
      };
    }

    console.log('❌ No good matches found, returning default response');
    // No good match found
    return {
      answer: "I couldn't find a specific answer to your question in the current knowledge base. Here are some suggestions:\n\n1. Try rephrasing your question with different keywords\n2. Check if your question relates to company policies, procedures, or guidelines\n3. Contact your administrator if this topic should be added to the knowledge base",
      sourceType: 'ai_generated',
      searchResults: [],
    };
  }

  private findDirectAnswerInDocuments(question: string, documentResults: SearchResult[]): AnswerGenerationResult | null {
    const questionLower = question.toLowerCase();
    
    console.log('🔍 Looking for direct answers in', documentResults.length, 'documents for:', questionLower);
    
    // Enhanced patterns for extracting specific information
    const patterns = [
      {
        keywords: ['equipment', 'package', 'standard', 'includes', 'included'],
        extractMethod: (content: string) => this.extractEquipmentList(content, questionLower)
      },
      {
        keywords: ['installation', 'install', 'setup', 'procedure'],
        extractMethod: (content: string) => this.extractInstallationInfo(content, questionLower)
      },
      {
        keywords: ['email', 'send to', 'contact', 'report to'],
        extractMethod: (content: string) => this.extractContactInfo(content, 'email')
      },
      {
        keywords: ['phone', 'call', 'number'],
        extractMethod: (content: string) => this.extractContactInfo(content, 'phone')
      },
      {
        keywords: ['deadline', 'due', 'within', 'hours', 'days'],
        extractMethod: (content: string) => this.extractTimeInfo(content)
      }
    ];

    for (const doc of documentResults) {
      console.log(`📄 Checking document: ${doc.source} (${doc.answer.length} chars)`);
      
      for (const pattern of patterns) {
        const hasKeyword = pattern.keywords.some(keyword => 
          questionLower.includes(keyword) && doc.answer.toLowerCase().includes(keyword)
        );
        
        if (hasKeyword) {
          console.log(`🎯 Found matching keywords for pattern: ${pattern.keywords[0]}`);
          
          const extracted = pattern.extractMethod(doc.answer);
          if (extracted) {
            console.log('✅ Direct answer extracted successfully');
            
            return {
              answer: extracted,
              source: doc.source,
              sourceType: 'document',
              sourceId: doc.id,
              searchResults: [doc],
            };
          }
        }
      }
    }
    
    console.log('❌ No direct answers found in documents');
    return null;
  }

  private extractEquipmentList(content: string, question: string): string | null {
    const contentLower = content.toLowerCase();
    
    // Look for equipment lists in various formats
    const equipmentPatterns = [
      /(?:standard\s+package|package\s+includes?|equipment\s+included?)[:\s]*\n?(.*?)(?:\n\n|\n(?:[A-Z]|\d+\.)|$)/gis,
      /(?:included\s+equipment|standard\s+equipment)[:\s]*\n?(.*?)(?:\n\n|\n(?:[A-Z]|\d+\.)|$)/gis,
      /(?:the\s+following\s+equipment|equipment\s+list)[:\s]*\n?(.*?)(?:\n\n|\n(?:[A-Z]|\d+\.)|$)/gis
    ];
    
    for (const pattern of equipmentPatterns) {
      const matches = [...content.matchAll(pattern)];
      if (matches.length > 0) {
        const equipmentText = matches[0][1]?.trim();
        if (equipmentText && equipmentText.length > 20) {
          console.log('📦 Found equipment list:', equipmentText.substring(0, 100));
          
          // Clean up the equipment list
          const cleaned = equipmentText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.match(/^[•\-\*]\s*$/))
            .join('\n');
          
          return `Based on the document, the Standard Package includes:\n\n${cleaned}`;
        }
      }
    }
    
    // Fallback: look for any content that mentions equipment and the question terms
    if (question.includes('standard') && question.includes('package')) {
      const sentences = content.split(/[.!?]+/);
      const relevantSentences = sentences.filter(sentence => 
        sentence.toLowerCase().includes('standard') && 
        sentence.toLowerCase().includes('package') &&
        sentence.length > 20
      );
      
      if (relevantSentences.length > 0) {
        return relevantSentences.slice(0, 3).join('. ').trim() + '.';
      }
    }
    
    return null;
  }

  private extractInstallationInfo(content: string, question: string): string | null {
    const questionLower = question.toLowerCase();
    
    // Handle "call customer" specific questions
    if (questionLower.includes('call') && questionLower.includes('customer')) {
      console.log('🎯 Looking for customer call information in content');
      
      // Look for specific patterns about calling customers
      const customerCallPatterns = [
        /(?:call\s+the\s+customer|contact\s+customer|call\s+customer)[^.]*?(?:before|prior to|day before)[^.]*?(?:installation|appointment)/gi,
        /(?:one\s+day\s+before|24\s+hours\s+before|day\s+prior)[^.]*?(?:call|contact)[^.]*?customer/gi,
        /(?:customer\s+must\s+be\s+called|call\s+customer)[^.]*?(?:before|prior|advance)/gi
      ];
      
      for (const pattern of customerCallPatterns) {
        const matches = [...content.matchAll(pattern)];
        if (matches.length > 0) {
          console.log('✅ Found customer call information:', matches[0][0]);
          
          // Extract surrounding context for better understanding
          const match = matches[0][0];
          const matchIndex = content.indexOf(match);
          const contextStart = Math.max(0, matchIndex - 100);
          const contextEnd = Math.min(content.length, matchIndex + match.length + 100);
          const context = content.substring(contextStart, contextEnd);
          
          return `Customer Communication Requirement:\n\n${context.trim()}`;
        }
      }
      
      // Fallback: look for any sentence mentioning customer and call/contact
      const sentences = content.split(/[.!?]+/);
      const relevantSentences = sentences.filter(sentence => {
        const sentenceLower = sentence.toLowerCase();
        return (sentenceLower.includes('customer') && 
                (sentenceLower.includes('call') || sentenceLower.includes('contact')) &&
                sentence.length > 20);
      });
      
      if (relevantSentences.length > 0) {
        console.log('✅ Found relevant customer communication sentence');
        return `Customer Communication:\n\n${relevantSentences[0].trim()}.`;
      }
    }
    
    // Standard installation procedure patterns
    const installationPatterns = [
      /(?:installation\s+procedure|installation\s+steps|how\s+to\s+install)[:\s]*\n?(.*?)(?:\n\n|\n(?:[A-Z]|\d+\.)|$)/gis,
      /(?:setup\s+instructions|installation\s+guide)[:\s]*\n?(.*?)(?:\n\n|\n(?:[A-Z]|\d+\.)|$)/gis
    ];
    
    for (const pattern of installationPatterns) {
      const matches = [...content.matchAll(pattern)];
      if (matches.length > 0) {
        const installText = matches[0][1]?.trim();
        if (installText && installText.length > 30) {
          return `Installation information:\n\n${installText}`;
        }
      }
    }
    
    return null;
  }

  private extractContactInfo(content: string, type: 'email' | 'phone'): string | null {
    const patterns = {
      email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
      phone: /(\b\d{3}[-.]?\d{3}[-.]?\d{4}\b)/g
    };
    
    // Look for contextual phone numbers (support, help desk, etc.)
    if (type === 'phone') {
      const contextualPatterns = [
        /(?:support|help\s*desk|customer\s*service|technical\s*support)[^:]*?:?\s*(\b\d{3}[-.]?\d{3}[-.]?\d{4}\b)/gi,
        /(?:call|phone|contact)[^:]*?:?\s*(\b\d{3}[-.]?\d{3}[-.]?\d{4}\b)/gi,
        /(\b\d{3}[-.]?\d{3}[-.]?\d{4}\b)[^.]*?(?:support|help|assistance)/gi
      ];
      
      for (const pattern of contextualPatterns) {
        const matches = [...content.matchAll(pattern)];
        if (matches.length > 0) {
          const phoneNumber = matches[0][1];
          console.log('📞 Found contextual phone number:', phoneNumber);
          
          // Find the context around the phone number
          const matchText = matches[0][0];
          const contextStart = Math.max(0, content.indexOf(matchText) - 50);
          const contextEnd = Math.min(content.length, content.indexOf(matchText) + matchText.length + 50);
          const context = content.substring(contextStart, contextEnd).trim();
          
          return `Support Contact Information:\n\n${context}`;
        }
      }
    }
    
    // Standard pattern matching
    const matches = [...content.matchAll(patterns[type])];
    if (matches.length > 0) {
      console.log(`📧 Found ${type}:`, matches[0][1]);
      return `Contact ${type}: ${matches[0][1]}`;
    }
    
    return null;
  }

  private extractTimeInfo(content: string): string | null {
    const timePattern = /(?:within|due|deadline|by)\s*(\d+\s*(?:hours?|days?|weeks?))/gi;
    const matches = [...content.matchAll(timePattern)];
    
    if (matches.length > 0) {
      return `Timeframe: ${matches[0][0]}`;
    }
    
    return null;
  }
}
