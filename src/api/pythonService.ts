
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
    
    // Python script expects a specific data format
    // First check if the data is in the expected format
    if (!data || !data.data || !Array.isArray(data.data)) {
      throw new Error("Invalid data format: data.data must be an array");
    }
    
    // Ensure all date values are properly formatted as strings
    const formattedData = data.data.map((row: any) => {
      const formattedRow = { ...row };
      if (row.date) {
        // Convert date to string format if it's a Date object
        formattedRow.date = row.date instanceof Date 
          ? row.date.toISOString().split('T')[0] 
          : String(row.date);
      }
      return formattedRow;
    });
    
    console.log(`Formatted ${formattedData.length} data points for analysis`);
    
    // Create the request payload for the Python script
    const requestData = {
      data: formattedData,
      column, // Column to analyze
      config: {
        trainSize: config.trainSize || 0.8,
        modelType: config.modelType || "auto",
        order: config.order || { p: 1, d: 1, q: 1 },
        seasonal: config.seasonal || false,
        seasonalPeriod: config.seasonalPeriod || 12
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
    
    // Check if the response contains an error
    if (result.error) {
      console.error('Error from Python backend:', result.error);
      throw new Error(result.error);
    }
    
    console.log("ARIMA model result received:", result);
    return result;
  } catch (error) {
    console.error('Error running ARIMA model:', error);
    throw error;
  }
}
