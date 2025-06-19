
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

    const systemPrompt = `You are a helpful AI assistant for a company knowledge base. Your job is to provide accurate, helpful answers based on the provided context from company documents and Q&A pairs.

Guidelines:
- Always base your answers on the provided context
- If you can't find relevant information in the context, say so clearly
- Be concise but comprehensive
- Include source references when possible
- If there are multiple relevant sources, synthesize the information
- Maintain a professional, helpful tone

Context from company knowledge base:
${context}

${conversationContext ? `Previous conversation context:\n${conversationContext}\n` : ''}`;

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
