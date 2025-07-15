export class QuestionNormalizationService {
  // Common question patterns mapped to canonical forms
  private static readonly SEMANTIC_PATTERNS = [
    // Phone/Contact Support patterns
    {
      patterns: [
        /how.*contact.*support.*phone/i,
        /how.*contact.*support.*department.*phone/i,
        /what.*number.*call.*support/i,
        /what.*number.*call.*reach.*support/i,
        /phone.*number.*support/i,
        /support.*phone.*number/i,
        /contact.*support.*phone/i,
        /how.*reach.*support/i,
        /support.*contact.*number/i,
        /call.*support.*number/i,
        /is.*phone.*number.*support/i,
        /phone.*number.*available.*support/i
      ],
      canonical: 'phone number support contact',
      intent: 'support_phone',
      keywords: ['phone', 'number', 'support', 'contact', 'call']
    },
    
    // Customer Communication patterns
    {
      patterns: [
        /call.*customer.*before/i,
        /should.*call.*customer/i,
        /customer.*call.*before/i,
        /contact.*customer.*installation/i,
        /wiring.*required.*customer/i,
        /before.*installation.*customer/i,
        /customer.*communication.*before/i
      ],
      canonical: 'call customer before installation',
      intent: 'customer_communication',
      keywords: ['call', 'customer', 'before', 'installation', 'wiring', 'contact']
    },
    
    // Equipment/Package patterns
    {
      patterns: [
        /what.*equipment.*included/i,
        /standard.*package.*equipment/i,
        /comes.*with.*installation/i,
        /equipment.*package.*standard/i,
        /included.*standard.*package/i,
        /what.*comes.*standard/i,
        /equipment.*list/i
      ],
      canonical: 'equipment package standard installation included',
      intent: 'equipment_inquiry',
      keywords: ['equipment', 'package', 'standard', 'installation', 'included', 'comes']
    },
    
    // Process/Procedure patterns
    {
      patterns: [
        /how.*to.*process/i,
        /what.*procedure/i,
        /steps.*to.*follow/i,
        /what.*should.*do/i,
        /process.*procedure/i,
        /how.*should.*proceed/i
      ],
      canonical: 'process procedure steps how to',
      intent: 'process_inquiry',
      keywords: ['process', 'procedure', 'steps', 'how', 'should', 'do']
    }
  ];

  /**
   * Normalizes a question to its canonical form and extracts semantic information
   */
  static normalizeQuestion(question: string): {
    normalized: string;
    intent: string | null;
    keywords: string[];
    semanticScore: number;
  } {
    const cleanQuestion = question.trim().toLowerCase();
    console.log('🔍 DEBUG: QuestionNormalizationService.normalizeQuestion called with:', cleanQuestion);
    
    // Check against semantic patterns
    for (const pattern of this.SEMANTIC_PATTERNS) {
      console.log('🔍 DEBUG: Checking pattern:', pattern.intent);
      for (const regex of pattern.patterns) {
        console.log('🔍 DEBUG: Testing regex:', regex.source, 'against:', cleanQuestion);
        if (regex.test(cleanQuestion)) {
          console.log('✅ DEBUG: Pattern matched!', pattern.intent, 'returning:', pattern.canonical);
          return {
            normalized: pattern.canonical,
            intent: pattern.intent,
            keywords: pattern.keywords,
            semanticScore: 0.95 // High semantic match
          };
        }
      }
    }
    
    // If no pattern matches, extract keywords and create normalized form
    const keywords = this.extractKeywords(cleanQuestion);
    
    return {
      normalized: keywords.join(' '),
      intent: null,
      keywords,
      semanticScore: 0.5 // Fallback keyword matching
    };
  }

  /**
   * Extracts meaningful keywords from a question
   */
  private static extractKeywords(question: string): string[] {
    // Remove common question words and stopwords
    const stopwords = new Set([
      'what', 'how', 'when', 'where', 'why', 'who', 'which', 'can', 'could',
      'should', 'would', 'will', 'do', 'does', 'did', 'is', 'are', 'was', 'were',
      'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
      'with', 'by', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him',
      'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
    ]);
    
    return question
      .split(/\s+/)
      .map(word => word.replace(/[^\w]/g, ''))
      .filter(word => word.length > 2 && !stopwords.has(word))
      .slice(0, 8); // Limit to most important keywords
  }

  /**
   * Creates multiple query variants for enhanced matching
   */
  static createQueryVariants(question: string): string[] {
    const normalized = this.normalizeQuestion(question);
    const variants = [question]; // Original question
    
    // Add normalized form
    if (normalized.normalized !== question.toLowerCase()) {
      variants.push(normalized.normalized);
    }
    
    // Add keyword-only variant
    if (normalized.keywords.length > 0) {
      variants.push(normalized.keywords.join(' '));
    }
    
    // Add intent-based variant if available
    if (normalized.intent) {
      const intentKeywords = this.getIntentKeywords(normalized.intent);
      if (intentKeywords) {
        variants.push(intentKeywords);
      }
    }
    
    return [...new Set(variants)]; // Remove duplicates
  }

  /**
   * Gets the primary keywords for a specific intent
   */
  private static getIntentKeywords(intent: string): string | null {
    const intentMap: Record<string, string> = {
      'support_phone': 'phone support contact number',
      'customer_communication': 'customer call before installation',
      'equipment_inquiry': 'equipment package standard',
      'process_inquiry': 'process procedure steps'
    };
    
    return intentMap[intent] || null;
  }

  /**
   * Calculates semantic similarity between two questions
   */
  static calculateSemanticSimilarity(question1: string, question2: string): number {
    const norm1 = this.normalizeQuestion(question1);
    const norm2 = this.normalizeQuestion(question2);
    
    // Intent match gets highest score
    if (norm1.intent && norm1.intent === norm2.intent) {
      return 0.95;
    }
    
    // Keyword overlap scoring
    const keywords1 = new Set(norm1.keywords);
    const keywords2 = new Set(norm2.keywords);
    const intersection = new Set([...keywords1].filter(k => keywords2.has(k)));
    const union = new Set([...keywords1, ...keywords2]);
    
    if (union.size === 0) return 0;
    
    const jaccardSimilarity = intersection.size / union.size;
    
    // Boost score for high-quality semantic patterns
    const semanticBoost = Math.max(norm1.semanticScore, norm2.semanticScore) - 0.5;
    
    return Math.min(0.9, jaccardSimilarity + semanticBoost);
  }
}