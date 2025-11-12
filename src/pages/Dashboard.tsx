import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Loader2,
  Search,
  Download,
  Calendar,
  Filter,
  XCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Comparison {
  id: string;
  title: string;
  vendor_count: number;
  item_count: number;
  total_value: number | null;
  status: string;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [filteredComparisons, setFilteredComparisons] = useState<Comparison[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchComparisons();
  }, []);

  useEffect(() => {
    filterComparisons();
  }, [searchQuery, statusFilter, comparisons]);

  const fetchComparisons = async () => {
    try {
      const { data, error } = await supabase
        .from('comparisons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setComparisons(data || []);
    } catch (error) {
      console.error('Error fetching comparisons:', error);
      toast({
        title: "Error loading comparisons",
        description: "Failed to load your comparison history.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterComparisons = () => {
    let filtered = [...comparisons];

    if (searchQuery) {
      filtered = filtered.filter(comp => 
        comp.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(comp => comp.status === statusFilter);
    }

    setFilteredComparisons(filtered);
  };

  const exportToCSV = () => {
    if (filteredComparisons.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no comparisons to export.",
        variant: "destructive"
      });
      return;
    }

    const headers = ["Title", "Status", "Vendors", "Items", "Total Value", "Created Date"];
    const rows = filteredComparisons.map(comp => [
      comp.title,
      comp.status,
      comp.vendor_count,
      comp.item_count,
      comp.total_value || 0,
      new Date(comp.created_at).toLocaleDateString()
    ]);

    const csv = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comparisons-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Your comparison history has been exported.",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-accent" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      processing: "secondary",
      failed: "destructive"
    };
    
    return (
      <Badge variant={variants[status] || "outline"}>
        {status}
      </Badge>
    );
  };

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
              <h1 className="text-4xl font-bold mb-3">Comparison History</h1>
              <p className="text-muted-foreground text-lg">
                Browse and manage all your vendor comparisons
              </p>
            </div>
            <Button onClick={() => navigate("/upload")} size="lg">
              New Comparison
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="gradient-card border-border shadow-glow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Comparisons
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{comparisons.length}</div>
                <p className="text-xs text-muted-foreground">
                  All time comparisons
                </p>
              </CardContent>
            </Card>

            <Card className="gradient-card border-border shadow-glow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Completed
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {comparisons.filter(c => c.status === 'completed').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Successfully processed
                </p>
              </CardContent>
            </Card>

            <Card className="gradient-card border-border shadow-glow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Value
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${comparisons.reduce((sum, c) => sum + (c.total_value || 0), 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all comparisons
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="gradient-card border-border shadow-glow mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search comparisons..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={exportToCSV}
                    disabled={filteredComparisons.length === 0}
                    title="Export to CSV"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparisons List */}
          <Card className="gradient-card border-border shadow-glow">
            <CardHeader>
              <CardTitle>All Comparisons</CardTitle>
              <CardDescription>
                {filteredComparisons.length} comparison{filteredComparisons.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredComparisons.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">
                    {searchQuery || statusFilter !== "all" 
                      ? "No comparisons found" 
                      : "No comparisons yet"}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery || statusFilter !== "all"
                      ? "Try adjusting your filters or search query"
                      : "Upload vendor documents to create your first comparison"}
                  </p>
                  {!searchQuery && statusFilter === "all" && (
                    <Button onClick={() => navigate("/upload")}>
                      Create First Comparison
                    </Button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredComparisons.map((comparison, idx) => (
                    <motion.div
                      key={comparison.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="p-4 hover:bg-secondary/30 transition-smooth cursor-pointer rounded-lg"
                      onClick={() => navigate(`/comparison?id=${comparison.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          {getStatusIcon(comparison.status)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold truncate">{comparison.title}</h3>
                              {getStatusBadge(comparison.status)}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {comparison.vendor_count} vendors
                              </span>
                              <span>•</span>
                              <span>{comparison.item_count} items</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(comparison.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-lg whitespace-nowrap">
                            {comparison.total_value 
                              ? `$${comparison.total_value.toLocaleString()}` 
                              : comparison.status === 'processing' 
                                ? 'Processing...' 
                                : 'N/A'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Total Value
                          </p>
                        </div>
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
