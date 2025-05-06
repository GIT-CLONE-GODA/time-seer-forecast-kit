
import requests
import json
import pandas as pd
import numpy as np

def test_forecast_api():
    """
    Test the forecast API by sending sample data and printing the response.
    """
    # API endpoint
    url = "http://localhost:5000/api/forecast"
    
    # Generate sample time series data
    dates = pd.date_range(start='2020-01-01', periods=36, freq='MS')
    values = [100 + i * 10 + np.sin(i) * 20 for i in range(36)]
    
    # Create data in the format expected by the API
    data = []
    for date, value in zip(dates, values):
        data.append({
            "date": date.strftime('%Y-%m-%d'),
            "value": float(value)
        })
    
    # Prepare request payload
    payload = {
        "data": data,
        "column_name": "Test Region",
        "forecast_steps": 12,
        "config": {
            "model_type": "auto",
            "train_size": 0.8,
            "seasonal": True,
            "seasonal_period": 12
        }
    }
    
    print("Sending request to API...")
    
    # Send POST request to API
    response = requests.post(url, json=payload)
    
    # Check if request was successful
    if response.status_code == 200:
        print("API request successful!")
        result = response.json()
        
        # Print forecast results
        print("\nForecast Values:")
        for date, value in zip(result['dates'], result['forecast']):
            print(f"{date}: {value:.2f}")
        
        # Print metrics
        if 'metrics' in result:
            print("\nModel Performance Metrics:")
            for metric, value in result['metrics'].items():
                print(f"{metric}: {value:.4f}")
    else:
        print(f"API request failed with status code {response.status_code}")
        print(f"Response: {response.text}")

if __name__ == "__main__":
    test_forecast_api()
