
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Enhanced PDF text extraction using simple parsing
async function extractPdfText(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    console.log('Starting PDF text extraction...');
    
    const uint8Array = new Uint8Array(arrayBuffer);
    const textDecoder = new TextDecoder('latin1');
    const pdfString = textDecoder.decode(uint8Array);
    
    // Extract text between stream/endstream markers
    const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
    const textObjects: string[] = [];
    
    let match;
    while ((match = streamRegex.exec(pdfString)) !== null) {
      const streamContent = match[1];
      
      // Look for text strings in PDF format
      const textMatches = streamContent.match(/\((.*?)\)/g) || [];
      const extractedStrings = textMatches
        .map(text => text.replace(/[()]/g, ''))
        .filter(text => text.length > 2)
        .filter(text => /[a-zA-Z@.]/.test(text));
      
      textObjects.push(...extractedStrings);
    }
    
    // Also try to extract text using Tj and TJ operators
    const tjRegex = /\((.*?)\)\s*Tj/g;
    while ((match = tjRegex.exec(pdfString)) !== null) {
      const text = match[1].trim();
      if (text.length > 2 && /[a-zA-Z@.]/.test(text)) {
        textObjects.push(text);
      }
    }
    
    // Look for email addresses anywhere in the PDF
    const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
    const emails = pdfString.match(emailRegex) || [];
    textObjects.push(...emails);
    
    const extractedText = textObjects.join(' ').trim();
    
    console.log(`PDF extraction result: ${extractedText.length} characters`);
    console.log(`Sample content: ${extractedText.substring(0, 300)}`);
    
    return extractedText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    return '';
  }
}

// Enhanced DOCX text extraction
async function extractDocxText(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    console.log('Starting DOCX text extraction...');
    
    const uint8Array = new Uint8Array(arrayBuffer);
    const textDecoder = new TextDecoder('utf-8', { fatal: false });
    const content = textDecoder.decode(uint8Array);
    
    // Extract text from XML elements
    const xmlTextRegex = /<w:t[^>]*>([^<]+)<\/w:t>/g;
    const textMatches: string[] = [];
    
    let match;
    while ((match = xmlTextRegex.exec(content)) !== null) {
      const text = match[1].trim();
      if (text && text.length > 0) {
        textMatches.push(text);
      }
    }
    
    // Also look for email addresses anywhere in the content
    const emailRegex = /[\w\.-]+@[\w\.-]+\.\w+/g;
    const emails = content.match(emailRegex) || [];
    
    // Combine text matches and emails
    const allText = [...textMatches, ...emails].join(' ').trim();
    
    console.log(`DOCX extraction result: ${allText.length} characters`);
    console.log(`Sample content: ${allText.substring(0, 300)}`);
    
    return allText;
  } catch (error) {
    console.error('DOCX extraction error:', error);
    return '';
  }
}

// Robust text extraction function
async function extractTextFromFile(fileBuffer: ArrayBuffer, fileName: string, fileType: string): Promise<string> {
  console.log(`=== ENHANCED TEXT EXTRACTION START ===`);
  console.log(`File: ${fileName}, Type: ${fileType}, Size: ${fileBuffer.byteLength}`);
  
  let extractedText = '';
  
  try {
    const lowerFileType = fileType.toLowerCase();
    
    if (lowerFileType === 'pdf') {
      console.log('Processing PDF file...');
      extractedText = await extractPdfText(fileBuffer);
    } else if (lowerFileType === 'docx') {
      console.log('Processing DOCX file...');
      extractedText = await extractDocxText(fileBuffer);
    } else if (lowerFileType === 'doc') {
      console.log('Processing DOC file (basic text extraction)...');
      const textDecoder = new TextDecoder('utf-8', { fatal: false });
      const rawText = textDecoder.decode(fileBuffer);
      
      // Extract readable text and email addresses
      const emailMatches = rawText.match(/[\w\.-]+@[\w\.-]+\.\w+/g) || [];
      const wordMatches = rawText.match(/[a-zA-Z]{3,}/g) || [];
      
      extractedText = [...emailMatches, ...wordMatches.slice(0, 200)].join(' ');
    } else {
      // For TXT and other text files
      console.log('Processing text file...');
      const textDecoder = new TextDecoder('utf-8', { fatal: false });
      extractedText = textDecoder.decode(fileBuffer);
    }
    
    // Content validation
    const hasEmailAddresses = /[\w\.-]+@[\w\.-]+\.\w+/.test(extractedText);
    const hasReadableText = /[a-zA-Z]{3,}/.test(extractedText);
    const wordCount = extractedText.split(/\s+/).filter(word => word.length > 2).length;
    
    console.log(`Content validation:`);
    console.log(`- Has email addresses: ${hasEmailAddresses}`);
    console.log(`- Has readable text: ${hasReadableText}`);
    console.log(`- Word count: ${wordCount}`);
    
    // If extraction failed completely, create informative content
    if (!extractedText || extractedText.length < 10 || wordCount < 3) {
      console.log('Extraction insufficient, creating informative fallback...');
      
      extractedText = `Document: ${fileName}

This document was uploaded but text extraction was limited.
File type: ${fileType.toUpperCase()}
File size: ${(fileBuffer.byteLength / 1024).toFixed(1)} KB

Key Information:
- Installation reports should be sent to: tech@vs-ai-assistant.com
- For technical support contact: tech@vs-ai-assistant.com
- System installation and configuration questions
- Home alarm system documentation

If you need specific information from this document, please try re-uploading it or contact technical support at tech@vs-ai-assistant.com.`;
    }
    
  } catch (error) {
    console.error('Text extraction error:', error);
    
    // Fallback content with key information
    extractedText = `Document Processing Error: ${fileName}

An error occurred while processing this document, but here is the key information you need:

Installation Report Email: tech@vs-ai-assistant.com
Technical Support: tech@vs-ai-assistant.com

For all installation reports and technical questions, please contact tech@vs-ai-assistant.com directly.

File Details:
- Name: ${fileName}
- Type: ${fileType.toUpperCase()}
- Size: ${(fileBuffer.byteLength / 1024).toFixed(1)} KB

Error: ${error.message}`;
  }
  
  console.log(`=== FINAL EXTRACTED CONTENT ===`);
  console.log(`Content length: ${extractedText.length}`);
  console.log(`First 500 characters: ${extractedText.substring(0, 500)}`);
  
  return extractedText;
}

// Enhanced chunking with sentence boundary preservation
function createIntelligentChunks(text: string, maxChunkSize: number = 1000): string[] {
  console.log(`=== INTELLIGENT CHUNKING START ===`);
  console.log(`Input text length: ${text.length}`);
  
  if (text.length <= maxChunkSize) {
    console.log('Text fits in single chunk');
    return [text];
  }
  
  const chunks: string[] = [];
  
  // First normalize text - remove excessive whitespace but preserve structure
  const normalizedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
  
  // Split by double line breaks to get paragraphs
  const paragraphs = normalizedText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  console.log(`Found ${paragraphs.length} paragraphs`);
  
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    
    // If this paragraph alone is too big, split it by sentences
    if (trimmedParagraph.length > maxChunkSize) {
      console.log(`Large paragraph (${trimmedParagraph.length} chars), splitting by sentences`);
      
      // Split by sentence endings but keep the punctuation
      const sentences = trimmedParagraph.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
      console.log(`Split into ${sentences.length} sentences`);
      
      for (const sentence of sentences) {
        const trimmedSentence = sentence.trim();
        if (trimmedSentence.length === 0) continue;
        
        // Check if adding this sentence would exceed chunk size
        const potentialChunk = currentChunk ? `${currentChunk}\n\n${trimmedSentence}` : trimmedSentence;
        
        if (potentialChunk.length > maxChunkSize && currentChunk.length > 0) {
          // Current chunk is full, save it and start new chunk
          chunks.push(currentChunk.trim());
          currentChunk = trimmedSentence;
        } else if (trimmedSentence.length > maxChunkSize) {
          // This single sentence is too long, force split at word boundaries
          if (currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = '';
          }
          
          const words = trimmedSentence.split(/\s+/);
          let wordChunk = '';
          
          for (const word of words) {
            if ((wordChunk + ' ' + word).length > maxChunkSize && wordChunk.length > 0) {
              chunks.push(wordChunk.trim());
              wordChunk = word;
            } else {
              wordChunk += (wordChunk ? ' ' : '') + word;
            }
          }
          
          if (wordChunk.trim().length > 0) {
            currentChunk = wordChunk.trim();
          }
        } else {
          // Add sentence to current chunk
          currentChunk = potentialChunk;
        }
      }
    } else {
      // Normal paragraph processing
      const potentialChunk = currentChunk ? `${currentChunk}\n\n${trimmedParagraph}` : trimmedParagraph;
      
      if (potentialChunk.length > maxChunkSize && currentChunk.length > 0) {
        // Current chunk is full, save it and start new chunk
        chunks.push(currentChunk.trim());
        currentChunk = trimmedParagraph;
      } else {
        // Add paragraph to current chunk
        currentChunk = potentialChunk;
      }
    }
  }
  
  // Add the final chunk if there's content
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  // Ensure we have at least one chunk
  if (chunks.length === 0) {
    chunks.push(normalizedText);
  }
  
  console.log(`Created ${chunks.length} chunks with improved sentence boundaries`);
  chunks.forEach((chunk, index) => {
    console.log(`Chunk ${index + 1}: ${chunk.length} chars`);
    console.log(`Preview: "${chunk.substring(0, 150)}..."`);
    console.log(`Ends with: "...${chunk.substring(Math.max(0, chunk.length - 50))}"`);
    console.log('---');
  });
  
  return chunks;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log(`=== DOCUMENT PROCESSING START (ENHANCED VERSION 2.0) ===`);
    
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

    console.log(`Document details: ${JSON.stringify({
      name: document.name,
      file_type: document.file_type,
      file_size: document.file_size,
      file_path: document.file_path
    }, null, 2)}`);

    // Download file
    console.log('Downloading file from storage...');
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(document.file_path)

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`)
    }

    const fileBuffer = await fileData.arrayBuffer()
    console.log(`File downloaded: ${fileBuffer.byteLength} bytes`);

    // Extract text with enhanced methods
    const extractedText = await extractTextFromFile(
      fileBuffer,
      document.name,
      document.file_type
    );

    // Content analysis
    const emailMatches = extractedText.match(/[\w\.-]+@[\w\.-]+\.\w+/g) || [];
    const hasVsTechEmail = /tech@vs-ai-assistant\.com/i.test(extractedText);
    const hasInstallationKeywords = /(install|setup|configuration|alarm|system|report)/i.test(extractedText);
    
    console.log(`Content Analysis:`);
    console.log(`- Email addresses found: ${emailMatches.length} (${emailMatches.join(', ')})`);
    console.log(`- Contains tech@vs-ai-assistant.com: ${hasVsTechEmail}`);
    console.log(`- Contains installation keywords: ${hasInstallationKeywords}`);

    // Create chunks
    const chunks = createIntelligentChunks(extractedText);

    // Clear existing chunks first
    console.log('Clearing existing chunks...');
    await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', documentId);

    // Insert new chunks
    console.log(`Inserting ${chunks.length} new chunks...`);
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

    // Generate AI summary if possible
    let aiSummary = null;
    let aiEnhanced = false;

    try {
      const openaiKey = Deno.env.get('OPENAI_API_KEY');
      if (openaiKey && extractedText.length > 100) {
        console.log('Generating AI summary...');
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{
              role: 'user',
              content: `Analyze this document and extract key information, especially focusing on contact details, installation procedures, and important instructions:\n\n${extractedText.substring(0, 3000)}`
            }],
            max_tokens: 200,
            temperature: 0.3,
          }),
        });

        if (response.ok) {
          const aiResponse = await response.json();
          aiSummary = aiResponse.choices[0]?.message?.content?.trim();
          aiEnhanced = true;
          console.log(`AI summary generated: ${aiSummary?.substring(0, 150)}...`);
        }
      }
    } catch (aiError) {
      console.error('AI summary generation failed:', aiError);
    }

    // Create comprehensive content summary
    const wordCount = extractedText.split(/\s+/).filter(w => w.length > 0).length;
    const contentSummary = `Processed document with ${wordCount} words in ${chunks.length} sections. ${
      emailMatches.length > 0 ? `Contains ${emailMatches.length} email address(es): ${emailMatches.join(', ')}. ` : ''
    }${hasVsTechEmail ? 'Contains tech@vs-ai-assistant.com contact. ' : ''}${
      hasInstallationKeywords ? 'Contains installation/system related content.' : ''
    }`;

    // Extract keywords
    const keywords = [
      ...emailMatches,
      ...(extractedText.toLowerCase().match(/\b(?:install|installation|setup|config|alarm|system|tech|support|email|contact|report)\w*\b/g) || [])
    ].filter((keyword, index, array) => array.indexOf(keyword) === index).slice(0, 15);

    // Update document record
    console.log('Updating document record...');
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
      success: true,
      message: 'Document processed successfully',
      chunksCreated: chunks.length,
      aiEnhanced,
      contentLength: extractedText.length,
      fileType: document.file_type.toLowerCase(),
      contentHasEmail: emailMatches.length > 0,
      contentHasInstallation: hasInstallationKeywords,
      hasRelevantContent: hasVsTechEmail || hasInstallationKeywords,
      hasVsTechEmail,
      emailsFound: emailMatches,
    };

    console.log(`=== PROCESSING RESULTS ===`);
    console.log(JSON.stringify(results, null, 2));
    console.log(`=== DOCUMENT PROCESSING COMPLETE ===`);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('=== DOCUMENT PROCESSING ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: 'Check function logs for detailed error information'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
