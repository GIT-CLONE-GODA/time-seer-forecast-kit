
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { Loader2 } from 'lucide-react';

export interface ModelConfig {
  trainSize: number;
  modelType: 'auto' | 'manual';
  order?: {
    p: number;
    d: number;
    q: number;
  };
  seasonal: boolean;
  seasonalPeriod: number;
}

interface ModelConfigurationProps {
  onRunModel: (config: ModelConfig) => void;
  isLoading?: boolean;
}

const ModelConfiguration = ({ onRunModel, isLoading = false }: ModelConfigurationProps) => {
  const [modelType, setModelType] = useState<'auto' | 'manual'>('auto');
  const [seasonal, setSeasonal] = useState(false);
  
  const form = useForm<ModelConfig>({
    defaultValues: {
      trainSize: 0.8,
      modelType: 'auto',
      order: {
        p: 1,
        d: 1,
        q: 1,
      },
      seasonal: false,
      seasonalPeriod: 12,
    },
  });
  
  const handleSubmit = (values: ModelConfig) => {
    onRunModel(values);
  };
  
  const handleTypeChange = (value: string) => {
    setModelType(value as 'auto' | 'manual');
    form.setValue('modelType', value as 'auto' | 'manual');
  };
  
  const handleSeasonalChange = (checked: boolean) => {
    setSeasonal(checked);
    form.setValue('seasonal', checked);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Model Configuration</CardTitle>
        <CardDescription>Configure your ARIMA time series model</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <FormLabel className="text-sm font-medium">Training Data Size</FormLabel>
              <div className="flex flex-wrap items-center gap-2">
                <Slider
                  defaultValue={[80]}
                  max={95}
                  min={50}
                  step={5}
                  onValueChange={(value) => form.setValue('trainSize', value[0] / 100)}
                  className="flex-1"
                />
                <span className="text-sm font-medium">
                  {Math.round(form.watch('trainSize') * 100)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Percentage of data used for training the model
              </p>
            </div>
            
            <Tabs defaultValue="auto" onValueChange={handleTypeChange}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="auto">Auto ARIMA</TabsTrigger>
                <TabsTrigger value="manual">Manual ARIMA</TabsTrigger>
              </TabsList>
              
              <TabsContent value="auto" className="pt-4">
                <p className="text-sm text-muted-foreground">
                  Auto ARIMA automatically identifies the optimal model parameters (p,d,q) 
                  using statistical methods.
                </p>
              </TabsContent>
              
              <TabsContent value="manual" className="space-y-4 pt-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="order.p"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>p (AR)</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select p" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[0, 1, 2, 3, 4, 5].map((p) => (
                              <SelectItem key={p} value={p.toString()}>
                                {p}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="order.d"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>d (I)</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select d" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[0, 1, 2].map((d) => (
                              <SelectItem key={d} value={d.toString()}>
                                {d}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="order.q"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>q (MA)</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select q" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[0, 1, 2, 3, 4, 5].map((q) => (
                              <SelectItem key={q} value={q.toString()}>
                                {q}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="seasonal"
                checked={seasonal}
                onCheckedChange={handleSeasonalChange}
              />
              <label
                htmlFor="seasonal"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Include Seasonality
              </label>
            </div>
            
            {seasonal && (
              <FormField
                control={form.control}
                name="seasonalPeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seasonal Period</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[4, 7, 12, 52].map((period) => (
                          <SelectItem key={period} value={period.toString()}>
                            {period === 4 ? 'Quarterly (4)' : 
                             period === 7 ? 'Weekly (7)' : 
                             period === 12 ? 'Monthly (12)' : 
                             'Weekly (52)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Data
                </>
              ) : (
                'Run Model'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ModelConfiguration;
