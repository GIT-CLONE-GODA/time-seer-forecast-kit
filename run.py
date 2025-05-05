

import os
import subprocess
import sys

def start_app():
    """
    Start the TimeSeer Forecast Kit Streamlit application.
    This script ensures all dependencies are installed before launching.
    """
    print("Starting TimeSeer Forecast Kit...")
    
    # Check if requirements are installed
    try:
        import streamlit
        import pandas
        import numpy
        import matplotlib
        import statsmodels
        import sklearn
        import pmdarima
    except ImportError:
        print("Installing required dependencies...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
    
    # Generate sample data if it doesn't exist
    if not os.path.exists('sample_housing_prices.csv'):
        print("Generating sample data for testing...")
        import sample_data
        sample_data.generate_sample_data()
    
    # Start the Streamlit app
    print("Launching Streamlit application...")
    subprocess.call(["streamlit", "run", "app.py"])

if __name__ == "__main__":
    start_app() 