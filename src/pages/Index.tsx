
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import FileUpload from '@/components/FileUpload';
import DataPreview from '@/components/DataPreview';
import TimeSeriesChart from '@/components/TimeSeriesChart';
import ModelConfiguration, { ModelConfig } from '@/components/ModelConfiguration';
import ModelResults from '@/components/ModelResults';
import { useToast } from '@/hooks/use-toast';
import { CalendarClock } from 'lucide-react';
import { runForecast, prepareTimeSeriesData, preprocessData, validateData } from '@/services/forecastService';

const Index = () => {
  const { toast } = useToast();
  const [data, setData] = useState<any | null>(null);
  const [processedData, setProcessedData] = useState<any | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [modelConfig, setModelConfig] = useState<ModelConfig | null>(null);
  const [modelResults, setModelResults] = useState<any | null>(null);
  const [predictions, setPredictions] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  // Process data when it changes
  useEffect(() => {
    const processUploadedData = async () => {
      if (data && data.data) {
        try {
          setIsValidating(true);
          // Call the backend to validate and preprocess the data
          const validatedData = await validateData(data.data);
          
          if (validatedData && validatedData.data) {
            // Update with processed data
            const processed = {
              ...data,
              data: validatedData.data,
              columns: validatedData.columns || data.columns,
              dateRange: validatedData.dateRange || data.dateRange,
              rowCount: validatedData.data.length
            };
            
            setProcessedData(processed);
          } else {
            throw new Error("Data validation failed");
          }
        } catch (error) {
          console.error('Error processing data:', error);
          toast({
            title: "Error validating data",
            description: error instanceof Error ? error.message : "Make sure your CSV has a 'date' column and numeric data",
            variant: "destructive",
          });
        } finally {
          setIsValidating(false);
        }
      }
    };

    processUploadedData();
  }, [data, toast]);

  const handleFileUploaded = (fileData: any) => {
    // Validate data has necessary columns
    if (!fileData || !fileData.data || !fileData.columns) {
      toast({
        title: "Invalid data format",
        description: "The uploaded file doesn't contain valid time series data",
        variant: "destructive",
      });
      return;
    }
    
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
    if (!processedData || !selectedColumn) {
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
      const timeSeriesData = prepareTimeSeriesData(processedData.data, selectedColumn);
      
      if (timeSeriesData.length === 0) {
        throw new Error("No valid data points found for the selected column");
      }
      
      // Calculate forecast steps based on test data size
      const trainSize = Math.floor(timeSeriesData.length * config.trainSize);
      const testSize = timeSeriesData.length - trainSize;
      
      const request = {
        data: timeSeriesData,
        column_name: selectedColumn,
        forecast_steps: testSize > 0 ? testSize : 6, // Default to 6 months if no test size
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
      
      toast({
        title: "Model execution complete",
        description: `Your ${config.modelType === 'auto' ? 'Auto' : 'Manual'} ARIMA model has been successfully trained and evaluated.`,
      });
    } catch (error) {
      console.error('Error running model:', error);
      toast({
        title: "Error running model",
        description: error instanceof Error ? error.message : "There was an error running the ARIMA model",
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
                {isValidating ? (
                  <div className="flex items-center justify-center h-[300px] border rounded-md">
                    <div className="text-center">
                      <CalendarClock className="h-10 w-10 text-primary mx-auto mb-4 animate-pulse" />
                      <p className="text-muted-foreground">Validating and preprocessing data...</p>
                    </div>
                  </div>
                ) : processedData ? (
                  <DataPreview data={processedData} onColumnSelect={handleColumnSelect} />
                ) : null}
              </div>
              
              {selectedColumn && (
                <div>
                  <ModelConfiguration onRunModel={handleRunModel} isLoading={isLoading} />
                </div>
              )}
            </div>
            
            {selectedColumn && processedData && (
              <div className="grid gap-6">
                <TimeSeriesChart 
                  data={processedData.data} 
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
