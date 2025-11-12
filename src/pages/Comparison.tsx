import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { FileText, TrendingDown, TrendingUp, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ComparisonItem {
  item_name: string;
  vendor_a_price?: number;
  vendor_b_price?: number;
  vendor_c_price?: number;
  unit?: string;
}

interface ComparisonData {
  items: ComparisonItem[];
  vendors?: Array<{ name: string; contact?: string }>;
}

const Comparison = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    const fetchComparison = async () => {
      const comparisonId = searchParams.get('id');
      
      if (!comparisonId) {
        // Fetch the most recent comparison
        const { data, error } = await supabase
          .from('comparisons')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error || !data) {
          console.error('Error fetching comparison:', error);
          toast({
            title: "No comparison found",
            description: "Please upload vendor documents first.",
            variant: "destructive"
          });
          navigate('/upload');
          return;
        }

        if (data.comparison_data) {
          setComparisonData(data.comparison_data as unknown as ComparisonData);
          setTotalValue(data.total_value || 0);
        }
      } else {
        // Fetch specific comparison and set up realtime subscription
        const { data, error } = await supabase
          .from('comparisons')
          .select('*')
          .eq('id', comparisonId)
          .single();

        if (error || !data) {
          console.error('Error fetching comparison:', error);
          return;
        }

        if (data.comparison_data) {
          setComparisonData(data.comparison_data as unknown as ComparisonData);
          setTotalValue(data.total_value || 0);
        }

        // Subscribe to changes
        const channel = supabase
          .channel(`comparison-${comparisonId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'comparisons',
              filter: `id=eq.${comparisonId}`
            },
            (payload) => {
              console.log('Comparison updated:', payload);
              const newData = payload.new as any;
              if (newData.comparison_data) {
                setComparisonData(newData.comparison_data as unknown as ComparisonData);
                setTotalValue(newData.total_value || 0);
              }
            }
          )
          .subscribe();

        return () => {
          channel.unsubscribe();
        };
      }
      
      setIsLoading(false);
    };

    fetchComparison();
  }, [searchParams, navigate, toast]);

  const getMinMax = (item: ComparisonItem) => {
    const prices = [
      item.vendor_a_price || 0,
      item.vendor_b_price || 0,
      item.vendor_c_price || 0
    ].filter(p => p > 0);
    
    if (prices.length === 0) return { min: 0, max: 0 };
    
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  };

  const getCellColor = (price: number | undefined, item: ComparisonItem) => {
    if (!price) return "bg-muted border-border text-muted-foreground";
    const { min, max } = getMinMax(item);
    if (price === min && min > 0) return "bg-accent/20 text-accent border-accent/50";
    if (price === max && max > 0) return "bg-destructive/20 text-destructive border-destructive/50";
    return "bg-card border-border";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    );
  }

  if (!comparisonData || !comparisonData.items || comparisonData.items.length === 0) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-6 py-12">
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No Data Available</h2>
            <p className="text-muted-foreground mb-6">
              The documents are still being processed or no pricing data was found.
            </p>
            <Button onClick={() => navigate('/upload')}>
              Upload New Documents
            </Button>
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
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-3">Vendor Comparison</h1>
              <p className="text-muted-foreground text-lg">
                Side-by-side price analysis across vendors
              </p>
            </div>
            <Button onClick={() => navigate("/memo")} size="lg">
              Generate Approval Memo
            </Button>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl overflow-hidden shadow-glow">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="px-6 py-4 text-left text-sm font-semibold">Item Description</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">
                      {comparisonData.vendors?.[0]?.name || 'Vendor A'}
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">
                      {comparisonData.vendors?.[1]?.name || 'Vendor B'}
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">
                      {comparisonData.vendors?.[2]?.name || 'Vendor C'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.items.map((item, idx) => (
                    <motion.tr
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="border-b border-border hover:bg-secondary/30 transition-smooth"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-primary" />
                          <div>
                            <span className="font-medium">{item.item_name}</span>
                            {item.unit && (
                              <span className="text-xs text-muted-foreground ml-2">({item.unit})</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`text-center py-2 px-4 rounded-lg border ${getCellColor(
                            item.vendor_a_price,
                            item
                          )}`}
                        >
                          {item.vendor_a_price ? (
                            <div className="flex items-center justify-center gap-2">
                              ${item.vendor_a_price.toLocaleString()}
                              {item.vendor_a_price === getMinMax(item).min && getMinMax(item).min > 0 && (
                                <TrendingDown className="w-4 h-4" />
                              )}
                              {item.vendor_a_price === getMinMax(item).max && getMinMax(item).max > 0 && (
                                <TrendingUp className="w-4 h-4" />
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`text-center py-2 px-4 rounded-lg border ${getCellColor(
                            item.vendor_b_price,
                            item
                          )}`}
                        >
                          {item.vendor_b_price ? (
                            <div className="flex items-center justify-center gap-2">
                              ${item.vendor_b_price.toLocaleString()}
                              {item.vendor_b_price === getMinMax(item).min && getMinMax(item).min > 0 && (
                                <TrendingDown className="w-4 h-4" />
                              )}
                              {item.vendor_b_price === getMinMax(item).max && getMinMax(item).max > 0 && (
                                <TrendingUp className="w-4 h-4" />
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`text-center py-2 px-4 rounded-lg border ${getCellColor(
                            item.vendor_c_price,
                            item
                          )}`}
                        >
                          {item.vendor_c_price ? (
                            <div className="flex items-center justify-center gap-2">
                              ${item.vendor_c_price.toLocaleString()}
                              {item.vendor_c_price === getMinMax(item).min && getMinMax(item).min > 0 && (
                                <TrendingDown className="w-4 h-4" />
                              )}
                              {item.vendor_c_price === getMinMax(item).max && getMinMax(item).max > 0 && (
                                <TrendingUp className="w-4 h-4" />
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-border bg-secondary/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Estimated Value (Best Prices)</p>
                  <p className="text-2xl font-bold">${totalValue.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-accent"></div>
                    <span className="text-sm">Lowest Price</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-destructive"></div>
                    <span className="text-sm">Highest Price</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Comparison;
