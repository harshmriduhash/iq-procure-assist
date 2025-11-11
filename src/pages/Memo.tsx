import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Download, RefreshCw, Sparkles } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Memo = () => {
  const { toast } = useToast();
  const [memoContent, setMemoContent] = useState(`PROCUREMENT APPROVAL MEMO

To: Procurement Director
From: AI Analysis System
Date: ${new Date().toLocaleDateString()}
Subject: Vendor Comparison Analysis - Q1 2025 Materials

EXECUTIVE SUMMARY
Based on comprehensive analysis of submitted vendor quotations, we recommend proceeding with Vendor B for the materials procurement contract. This recommendation is supported by competitive pricing analysis and total cost optimization.

VENDOR ANALYSIS

Vendor A - Total Quote: $2,910
• Steel Plates: $1,250 (18% above lowest)
• Aluminum Sheets: $890 (5% above recommended)
• Copper Wire: $450 (5% above lowest)
• Brass Fittings: $320 (3% above lowest)

Vendor B - Total Quote: $2,870 (RECOMMENDED)
• Steel Plates: $1,180 (LOWEST)
• Aluminum Sheets: $920
• Copper Wire: $430 (LOWEST)
• Brass Fittings: $340

Vendor C - Total Quote: $2,970
• Steel Plates: $1,350 (14% above lowest)
• Aluminum Sheets: $850 (LOWEST)
• Copper Wire: $460
• Brass Fittings: $310 (LOWEST)

RECOMMENDATION
Approve Vendor B for primary contract with estimated savings of $100 compared to alternatives. Vendor C recommended for aluminum sheets as secondary supplier for price optimization.

FINANCIAL IMPACT
• Total Project Value: $11,940
• Projected Savings: 3.4% vs. average quotes
• Risk Assessment: Low - established vendor relationships

NEXT STEPS
1. Issue purchase order to Vendor B
2. Confirm delivery schedules
3. Update quarterly procurement metrics`);

  const handleRegenerate = () => {
    toast({
      title: "Regenerating memo...",
      description: "AI is creating a new version based on latest data",
    });
  };

  const handleExport = () => {
    toast({
      title: "Exporting memo",
      description: "Your memo has been exported to PDF",
    });
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-4xl font-bold">Approval Memo</h1>
                <div className="flex items-center gap-1 px-3 py-1 bg-primary/10 rounded-full">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-xs font-medium text-primary">AI Generated</span>
                </div>
              </div>
              <p className="text-muted-foreground text-lg">
                Review and customize your procurement approval memo
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleRegenerate}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
              <Button onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-glow">
            <Textarea
              value={memoContent}
              onChange={(e) => setMemoContent(e.target.value)}
              className="min-h-[600px] font-mono text-sm bg-background/50 border-border resize-none"
            />
          </div>

          <div className="mt-6 p-4 bg-secondary/50 rounded-xl border border-border">
            <p className="text-sm text-muted-foreground">
              <strong>Pro tip:</strong> Edit the memo directly or click "Regenerate" to create a
              new version based on updated parameters.
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Memo;
