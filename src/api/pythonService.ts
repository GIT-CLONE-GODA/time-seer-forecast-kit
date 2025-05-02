
/**
 * Service for interacting with the Python backend
 */

/**
 * Run ARIMA time series analysis on the provided data
 * @param data The time series data
 * @param column The column to analyze
 * @param config The model configuration
 */
export async function runArimaModel(data: any, column: string, config: any) {
  try {
    // Prepare the request data
    const requestData = {
      data: data.data,
      column,
      config: {
        trainSize: config.trainSize,
        modelType: config.modelType,
        order: config.order,
        seasonal: config.seasonal,
        seasonalPeriod: config.seasonalPeriod
      }
    };

    // Make a POST request to our server endpoint that will run the Python script
    const response = await fetch('/api/run-arima', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Parse and return the response
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error running ARIMA model:', error);
    throw error;
  }
}
