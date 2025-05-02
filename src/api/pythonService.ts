
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
    console.log("Sending request to run ARIMA model:", { column, config });
    
    // We'll send the raw data to the Python backend as-is
    // The Python script will handle all the preprocessing
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

    console.log("Request data prepared:", JSON.stringify(requestData).slice(0, 200) + "...");

    // Make a POST request to our server endpoint that will run the Python script
    const response = await fetch('/api/run-arima', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Parse and return the response
    const result = await response.json();
    console.log("ARIMA model result received:", result);
    return result;
  } catch (error) {
    console.error('Error running ARIMA model:', error);
    throw error;
  }
}
