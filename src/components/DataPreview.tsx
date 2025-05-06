
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getNumericColumns, preprocessData } from '@/services/forecastService';

interface DataPreviewProps {
  data: {
    fileName: string;
    columns: string[];
    dateRange: {
      start: string;
      end: string;
    };
    rowCount: number;
    data: any[];
  };
  onColumnSelect: (column: string) => void;
}

const DataPreview = ({ data, onColumnSelect }: DataPreviewProps) => {
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [processedData, setProcessedData] = useState<any[]>([]);
  const [numericColumns, setNumericColumns] = useState<string[]>([]);
  
  // Process data on mount and when data changes
  useEffect(() => {
    if (data && data.data) {
      const preprocessed = preprocessData(data.data);
      setProcessedData(preprocessed);
      
      // Get numeric columns for analysis
      const columns = getNumericColumns(preprocessed);
      setNumericColumns(columns);
    }
  }, [data]);
  
  // Handle column selection
  const handleColumnChange = (value: string) => {
    setSelectedColumn(value);
    onColumnSelect(value);
  };

  // Format cell value safely
  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    
    if (typeof value === 'number') {
      // Format numbers with locale and handle large numbers
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(2)}M`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return value.toLocaleString();
    }
    
    return String(value);
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Data Preview: {data.fileName}</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-normal text-muted-foreground">Select column to analyze:</span>
            <Select onValueChange={handleColumnChange} value={selectedColumn}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select column" />
              </SelectTrigger>
              <SelectContent>
                {numericColumns.map((column) => (
                  <SelectItem key={column} value={column}>
                    {column}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] rounded-md border">
          <div className="w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  {data.columns.map((column) => (
                    <TableHead 
                      key={column} 
                      className={column === selectedColumn ? 
                        "bg-primary/20 text-primary font-semibold sticky top-0 z-10" : "sticky top-0 z-10"}
                    >
                      {column}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedData.slice(0, 20).map((row, i) => (
                  <TableRow key={i}>
                    {data.columns.map((column) => (
                      <TableCell 
                        key={column} 
                        className={column === selectedColumn ? 
                          "bg-primary/10 font-medium" : ""}
                      >
                        {formatCellValue(row[column])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
        <div className="mt-2 text-xs text-muted-foreground">
          Showing 20 of {data.rowCount} rows • Date range: {data.dateRange.start} to {data.dateRange.end}
        </div>
      </CardContent>
    </Card>
  );
};

export default DataPreview;
