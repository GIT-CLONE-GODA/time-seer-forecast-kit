
import subprocess
import sys

def start_api_server():
    """
    Start the ARIMA Forecast API server.
    This script ensures all dependencies are installed before launching.
    """
    print("Starting ARIMA Forecast API server...")
    
    # Check if requirements are installed
    try:
        import flask
        import flask_cors
        import pandas
        import numpy
        import statsmodels
        import sklearn
        import pmdarima
    except ImportError:
        print("Installing required dependencies...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements_api.txt"])
    
    # Start the Flask API server
    print("Launching API server...")
    subprocess.call(["python", "api_server.py"])

if __name__ == "__main__":
    start_api_server()
