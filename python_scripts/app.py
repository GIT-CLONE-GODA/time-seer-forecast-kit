import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import os
import sys
import io
from contextlib import redirect_stdout

# Add the python_scripts directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), "python_scripts"))

# Import the ARIMATimeSeriesAnalyzer class from main.py
from main import ARIMATimeSeriesAnalyzer

# Import the sample data generator
from sample_data import generate_sample_data

# Configure page settings
st.set_page_config(
    page_title="TimeSeer Forecast Kit",
    page_icon="📈",
    layout="wide"
)

# Add custom styling
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #3949AB;
        margin-bottom: 1rem;
    }
    .sub-header {
        font-size: 1.5rem;
        font-weight: bold;
        margin-top: 1rem;
        margin-bottom: 0.5rem;
    }
    .info-text {
        font-size: 1rem;
        color: #666;
    }
</style>
""", unsafe_allow_html=True)

# Session state initialization
if 'analyzer' not in st.session_state:
    st.session_state.analyzer = None
if 'data_loaded' not in st.session_state:
    st.session_state.data_loaded = False
if 'column_selected' not in st.session_state:
    st.session_state.column_selected = False
if 'model_fit' not in st.session_state:
    st.session_state.model_fit = False
if 'auto_model_fit' not in st.session_state:
    st.session_state.auto_model_fit = False
if 'forecast_generated' not in st.session_state:
    st.session_state.forecast_generated = False
if 'auto_forecast_generated' not in st.session_state:
    st.session_state.auto_forecast_generated = False

# Title and description
st.markdown('<div class="main-header">TimeSeer Forecast Kit</div>', unsafe_allow_html=True)

st.markdown("""
Upload your time series data to analyze trends and generate accurate forecasts with advanced ARIMA models.
""")

# File Upload Section
st.markdown('<div class="sub-header">Data Upload</div>', unsafe_allow_html=True)

# Add a sample data option
use_sample_data = st.checkbox("Use sample data for testing")

if use_sample_data:
    if st.button("Generate Sample Data"):
        # Generate sample data
        with st.spinner("Generating sample data..."):
            sample_df = generate_sample_data()
            
            # Load the data using the ARIMATimeSeriesAnalyzer class
            ARIMATimeSeriesAnalyzer.load_data('sample_housing_prices.csv')
            
            # Create a new analyzer instance
            if st.session_state.analyzer is None:
                st.session_state.analyzer = ARIMATimeSeriesAnalyzer()
            
            st.session_state.data_loaded = True
            st.success("Sample data generated and loaded successfully!")
else:
    uploaded_file = st.file_uploader("Upload a CSV file with time series data", type=["csv"])
    
    # Handle file upload
    if uploaded_file is not None:
        try:
            # Create a temporary file to store the uploaded data
            with open("temp_data.csv", "wb") as f:
                f.write(uploaded_file.getbuffer())
            
            # Load the data using the ARIMATimeSeriesAnalyzer class
            ARIMATimeSeriesAnalyzer.load_data("temp_data.csv")
            
            # Create a new analyzer instance
            if st.session_state.analyzer is None:
                st.session_state.analyzer = ARIMATimeSeriesAnalyzer()
            
            st.session_state.data_loaded = True
            st.success(f"File '{uploaded_file.name}' loaded successfully!")
        except Exception as e:
            st.error(f"Error loading file: {str(e)}")

# If data is loaded, show the rest of the interface
if st.session_state.data_loaded and st.session_state.analyzer is not None:
    # Data Preview
    st.markdown('<div class="sub-header">Data Preview</div>', unsafe_allow_html=True)
    
    # Get available columns (regions)
    available_columns = ARIMATimeSeriesAnalyzer._df.columns.tolist()
    
    # Display data preview
    st.dataframe(ARIMATimeSeriesAnalyzer._df.head())
    
    # Column Selection
    st.markdown('<div class="sub-header">Select Region for Analysis</div>', unsafe_allow_html=True)
    selected_column = st.selectbox("Choose a region to analyze:", available_columns)
    
    if st.button("Select Region"):
        # Select the column in the analyzer
        st.session_state.analyzer.select_column(selected_column)
        st.session_state.column_selected = True
        st.session_state.model_fit = False
        st.session_state.auto_model_fit = False
        st.session_state.forecast_generated = False
        st.session_state.auto_forecast_generated = False
        st.success(f"Selected {selected_column} for analysis")
    
    # If column is selected, show time series plot and model configuration
    if st.session_state.column_selected:
        # Split into columns for layout
        col1, col2 = st.columns([2, 1])
        
        with col1:
            st.markdown('<div class="sub-header">Time Series Plot</div>', unsafe_allow_html=True)
            fig, ax = plt.subplots(figsize=(10, 6))
            ax.plot(st.session_state.analyzer.ts)
            ax.set_title(f'{selected_column} Prices')
            ax.set_ylabel('Price Index')
            ax.grid(True)
            st.pyplot(fig)
        
        with col2:
            st.markdown('<div class="sub-header">Model Configuration</div>', unsafe_allow_html=True)
            
            st.write("Configure and run your ARIMA time series model")
            
            # Model Type Selection
            model_type = st.radio("ARIMA Model Type", 
                                ["Auto ARIMA (Automatically find best parameters)", 
                                 "Manual ARIMA (Set your own parameters)"])
            
            # Train-Test Split
            train_size = st.slider("Training Data Size (%)", 50, 95, 80, 5)
            
            # Manual ARIMA parameters
            if "Manual" in model_type:
                col_p, col_d, col_q = st.columns(3)
                with col_p:
                    p = st.slider("P (AR order)", 0, 5, 2)
                with col_d:
                    d = st.slider("D (Differencing)", 0, 2, 1)
                with col_q:
                    q = st.slider("Q (MA order)", 0, 5, 1)
            
            # Seasonal component
            seasonal = st.checkbox("Include Seasonal Component", False)
            
            if seasonal:
                seasonal_period = st.selectbox("Seasonal Period", 
                                             options=[4, 12, 52],
                                             format_func=lambda x: f"{x} ({'Quarterly' if x == 4 else 'Monthly' if x == 12 else 'Weekly'})")
            else:
                seasonal_period = 12  # Default value
            
            # Run Model Button
            if st.button("Run Model", type="primary"):
                # Split the data
                with st.spinner("Splitting data into training and testing sets..."):
                    st.session_state.analyzer.split_data(train_size=train_size/100, plot=False)
                
                # Run selected model
                if "Manual" in model_type:
                    with st.spinner(f"Fitting ARIMA({p},{d},{q}) model..."):
                        st.session_state.analyzer.fit_arima(order=(p, d, q))
                        st.session_state.model_fit = True
                else:
                    with st.spinner("Fitting Auto ARIMA model (this may take a moment)..."):
                        try:
                            st.session_state.analyzer.fit_auto_arima(seasonal=seasonal, m=seasonal_period)
                            st.session_state.auto_model_fit = True
                        except Exception as e:
                            st.error(f"Error fitting Auto ARIMA model: {str(e)}")
                            st.info("Try using Manual ARIMA instead or adjust parameters.")
                
                if st.session_state.model_fit or st.session_state.auto_model_fit:
                    st.success("Model fitted successfully!")
        
        # Display stationary test results if model is fit
        if st.session_state.model_fit or st.session_state.auto_model_fit:
            st.markdown('<div class="sub-header">Stationarity Test</div>', unsafe_allow_html=True)
            
            # Run stationarity test
            col1, col2 = st.columns(2)
            
            with col1:
                st.write("Original Series Stationarity Test")
                # Capture the print output from check_stationarity
                f = io.StringIO()
                with redirect_stdout(f):
                    result = st.session_state.analyzer.check_stationarity()
                stationarity_output = f.getvalue()
                
                st.text(stationarity_output)
                st.write("Is Stationary:", result)
            
            with col2:
                st.write("Differenced Series Stationarity Test")
                fig, ax = plt.subplots(figsize=(10, 6))
                differenced = st.session_state.analyzer.difference_series(plot=False)
                ax.plot(differenced)
                ax.set_title("Differenced Time Series")
                st.pyplot(fig)
            
            # ACF and PACF plots
            st.markdown('<div class="sub-header">ACF and PACF Plots</div>', unsafe_allow_html=True)
            fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 8))
            from statsmodels.graphics.tsaplots import plot_acf, plot_pacf
            plot_acf(differenced, ax=ax1)
            plot_pacf(differenced, ax=ax2)
            plt.tight_layout()
            st.pyplot(fig)
            
            # Model Residuals
            if st.session_state.model_fit:
                st.markdown('<div class="sub-header">Manual ARIMA Model Residuals</div>', unsafe_allow_html=True)
                
                residuals = st.session_state.analyzer.model_fit.resid[1:]
                fig, ax = plt.subplots(1, 2, figsize=(10, 4))
                ax[0].plot(residuals)
                ax[0].set_title('Residuals')
                residuals.plot(title='Density', kind='kde', ax=ax[1])
                plt.tight_layout()
                st.pyplot(fig)
            
            # Generate Forecasts button
            if st.button("Generate Forecasts"):
                if st.session_state.model_fit:
                    with st.spinner("Generating forecasts from manual ARIMA model..."):
                        try:
                            forecast = st.session_state.analyzer.forecast(plot=False)
                            st.session_state.forecast_generated = True
                        except Exception as e:
                            st.error(f"Error generating manual ARIMA forecasts: {str(e)}")
                
                if st.session_state.auto_model_fit:
                    with st.spinner("Generating forecasts from Auto ARIMA model..."):
                        try:
                            auto_forecast = st.session_state.analyzer.auto_forecast(plot=False)
                            st.session_state.auto_forecast_generated = True
                        except Exception as e:
                            st.error(f"Error generating Auto ARIMA forecasts: {str(e)}")
                
                if st.session_state.forecast_generated or st.session_state.auto_forecast_generated:
                    st.success("Forecasts generated successfully!")
            
            # Show forecasts if generated
            if st.session_state.forecast_generated or st.session_state.auto_forecast_generated:
                st.markdown('<div class="sub-header">Forecast Results</div>', unsafe_allow_html=True)
                
                # Create a figure for plotting
                fig, ax = plt.subplots(figsize=(12, 6))
                
                # Plot original data
                ax.plot(st.session_state.analyzer.ts, label='Original Data')
                
                # Plot forecasts
                if st.session_state.forecast_generated:
                    forecast = st.session_state.analyzer.forecast(plot=False)
                    forecast_index = st.session_state.analyzer.ts_test.index
                    ax.plot(forecast_index, forecast, label='Manual ARIMA Forecast')
                
                if st.session_state.auto_forecast_generated:
                    auto_forecast = st.session_state.analyzer.auto_forecast(plot=False)
                    forecast_index = st.session_state.analyzer.ts_test.index
                    ax.plot(forecast_index, auto_forecast, label='Auto ARIMA Forecast')
                
                # Add labels and legend
                ax.set_title(f'ARIMA Forecast for {selected_column}')
                ax.set_ylabel('Price Index')
                ax.legend()
                ax.grid(True)
                
                # Display the plot
                st.pyplot(fig)
                
                # Display metrics if models are fit
                if st.session_state.forecast_generated or st.session_state.auto_forecast_generated:
                    st.markdown('<div class="sub-header">Model Evaluation</div>', unsafe_allow_html=True)
                    
                    metrics = st.session_state.analyzer.evaluate_models()
                    
                    # Create a DataFrame from the metrics for display
                    metrics_data = []
                    for model_name, values in metrics.items():
                        metrics_data.append({
                            'Model': model_name,
                            'RMSE': values['RMSE'],
                            'MAE': values['MAE'],
                            'R²': values['R²']
                        })
                    
                    metrics_df = pd.DataFrame(metrics_data)
                    st.dataframe(metrics_df)
else:
    # Show instructions if no data is loaded
    st.info("Please upload a CSV file or use the sample data to begin your time series analysis.")
    
    st.markdown("""
    ### Expected CSV Format
    Your CSV file should include:
    
    1. A date column (in format YYYY-MM-DD)
    2. One or more columns with numeric time series data
    
    For example, housing price data for different regions over time.
    """) 