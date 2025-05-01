
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ModelConfigurationProps {
  onRunModel: (config: ModelConfig) => void;
}

export interface ModelConfig {
  modelType: 'manual' | 'auto';
  trainSize: number;
  order?: { p: number; d: number; q: number };
  seasonal: boolean;
  seasonalPeriod: number;
}

const ModelConfiguration = ({ onRunModel }: ModelConfigurationProps) => {
  const [modelType, setModelType] = useState<'manual' | 'auto'>('auto');
  const [p, setP] = useState<number>(2);
  const [d, setD] = useState<number>(1);
  const [q, setQ] = useState<number>(1);
  const [trainSize, setTrainSize] = useState<number>(80);
  const [seasonal, setSeasonal] = useState<boolean>(false);
  const [seasonalPeriod, setSeasonalPeriod] = useState<number>(12);
  
  const handleRunModel = () => {
    const config: ModelConfig = {
      modelType,
      trainSize: trainSize / 100,
      seasonal,
      seasonalPeriod,
    };
    
    if (modelType === 'manual') {
      config.order = { p, d, q };
    }
    
    onRunModel(config);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Model Configuration</CardTitle>
        <CardDescription>Configure and run your ARIMA time series model</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="model-type">ARIMA Model Type</Label>
            <Select 
              value={modelType} 
              onValueChange={(value: 'manual' | 'auto') => setModelType(value)}
            >
              <SelectTrigger id="model-type">
                <SelectValue placeholder="Select model type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto ARIMA (Automatically find best parameters)</SelectItem>
                <SelectItem value="manual">Manual ARIMA (Set your own parameters)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {modelType === 'manual' && (
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="p-value">P (AR order)</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="p-slider"
                    min={0}
                    max={5}
                    step={1}
                    value={[p]}
                    onValueChange={(value) => setP(value[0])}
                    className="flex-1"
                  />
                  <span className="w-8 text-center">{p}</span>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="d-value">D (Differencing)</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="d-slider"
                    min={0}
                    max={2}
                    step={1}
                    value={[d]}
                    onValueChange={(value) => setD(value[0])}
                    className="flex-1"
                  />
                  <span className="w-8 text-center">{d}</span>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="q-value">Q (MA order)</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="q-slider"
                    min={0}
                    max={5}
                    step={1}
                    value={[q]}
                    onValueChange={(value) => setQ(value[0])}
                    className="flex-1"
                  />
                  <span className="w-8 text-center">{q}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid gap-2">
            <Label htmlFor="train-size">Training Data Size (%)</Label>
            <div className="flex items-center gap-2">
              <Slider
                id="train-size"
                min={50}
                max={90}
                step={5}
                value={[trainSize]}
                onValueChange={(value) => setTrainSize(value[0])}
                className="flex-1"
              />
              <span className="w-12 text-center">{trainSize}%</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="seasonal"
              checked={seasonal}
              onCheckedChange={setSeasonal}
            />
            <Label htmlFor="seasonal">Include Seasonal Component</Label>
          </div>
          
          {seasonal && (
            <div className="grid gap-2">
              <Label htmlFor="seasonal-period">Seasonal Period</Label>
              <Select 
                value={seasonalPeriod.toString()} 
                onValueChange={(value) => setSeasonalPeriod(parseInt(value))}
              >
                <SelectTrigger id="seasonal-period">
                  <SelectValue placeholder="Select seasonal period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">Quarterly (4)</SelectItem>
                  <SelectItem value="12">Monthly (12)</SelectItem>
                  <SelectItem value="52">Weekly (52)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <Button 
            className="w-full" 
            onClick={handleRunModel}
          >
            Run Model
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ModelConfiguration;
