
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { ArrowDown, FilePlus } from 'lucide-react';
import DataPreview from '@/components/DataPreview';
import StreamlitUI from '@/components/StreamlitUI';

const Index = () => {
  const { toast } = useToast();
  const [isStreamlitRunning, setIsStreamlitRunning] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [fileData, setFileData] = useState<any>(null);
  
  // Sample data for initial UI
  const sampleData = {
    fileName: 'housing_data.csv',
    columns: ['date', 'price', 'inventory', 'mortgage_rate'],
    dateRange: {
      start: '2018-01-01',
      end: '2023-01-01',
    },
    rowCount: 60,
    data: [
      { date: '2018-01-01', price: 350000, inventory: 1200, mortgage_rate: 4.5 },
      { date: '2018-02-01', price: 355000, inventory: 1150, mortgage_rate: 4.6 },
      { date: '2018-03-01', price: 360000, inventory: 1100, mortgage_rate: 4.7 },
      { date: '2018-04-01', price: 365000, inventory: 1050, mortgage_rate: 4.8 },
      { date: '2018-05-01', price: 370000, inventory: 1000, mortgage_rate: 4.9 }
    ]
  };

  // Function to execute the Streamlit script
  const runStreamlitApp = async () => {
    try {
      setIsStreamlitRunning(true);
      const response = await fetch('/api/execute-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: 'python_scripts/run_streamlit.sh',
        }),
      });
      
      if (response.ok) {
        toast({
          title: 'Streamlit application is running',
          description: 'You can now interact with the ARIMA analyzer.',
        });
      } else {
        const errorData = await response.json();
        toast({
          variant: 'destructive',
          title: 'Failed to start Streamlit application',
          description: errorData.error || 'An unknown error occurred',
        });
        setIsStreamlitRunning(false);
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to start the Streamlit application.',
      });
      setIsStreamlitRunning(false);
    }
  };

  // Auto-start the Streamlit app when component mounts
  useEffect(() => {
    runStreamlitApp();
  }, []);

  // Handle column selection for analysis
  const handleColumnSelect = (column: string) => {
    setSelectedColumn(column);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <div className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex flex-col space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Time Series Analysis</h1>
              <p className="text-muted-foreground">
                Analyze and forecast time series data using ARIMA models
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={runStreamlitApp}
                disabled={isStreamlitRunning}
              >
                <FilePlus className="mr-2 h-4 w-4" />
                {isStreamlitRunning ? 'Running...' : 'Start Analysis'}
              </Button>
            </div>
          </div>
          
          <Separator />
          
          <ResizablePanelGroup
            direction="vertical"
            className="min-h-[calc(100vh-14rem)]"
          >
            <ResizablePanel defaultSize={30} minSize={20}>
              <ScrollArea className="h-full px-1">
                <div className="p-2">
                  <DataPreview 
                    data={fileData || sampleData} 
                    onColumnSelect={handleColumnSelect}
                  />
                </div>
              </ScrollArea>
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={70}>
              <div className="p-2 h-full">
                <StreamlitUI isLoading={!isStreamlitRunning} />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
};

export default Index;
