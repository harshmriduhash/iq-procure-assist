-- Create storage bucket for document uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true);

-- Create comparisons table for storing comparison history
CREATE TABLE public.comparisons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  vendor_count INTEGER NOT NULL DEFAULT 0,
  item_count INTEGER NOT NULL DEFAULT 0,
  total_value DECIMAL(12, 2),
  status TEXT NOT NULL DEFAULT 'processing',
  files JSONB DEFAULT '[]'::jsonb,
  comparison_data JSONB,
  memo_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.comparisons ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to view comparisons (public access for MVP)
CREATE POLICY "Allow public read access to comparisons" 
ON public.comparisons 
FOR SELECT 
USING (true);

-- Create policy to allow anyone to insert comparisons (public access for MVP)
CREATE POLICY "Allow public insert access to comparisons" 
ON public.comparisons 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow anyone to update comparisons (public access for MVP)
CREATE POLICY "Allow public update access to comparisons" 
ON public.comparisons 
FOR UPDATE 
USING (true);

-- Create policy to allow anyone to delete comparisons (public access for MVP)
CREATE POLICY "Allow public delete access to comparisons" 
ON public.comparisons 
FOR DELETE 
USING (true);

-- Storage policies for documents bucket
CREATE POLICY "Public access to view documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents');

CREATE POLICY "Public access to upload documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Public access to update documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'documents');

CREATE POLICY "Public access to delete documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_comparisons_updated_at
BEFORE UPDATE ON public.comparisons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_comparisons_created_at ON public.comparisons(created_at DESC);
CREATE INDEX idx_comparisons_status ON public.comparisons(status);