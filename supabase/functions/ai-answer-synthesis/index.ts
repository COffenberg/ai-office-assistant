
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, searchResults, conversationHistory = [] } = await req.json();

    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get('Authorization')! },
      },
    });

    // Prepare context from search results
    const context = searchResults.map((result: any, index: number) => 
      `[Source ${index + 1}: ${result.source}]\n${result.answer || result.content}`
    ).join('\n\n');

    // Prepare conversation history context
    const conversationContext = conversationHistory.slice(-6).map((msg: any) => 
      `${msg.role}: ${msg.content}`
    ).join('\n');

    const systemPrompt = `You are a helpful AI assistant for a company knowledge base. Your job is to provide accurate, helpful answers based ONLY on the provided context from company documents and Q&A pairs.

CRITICAL INSTRUCTIONS:
- ONLY use information from the provided context below
- NEVER use external knowledge or make assumptions
- If the context doesn't contain the answer, clearly state that the information is not available
- Be specific and direct in your answers
- When listing equipment, procedures, or specific information, extract the exact details from the context
- If asked about equipment in a package, list all items mentioned in the relevant section
- Always reference the source when providing specific information

CONTEXT ANALYSIS:
- Look for section headings, bullet points, and numbered lists
- Pay attention to specific equipment names, model numbers, and technical details
- Extract complete lists when requested (e.g., "Standard Package includes...")
- Identify installation procedures, contact information, and time requirements

Context from company knowledge base:
${context}

${conversationContext ? `Previous conversation context:\n${conversationContext}\n` : ''}

Remember: Only provide information that is explicitly stated in the context above. Do not add external knowledge or make assumptions.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    const answer = aiResponse.choices[0].message.content;

    return new Response(
      JSON.stringify({ 
        answer,
        sources: searchResults.map((r: any) => ({
          id: r.id,
          source: r.source,
          type: r.type
        })),
        aiGenerated: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI synthesis error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
