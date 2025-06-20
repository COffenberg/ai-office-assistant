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

    console.log('=== DOCUMENT PROCESSING START ===');
    console.log('Processing document ID:', documentId);

    // Get document details
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('Document not found:', docError);
      throw new Error('Document not found');
    }

    console.log('Document details:', {
      name: document.name,
      file_type: document.file_type,
      file_size: document.file_size,
      file_path: document.file_path
    });

    // Update processing status
    await supabase
      .from('documents')
      .update({ processing_status: 'processing' })
      .eq('id', documentId);

    // Download the file from storage
    console.log('Downloading file from storage...');
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(document.file_path);

    if (downloadError || !fileData) {
      console.error('File download failed:', downloadError);
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    console.log('File downloaded successfully, size:', fileData.size);

    let extractedContent = '';
    const fileType = document.file_type.toLowerCase();

    console.log('=== TEXT EXTRACTION START ===');
    console.log('File type:', fileType);

    try {
      if (fileType === 'pdf') {
        console.log('Processing PDF file...');
        // For now, we'll use a simple approach for PDFs
        // In production, you might want to use a more sophisticated PDF parser
        const arrayBuffer = await fileData.arrayBuffer();
        const text = new TextDecoder().decode(arrayBuffer);
        
        // Try to extract readable text from PDF
        const pdfTextRegex = /BT\s*\/\w+\s+\d+\s+Tf\s*[^)]*\)\s*Tj\s*ET|\/P\s*<<[^>]*>>\s*BDC[^E]*EMC/g;
        const matches = text.match(pdfTextRegex);
        
        if (matches && matches.length > 0) {
          extractedContent = matches.join(' ')
            .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        } else {
          extractedContent = text
            .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        }
        
        console.log('PDF extraction completed, content length:', extractedContent.length);
        
      } else if (fileType === 'txt') {
        console.log('Processing TXT file...');
        extractedContent = await fileData.text();
        console.log('TXT extraction completed, content length:', extractedContent.length);
        
      } else if (fileType === 'docx') {
        console.log('Processing DOCX file...');
        
        try {
          // DOCX files are ZIP archives containing XML files
          const arrayBuffer = await fileData.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Convert to string and try to extract readable content
          const docxContent = new TextDecoder('utf-8', { fatal: false }).decode(uint8Array);
          
          // Look for text content patterns in DOCX XML
          const textMatches = docxContent.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
          
          if (textMatches && textMatches.length > 0) {
            extractedContent = textMatches
              .map(match => match.replace(/<w:t[^>]*>([^<]+)<\/w:t>/, '$1'))
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim();
          } else {
            // Fallback: try to extract any readable text
            extractedContent = docxContent
              .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
          }
          
          console.log('DOCX extraction completed, content length:', extractedContent.length);
          
        } catch (docxError) {
          console.error('DOCX extraction error:', docxError);
          // Fallback to basic text extraction
          extractedContent = await fileData.text();
        }
        
      } else {
        console.log('Processing as generic text file...');
        extractedContent = await fileData.text();
        console.log('Generic extraction completed, content length:', extractedContent.length);
      }
      
    } catch (extractionError) {
      console.error('Primary extraction failed:', extractionError);
      
      // Fallback extraction
      console.log('Attempting fallback extraction...');
      try {
        extractedContent = await fileData.text();
        console.log('Fallback extraction succeeded, content length:', extractedContent.length);
      } catch (fallbackError) {
        console.error('Fallback extraction also failed:', fallbackError);
        extractedContent = `Content extraction failed for ${document.name}. File type: ${fileType}. Please check the file format and try again.`;
      }
    }

    // Validate extracted content
    if (!extractedContent || extractedContent.length < 10) {
      console.warn('Extracted content is too short or empty');
      extractedContent = `Document ${document.name} was processed but minimal readable content was extracted. This may be due to the file format, encoding, or content structure. File type: ${fileType}, File size: ${document.file_size} bytes.`;
    }

    console.log('=== EXTRACTED CONTENT PREVIEW ===');
    console.log('Content length:', extractedContent.length);
    console.log('First 500 characters:', extractedContent.substring(0, 500));
    console.log('Last 200 characters:', extractedContent.substring(Math.max(0, extractedContent.length - 200)));

    // Create intelligent chunks from the content
    console.log('=== CHUNKING START ===');
    const chunks = createIntelligentChunks(extractedContent, document.name);
    console.log('Created chunks:', chunks.length);

    // Log first few chunks for debugging
    chunks.slice(0, 3).forEach((chunk, index) => {
      console.log(`Chunk ${index + 1} preview:`, chunk.substring(0, 200));
    });

    const documentChunks = chunks.map((content, index) => ({
      document_id: documentId,
      chunk_index: index,
      content: content.trim(),
      page_number: Math.floor(index / 3) + 1,
    }));

    // Insert chunks
    if (documentChunks.length > 0) {
      console.log('Inserting', documentChunks.length, 'chunks into database...');
      const { error: chunksError } = await supabase
        .from('document_chunks')
        .insert(documentChunks);

      if (chunksError) {
        console.error('Error inserting chunks:', chunksError);
        throw chunksError;
      }
      console.log('Chunks inserted successfully');
    }

    let aiSummary = null;
    let keywords: string[] = [];

    // Generate AI summary if OpenAI is available
    if (openAIApiKey && extractedContent.length > 50) {
      try {
        console.log('=== AI SUMMARY GENERATION START ===');
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
            console.log('AI summary extracted:', aiSummary.substring(0, 100));
          }
          
          if (keywordsMatch) {
            keywords = keywordsMatch[1].split(',').map(k => k.trim()).filter(k => k.length > 0);
            console.log('AI keywords extracted:', keywords);
          }
        } else {
          console.error('AI API response not ok:', response.status, response.statusText);
        }
      } catch (aiError) {
        console.error('AI processing error:', aiError);
      }
    } else {
      console.log('Skipping AI summary - OpenAI key not available or content too short');
    }

    // Create content summary from extracted text
    const contentSummary = createContentSummary(extractedContent, documentChunks.length);
    console.log('Content summary created:', contentSummary);

    // Update document with processing results
    const updateData: any = {
      processing_status: 'processed',
      total_chunks: documentChunks.length,
      content_summary: contentSummary,
      last_processed_at: new Date().toISOString(),
    };

    if (aiSummary) updateData.ai_summary = aiSummary;
    if (keywords.length > 0) updateData.keywords = keywords;

    console.log('Updating document with results...');
    await supabase
      .from('documents')
      .update(updateData)
      .eq('id', documentId);

    console.log('=== DOCUMENT PROCESSING COMPLETE ===');
    console.log('Results:', {
      chunksCreated: documentChunks.length,
      aiEnhanced: !!aiSummary,
      contentLength: extractedContent.length,
      fileType: fileType
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        chunksCreated: documentChunks.length,
        aiEnhanced: !!aiSummary,
        contentLength: extractedContent.length,
        fileType: fileType,
        contentPreview: extractedContent.substring(0, 200)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('=== DOCUMENT PROCESSING ERROR ===');
    console.error('Error details:', error);
    
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
    summary += ` Contains ${hasEmail.length} email address(es): ${hasEmail.slice(0, 3).join(', ')}.`;
  }
  if (hasPhone) {
    summary += ` Contains ${hasPhone.length} phone number(s).`;
  }
  if (hasDates) {
    summary += ` Contains ${hasDates.length} date reference(s).`;
  }
  
  return summary;
}
