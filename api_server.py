
import json
import pandas as pd
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from python_scripts.main import ARIMATimeSeriesAnalyzer

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/forecast', methods=['POST'])
def forecast():
    """
    API endpoint to receive time series data and return ARIMA forecast
    
    Expected JSON input format:
    {
        "data": [
            {"date": "2022-01-01", "value": 100.0},
            {"date": "2022-02-01", "value": 105.5},
            ...
        ],
        "column_name": "Region Name",
        "forecast_steps": 12,
        "config": {
            "model_type": "auto",  // or "manual"
            "train_size": 0.8,
            "order": {"p": 1, "d": 1, "q": 1},  // only required for manual models
            "seasonal": false,
            "seasonal_period": 12
        }
    }
    """
    try:
        # Parse request data
        request_data = request.get_json()
        
        if not request_data or 'data' not in request_data:
            return jsonify({"error": "Missing required data field"}), 400
            
        # Extract parameters
        time_series_data = request_data.get('data', [])
        column_name = request_data.get('column_name', 'value')
        forecast_steps = request_data.get('forecast_steps', 12)
        config = request_data.get('config', {})
        
        # Validate time series data
        if not time_series_data or len(time_series_data) < 10:  # Minimum data points for meaningful analysis
            return jsonify({"error": "Insufficient data points. At least 10 are required."}), 400
            
        # Convert input data to DataFrame
        df = pd.DataFrame(time_series_data)
        
        # Check if data has proper format
        if 'date' not in df.columns or 'value' not in df.columns:
            return jsonify({"error": "Data must contain 'date' and 'value' columns"}), 400
            
        # Set date as index and prepare for analysis
        df['date'] = pd.to_datetime(df['date'])
        df = df.set_index('date')
        df.columns = [column_name]
        
        # Initialize analyzer with data
        analyzer = ARIMATimeSeriesAnalyzer()
        analyzer.ts = df[column_name]
        
        # Split data for training/testing
        train_size = config.get('train_size', 0.8)
        analyzer.split_data(train_size=train_size, plot=False)
        
        # Fit model based on config
        model_type = config.get('model_type', 'auto')
        seasonal = config.get('seasonal', False)
        seasonal_period = config.get('seasonal_period', 12)
        
        if model_type == 'manual':
            # Get order parameters
            order = config.get('order', {'p': 1, 'd': 1, 'q': 1})
            p = order.get('p', 1)
            d = order.get('d', 1)
            q = order.get('q', 1)
            
            # Fit manual ARIMA model
            analyzer.fit_arima(order=(p, d, q))
            forecast_values = analyzer.forecast(steps=forecast_steps, plot=False)
        else:
            # Fit auto ARIMA model
            analyzer.fit_auto_arima(seasonal=seasonal, m=seasonal_period)
            forecast_values = analyzer.auto_forecast(steps=forecast_steps, plot=False)
        
        # Calculate evaluation metrics
        metrics = {}
        if analyzer.ts_test is not None and len(analyzer.ts_test) > 0:
            # Calculate metrics only for the overlapping period with test data
            overlap_steps = min(len(analyzer.ts_test), len(forecast_values))
            
            if overlap_steps > 0:
                test_values = analyzer.ts_test.iloc[:overlap_steps]
                forecast_overlap = forecast_values[:overlap_steps]
                
                # Calculate metrics
                rmse = np.sqrt(((test_values - forecast_overlap) ** 2).mean())
                mae = np.abs(test_values - forecast_overlap).mean()
                
                # Calculate R-squared
                ss_total = ((test_values - test_values.mean()) ** 2).sum()
                ss_residual = ((test_values - forecast_overlap) ** 2).sum()
                r2 = 1 - (ss_residual / ss_total) if ss_total != 0 else 0
                
                # Constrain R-squared to be between 0 and 1
                r2 = max(0, min(r2, 1))
                
                # Calculate simple accuracy metric (1 - normalized MAE)
                max_min_range = test_values.max() - test_values.min()
                accuracy = 1 - (mae / max_min_range) if max_min_range > 0 else 0
                
                # Constrain accuracy to be between 0 and 1
                accuracy = max(0, min(accuracy, 1))
                
                metrics = {
                    'rmse': float(rmse),
                    'mae': float(mae),
                    'r2': float(r2),
                    'accuracy': float(accuracy)
                }
        
        # Generate forecast dates
        last_date = df.index[-1]
        forecast_dates = pd.date_range(start=last_date + pd.DateOffset(months=1), periods=forecast_steps, freq='MS')
        forecast_dates_str = [date.strftime('%Y-%m-%d') for date in forecast_dates]
        
        # Prepare response
        response = {
            'forecast': [float(val) for val in forecast_values],
            'dates': forecast_dates_str,
            'metrics': metrics,
            'config': {
                'model_type': model_type,
                'train_size': train_size,
                'seasonal': seasonal,
                'seasonal_period': seasonal_period
            }
        }
        
        # Add order details for manual models
        if model_type == 'manual':
            response['config']['order'] = {
                'p': p,
                'd': d,
                'q': q
            }
            
        # Add model summary info if available
        if model_type == 'manual' and analyzer.model_fit is not None:
            # Extract key info from model summary, converting to serializable format
            model_info = {
                'aic': float(analyzer.model_fit.aic) if hasattr(analyzer.model_fit, 'aic') else None,
                'bic': float(analyzer.model_fit.bic) if hasattr(analyzer.model_fit, 'bic') else None
            }
            response['model_info'] = model_info
            
        return jsonify(response)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
