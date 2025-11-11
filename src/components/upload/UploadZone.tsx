import { Upload, FileText, X } from "lucide-react";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

export const UploadZone = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFiles = (fileList: File[]) => {
    const newFiles: UploadedFile[] = fileList.map((file) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
    toast({
      title: "Files added",
      description: `${newFiles.length} file(s) ready to process`,
    });
  };

  const processFiles = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    
    try {
      const uploadedFiles = [];
      
      // Upload each file to Supabase storage
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file.file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        uploadedFiles.push({
          name: file.name,
          path: filePath,
          size: file.size,
          type: file.type,
        });
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Create a comparison record
      const { data: comparison, error: dbError } = await supabase
        .from('comparisons')
        .insert({
          title: `Comparison - ${new Date().toLocaleDateString()}`,
          vendor_count: 3,
          item_count: files.length,
          status: 'processing',
          files: uploadedFiles,
          user_id: user.id,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        throw dbError;
      }

      toast({
        title: "Files uploaded successfully!",
        description: "Processing your documents...",
      });

      // Navigate to comparison view
      setTimeout(() => {
        navigate('/comparison');
      }, 1000);

    } catch (error) {
      console.error('Error processing files:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-smooth ${
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border hover:border-primary/50 hover:bg-primary/5"
        }`}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          multiple
          accept=".pdf,.docx,.xlsx,.xls"
          onChange={handleFileInput}
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="w-12 h-12 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Drop files here or click to upload</h3>
          <p className="text-sm text-muted-foreground">
            Supports PDF, DOCX, XLSX files up to 20MB
          </p>
        </label>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            <h4 className="text-sm font-medium text-muted-foreground">Uploaded Files</h4>
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border"
              >
                <FileText className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(file.id)}
                  className="flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {files.length > 0 && (
        <Button 
          className="w-full" 
          size="lg" 
          onClick={processFiles}
          disabled={isProcessing}
        >
          {isProcessing ? "Processing..." : "Process with AI"}
        </Button>
      )}
    </div>
  );
};
