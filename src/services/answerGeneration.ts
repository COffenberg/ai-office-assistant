
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
    
    // Define question types with more specific matching
    const questionTypes = [
      {
        type: 'customer_contact',
        keywords: ['call', 'contact', 'customer', 'before', 'day'],
        priority: 1
      },
      {
        type: 'control_panel_location',
        keywords: ['control', 'panel', 'unit', 'where', 'install', 'mount'],
        priority: 1
      },
      {
        type: 'app_testing',
        keywords: ['app', 'test', 'before', 'leaving', 'site', 'sensor'],
        priority: 1
      },
      {
        type: 'post_installation',
        keywords: ['after', 'installation', 'complete', 'customer', 'done'],
        priority: 1
      },
      {
        type: 'equipment_list',
        keywords: ['equipment', 'package', 'standard', 'includes', 'included'],
        priority: 2
      },
      {
        type: 'contact_info',
        keywords: ['email', 'send', 'report', 'contact'],
        priority: 3
      }
    ];

    // Sort documents by relevance score (best first)
    const sortedDocs = [...documentResults].sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    for (const doc of sortedDocs) {
      console.log(`📄 Analyzing document: ${doc.source} (${doc.answer.length} chars, score: ${doc.relevanceScore.toFixed(3)})`);
      
      // Try to identify question type based on keywords
      const matchingTypes = questionTypes.filter(type => {
        const keywordMatches = type.keywords.filter(keyword => questionLower.includes(keyword)).length;
        return keywordMatches >= 2; // Need at least 2 keyword matches
      }).sort((a, b) => a.priority - b.priority); // Sort by priority
      
      if (matchingTypes.length > 0) {
        const questionType = matchingTypes[0];
        console.log(`🎯 Identified question type: ${questionType.type}`);
        
        // Try type-specific extraction
        let extracted = null;
        
        switch (questionType.type) {
          case 'customer_contact':
          case 'control_panel_location':
          case 'app_testing':
          case 'post_installation':
            extracted = this.extractInstallationInfo(doc.answer, questionLower);
            break;
          case 'equipment_list':
            extracted = this.extractEquipmentList(doc.answer, questionLower);
            break;
          case 'contact_info':
            extracted = this.extractContactInfo(doc.answer, 'email');
            break;
        }
        
        if (extracted) {
          console.log('✅ Direct answer extracted successfully using type-specific method');
          
          return {
            answer: extracted,
            source: doc.source,
            sourceType: 'document',
            sourceId: doc.id,
            searchResults: [doc],
          };
        }
      }
      
      // Fallback: try generic keyword matching for any relevant content
      console.log('🔄 Trying generic content extraction as fallback');
      
      const questionWords = questionLower.split(/\s+/).filter(w => w.length > 2);
      const sentences = doc.answer.split(/[.!?]+/).filter(s => s.trim().length > 30);
      
      // Find sentences that contain multiple question keywords
      const relevantSentences = sentences.filter(sentence => {
        const sentenceLower = sentence.toLowerCase();
        const matchingWords = questionWords.filter(word => sentenceLower.includes(word));
        return matchingWords.length >= Math.min(2, questionWords.length);
      });
      
      if (relevantSentences.length > 0) {
        console.log('✅ Found relevant content using generic matching');
        
        // Take the most relevant sentences (up to 3)
        const answer = relevantSentences.slice(0, 3).map(s => s.trim()).join('. ') + '.';
        
        return {
          answer: `Based on the document:\n\n${answer}`,
          source: doc.source,
          sourceType: 'document',
          sourceId: doc.id,
          searchResults: [doc],
        };
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
    console.log('🔧 Extracting installation info for question:', question);
    console.log('📄 Content length:', content.length, 'chars');
    console.log('📄 Content preview:', content.substring(0, 300) + '...');
    
    const questionLower = question.toLowerCase();
    
    // Enhanced patterns for specific installation questions
    
    // 1. Control panel/unit installation location
    if ((questionLower.includes('control') && questionLower.includes('unit')) || 
        (questionLower.includes('control') && questionLower.includes('panel')) ||
        (questionLower.includes('where') && questionLower.includes('install'))) {
      console.log('🎯 Looking for control panel installation info');
      
      const controlPanelPatterns = [
        // Look for "Mount the control panel at 1.4 meters height" type content
        /mount\s+(?:the\s+)?control\s+panel\s+at\s+[\d.]+\s*(?:meters?|m)\s+height[^.]*\./gi,
        /control\s+panel[^.]*(?:mount|install|place)[^.]*(?:height|meters?|m)[^.]*\./gi,
        /(?:install|mount|place)\s+(?:the\s+)?control\s+panel[^.]*(?:height|meters?|m)[^.]*\./gi,
        // Broader control panel installation patterns
        /control\s+panel[^.]*(?:installation|mounting|placement)[^.]*\./gi,
        /(?:primary|main)\s+control\s+unit[^.]*(?:installation|mounting|placement)[^.]*\./gi
      ];
      
      for (const pattern of controlPanelPatterns) {
        const matches = [...content.matchAll(pattern)];
        if (matches.length > 0) {
          console.log('✅ Found control panel installation info:', matches[0][0]);
          
          // Get the sentence and some context
          const match = matches[0][0];
          const sentences = content.split(/[.!?]+/);
          const matchingSentence = sentences.find(s => s.includes(match.substring(0, 20)));
          
          if (matchingSentence) {
            return `Control Panel Installation:\n\n${matchingSentence.trim()}.`;
          }
          
          return `Control Panel Installation:\n\n${match}`;
        }
      }
    }
    
    // 2. App testing before leaving site
    if ((questionLower.includes('app') && questionLower.includes('before')) ||
        (questionLower.includes('test') && questionLower.includes('app')) ||
        (questionLower.includes('leaving') && questionLower.includes('site'))) {
      console.log('🎯 Looking for app testing requirements');
      
      const appTestingPatterns = [
        /(?:all\s+)?sensors?\s+should\s+be\s+tested\s+via\s+(?:the\s+)?app\s+before[^.]*\./gi,
        /test\s+(?:all\s+)?sensors?\s+(?:via|through|in)\s+(?:the\s+)?app\s+before[^.]*\./gi,
        /before\s+(?:final|leaving)[^.]*test[^.]*(?:sensors?|app)[^.]*\./gi,
        /(?:sensors?|devices?)\s+(?:must\s+)?(?:be\s+)?tested[^.]*app[^.]*before[^.]*\./gi
      ];
      
      for (const pattern of appTestingPatterns) {
        const matches = [...content.matchAll(pattern)];
        if (matches.length > 0) {
          console.log('✅ Found app testing info:', matches[0][0]);
          
          const match = matches[0][0];
          return `App Testing Requirement:\n\n${match}`;
        }
      }
    }
    
    // 3. Customer contact requirements
    if ((questionLower.includes('contact') && questionLower.includes('customer')) ||
        (questionLower.includes('call') && questionLower.includes('customer')) ||
        (questionLower.includes('customer') && questionLower.includes('before'))) {
      console.log('🎯 Looking for customer contact requirements');
      
      const customerContactPatterns = [
        // Specific "1 day before" pattern
        /always\s+call\s+(?:the\s+)?customer\s+1\s+day\s+before[^.]*\./gi,
        /call\s+(?:the\s+)?customer\s+1\s+day\s+before[^.]*\./gi,
        // General customer call patterns
        /(?:always\s+)?(?:call|contact)\s+(?:the\s+)?customer[^.]*(?:before|prior\s+to)[^.]*(?:installation|visit)[^.]*\./gi,
        /customer\s+(?:must\s+)?(?:be\s+)?(?:called|contacted)[^.]*before[^.]*\./gi,
        // Wiring-related customer contact
        /(?:if|when)\s+wiring\s+is\s+required[^.]*customer[^.]*\./gi
      ];
      
      for (const pattern of customerContactPatterns) {
        const matches = [...content.matchAll(pattern)];
        if (matches.length > 0) {
          console.log('✅ Found customer contact info:', matches[0][0]);
          
          const match = matches[0][0];
          return `Customer Contact Requirement:\n\n${match}`;
        }
      }
    }
    
    // 4. Post-installation completion requirements
    if ((questionLower.includes('after') && questionLower.includes('installation')) ||
        (questionLower.includes('complete') && questionLower.includes('installation')) ||
        (questionLower.includes('done') && questionLower.includes('customer'))) {
      console.log('🎯 Looking for post-installation requirements');
      
      const postInstallationPatterns = [
        /after\s+(?:the\s+)?installation[^.]*(?:customer|complete|done)[^.]*\./gi,
        /(?:when|once)\s+installation\s+is\s+complete[^.]*\./gi,
        /installation\s+(?:complete|finished)[^.]*customer[^.]*\./gi,
        /(?:must\s+)?(?:be\s+)?done\s+(?:with\s+)?(?:the\s+)?customer\s+after[^.]*\./gi
      ];
      
      for (const pattern of postInstallationPatterns) {
        const matches = [...content.matchAll(pattern)];
        if (matches.length > 0) {
          console.log('✅ Found post-installation info:', matches[0][0]);
          
          const match = matches[0][0];
          return `Post-Installation Requirement:\n\n${match}`;
        }
      }
    }
    
    // 5. Wiring safety requirements
    if (questionLower.includes('wiring') && questionLower.includes('required')) {
      console.log('🎯 Looking for wiring safety requirements');
      
      const wiringSafetyPatterns = [
        /if\s+wiring\s+is\s+required[^.]*turn\s+off\s+power\s+at\s+(?:the\s+)?fusebox\s+first[^.]*\./gi,
        /when\s+wiring\s+is\s+required[^.]*power[^.]*fusebox[^.]*\./gi,
        /wiring\s+.*?required[^.]*(?:power|fusebox|electrical\s+safety)[^.]*\./gi
      ];
      
      for (const pattern of wiringSafetyPatterns) {
        const matches = [...content.matchAll(pattern)];
        if (matches.length > 0) {
          console.log('✅ Found wiring safety info:', matches[0][0]);
          
          const match = matches[0][0];
          return `Wiring Safety Requirement:\n\n${match}`;
        }
      }
    }
    
    // Fallback: look for any installation-related content that matches question keywords
    console.log('🔄 Using fallback extraction for installation content');
    
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const questionWords = questionLower.split(/\s+/).filter(w => w.length > 2);
    
    const relevantSentences = sentences.filter(sentence => {
      const sentenceLower = sentence.toLowerCase();
      const matchCount = questionWords.filter(word => sentenceLower.includes(word)).length;
      return matchCount >= Math.min(2, questionWords.length);
    });
    
    if (relevantSentences.length > 0) {
      console.log('✅ Found relevant installation sentence via fallback');
      const bestSentence = relevantSentences[0].trim();
      return `Installation Information:\n\n${bestSentence}.`;
    }
    
    console.log('❌ No installation information found');
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
