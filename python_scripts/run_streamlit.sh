
#!/bin/bash

# Script to run the Streamlit application
echo "Starting ARIMA Time Series Analysis Streamlit app..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python3 is not installed. Please install Python 3 to run this application."
    exit 1
fi

# Ensure the requirements are installed
echo "Installing required packages..."
pip install -r python_scripts/requirements.txt

# Run the Streamlit app
echo "Starting Streamlit server on port 8501..."
streamlit run python_scripts/streamlit_app.py

