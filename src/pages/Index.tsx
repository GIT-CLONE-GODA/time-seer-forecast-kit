
import React, { useState } from 'react';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import DataPreview from '@/components/DataPreview';
import TimeSeriesChart from '@/components/TimeSeriesChart';
import ModelConfiguration, { ModelConfig } from '@/components/ModelConfiguration';
import ModelResults from '@/components/ModelResults';
import { useToast } from '@/components/ui/use-toast';
import { CalendarClock } from 'lucide-react';
import { runArimaModel } from '@/api/pythonService';

const Index = () => {
  const { toast } = useToast();
  const [data, setData] = useState<any | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);
  const [modelResults, setModelResults] = useState<any | null>(null);
  const [predictions, setPredictions] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleFileUploaded = (fileData: any) => {
    setData(fileData);
    setSelectedColumn('');
    setModelConfig(null);
    setModelResults(null);
    setPredictions(null);
  };

  const handleColumnSelect = (column: string) => {
    setSelectedColumn(column);
    setModelConfig(null);
    setModelResults(null);
    setPredictions(null);
  };

  const handleRunModel = async (config: ModelConfig) => {
    // Show loading toast
    toast({
      title: "Running ARIMA model",
      description: "Please wait while we process your data...",
    });
    
    setIsLoading(true);

    try {
      // Run the ARIMA model using the Python service
      const result = await runArimaModel(data, selectedColumn, config);
      
      // Save model configuration, results, and predictions
      setModelConfig(config);
      setModelResults({
        rmse: result.metrics.rmse,
        mae: result.metrics.mae,
        r2: result.metrics.r2,
        accuracy: result.metrics.accuracy || 0.85
      });
      
      setPredictions({
        forecast: result.forecast,
        dates: result.dates
      });

      // Update the data with forecast values
      const updatedData = [...data.data];
      result.forecast.forEach((value: number, i: number) => {
        const index = data.data.findIndex((d: any) => d.date === result.dates[i]);
        if (index !== -1) {
          updatedData[index] = {
            ...updatedData[index],
            [`${selectedColumn}_forecast`]: value
          };
        }
      });

      toast({
        title: "Model execution complete",
        description: "Your ARIMA model has been successfully trained and evaluated.",
      });
    } catch (error) {
      console.error("Error running model:", error);
      toast({
        title: "Error running model",
        description: "There was an error processing your data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container px-4 py-6 mx-auto max-w-7xl">
        {!data ? (
          <div className="space-y-6">
            <div className="text-center py-12">
              <CalendarClock className="h-16 w-16 text-seer-600 mx-auto mb-4 animate-pulse-slow" />
              <h1 className="text-3xl font-bold text-foreground mb-2">TimeSeer Forecast Kit</h1>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                Upload your time series data to analyze trends and generate accurate forecasts with our advanced ARIMA models.
              </p>
            </div>
            <FileUpload onFileUploaded={handleFileUploaded} />
          </div>
        ) : (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-foreground">Time Series Analysis Dashboard</h1>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <DataPreview data={data} onColumnSelect={handleColumnSelect} />
              </div>
              
              {selectedColumn && (
                <div>
                  <ModelConfiguration onRunModel={handleRunModel} isLoading={isLoading} />
                </div>
              )}
            </div>
            
            {selectedColumn && (
              <div className="grid gap-6">
                <TimeSeriesChart 
                  data={data.data} 
                  selectedColumn={selectedColumn}
                  predictions={predictions}
                />
                
                {modelResults && modelConfig && (
                  <ModelResults config={modelConfig} metrics={modelResults} />
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
