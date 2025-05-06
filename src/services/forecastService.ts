
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
