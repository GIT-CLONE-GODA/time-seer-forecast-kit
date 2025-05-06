
import os
import subprocess
import sys
import threading

def start_api_server():
    """Start the API server for the TimeSeer Forecast Kit."""
    print("Starting API server...")
    api_server_script = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "api_server.py")
    subprocess.Popen([sys.executable, api_server_script], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    print("API server started at http://localhost:5000")

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
    
    # Check if API requirements are installed
    try:
        import flask
        import flask_cors
    except ImportError:
        print("Installing API server dependencies...")
        requirements_api_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "requirements_api.txt")
        if os.path.exists(requirements_api_path):
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", requirements_api_path])
        else:
            subprocess.check_call([sys.executable, "-m", "pip", "install", "flask", "flask-cors"])
    
    # Generate sample data if it doesn't exist
    if not os.path.exists('sample_housing_prices.csv'):
        print("Generating sample data for testing...")
        import sample_data as sample_data
        sample_data.generate_sample_data()
    
    # Start the API server in a separate thread
    api_thread = threading.Thread(target=start_api_server)
    api_thread.daemon = True
    api_thread.start()
    
    # Start the Streamlit app
    print("Launching Streamlit application...")
    script_dir = os.path.dirname(os.path.abspath(__file__))
    app_path = os.path.join(script_dir, "app.py")
    subprocess.call(["streamlit", "run", app_path])

if __name__ == "__main__":
    start_app()
