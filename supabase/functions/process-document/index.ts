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

// Import PDF parsing library
import pdfParse from 'https://esm.sh/pdf-parse@1.1.1';

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

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    let extractedContent = '';
    const fileType = document.file_type.toLowerCase();

    console.log('Extracting content from file type:', fileType);

    try {
      if (fileType === 'pdf') {
        // Extract text from PDF
        const arrayBuffer = await fileData.arrayBuffer();
        const pdfData = await pdfParse(new Uint8Array(arrayBuffer));
        extractedContent = pdfData.text;
        console.log('PDF text extracted, length:', extractedContent.length);
      } else if (fileType === 'txt') {
        // Extract text from TXT file
        extractedContent = await fileData.text();
        console.log('TXT content extracted, length:', extractedContent.length);
      } else if (fileType === 'docx') {
        // For DOCX files, we'll use a simpler approach for now
        // In production, you'd want to use mammoth.js or similar
        const arrayBuffer = await fileData.arrayBuffer();
        const text = new TextDecoder().decode(arrayBuffer);
        // Extract readable text (this is a simplified approach)
        extractedContent = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        console.log('DOCX content extracted (basic), length:', extractedContent.length);
      } else {
        // For other file types, try to extract as text
        extractedContent = await fileData.text();
        console.log('Generic text extraction, length:', extractedContent.length);
      }
    } catch (extractionError) {
      console.error('Text extraction error:', extractionError);
      // Fallback to basic text extraction
      try {
        extractedContent = await fileData.text();
      } catch (fallbackError) {
        console.error('Fallback extraction failed:', fallbackError);
        extractedContent = `Unable to extract text from ${document.name}. File type: ${fileType}`;
      }
    }

    if (!extractedContent || extractedContent.length < 10) {
      extractedContent = `Document ${document.name} was processed but no readable text content was found. This may be due to the file format or content structure.`;
    }

    console.log('Final extracted content preview:', extractedContent.substring(0, 200));

    // Create intelligent chunks from the content
    const chunks = createIntelligentChunks(extractedContent, document.name);
    console.log('Created chunks:', chunks.length);

    const documentChunks = chunks.map((content, index) => ({
      document_id: documentId,
      chunk_index: index,
      content: content.trim(),
      page_number: Math.floor(index / 3) + 1, // Rough page estimation
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
    if (openAIApiKey && extractedContent.length > 50) {
      try {
        console.log('Generating AI summary...');
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
                content: 'You are a helpful assistant that creates concise summaries and extracts keywords from documents. Focus on extracting key information, contact details, procedures, and important facts.'
              },
              {
                role: 'user',
                content: `Please create a concise summary and extract 5-10 relevant keywords from this document content. Pay special attention to contact information, emails, procedures, and important details:\n\n${extractedContent.substring(0, 8000)}\n\nFormat your response as:\nSUMMARY: [your summary]\nKEYWORDS: [comma-separated keywords]`
              }
            ],
            max_tokens: 800,
          }),
        });

        if (response.ok) {
          const aiResponse = await response.json();
          const content = aiResponse.choices[0].message.content;
          console.log('AI response received:', content.substring(0, 200));
          
          const summaryMatch = content.match(/SUMMARY:\s*(.+?)(?=KEYWORDS:|$)/s);
          const keywordsMatch = content.match(/KEYWORDS:\s*(.+)/s);
          
          if (summaryMatch) {
            aiSummary = summaryMatch[1].trim();
          }
          
          if (keywordsMatch) {
            keywords = keywordsMatch[1].split(',').map(k => k.trim()).filter(k => k.length > 0);
          }
          
          console.log('Extracted summary:', aiSummary?.substring(0, 100));
          console.log('Extracted keywords:', keywords);
        }
      } catch (aiError) {
        console.error('AI processing error:', aiError);
        // Continue without AI enhancement
      }
    }

    // Create content summary from extracted text
    const contentSummary = createContentSummary(extractedContent, documentChunks.length);

    // Update document with processing results
    const updateData: any = {
      processing_status: 'processed',
      total_chunks: documentChunks.length,
      content_summary: contentSummary,
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
        aiEnhanced: !!aiSummary,
        contentLength: extractedContent.length,
        fileType: fileType
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Document processing error:', error);
    
    // Update document with error status
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { documentId } = await req.json().catch(() => ({}));
      if (documentId) {
        await supabase
          .from('documents')
          .update({ 
            processing_status: 'error',
            processing_error: error.message 
          })
          .eq('id', documentId);
      }
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

// Helper function to create intelligent chunks
function createIntelligentChunks(text: string, fileName: string): string[] {
  if (!text || text.length < 50) {
    return [`Document: ${fileName}\n\nNo readable content could be extracted from this document.`];
  }

  const chunks: string[] = [];
  const maxChunkSize = 1000;
  const overlapSize = 100;

  // Split by paragraphs first, then by sentences if needed
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    
    if (currentChunk.length + trimmedParagraph.length > maxChunkSize) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        // Keep some overlap for context
        const sentences = currentChunk.split(/[.!?]+/).filter(s => s.trim().length > 0);
        currentChunk = sentences.slice(-2).join('. ').trim();
        if (currentChunk && !currentChunk.endsWith('.')) {
          currentChunk += '.';
        }
        currentChunk += '\n\n';
      }
    }
    
    currentChunk += trimmedParagraph + '\n\n';
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  // If no chunks were created (very short text), create one chunk
  if (chunks.length === 0) {
    chunks.push(text.trim());
  }

  console.log(`Created ${chunks.length} intelligent chunks from ${text.length} characters`);
  return chunks;
}

// Helper function to create content summary
function createContentSummary(extractedContent: string, chunkCount: number): string {
  const wordCount = extractedContent.split(/\s+/).length;
  const hasEmail = extractedContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
  const hasPhone = extractedContent.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g);
  const hasDates = extractedContent.match(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b\d{1,2}-\d{1,2}-\d{2,4}\b/g);
  
  let summary = `Document contains ${wordCount} words across ${chunkCount} sections.`;
  
  if (hasEmail) {
    summary += ` Contains ${hasEmail.length} email address(es).`;
  }
  if (hasPhone) {
    summary += ` Contains ${hasPhone.length} phone number(s).`;
  }
  if (hasDates) {
    summary += ` Contains ${hasDates.length} date reference(s).`;
  }
  
  return summary;
}
