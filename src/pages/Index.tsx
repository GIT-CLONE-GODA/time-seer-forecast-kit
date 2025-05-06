
import React, { useState } from 'react';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import DataPreview from '@/components/DataPreview';
import TimeSeriesChart from '@/components/TimeSeriesChart';
import ModelConfiguration, { ModelConfig } from '@/components/ModelConfiguration';
import ModelResults from '@/components/ModelResults';
import { useToast } from '@/hooks/use-toast';
import { CalendarClock } from 'lucide-react';
import { runForecast, prepareTimeSeriesData } from '@/services/forecastService';

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
    if (!data || !selectedColumn) {
      toast({
        title: "Error",
        description: "Please upload data and select a column first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Prepare request data
      const timeSeriesData = prepareTimeSeriesData(data.data, selectedColumn);
      
      // Calculate forecast steps based on test data size
      const testSize = Math.floor(data.data.length * (1 - config.trainSize));
      
      const request = {
        data: timeSeriesData,
        column_name: selectedColumn,
        forecast_steps: testSize,
        config: {
          model_type: config.modelType,
          train_size: config.trainSize,
          seasonal: config.seasonal,
          seasonal_period: config.seasonalPeriod,
          order: config.modelType === 'manual' ? config.order : undefined
        }
      };

      // Call API
      const response = await runForecast(request);
      
      // Update state with API response
      setModelConfig(config);
      setModelResults(response.metrics);
      
      // Set predictions
      setPredictions({
        forecast: response.forecast,
        dates: response.dates
      });
      
      // Add forecast values to the data
      const updatedData = [...data.data];
      const trainSize = Math.floor(data.data.length * config.trainSize);
      
      response.forecast.forEach((value: number, i: number) => {
        if (trainSize + i < updatedData.length) {
          updatedData[trainSize + i] = {
            ...updatedData[trainSize + i],
            [`${selectedColumn}_forecast`]: value
          };
        }
      });

      toast({
        title: "Model execution complete",
        description: `Your ${config.modelType === 'auto' ? 'Auto' : 'Manual'} ARIMA model has been successfully trained and evaluated.`,
      });
    } catch (error) {
      console.error('Error running model:', error);
      toast({
        title: "Error running model",
        description: "There was an error running the ARIMA model. Please check the console for details.",
        variant: "destructive",
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
              <CalendarClock className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse-slow" />
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
