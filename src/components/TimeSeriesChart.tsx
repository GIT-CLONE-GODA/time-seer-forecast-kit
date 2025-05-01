
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
  
  // If we have predictions, add them to the chart data
  if (predictions && predictions.forecast) {
    const trainSize = Math.floor(data.length * 0.8);
    const trainingData = data.slice(0, trainSize);
    const testingData = data.slice(trainSize);
    
    // Add forecast values to the testing data points
    predictions.forecast.forEach((value, index) => {
      if (index < testingData.length) {
        testingData[index] = {
          ...testingData[index],
          [`${selectedColumn}_forecast`]: value
        };
      }
    });
  }

  // Create split view data (training and testing)
  const trainSize = Math.floor(data.length * 0.8);
  const trainingData = data.slice(0, trainSize);
  const testingData = data.slice(trainSize);
  const allData = [...trainingData, ...testingData];
  
  // Custom formatter for y-axis values
  const formatYAxis = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value;
  };
  
  // Custom tooltip formatter
  const renderTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-md">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
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
              <LineChart data={allData}>
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
                  name={`${selectedColumn} (Training)`}
                  animationDuration={1500}
                  data={trainingData}
                />
                <Line
                  type="monotone"
                  dataKey={selectedColumn}
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                  name={`${selectedColumn} (Testing)`}
                  animationDuration={1500}
                  data={testingData}
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
