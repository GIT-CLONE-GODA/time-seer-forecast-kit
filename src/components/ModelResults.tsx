
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ModelConfig } from './ModelConfiguration';

interface ModelResultsProps {
  config: ModelConfig;
  metrics: {
    rmse: number;
    mae: number;
    r2: number;
    accuracy: number;
  };
}

const ModelResults = ({ config, metrics }: ModelResultsProps) => {
  // Helper function to get color based on score
  const getScoreColor = (score: number, metric: string) => {
    if (metric === 'r2' || metric === 'accuracy') {
      if (score >= 0.9) return 'text-green-600';
      if (score >= 0.7) return 'text-amber-600';
      return 'text-red-600';
    } else {
      // For error metrics like RMSE and MAE, lower is better
      // Using arbitrary thresholds here
      if (score <= 0.05) return 'text-green-600';
      if (score <= 0.2) return 'text-amber-600';
      return 'text-red-600';
    }
  };
  
  // Helper function for progress bar color
  const getProgressColor = (score: number, metric: string) => {
    if (metric === 'r2' || metric === 'accuracy') {
      if (score >= 0.9) return 'bg-green-600';
      if (score >= 0.7) return 'bg-amber-600';
      return 'bg-red-600';
    } else {
      if (score <= 0.05) return 'bg-green-600';
      if (score <= 0.2) return 'bg-amber-600';
      return 'bg-red-600';
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Model Results</CardTitle>
            <CardDescription>Performance metrics for your ARIMA model</CardDescription>
          </div>
          <Badge variant={config.modelType === 'auto' ? 'secondary' : 'outline'}>
            {config.modelType === 'auto' ? 'Auto ARIMA' : `ARIMA(${config.order?.p},${config.order?.d},${config.order?.q})`}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="metrics">
          <TabsList className="mb-4">
            <TabsTrigger value="metrics">Performance Metrics</TabsTrigger>
            <TabsTrigger value="config">Model Configuration</TabsTrigger>
          </TabsList>
          
          <TabsContent value="metrics">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Accuracy</span>
                  <span className={`text-sm font-medium ${getScoreColor(metrics.accuracy, 'accuracy')}`}>
                    {(metrics.accuracy * 100).toFixed(2)}%
                  </span>
                </div>
                <Progress 
                  value={metrics.accuracy * 100} 
                  className="h-2"
                  indicatorClassName={getProgressColor(metrics.accuracy, 'accuracy')}
                />
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">R² Score</span>
                  <span className={`text-sm font-medium ${getScoreColor(metrics.r2, 'r2')}`}>
                    {metrics.r2.toFixed(3)}
                  </span>
                </div>
                <Progress 
                  value={Math.max(0, metrics.r2) * 100} 
                  className="h-2"
                  indicatorClassName={getProgressColor(metrics.r2, 'r2')}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="border p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold">{metrics.rmse.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">RMSE</div>
                </div>
                <div className="border p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold">{metrics.mae.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">MAE</div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="config">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Model Type</TableCell>
                  <TableCell>{config.modelType === 'auto' ? 'Auto ARIMA' : 'Manual ARIMA'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Training Size</TableCell>
                  <TableCell>{(config.trainSize * 100).toFixed(0)}%</TableCell>
                </TableRow>
                {config.modelType === 'manual' && config.order && (
                  <TableRow>
                    <TableCell className="font-medium">ARIMA Order (p,d,q)</TableCell>
                    <TableCell>({config.order.p}, {config.order.d}, {config.order.q})</TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell className="font-medium">Seasonal</TableCell>
                  <TableCell>{config.seasonal ? 'Yes' : 'No'}</TableCell>
                </TableRow>
                {config.seasonal && (
                  <TableRow>
                    <TableCell className="font-medium">Seasonal Period</TableCell>
                    <TableCell>{config.seasonalPeriod}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ModelResults;
