import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Download, RefreshCw, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Memo = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const comparisonId = searchParams.get("id");
  const [memoContent, setMemoContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    if (comparisonId) {
      loadMemo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comparisonId]);

  const loadMemo = async () => {
    try {
      setIsLoading(true);
      const { data: comparison, error } = await supabase
        .from("comparisons")
        .select("memo_content")
        .eq("id", comparisonId)
        .single();

      if (error) throw error;

      if (comparison?.memo_content) {
        setMemoContent(comparison.memo_content);
      } else {
        // Generate memo if it doesn't exist
        await generateMemo();
      }
    } catch (error) {
      console.error("Error loading memo:", error);
      toast({
        title: "Error loading memo",
        description: "Failed to load the memo content",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateMemo = async () => {
    try {
      setIsRegenerating(true);
      const { data, error } = await supabase.functions.invoke("generate-memo", {
        body: { comparisonId },
      });

      if (error) throw error;

      if (data?.memoContent) {
        setMemoContent(data.memoContent);
        toast({
          title: "Memo generated",
          description: "Your approval memo has been created successfully",
        });
      }
    } catch (error) {
      console.error("Error generating memo:", error);
      toast({
        title: "Error generating memo",
        description: "Failed to generate the memo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRegenerate = async () => {
    await generateMemo();
  };

  const handleExport = () => {
    const blob = new Blob([memoContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `procurement-memo-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Memo exported",
      description: "Your memo has been downloaded as a text file",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading memo...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
              <Button 
                variant="outline" 
                onClick={handleRegenerate}
                disabled={isRegenerating}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRegenerating ? "animate-spin" : ""}`} />
                {isRegenerating ? "Generating..." : "Regenerate"}
              </Button>
              <Button onClick={handleExport} disabled={!memoContent}>
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
