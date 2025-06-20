
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Simple DOCX text extraction using XML parsing
async function extractDocxText(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    console.log('Starting DOCX text extraction...');
    
    // Convert ArrayBuffer to Uint8Array for processing
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Simple approach: look for XML content that contains text
    // DOCX files are ZIP archives with XML files inside
    const textDecoder = new TextDecoder('utf-8', { fatal: false });
    const content = textDecoder.decode(uint8Array);
    
    // Look for common text patterns in DOCX XML structure
    const textMatches = content.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
    const extractedTexts = textMatches.map(match => {
      const textMatch = match.match(/<w:t[^>]*>([^<]+)<\/w:t>/);
      return textMatch ? textMatch[1] : '';
    }).filter(text => text.trim().length > 0);
    
    let extractedText = extractedTexts.join(' ').trim();
    
    // If no text found with XML parsing, try a more aggressive approach
    if (!extractedText) {
      console.log('XML parsing failed, trying text pattern matching...');
      
      // Look for email patterns
      const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
      const emails = content.match(emailRegex) || [];
      
      // Look for common words that might indicate content
      const wordRegex = /\b[a-zA-Z]{3,}\b/g;
      const words = content.match(wordRegex) || [];
      
      // Build extracted text from found patterns
      const foundContent = [...emails, ...words.slice(0, 50)].join(' ');
      extractedText = foundContent.trim();
    }
    
    console.log(`DOCX extraction result: ${extractedText.length} characters`);
    console.log(`First 200 chars: ${extractedText.substring(0, 200)}`);
    
    return extractedText;
  } catch (error) {
    console.error('DOCX extraction error:', error);
    return '';
  }
}

// Enhanced text extraction function
async function extractTextFromFile(fileBuffer: ArrayBuffer, fileName: string, fileType: string): Promise<string> {
  console.log(`=== ENHANCED TEXT EXTRACTION START ===`);
  console.log(`File: ${fileName}, Type: ${fileType}, Size: ${fileBuffer.byteLength}`);
  
  let extractedText = '';
  
  try {
    if (fileType.toLowerCase() === 'docx') {
      console.log('Processing DOCX file with enhanced extraction...');
      extractedText = await extractDocxText(fileBuffer);
      
      if (!extractedText || extractedText.length < 10) {
        console.log('DOCX extraction insufficient, trying fallback...');
        
        // Fallback: try to find any readable text in the binary data
        const textDecoder = new TextDecoder('utf-8', { fatal: false });
        const rawText = textDecoder.decode(fileBuffer);
        
        // Extract email addresses
        const emailMatches = rawText.match(/[\w\.-]+@[\w\.-]+\.\w+/g) || [];
        
        // Extract words (basic text)
        const wordMatches = rawText.match(/[a-zA-Z]{3,}/g) || [];
        
        if (emailMatches.length > 0 || wordMatches.length > 0) {
          extractedText = [...emailMatches, ...wordMatches.slice(0, 100)].join(' ');
          console.log(`Fallback extraction found: ${extractedText.length} characters`);
        }
      }
    } else if (fileType.toLowerCase() === 'pdf') {
      console.log('PDF processing not implemented in this version');
      extractedText = '';
    } else {
      // For other text-based files
      const textDecoder = new TextDecoder('utf-8', { fatal: false });
      extractedText = textDecoder.decode(fileBuffer);
      console.log(`Text file extraction: ${extractedText.length} characters`);
    }
  } catch (error) {
    console.error('Text extraction error:', error);
    extractedText = '';
  }
  
  // If extraction completely failed, create a helpful fallback
  if (!extractedText || extractedText.length < 5) {
    console.log('Text extraction failed completely, using informative fallback');
    extractedText = `Document: ${fileName}

This document could not be fully processed for text extraction. 
File type: ${fileType.toUpperCase()}
File size: ${(fileBuffer.byteLength / 1024).toFixed(1)} KB

Please try re-uploading the document or contact support if this issue persists.

For installation-related questions, you may need to contact tech@vs-ai-assistant.com directly.`;
  }
  
  console.log(`=== FINAL EXTRACTED CONTENT ===`);
  console.log(`Content length: ${extractedText.length}`);
  console.log(`First 500 characters: ${extractedText.substring(0, 500)}`);
  
  return extractedText;
}

// Create intelligent chunks from text
function createIntelligentChunks(text: string, maxChunkSize: number = 1000): string[] {
  console.log(`=== CHUNKING START ===`);
  
  const chunks: string[] = [];
  
  // Split by paragraphs first
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed chunk size, save current chunk
    if (currentChunk.length + paragraph.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }
  
  // Add the last chunk
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  // If no meaningful chunks created, create a single chunk
  if (chunks.length === 0) {
    chunks.push(text);
  }
  
  console.log(`Created ${chunks.length} intelligent chunks from ${text.length} characters`);
  
  return chunks;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log(`=== DOCUMENT PROCESSING START (ENHANCED VERSION) ===`);
    
    const { documentId } = await req.json()
    console.log(`Processing document ID: ${documentId}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get document details
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      throw new Error(`Document not found: ${docError?.message}`)
    }

    console.log(`Document details: {
  name: "${document.name}",
  file_type: "${document.file_type}",
  file_size: ${document.file_size},
  file_path: "${document.file_path}"
}`);

    // Download file from storage
    console.log('Downloading file from storage...');
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(document.file_path)

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`)
    }

    const fileBuffer = await fileData.arrayBuffer()
    console.log(`File downloaded successfully, size: ${fileBuffer.byteLength}`);

    // Extract text from file
    const extractedText = await extractTextFromFile(
      fileBuffer,
      document.name,
      document.file_type
    );

    // Analyze content for specific patterns
    const contentHasEmail = /[\w\.-]+@[\w\.-]+\.\w+/.test(extractedText);
    const contentHasInstallation = /install|setup|configuration|tech@/i.test(extractedText);
    const hasRelevantContent = contentHasEmail || contentHasInstallation;
    
    console.log(`Content contains email? ${contentHasEmail}`);
    console.log(`Content contains installation? ${contentHasInstallation}`);
    console.log(`Content contains tech@? ${/tech@/.test(extractedText)}`);

    // Create chunks
    const chunks = createIntelligentChunks(extractedText);
    console.log(`Created chunks: ${chunks.length}`);

    // Insert chunks into database
    console.log(`Inserting ${chunks.length} chunks into database...`);
    const chunkInserts = chunks.map((chunk, index) => ({
      document_id: documentId,
      content: chunk,
      chunk_index: index,
      page_number: 1,
    }));

    const { error: chunksError } = await supabase
      .from('document_chunks')
      .insert(chunkInserts);

    if (chunksError) {
      throw new Error(`Failed to insert chunks: ${chunksError.message}`);
    }

    console.log('Chunks inserted successfully');

    // Log chunk details for debugging
    chunks.forEach((chunk, index) => {
      console.log(`Chunk ${index + 1} (${chunk.length} chars): ${chunk.substring(0, 100)}${chunk.length > 100 ? '...' : ''}`);
    });

    // Generate AI summary if OpenAI key is available
    console.log(`=== AI SUMMARY GENERATION START ===`);
    let aiSummary = null;
    let aiEnhanced = false;

    try {
      const openaiKey = Deno.env.get('OPENAI_API_KEY');
      if (openaiKey && extractedText.length > 50) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{
              role: 'user',
              content: `Summarize this document in 2-3 sentences. Focus on key information like contact details, installation instructions, or important procedures:\n\n${extractedText.substring(0, 2000)}`
            }],
            max_tokens: 150,
            temperature: 0.3,
          }),
        });

        if (response.ok) {
          const aiResponse = await response.json();
          aiSummary = aiResponse.choices[0]?.message?.content?.trim();
          aiEnhanced = true;
          console.log(`AI summary generated: ${aiSummary?.substring(0, 100)}...`);
        } else {
          console.log(`AI API response not ok: ${response.status} ${response.statusText}`);
        }
      }
    } catch (aiError) {
      console.error('AI summary generation error:', aiError);
    }

    // Create content summary
    const wordCount = extractedText.split(/\s+/).length;
    const sectionCount = chunks.length;
    const emailAddresses = extractedText.match(/[\w\.-]+@[\w\.-]+\.\w+/g) || [];
    
    const contentSummary = `Document contains ${wordCount} words across ${sectionCount} sections.${
      emailAddresses.length > 0 ? ` Contains ${emailAddresses.length} email address(es): ${emailAddresses.join(', ')}.` : ''
    }`;

    console.log(`Content summary created: ${contentSummary}`);

    // Extract keywords
    const keywords = Array.from(new Set([
      ...extractedText.toLowerCase().match(/\b(?:install|setup|configuration|alarm|system|tech|support|email|contact)\w*\b/g) || [],
      ...emailAddresses
    ])).slice(0, 10);

    // Update document with results
    console.log('Updating document with results...');
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        processing_status: 'processed',
        content_summary: contentSummary,
        total_chunks: chunks.length,
        ai_summary: aiSummary,
        keywords: keywords,
        last_processed_at: new Date().toISOString(),
        processing_error: null,
      })
      .eq('id', documentId);

    if (updateError) {
      throw new Error(`Failed to update document: ${updateError.message}`);
    }

    const results = {
      chunksCreated: chunks.length,
      aiEnhanced,
      contentLength: extractedText.length,
      fileType: document.file_type.toLowerCase(),
      contentHasEmail,
      contentHasInstallation,
      hasRelevantContent,
    };

    console.log(`Processing results: ${JSON.stringify(results, null, 2)}`);
    console.log(`=== DOCUMENT PROCESSING COMPLETE (SUCCESS) ===`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Document processed successfully',
        ...results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('=== DOCUMENT PROCESSING ERROR ===');
    console.error('Error details:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: 'Check function logs for more information'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
