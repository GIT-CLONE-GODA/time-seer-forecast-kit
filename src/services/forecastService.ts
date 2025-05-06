
import axios from 'axios';

// Define the API base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Types for API requests and responses
export interface TimeSeriesDataPoint {
  date: string;
  value: number;
}

export interface ForecastRequest {
  data: TimeSeriesDataPoint[];
  column_name: string;
  forecast_steps: number;
  config: {
    model_type: 'auto' | 'manual';
    train_size: number;
    order?: {
      p: number;
      d: number;
      q: number;
    };
    seasonal: boolean;
    seasonal_period: number;
  };
}

export interface ForecastResponse {
  forecast: number[];
  dates: string[];
  metrics: {
    rmse: number;
    mae: number;
    r2: number;
    accuracy: number;
  };
  config: {
    model_type: string;
    train_size: number;
    seasonal: boolean;
    seasonal_period: number;
    order?: {
      p: number;
      d: number;
      q: number;
    };
  };
  model_info?: {
    aic: number;
    bic: number;
  };
}

// Function to validate and preprocess data
export const validateData = async (data: any[]): Promise<any> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/validate`, { data });
    return response.data;
  } catch (error) {
    console.error('Error validating data:', error);
    throw error;
  }
};

// Function to run ARIMA forecast
export const runForecast = async (request: ForecastRequest): Promise<ForecastResponse> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/forecast`, request);
    return response.data;
  } catch (error) {
    console.error('Error running forecast:', error);
    throw error;
  }
};

// Function to prepare time series data for the API
export const prepareTimeSeriesData = (data: any[], selectedColumn: string): TimeSeriesDataPoint[] => {
  return data
    .filter(row => row.date && row[selectedColumn] !== undefined && row[selectedColumn] !== null)
    .map(row => ({
      date: row.date,
      value: parseFloat(row[selectedColumn])
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// Function to preprocess data before preview
export const preprocessData = (rawData: any[]): any[] => {
  // Filter out rows with invalid data
  return rawData.filter(row => {
    // Ensure row has a date and at least one valid numeric value
    if (!row.date) return false;
    
    // Check if at least one column contains a number
    return Object.keys(row).some(key => {
      if (key === 'date') return false;
      const val = row[key];
      return val !== null && val !== undefined && !isNaN(parseFloat(val));
    });
  }).map(row => {
    // Convert numeric strings to actual numbers
    const processedRow: any = { ...row };
    
    Object.keys(processedRow).forEach(key => {
      if (key !== 'date') {
        const val = processedRow[key];
        if (val !== null && val !== undefined && !isNaN(parseFloat(val))) {
          processedRow[key] = parseFloat(val);
        }
      }
    });
    
    return processedRow;
  });
};

// Function to identify numeric columns in dataset
export const getNumericColumns = (data: any[]): string[] => {
  if (!data || data.length === 0) return [];
  
  const firstRow = data[0];
  return Object.keys(firstRow).filter(key => {
    if (key === 'date') return false;
    
    // Check if column has numeric values
    return data.some(row => {
      const val = row[key];
      return val !== null && val !== undefined && !isNaN(parseFloat(val));
    });
  });
};

// Function to get data statistics for better visualization
export const getDataStats = (data: any[], column: string) => {
  if (!data || data.length === 0 || !column) {
    return { min: 0, max: 0, avg: 0 };
  }
  
  const values = data
    .filter(row => row[column] !== undefined && row[column] !== null)
    .map(row => parseFloat(row[column]));
  
  if (values.length === 0) {
    return { min: 0, max: 0, avg: 0 };
  }
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const sum = values.reduce((acc, val) => acc + val, 0);
  const avg = sum / values.length;
  
  return { min, max, avg };
};
