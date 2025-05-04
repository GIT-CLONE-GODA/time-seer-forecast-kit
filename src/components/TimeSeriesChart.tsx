
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TimeSeriesChartProps {
  data: any[];
  selectedColumn: string;
  predictions?: {
    forecast: number[];
    dates: string[];
  };
}

const TimeSeriesChart = ({ data, selectedColumn, predictions }: TimeSeriesChartProps) => {
  // Create chart data with predictions if available
  const chartData = [...data];
  
  // Create split view data (training and testing)
  const trainSize = Math.floor(data.length * 0.8);
  const trainingData = data.slice(0, trainSize);
  const testingData = data.slice(trainSize);
  
  // Create a properly formatted dataset for showing train/test split
  // Each data point knows whether it's in training or testing set
  const splitData = data.map((item, index) => ({
    ...item,
    [`${selectedColumn}_train`]: index < trainSize ? item[selectedColumn] : null,
    [`${selectedColumn}_test`]: index >= trainSize ? item[selectedColumn] : null
  }));
  
  // If we have predictions, add them to the chart data
  if (predictions && predictions.forecast) {
    // Map forecast values to testing data points
    testingData.forEach((item, index) => {
      if (index < predictions.forecast.length) {
        const forecastValue = predictions.forecast[index];
        const dataIndex = trainSize + index;
        if (dataIndex < chartData.length) {
          chartData[dataIndex] = {
            ...chartData[dataIndex],
            [`${selectedColumn}_forecast`]: forecastValue
          };
        }
      }
    });
  }
  
  // Custom formatter for y-axis values - updated to always return a string
  const formatYAxis = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString(); // Convert to string to ensure string return type
  };
  
  // Custom tooltip formatter
  const renderTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-md">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value !== null && entry.value !== undefined 
                ? entry.value.toLocaleString()
                : 'N/A'
              }
            </p>
          ))}
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
          
          <TabsContent value="full" className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%" className="time-series-chart">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickMargin={10} />
                <YAxis 
                  tickFormatter={formatYAxis}
                  width={60}
                  tick={{ fontSize: 12 }}
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
          
          <TabsContent value="split" className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%" className="time-series-chart">
              <LineChart data={splitData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickMargin={10} />
                <YAxis 
                  tickFormatter={formatYAxis}
                  width={60}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={renderTooltip} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={`${selectedColumn}_train`}
                  stroke="#0ca4eb"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                  name={`${selectedColumn} (Training)`}
                  animationDuration={1500}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey={`${selectedColumn}_test`}
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                  name={`${selectedColumn} (Testing)`}
                  animationDuration={1500}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
          
          {predictions && (
            <TabsContent value="forecast" className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%" className="time-series-chart">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} tickMargin={10} />
                  <YAxis 
                    tickFormatter={formatYAxis}
                    width={60}
                    tick={{ fontSize: 12 }}
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
                  />
                  <Line
                    type="monotone"
                    dataKey={`${selectedColumn}_forecast`}
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={{ r: 6 }}
                    name="Forecast"
                    animationDuration={1500}
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
