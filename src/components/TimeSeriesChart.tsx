
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getDataStats } from '@/services/forecastService';

interface TimeSeriesChartProps {
  data: any[];
  selectedColumn: string;
  predictions?: {
    forecast: number[];
    dates: string[];
  };
}

const TimeSeriesChart = ({ data, selectedColumn, predictions }: TimeSeriesChartProps) => {
  // Get data statistics for better scaling
  const dataStats = useMemo(() => 
    getDataStats(data, selectedColumn),
    [data, selectedColumn]
  );
  
  // Format data for the charts
  const chartData = [...data];
  
  // Calculate split point for train/test data (assuming 80% train by default)
  const trainSize = Math.floor(data.length * 0.8);
  
  // Prepare combined data for train/test visualization
  const combinedData = data.map((item, index) => {
    const isTraining = index < trainSize;
    return {
      ...item,
      [`${selectedColumn}_training`]: isTraining ? item[selectedColumn] : null,
      [`${selectedColumn}_testing`]: !isTraining ? item[selectedColumn] : null,
    };
  });
  
  // Add a single connecting point at the transition
  if (combinedData.length > 0 && trainSize > 0 && trainSize < combinedData.length) {
    // Create a connecting point at the boundary
    combinedData[trainSize-1][`${selectedColumn}_testing`] = combinedData[trainSize-1][selectedColumn];
  }

  // Prepare data for forecast visualization
  const forecastData = [...data];
  
  // If we have predictions, incorporate them into the forecast data
  if (predictions && predictions.forecast) {
    predictions.forecast.forEach((value, index) => {
      const dataIndex = trainSize + index;
      if (dataIndex < forecastData.length) {
        // Update existing data points
        forecastData[dataIndex] = {
          ...forecastData[dataIndex],
          [`${selectedColumn}_forecast`]: value
        };
      } else {
        // Add new data points for forecasts that extend beyond existing data
        // Use the date from predictions.dates if available, or generate a date
        const date = predictions.dates && predictions.dates[index] 
          ? predictions.dates[index] 
          : `Forecast ${index + 1}`;
        
        forecastData.push({
          date: date,
          [`${selectedColumn}_forecast`]: value
        });
      }
    });
  }
  
  // Calculate better Y domain for the chart based on data and predictions
  const calculateYDomain = () => {
    const values = data
      .filter(d => d[selectedColumn] !== null && d[selectedColumn] !== undefined)
      .map(d => d[selectedColumn]);
    
    // Include forecast values if they exist
    if (predictions && predictions.forecast) {
      values.push(...predictions.forecast);
    }
    
    if (values.length === 0) return [0, 100];
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Add some padding (10%)
    const padding = (max - min) * 0.1;
    const yMin = Math.max(0, min - padding); // Don't go below 0 unless data does
    const yMax = max + padding;
    
    return [yMin, yMax];
  };
  
  const yDomain = calculateYDomain();
  
  // Custom formatter for y-axis values
  const formatYAxis = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };
  
  // Sample data points for X-axis ticks (to avoid overcrowding)
  const getXAxisTicks = (data: any[]) => {
    if (!data || data.length <= 6) return undefined;
    
    const tickIndexes = [];
    const step = Math.ceil(data.length / 6);
    
    for (let i = 0; i < data.length; i += step) {
      tickIndexes.push(i);
    }
    
    // Always include the last point
    if (!tickIndexes.includes(data.length - 1)) {
      tickIndexes.push(data.length - 1);
    }
    
    return tickIndexes.map(i => data[i]?.date);
  };
  
  // Custom tooltip formatter
  const renderTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-3 border rounded shadow-md">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => {
            // Only show non-null values
            if (entry.value !== null) {
              // Extract the display name from the dataKey
              let displayName = entry.name;
              if (displayName.includes('_training')) {
                displayName = `${selectedColumn} (Training)`;
              } else if (displayName.includes('_testing')) {
                displayName = `${selectedColumn} (Testing)`;
              } else if (displayName.includes('_forecast')) {
                displayName = 'Forecast';
              }
              
              return (
                <p key={index} style={{ color: entry.color }}>
                  {displayName}: {entry.value.toLocaleString()}
                </p>
              );
            }
            return null;
          }).filter(Boolean)}
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle>Time Series Analysis - {selectedColumn}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="full">
          <TabsList className="mb-4">
            <TabsTrigger value="full">Full Series</TabsTrigger>
            <TabsTrigger value="split">Train/Test Split</TabsTrigger>
            {predictions && <TabsTrigger value="forecast">Forecast</TabsTrigger>}
          </TabsList>
          
          {/* Full Series Tab */}
          <TabsContent value="full" className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%" className="time-series-chart">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }} 
                  tickMargin={10}
                  ticks={getXAxisTicks(chartData)}
                />
                <YAxis 
                  tickFormatter={formatYAxis}
                  width={60}
                  tick={{ fontSize: 12 }}
                  domain={yDomain}
                />
                <Tooltip content={renderTooltip} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={selectedColumn}
                  stroke="#0ca4eb"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
          
          {/* Train/Test Split Tab - Fixed to show as one continuous chart with different colors */}
          <TabsContent value="split" className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%" className="time-series-chart">
              <LineChart data={combinedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }} 
                  tickMargin={10}
                  ticks={getXAxisTicks(combinedData)}
                />
                <YAxis 
                  tickFormatter={formatYAxis}
                  width={60}
                  tick={{ fontSize: 12 }}
                  domain={yDomain}
                />
                <Tooltip content={renderTooltip} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={`${selectedColumn}_training`}
                  name={`${selectedColumn} (Training)`}
                  stroke="#0ca4eb"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                  animationDuration={1500}
                  animationBegin={0}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey={`${selectedColumn}_testing`}
                  name={`${selectedColumn} (Testing)`}
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                  animationDuration={1500}
                  animationBegin={1500} // Start after training animation ends
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
          
          {/* Forecast Tab - Fixed to properly colorize actual vs forecast values */}
          {predictions && (
            <TabsContent value="forecast" className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%" className="time-series-chart">
                <LineChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }} 
                    tickMargin={10}
                    ticks={getXAxisTicks(forecastData)}
                  />
                  <YAxis 
                    tickFormatter={formatYAxis}
                    width={60}
                    tick={{ fontSize: 12 }}
                    domain={yDomain}
                  />
                  <Tooltip content={renderTooltip} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={selectedColumn}
                    stroke="#0ca4eb"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                    name="Actual"
                    animationDuration={1500}
                    animationBegin={0}
                  />
                  <Line
                    type="monotone"
                    dataKey={`${selectedColumn}_forecast`}
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                    name="Forecast"
                    animationDuration={1500}
                    animationBegin={1500} // Start after actual data animation ends
                  />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TimeSeriesChart;
