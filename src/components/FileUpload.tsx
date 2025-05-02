
import React, { useState } from 'react';
import { Upload, FileCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import Papa from 'papaparse';

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

  const parseFile = (file: File) => {
    setIsLoading(true);
    
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          toast({
            title: "Error parsing CSV",
            description: results.errors[0].message,
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        if (!results.data || results.data.length === 0) {
          toast({
            title: "Empty file",
            description: "The uploaded CSV file has no data",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        try {
          // Check if the data has a date column
          const hasDateColumn = results.data.some((row: any) => row.date || row.Date || row['Date'] || row['date']);
          
          if (!hasDateColumn) {
            // Try to infer the date column by checking column names
            const possibleDateColumns = Object.keys(results.data[0]).filter(col => 
              col.toLowerCase().includes('date') || 
              col.toLowerCase().includes('time') || 
              /^\d{4}-\d{2}-\d{2}$/.test(col)
            );
            
            if (possibleDateColumns.length === 0) {
              toast({
                title: "Missing date column",
                description: "The CSV must contain a 'date' column or date-formatted column names",
                variant: "destructive",
              });
              setIsLoading(false);
              return;
            }
          }
          
          // Get all columns
          const allColumns = Object.keys(results.data[0]);
          
          // Find date column
          let dateColumn = allColumns.find(col => 
            col.toLowerCase() === 'date' || 
            col.toLowerCase().includes('date')
          ) || allColumns[0];
          
          // Get possible time series columns (non-date columns)
          const timeSeriesColumns = allColumns.filter(col => col !== dateColumn);
          
          if (timeSeriesColumns.length === 0) {
            toast({
              title: "No time series data",
              description: "The CSV must contain at least one column of time series data",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }
          
          // Determine the date format and get date range
          let startDate = '';
          let endDate = '';
          
          if (results.data.length > 0) {
            const firstDate = results.data[0][dateColumn];
            const lastDate = results.data[results.data.length - 1][dateColumn];
            
            startDate = firstDate instanceof Date ? 
              firstDate.toISOString().split('T')[0] : 
              String(firstDate);
              
            endDate = lastDate instanceof Date ? 
              lastDate.toISOString().split('T')[0] : 
              String(lastDate);
          }
          
          // Create processed data structure
          const processedData = {
            fileName: file.name,
            columns: [dateColumn, ...timeSeriesColumns],
            dateRange: {
              start: startDate,
              end: endDate
            },
            rowCount: results.data.length,
            data: results.data
          };
          
          toast({
            title: "File uploaded successfully",
            description: `${file.name} has been processed.`,
          });
          
          onFileUploaded(processedData);
        } catch (error) {
          console.error("Error processing CSV:", error);
          toast({
            title: "Error processing file",
            description: "There was an error processing the CSV file",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      },
      error: (error) => {
        toast({
          title: "Error parsing CSV",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
      }
    });
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
              {isLoading ? (
                <>
                  <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                  <p className="font-medium text-lg">Processing {file.name}...</p>
                </>
              ) : (
                <>
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
                </>
              )}
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
