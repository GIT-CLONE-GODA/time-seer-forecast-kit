
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
    
    // Enhanced CSV parsing configuration
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      delimiter: '', // auto-detect delimiter
      comments: '#', // skip comment lines
      error: (error) => {
        console.error("CSV Parsing Error:", error);
        toast({
          title: "Error parsing CSV",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
      },
      complete: (results) => {
        console.log("CSV Parse Results:", results);
        
        if (results.errors && results.errors.length > 0) {
          console.warn("CSV Parse Warnings:", results.errors);
          // Show warning but continue if there are non-critical errors
          toast({
            title: "CSV parsing warnings",
            description: `${results.errors.length} parsing issues detected but continuing`,
            variant: "default",
          });
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
          // Log the first row to help with debugging
          console.log("First data row:", results.data[0]);
          console.log("Available columns:", Object.keys(results.data[0]));
          
          // Get all columns
          const allColumns = Object.keys(results.data[0]);
          
          if (allColumns.length === 0) {
            toast({
              title: "Invalid CSV format",
              description: "Could not detect columns in the CSV file",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }
          
          // Find date column - look for date-related columns or use the first column
          let dateColumn = allColumns.find(col => 
            col.toLowerCase() === 'date' || 
            col.toLowerCase().includes('date') ||
            col.toLowerCase() === 'time' ||
            col.toLowerCase().includes('time') ||
            col.toLowerCase() === 'period' ||
            /^\d{4}-\d{2}-\d{2}$/.test(col) // ISO date format
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
          
          // Clean up the data - ensure each row has all fields
          const cleanData = results.data.filter((row: any) => {
            return typeof row === 'object' && row !== null && Object.keys(row).length > 0;
          });
          
          if (cleanData.length === 0) {
            toast({
              title: "No valid data rows",
              description: "After cleaning, no valid data rows were found",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }
          
          // Ensure date column is present, otherwise try to create it
          if (!dateColumn || typeof cleanData[0][dateColumn] === 'undefined') {
            console.log("Could not find date column, adding index as date");
            // Add an artificial date column if none exists
            dateColumn = 'date';
            cleanData.forEach((row: any, index: number) => {
              const fakeDate = new Date(2023, 0, 1);
              fakeDate.setDate(fakeDate.getDate() + index);
              row[dateColumn] = fakeDate.toISOString().split('T')[0];
            });
          }
          
          // Determine the date range
          let startDate = cleanData[0][dateColumn];
          let endDate = cleanData[cleanData.length - 1][dateColumn];
          
          if (startDate instanceof Date) {
            startDate = startDate.toISOString().split('T')[0];
          } else {
            startDate = String(startDate);
          }
          
          if (endDate instanceof Date) {
            endDate = endDate.toISOString().split('T')[0];
          } else {
            endDate = String(endDate);
          }
          
          // Create processed data structure
          const processedData = {
            fileName: file.name,
            columns: [dateColumn, ...timeSeriesColumns],
            dateRange: {
              start: startDate,
              end: endDate
            },
            rowCount: cleanData.length,
            data: cleanData
          };
          
          console.log("Processed data:", processedData);
          
          toast({
            title: "File uploaded successfully",
            description: `${file.name} has been processed with ${cleanData.length} rows.`,
          });
          
          onFileUploaded(processedData);
        } catch (error) {
          console.error("Error processing CSV:", error);
          toast({
            title: "Error processing file",
            description: "There was an error processing the CSV file: " + (error as Error).message,
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
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
