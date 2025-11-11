import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { FileText, TrendingDown, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const mockData = [
  {
    item: "Steel Plates 10mm x 2000mm",
    vendor1: 1250,
    vendor2: 1180,
    vendor3: 1350,
  },
  {
    item: "Aluminum Sheets 5mm x 1500mm",
    vendor1: 890,
    vendor2: 920,
    vendor3: 850,
  },
  {
    item: "Copper Wire 2.5mm Gauge",
    vendor1: 450,
    vendor2: 430,
    vendor3: 460,
  },
  {
    item: "Brass Fittings 20mm",
    vendor1: 320,
    vendor2: 340,
    vendor3: 310,
  },
];

const Comparison = () => {
  const navigate = useNavigate();

  const getMinMax = (item: typeof mockData[0]) => {
    const prices = [item.vendor1, item.vendor2, item.vendor3];
    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  };

  const getCellColor = (price: number, item: typeof mockData[0]) => {
    const { min, max } = getMinMax(item);
    if (price === min) return "bg-accent/20 text-accent border-accent/50";
    if (price === max) return "bg-destructive/20 text-destructive border-destructive/50";
    return "bg-card border-border";
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
                    <th className="px-6 py-4 text-center text-sm font-semibold">Vendor A</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Vendor B</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">Vendor C</th>
                  </tr>
                </thead>
                <tbody>
                  {mockData.map((item, idx) => (
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
                          <span className="font-medium">{item.item}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`text-center py-2 px-4 rounded-lg border ${getCellColor(
                            item.vendor1,
                            item
                          )}`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            ${item.vendor1.toLocaleString()}
                            {item.vendor1 === getMinMax(item).min && (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            {item.vendor1 === getMinMax(item).max && (
                              <TrendingUp className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`text-center py-2 px-4 rounded-lg border ${getCellColor(
                            item.vendor2,
                            item
                          )}`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            ${item.vendor2.toLocaleString()}
                            {item.vendor2 === getMinMax(item).min && (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            {item.vendor2 === getMinMax(item).max && (
                              <TrendingUp className="w-4 h-4" />
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className={`text-center py-2 px-4 rounded-lg border ${getCellColor(
                            item.vendor3,
                            item
                          )}`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            ${item.vendor3.toLocaleString()}
                            {item.vendor3 === getMinMax(item).min && (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            {item.vendor3 === getMinMax(item).max && (
                              <TrendingUp className="w-4 h-4" />
                            )}
                          </div>
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
                  <p className="text-sm text-muted-foreground mb-1">Total Estimated Value</p>
                  <p className="text-2xl font-bold">$11,940</p>
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
