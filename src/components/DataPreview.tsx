
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

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
  
  // Auto-select the first column on initial load if none selected
  useEffect(() => {
    if (!selectedColumn && timeSeriesColumns.length > 0) {
      handleColumnChange(timeSeriesColumns[0]);
    }
  }, [timeSeriesColumns]);
  
  // Handle column selection
  const handleColumnChange = (value: string) => {
    setSelectedColumn(value);
    onColumnSelect(value);
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Data Preview:</span>
            <Badge variant="outline" className="font-normal">
              {data.fileName}
            </Badge>
          </div>
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
                      {column === 'date' ? row[column] : 
                        row[column] != null && !isNaN(row[column]) ? 
                          typeof row[column] === 'number' ? 
                            row[column].toLocaleString() : 
                            row[column] : 
                          'N/A'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-2 text-xs text-muted-foreground flex justify-between">
          <span>Showing 5 of {data.rowCount} rows</span>
          <span>Date range: {data.dateRange.start} to {data.dateRange.end}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default DataPreview;
