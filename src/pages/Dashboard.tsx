import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Clock, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Comparison {
  id: string;
  title: string;
  created_at: string;
  vendor_count: number;
  item_count: number;
  status: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [recentComparisons, setRecentComparisons] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComparisons();
  }, []);

  const fetchComparisons = async () => {
    try {
      const { data, error } = await supabase
        .from('comparisons')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      setRecentComparisons(data || []);
    } catch (error) {
      console.error('Error fetching comparisons:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const stats = [
    {
      title: "Total Comparisons",
      value: "24",
      icon: FileText,
      change: "+12% from last month",
    },
    {
      title: "Avg. Processing Time",
      value: "3.2 min",
      icon: Clock,
      change: "-18% improvement",
    },
    {
      title: "Cost Savings",
      value: "$45.2K",
      icon: TrendingUp,
      change: "+23% this quarter",
    },
  ];

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
              <h1 className="text-4xl font-bold mb-3">Dashboard</h1>
              <p className="text-muted-foreground text-lg">
                Welcome back! Track your procurement comparisons and insights.
              </p>
            </div>
            <Button size="lg" onClick={() => navigate("/upload")}>
              <Upload className="w-4 h-4 mr-2" />
              New Comparison
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="gradient-card border-border shadow-glow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <stat.icon className="w-4 h-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-1">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.change}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <Card className="gradient-card border-border shadow-glow">
            <CardHeader>
              <CardTitle>Recent Comparisons</CardTitle>
              <CardDescription>Your latest procurement analysis history</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading comparisons...
                </div>
              ) : recentComparisons.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">No comparisons yet</p>
                  <Button onClick={() => navigate("/upload")}>
                    Create your first comparison
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentComparisons.map((comparison, idx) => (
                    <motion.div
                      key={comparison.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl border border-border hover:bg-secondary/50 transition-smooth cursor-pointer"
                      onClick={() => navigate("/comparison")}
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{comparison.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{getRelativeTime(comparison.created_at)}</span>
                            <span>•</span>
                            <span>{comparison.vendor_count} vendors</span>
                            <span>•</span>
                            <span>{comparison.item_count} items</span>
                          </div>
                        </div>
                      </div>
                      <div className="px-3 py-1 bg-accent/20 text-accent rounded-full text-xs font-medium">
                        {comparison.status}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
