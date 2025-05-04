
import React, { useState } from 'react';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import DataPreview from '@/components/DataPreview';
import TimeSeriesChart from '@/components/TimeSeriesChart';
import ModelConfiguration, { ModelConfig } from '@/components/ModelConfiguration';
import ModelResults from '@/components/ModelResults';
import { useToast } from '@/components/ui/use-toast';
import { CalendarClock } from 'lucide-react';

const Index = () => {
  const { toast } = useToast();
  const [data, setData] = useState<any | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);
  const [modelResults, setModelResults] = useState<any | null>(null);
  const [predictions, setPredictions] = useState<any | null>(null);

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

  const handleRunModel = (config: ModelConfig) => {
    // Simulate model running with a toast
    toast({
      title: "Running ARIMA model",
      description: "Please wait while we process your data...",
    });

    // Simulate async model execution
    setTimeout(() => {
      // Generate mock results
      const mockResults = {
        rmse: 0.05 + Math.random() * 0.1,
        mae: 0.03 + Math.random() * 0.08,
        r2: 0.75 + Math.random() * 0.2,
        accuracy: 0.8 + Math.random() * 0.15
      };

      // Generate mock predictions
      const testSize = Math.floor(data.data.length * (1 - config.trainSize));
      const mockForecast = data.data.slice(-testSize).map((point: any, i: number) => {
        // Create a somewhat realistic forecast with some error
        const actual = point[selectedColumn];
        const error = (Math.random() - 0.5) * 0.1; // +/- 5% error
        return actual * (1 + error);
      });

      // Save model configuration, results, and predictions
      setModelConfig(config);
      setModelResults(mockResults);
      setPredictions({
        forecast: mockForecast,
        dates: data.data.slice(-testSize).map((point: any) => point.date)
      });

      // Add forecast values to the data
      const updatedData = [...data.data];
      const trainSize = Math.floor(data.data.length * config.trainSize);
      mockForecast.forEach((value: number, i: number) => {
        if (trainSize + i < updatedData.length) {
          updatedData[trainSize + i] = {
            ...updatedData[trainSize + i],
            [`${selectedColumn}_forecast`]: value
          };
        }
      });

      toast({
        title: "Model execution complete",
        description: "Your ARIMA model has been successfully trained and evaluated.",
      });
    }, 1500);
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
                  <ModelConfiguration onRunModel={handleRunModel} />
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
