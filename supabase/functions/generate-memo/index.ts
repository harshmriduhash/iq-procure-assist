import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { comparisonId } = await req.json();
    console.log("Generating memo for comparison:", comparisonId);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch comparison data
    const { data: comparison, error: fetchError } = await supabase
      .from("comparisons")
      .select("*")
      .eq("id", comparisonId)
      .single();

    if (fetchError || !comparison) {
      console.error("Error fetching comparison:", fetchError);
      throw new Error("Comparison not found");
    }

    const comparisonData = comparison.comparison_data;
    if (!comparisonData || !comparisonData.items || comparisonData.items.length === 0) {
      throw new Error("No comparison data available");
    }

    // Build analysis prompt
    const itemsAnalysis = comparisonData.items
      .map((item: any) => {
        const prices = Object.entries(item.prices || {})
          .map(([vendor, price]) => `${vendor}: $${price}`)
          .join(", ");
        return `${item.description}: ${prices}`;
      })
      .join("\n");

    const prompt = `Analyze the following vendor price comparison and generate a professional procurement approval memo.

COMPARISON DATA:
Title: ${comparison.title}
Total Items: ${comparison.item_count}
Number of Vendors: ${comparison.vendor_count}
Total Value: $${comparison.total_value}

ITEM PRICING:
${itemsAnalysis}

Generate a comprehensive procurement approval memo that includes:
1. Executive Summary with clear recommendation
2. Detailed vendor analysis with pricing breakdowns
3. Financial impact assessment
4. Risk assessment
5. Next steps

Format the memo professionally with proper sections and make specific recommendations based on the lowest prices for each item.`;

    console.log("Calling Lovable AI for memo generation...");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a professional procurement analyst. Generate detailed, actionable procurement memos with specific recommendations and financial analysis.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const memoContent = aiData.choices[0]?.message?.content;

    if (!memoContent) {
      throw new Error("No memo content generated");
    }

    console.log("Memo generated successfully");

    // Update comparison with memo content
    const { error: updateError } = await supabase
      .from("comparisons")
      .update({ memo_content: memoContent })
      .eq("id", comparisonId);

    if (updateError) {
      console.error("Error updating memo:", updateError);
    }

    return new Response(
      JSON.stringify({ memoContent }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in generate-memo function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
