
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { documentId } = await req.json();

    console.log('Processing document:', documentId);

    // Get document details
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error('Document not found');
    }

    // Update processing status
    await supabase
      .from('documents')
      .update({ processing_status: 'processing' })
      .eq('id', documentId);

    // For now, simulate text extraction (in production, you'd use proper PDF/Word parsers)
    const mockContent = `This is extracted content from ${document.name}. 
    It contains important information about company policies, procedures, and guidelines.
    This content would normally be extracted using PDF parsing libraries.`;

    // Create chunks from the content
    const chunks = mockContent.split('\n').filter(chunk => chunk.trim().length > 0);
    const documentChunks = chunks.map((content, index) => ({
      document_id: documentId,
      chunk_index: index,
      content: content.trim(),
      page_number: Math.floor(index / 3) + 1, // Simulate page numbers
    }));

    // Insert chunks
    if (documentChunks.length > 0) {
      const { error: chunksError } = await supabase
        .from('document_chunks')
        .insert(documentChunks);

      if (chunksError) {
        console.error('Error inserting chunks:', chunksError);
        throw chunksError;
      }
    }

    let aiSummary = null;
    let keywords: string[] = [];

    // Generate AI summary if OpenAI is available
    if (openAIApiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful assistant that creates concise summaries and extracts keywords from documents.'
              },
              {
                role: 'user',
                content: `Please create a concise summary and extract 5-10 relevant keywords from this document content:\n\n${mockContent}\n\nFormat your response as:\nSUMMARY: [your summary]\nKEYWORDS: [comma-separated keywords]`
              }
            ],
            max_tokens: 500,
          }),
        });

        if (response.ok) {
          const aiResponse = await response.json();
          const content = aiResponse.choices[0].message.content;
          
          const summaryMatch = content.match(/SUMMARY:\s*(.+?)(?=KEYWORDS:|$)/s);
          const keywordsMatch = content.match(/KEYWORDS:\s*(.+)/s);
          
          if (summaryMatch) {
            aiSummary = summaryMatch[1].trim();
          }
          
          if (keywordsMatch) {
            keywords = keywordsMatch[1].split(',').map(k => k.trim()).filter(k => k.length > 0);
          }
        }
      } catch (aiError) {
        console.error('AI processing error:', aiError);
        // Continue without AI enhancement
      }
    }

    // Update document with processing results
    const updateData: any = {
      processing_status: 'processed',
      total_chunks: documentChunks.length,
      content_summary: `Document contains ${documentChunks.length} sections with information about company policies and procedures.`,
      last_processed_at: new Date().toISOString(),
    };

    if (aiSummary) updateData.ai_summary = aiSummary;
    if (keywords.length > 0) updateData.keywords = keywords;

    await supabase
      .from('documents')
      .update(updateData)
      .eq('id', documentId);

    console.log('Document processing completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        chunksCreated: documentChunks.length,
        aiEnhanced: !!aiSummary 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Document processing error:', error);
    
    // Update document with error status
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase
        .from('documents')
        .update({ 
          processing_status: 'error',
          processing_error: error.message 
        })
        .eq('id', req.body?.documentId);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
