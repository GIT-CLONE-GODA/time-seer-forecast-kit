
import requests
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def test_forecast_api():
    # Generate sample data
    print("Generating sample time series data...")
    start_date = datetime(2020, 1, 1)
    dates = [(start_date + timedelta(days=i*30)).strftime('%Y-%m-%d') for i in range(36)]
    
    # Generate sample values with trend and seasonality
    values = [100 + i*5 + 20*np.sin(i/12*2*np.pi) + np.random.normal(0, 10) for i in range(36)]
    
    # Create request data
    data = [{'date': dates[i], 'value': values[i]} for i in range(len(dates))]
    
    request_data = {
        'data': data,
        'column_name': 'test_series',
        'forecast_steps': 6,
        'config': {
            'model_type': 'auto',
            'train_size': 0.8,
            'seasonal': True,
            'seasonal_period': 12
        }
    }
    
    # Send request to API
    print("Sending request to forecast API...")
    try:
        response = requests.post('http://localhost:5000/api/forecast', json=request_data)
        
        if response.status_code == 200:
            result = response.json()
            print("\n✅ API test successful!")
            print(f"Forecast steps: {len(result['forecast'])}")
            print(f"Metrics: {json.dumps(result['metrics'], indent=2)}")
            
            print("\nSample forecast values:")
            for i in range(min(3, len(result['forecast']))):
                print(f"{result['dates'][i]}: {result['forecast'][i]:.2f}")
            
            if len(result['forecast']) > 3:
                print("...")
        else:
            print(f"❌ API test failed with status code: {response.status_code}")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error during API test: {str(e)}")

if __name__ == "__main__":
    test_forecast_api()
