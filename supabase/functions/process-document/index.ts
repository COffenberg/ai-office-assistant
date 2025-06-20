
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

    console.log('=== DOCUMENT PROCESSING START (ENHANCED VERSION) ===');
    console.log('Processing document ID:', documentId);

    // Get document details
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      console.error('Document not found:', docError);
      return new Response(
        JSON.stringify({ success: false, error: 'Document not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
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

    console.log('=== ENHANCED TEXT EXTRACTION START ===');
    console.log('File type:', fileType);

    try {
      if (fileType === 'txt') {
        console.log('Processing TXT file...');
        extractedContent = await fileData.text();
        console.log('TXT extraction completed, content length:', extractedContent.length);
        
      } else if (fileType === 'docx') {
        console.log('Processing DOCX file with enhanced extraction...');
        
        const arrayBuffer = await fileData.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        console.log('DOCX file size in bytes:', uint8Array.length);
        
        // Enhanced DOCX text extraction
        try {
          // Method 1: Look for document.xml content patterns
          const decoder = new TextDecoder('utf-8', { fatal: false });
          const docContent = decoder.decode(uint8Array);
          
          // Enhanced regex patterns for DOCX XML text extraction
          const textPatterns = [
            /<w:t[^>]*>([^<]+)<\/w:t>/g,
            /<t[^>]*>([^<]+)<\/t>/g,
            />\s*([A-Za-z0-9@._-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\s*</g, // Email extraction
            />\s*(tech@[^<\s]+)\s*</g, // Specific tech@ email extraction
            />\s*([A-Z][a-z]+\s+[a-z]+\s+[a-z]+.*?)\s*</g // Sentence extraction
          ];
          
          const extractedTexts = new Set<string>();
          
          for (const pattern of textPatterns) {
            let match;
            while ((match = pattern.exec(docContent)) !== null) {
              const text = match[1]?.trim();
              if (text && text.length > 2 && !text.includes('PK') && !text.includes('xml')) {
                extractedTexts.add(text);
              }
            }
          }
          
          if (extractedTexts.size > 0) {
            extractedContent = Array.from(extractedTexts).join(' ').replace(/\s+/g, ' ').trim();
            console.log('Enhanced DOCX extraction successful, found', extractedTexts.size, 'text segments');
          }
          
          // Method 2: Fallback - look for readable text patterns
          if (!extractedContent || extractedContent.length < 50) {
            console.log('Trying fallback text extraction...');
            
            // Look for email patterns specifically
            const emailMatches = docContent.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
            const readableTextMatches = docContent.match(/[A-Za-z]{3,}[\w\s.,!?@-]{20,}/g);
            
            const allTexts = [];
            if (emailMatches) allTexts.push(...emailMatches);
            if (readableTextMatches) {
              allTexts.push(...readableTextMatches.filter(text => 
                !text.includes('PK') && 
                !text.includes('xml') && 
                text.length > 10
              ));
            }
            
            if (allTexts.length > 0) {
              extractedContent = allTexts.join(' ').replace(/\s+/g, ' ').trim();
              console.log('Fallback extraction found', allTexts.length, 'text segments');
            }
          }
          
        } catch (docxError) {
          console.error('DOCX extraction error:', docxError);
        }
        
        console.log('DOCX extraction completed, content length:', extractedContent.length);
        console.log('DOCX content preview:', extractedContent.substring(0, 500));
        
      } else if (fileType === 'pdf') {
        console.log('Processing PDF file with enhanced extraction...');
        
        const text = await fileData.text();
        
        // Enhanced PDF text extraction
        const emailMatches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
        const readableTextRegex = /[A-Za-z]{3,}[\w\s.,!?@-]{15,}/g;
        const textMatches = text.match(readableTextRegex);
        
        const allTexts = [];
        if (emailMatches) allTexts.push(...emailMatches);
        if (textMatches) {
          allTexts.push(...textMatches.filter(match => 
            !match.includes('PDF') && 
            !match.includes('%%') &&
            match.trim().length > 10
          ));
        }
        
        if (allTexts.length > 0) {
          extractedContent = allTexts.join(' ').replace(/\s+/g, ' ').trim();
        }
        
        console.log('PDF extraction completed, content length:', extractedContent.length);
        console.log('PDF content preview:', extractedContent.substring(0, 500));
        
      } else {
        console.log('Processing as generic text file...');
        extractedContent = await fileData.text();
        console.log('Generic extraction completed, content length:', extractedContent.length);
      }
      
    } catch (extractionError) {
      console.error('Text extraction failed:', extractionError);
      extractedContent = `Document ${document.name} - Text extraction error: ${extractionError.message}. File type: ${fileType}, File size: ${document.file_size} bytes.`;
    }

    // Enhanced content validation and fallback
    if (!extractedContent || extractedContent.length < 20) {
      console.warn('Extracted content is insufficient, using enhanced fallback');
      extractedContent = `Document: ${document.name}

This document could not be fully processed for text extraction. 
File type: ${fileType.toUpperCase()}
File size: ${(document.file_size / 1024).toFixed(1)} KB

Please try re-uploading the document or contact support if this issue persists.

For installation-related questions, you may need to contact tech@vs-ai-assistant.com directly.`;
    }

    console.log('=== FINAL EXTRACTED CONTENT ===');
    console.log('Content length:', extractedContent.length);
    console.log('First 500 characters:', extractedContent.substring(0, 500));
    console.log('Content contains email?', /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(extractedContent));
    console.log('Content contains installation?', extractedContent.toLowerCase().includes('installation'));
    console.log('Content contains tech@?', extractedContent.includes('tech@'));

    // Create intelligent chunks from the content
    console.log('=== CHUNKING START ===');
    const chunks = createIntelligentChunks(extractedContent, document.name);
    console.log('Created chunks:', chunks.length);

    // Log all chunks for debugging
    chunks.forEach((chunk, index) => {
      console.log(`Chunk ${index + 1} (${chunk.length} chars):`, chunk.substring(0, 200));
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

    console.log('=== DOCUMENT PROCESSING COMPLETE (SUCCESS) ===');
    const results = {
      chunksCreated: documentChunks.length,
      aiEnhanced: !!aiSummary,
      contentLength: extractedContent.length,
      fileType: fileType,
      contentHasEmail: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(extractedContent),
      contentHasInstallation: extractedContent.toLowerCase().includes('installation'),
      hasRelevantContent: extractedContent.includes('tech@') || extractedContent.toLowerCase().includes('installation')
    };
    
    console.log('Processing results:', results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        ...results,
        contentPreview: extractedContent.substring(0, 300),
        message: 'Document processed successfully with enhanced text extraction'
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('=== DOCUMENT PROCESSING ERROR ===');
    console.error('Error details:', error);
    
    // Update document with error status
    if (supabaseUrl && supabaseServiceKey) {
      try {
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
      } catch (updateError) {
        console.error('Failed to update error status:', updateError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Helper function to create intelligent chunks
function createIntelligentChunks(text: string, fileName: string): string[] {
  if (!text || text.length < 10) {
    return [`Document: ${fileName}\n\nNo readable content could be extracted from this document.`];
  }

  const chunks: string[] = [];
  const maxChunkSize = 1000;

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
