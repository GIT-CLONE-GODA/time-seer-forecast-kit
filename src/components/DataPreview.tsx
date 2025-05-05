
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  
  // Get non-date columns
  const timeSeriesColumns = data.columns.filter(col => col !== 'date');
  
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
                {timeSeriesColumns.map((column) => (
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
        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {data.columns.map((column) => (
                  <TableHead 
                    key={column} 
                    className={column === selectedColumn ? 
                      "bg-primary/20 text-primary font-semibold" : ""}
                  >
                    {column}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.slice(0, 5).map((row, i) => (
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
        <div className="mt-2 text-xs text-muted-foreground">
          Showing 5 of {data.rowCount} rows • Date range: {data.dateRange.start} to {data.dateRange.end}
        </div>
      </CardContent>
    </Card>
  );
};

export default DataPreview;
