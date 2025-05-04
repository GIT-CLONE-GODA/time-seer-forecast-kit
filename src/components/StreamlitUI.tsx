
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StreamlitUIProps {
  isLoading: boolean;
}

const StreamlitUI = ({ isLoading }: StreamlitUIProps) => {
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  
  useEffect(() => {
    // Add a handler to detect when the iframe has loaded
    const handleIframeLoad = () => {
      setIsIframeLoading(false);
    };
    
    const iframe = document.getElementById('streamlit-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.addEventListener('load', handleIframeLoad);
    }
    
    return () => {
      if (iframe) {
        iframe.removeEventListener('load', handleIframeLoad);
      }
    };
  }, []);

  return (
    <Card className="w-full h-[calc(100vh-12rem)] overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>ARIMA Time Series Analyzer</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-3.5rem)]">
        {(isLoading || isIframeLoading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Loading Streamlit Application...</p>
            </div>
          </div>
        )}
        <iframe 
          id="streamlit-iframe"
          src="http://localhost:8501" 
          className="w-full h-full border-none"
          title="Streamlit ARIMA Time Series Analysis"
          allow="camera; microphone; clipboard-read; clipboard-write"
        />
      </CardContent>
    </Card>
  );
};

export default StreamlitUI;
