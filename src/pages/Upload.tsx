import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { UploadZone } from "@/components/upload/UploadZone";

const Upload = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3">Upload Vendor Documents</h1>
            <p className="text-muted-foreground text-lg">
              Upload RFQs, quotes, and price sheets to compare vendors
            </p>
          </div>
          
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-8 shadow-glow">
            <UploadZone />
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Upload;
