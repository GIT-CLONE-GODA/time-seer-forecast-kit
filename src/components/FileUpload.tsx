
import React, { useState } from 'react';
import { Upload, FileCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface FileUploadProps {
  onFileUploaded: (data: any) => void;
}

const FileUpload = ({ onFileUploaded }: FileUploadProps) => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
        parseFile(droppedFile);
      } else {
        toast({
          title: "Invalid file format",
          description: "Please upload a CSV file",
          variant: "destructive",
        });
      }
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
        parseFile(selectedFile);
      } else {
        toast({
          title: "Invalid file format",
          description: "Please upload a CSV file",
          variant: "destructive",
        });
      }
    }
  };

  const parseFile = (file: File) => {
    // In a real app, we'd use library like papaparse
    // For this demo, we'll create mock data
    
    // Mock time series data
    const mockData = {
      fileName: file.name,
      columns: ['date', 'Los Angeles, CA', 'New York, NY', 'Chicago, IL'],
      dateRange: {
        start: '2020-01-01',
        end: '2023-12-31'
      },
      rowCount: 48,
      // Mock time series data
      data: Array(48).fill(0).map((_, i) => ({
        date: new Date(2020, Math.floor(i / 12), (i % 12) + 1).toISOString().split('T')[0],
        'Los Angeles, CA': Math.round(200000 + Math.sin(i / 3) * 50000 + i * 3000 + Math.random() * 10000),
        'New York, NY': Math.round(500000 + Math.cos(i / 4) * 70000 + i * 5000 + Math.random() * 15000),
        'Chicago, IL': Math.round(300000 + Math.sin(i / 5) * 40000 + i * 4000 + Math.random() * 8000)
      }))
    };
    
    toast({
      title: "File uploaded successfully",
      description: `${file.name} has been processed.`,
    });
    
    onFileUploaded(mockData);
  };
  
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? 'border-seer-400 bg-seer-50' : 'border-muted'
          }`}
        >
          {file ? (
            <div className="flex flex-col items-center space-y-2">
              <FileCheck className="h-12 w-12 text-green-500" />
              <p className="font-medium text-lg">{file.name}</p>
              <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
              <Button
                variant="outline" 
                onClick={() => setFile(null)}
                className="mt-2"
              >
                Upload a different file
              </Button>
            </div>
          ) : (
            <>
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">Upload your CSV file</h3>
              <p className="text-muted-foreground mb-4">
                Drag and drop your file here or click to browse
              </p>
              <div className="flex justify-center">
                <Button variant="outline" className="relative" asChild>
                  <label>
                    <input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                      accept=".csv"
                    />
                    Browse files
                  </label>
                </Button>
              </div>
              <div className="mt-4">
                <p className="text-xs text-muted-foreground flex items-center justify-center">
                  <AlertCircle className="h-3 w-3 mr-1" /> 
                  File should include a date column and at least one time series column
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FileUpload;
