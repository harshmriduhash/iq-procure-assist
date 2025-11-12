import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.81.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { comparisonId, files } = await req.json();
    console.log('Processing documents for comparison:', comparisonId);
    console.log('Files to process:', files);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download and extract text from files
    let documentTexts = [];
    for (const file of files) {
      console.log('Downloading file:', file.path);
      const { data, error } = await supabase.storage
        .from('documents')
        .download(file.path);

      if (error) {
        console.error('Error downloading file:', error);
        continue;
      }

      // Convert blob to text (works for text-based formats)
      const text = await data.text();
      documentTexts.push({
        filename: file.name,
        content: text.substring(0, 50000) // Limit to prevent token overflow
      });
    }

    console.log('Extracted text from', documentTexts.length, 'documents');

    // Use Lovable AI to extract structured vendor pricing data
    const prompt = `You are a procurement data extraction assistant. Analyze the following vendor documents and extract pricing information.

Documents:
${documentTexts.map(doc => `\n--- ${doc.filename} ---\n${doc.content}`).join('\n\n')}

Extract all items with their prices from each vendor. Return the data in a structured format.`;

    console.log('Calling Lovable AI for data extraction...');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a procurement data extraction specialist. Extract vendor pricing data and return it in structured format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'extract_vendor_prices',
            description: 'Extract vendor pricing data from documents',
            parameters: {
              type: 'object',
              properties: {
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      item_name: { type: 'string', description: 'Name/description of the item' },
                      vendor_a_price: { type: 'number', description: 'Price from first vendor' },
                      vendor_b_price: { type: 'number', description: 'Price from second vendor' },
                      vendor_c_price: { type: 'number', description: 'Price from third vendor' },
                      unit: { type: 'string', description: 'Unit of measurement' }
                    },
                    required: ['item_name']
                  }
                },
                vendors: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      contact: { type: 'string' }
                    }
                  }
                }
              },
              required: ['items']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'extract_vendor_prices' } }
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    // Extract the tool call result
    const toolCall = aiData.choices[0]?.message?.tool_calls?.[0];
    let extractedData;
    
    if (toolCall && toolCall.function) {
      extractedData = JSON.parse(toolCall.function.arguments);
      console.log('Extracted data:', extractedData);
    } else {
      console.warn('No tool call in response, using fallback structure');
      extractedData = { items: [], vendors: [] };
    }

    // Calculate total value
    const totalValue = extractedData.items.reduce((sum: number, item: any) => {
      const prices = [
        item.vendor_a_price || 0,
        item.vendor_b_price || 0,
        item.vendor_c_price || 0
      ];
      return sum + Math.min(...prices.filter(p => p > 0));
    }, 0);

    // Update the comparison record
    const { error: updateError } = await supabase
      .from('comparisons')
      .update({
        comparison_data: extractedData,
        status: 'completed',
        total_value: totalValue,
        item_count: extractedData.items.length,
        vendor_count: extractedData.vendors?.length || 3
      })
      .eq('id', comparisonId);

    if (updateError) {
      console.error('Error updating comparison:', updateError);
      throw updateError;
    }

    console.log('Comparison updated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: extractedData,
        totalValue 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing documents:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
