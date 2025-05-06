
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
  const [isLoading, setIsLoading] = useState(false);
  
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

  const parseFile = async (file: File) => {
    setIsLoading(true);
    
    try {
      // Read the file content
      const text = await readFileAsText(file);
      
      // Split by newline and find the headers
      const lines = text.split('\n');
      if (lines.length === 0) {
        throw new Error("File is empty");
      }
      
      // Parse headers - assume first row is headers
      const headers = parseCSVLine(lines[0]);
      if (headers.length === 0) {
        throw new Error("No headers found in file");
      }
      
      // Find date column index (assuming it's named 'date' or contains 'date')
      let dateColumnIndex = headers.findIndex(h => h.toLowerCase() === 'date');
      if (dateColumnIndex === -1) {
        // Try finding any column with 'date' in it
        dateColumnIndex = headers.findIndex(h => h.toLowerCase().includes('date'));
      }
      
      if (dateColumnIndex === -1) {
        throw new Error("No date column found. Please ensure your CSV has a column named 'date'");
      }
      
      // Parse data rows
      const data = [];
      let minDate = '';
      let maxDate = '';
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === '') continue;
        
        const values = parseCSVLine(lines[i]);
        if (values.length !== headers.length) continue;
        
        const rowData: any = {};
        
        for (let j = 0; j < headers.length; j++) {
          const value = values[j].trim();
          
          if (j === dateColumnIndex) {
            rowData['date'] = value;
            if (!minDate || value < minDate) minDate = value;
            if (!maxDate || value > maxDate) maxDate = value;
          } else {
            // Try to convert numeric values
            const numValue = parseFloat(value);
            rowData[headers[j]] = isNaN(numValue) ? value : numValue;
          }
        }
        
        data.push(rowData);
      }
      
      // Create result object
      const result = {
        fileName: file.name,
        columns: ['date', ...headers.filter((_, i) => i !== dateColumnIndex)],
        dateRange: {
          start: minDate,
          end: maxDate
        },
        rowCount: data.length,
        data: data
      };
      
      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been processed with ${data.length} rows.`,
      });
      
      onFileUploaded(result);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      toast({
        title: "Error parsing file",
        description: error instanceof Error ? error.message : "Failed to parse CSV file",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to read file content
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          resolve(event.target.result);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsText(file);
    });
  };
  
  // Helper function to parse CSV line handling quotes
  const parseCSVLine = (line: string): string[] => {
    const result = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(currentValue);
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    
    // Add the last value
    result.push(currentValue);
    return result;
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
          {isLoading ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              <p className="font-medium text-lg">Processing file...</p>
            </div>
          ) : file ? (
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
