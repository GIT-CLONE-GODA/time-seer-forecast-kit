
import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf
from statsmodels.tsa.stattools import adfuller
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from pmdarima.arima import auto_arima
import math
import re
from datetime import datetime
import warnings
import io
import base64

warnings.filterwarnings('ignore')

class ARIMATimeSeriesAnalyzerStreamlit:
    """
    A class for analyzing time series data using ARIMA models in Streamlit.
    """
    
    # Class variable to store loaded data
    _df = None
    
    def __init__(self, column=None, data_source=None):
        """Initialize the analyzer with optional column and data source parameters."""
        self.ts = None
        self.ts_train = None
        self.ts_test = None
        self.model_fit = None
        self.auto_model = None
        
        # Load data if provided and not already loaded
        if data_source is not None:
            ARIMATimeSeriesAnalyzerStreamlit.load_data(data_source)
        
        # Select the column if provided and data is available
        if column is not None and ARIMATimeSeriesAnalyzerStreamlit._df is not None:
            self.select_column(column)
    
    @classmethod
    def load_data(cls, data_source):
        """Load time series data from a DataFrame or CSV file."""
        try:
            if isinstance(data_source, str):
                cls._df = pd.read_csv(data_source)
            else:
                # Handle UploadedFile from Streamlit
                cls._df = pd.read_csv(data_source)
                
            # Check if we need to reshape/preprocess the data
            date_cols = [col for col in cls._df.columns if re.search(r'^\d{4}-\d{2}-\d{2}$', str(col))]
            
            if date_cols:
                st.info("Detected date columns, reshaping data...")
                # Get non-date columns (potential ID columns)
                id_cols = [col for col in cls._df.columns if col not in date_cols]
                
                if not id_cols:  # If no ID columns, use index as ID
                    id_cols = ["ID"]
                    cls._df["ID"] = range(len(cls._df))
                
                # Keep only first ID column as RegionName
                data_subset = cls._df[[id_cols[0]] + date_cols].rename(columns={id_cols[0]: "RegionName"})
                
                # Melt the data to transform from wide to long format
                melted = data_subset.melt(id_vars="RegionName", var_name="date", value_name="value")
                melted["date"] = pd.to_datetime(melted["date"])
                
                # Pivot to get regions as columns and dates as index
                cleaned = melted.pivot(index="date", columns="RegionName", values="value").dropna(axis=1)
                cls._df = cleaned
                st.success(f"Data reshaped successfully with {len(cls._df.columns)} regions")
            else:
                # Check if there's a date/time column we can use as index
                date_col = None
                for col in cls._df.columns:
                    # Try to convert the column to datetime
                    try:
                        pd.to_datetime(cls._df[col])
                        date_col = col
                        break
                    except:
                        continue
                
                if date_col:
                    st.info(f"Using '{date_col}' as date index")
                    cls._df[date_col] = pd.to_datetime(cls._df[date_col])
                    cls._df.set_index(date_col, inplace=True)
                else:
                    st.warning("No date column found. Using default index.")
                    
            st.success(f"Data loaded successfully! Shape: {cls._df.shape}")
            
        except Exception as e:
            st.error(f"Error loading data: {str(e)}")
            return None
        
        return cls
    
    def select_column(self, column):
        """Select a specific column from the loaded data for analysis."""
        if ARIMATimeSeriesAnalyzerStreamlit._df is None:
            st.error("No data loaded. Please upload a file first.")
            return None
        
        if column not in ARIMATimeSeriesAnalyzerStreamlit._df.columns:
            st.error(f"Column '{column}' not found in the data.")
            return None
        
        self.ts = ARIMATimeSeriesAnalyzerStreamlit._df[column]
        st.info(f"Selected time series data for {column}")
        
        return self
    
    # ... keep existing code (plot_time_series, split_data, check_stationarity and other analysis methods)
    
    def plot_time_series(self, title=None):
        """Plot the loaded time series data."""
        if self.ts is None:
            st.error("No time series data selected.")
            return None
        
        fig, ax = plt.subplots(figsize=(12, 6))
        ax.plot(self.ts)
        ax.set_title(title or f'{self.ts.name} Prices')
        ax.set_ylabel('Price Index')
        ax.grid(True)
        st.pyplot(fig)
        
        return self
    
    def split_data(self, train_size=0.8, plot=True):
        """Split the time series data into training and testing sets."""
        if self.ts is None:
            st.error("No time series data selected.")
            return None
        
        split_idx = int(len(self.ts) * train_size)
        self.ts_train, self.ts_test = self.ts[:split_idx], self.ts[split_idx:]
        
        st.info(f"Training data: {len(self.ts_train)} observations ({train_size*100:.0f}%)")
        st.info(f"Testing data: {len(self.ts_test)} observations ({(1-train_size)*100:.0f}%)")
        
        if plot:
            fig, ax = plt.subplots(figsize=(12, 6))
            ax.plot(self.ts_train, label='Training Data')
            ax.plot(self.ts_test, label='Testing Data')
            ax.set_title(f'Train-Test Split of {self.ts.name}')
            ax.set_ylabel('Price Index')
            ax.legend()
            ax.grid(True)
            st.pyplot(fig)
        
        return self
    
    def check_stationarity(self, series=None):
        """Check if a time series is stationary using the Augmented Dickey-Fuller test."""
        if series is None:
            if self.ts_train is None:
                st.error("No training data available. Split the data first.")
                return None
            series = self.ts_train
        
        # Perform Augmented Dickey-Fuller test
        result = adfuller(series.dropna())
        
        # Create a nice table for the results
        adf_results = {
            'ADF Statistic': result[0],
            'p-value': result[1],
            '1% Critical Value': result[4]['1%'],
            '5% Critical Value': result[4]['5%'],
            '10% Critical Value': result[4]['10%']
        }
        
        st.write("### Augmented Dickey-Fuller Test")
        st.dataframe(pd.DataFrame([adf_results]))
        
        # Interpret the results
        is_stationary = result[1] <= 0.05
        if is_stationary:
            st.success("✅ Data is stationary (reject null hypothesis)")
        else:
            st.warning("⚠️ Data is non-stationary (fail to reject null hypothesis)")
        
        return is_stationary
    
    def difference_series(self, plot=True):
        """Apply differencing to make the time series stationary."""
        if self.ts_train is None:
            st.error("No training data available. Split the data first.")
            return None
        
        ts_diff = self.ts_train.diff().dropna()  # First difference
        
        if plot:
            fig, ax = plt.subplots(figsize=(12, 6))
            ax.plot(ts_diff)
            ax.set_title("Differenced Time Series")
            ax.grid(True)
            st.pyplot(fig)
            
            st.write("### Checking Stationarity of Differenced Series")
            self.check_stationarity(ts_diff)
        
        return ts_diff
    
    def plot_acf_pacf(self, series=None):
        """Plot the Autocorrelation Function (ACF) and Partial Autocorrelation Function (PACF)."""
        if series is None:
            series = self.difference_series(plot=False)
            
        if series is None:
            return None
        
        fig, axes = plt.subplots(2, 1, figsize=(12, 10))
        
        plot_acf(series, ax=axes[0])
        axes[0].set_title("Autocorrelation Function (ACF)")
        
        plot_pacf(series, ax=axes[1])
        axes[1].set_title("Partial Autocorrelation Function (PACF)")
        
        plt.tight_layout()
        st.pyplot(fig)
        
        st.write("### Interpreting ACF and PACF")
        st.info("ACF: The autocorrelation function shows the correlation of the series with itself at different lags.")
        st.info("PACF: The partial autocorrelation function shows the correlation of the series with itself at different lags, controlling for shorter lags.")
        st.info("Use these plots to determine appropriate p and q values for your ARIMA model.")
        
        return self
    
    def fit_arima(self, order=(2, 1, 0)):
        """Fit an ARIMA model to the training data."""
        if self.ts_train is None:
            st.error("No training data available. Split the data first.")
            return None
        
        progress_text = st.text("Fitting ARIMA model...")
        progress_bar = st.progress(0)
        
        try:
            model = ARIMA(self.ts_train, order=order)
            self.model_fit = model.fit()
            
            progress_bar.progress(100)
            progress_text.text("ARIMA model fitted successfully!")
            
            # Display model summary
            summary_html = self.model_fit.summary().tables[1].as_html()
            st.write("### ARIMA Model Summary")
            st.write(pd.read_html(summary_html, header=0, index_col=0)[0])
            
        except Exception as e:
            progress_bar.progress(100)
            progress_text.text(f"Error fitting ARIMA model: {str(e)}")
            st.error(f"Failed to fit ARIMA model: {str(e)}")
        
        return self
    
    def plot_residuals(self):
        """Plot the residuals of the fitted ARIMA model."""
        if self.model_fit is None:
            st.error("No model fitted. Please fit an ARIMA model first.")
            return None
        
        residuals = self.model_fit.resid[1:]
        
        fig, axes = plt.subplots(1, 3, figsize=(18, 6))
        
        # Time plot of residuals
        axes[0].plot(residuals)
        axes[0].set_title("Residuals Over Time")
        axes[0].grid(True)
        
        # Histogram of residuals
        axes[1].hist(residuals, bins=20, edgecolor='black')
        axes[1].set_title("Histogram of Residuals")
        
        # Q-Q plot of residuals
        import scipy.stats as stats
        stats.probplot(residuals, dist="norm", plot=axes[2])
        axes[2].set_title("Normal Q-Q Plot")
        
        plt.tight_layout()
        st.pyplot(fig)
        
        # Calculate residual statistics
        st.write("### Residual Statistics")
        residual_stats = {
            "Mean": residuals.mean(),
            "Standard Deviation": residuals.std(),
            "Skewness": residuals.skew(),
            "Kurtosis": residuals.kurtosis()
        }
        st.dataframe(pd.DataFrame([residual_stats]))
        
        # Check if residuals are normally distributed
        from scipy.stats import shapiro
        stat, p = shapiro(residuals)
        if p > 0.05:
            st.success("✅ Residuals appear normally distributed (Shapiro-Wilk test)")
        else:
            st.warning("⚠️ Residuals do not appear normally distributed (Shapiro-Wilk test)")
        
        return self
    
    def forecast(self, steps=None, plot=True):
        """Generate forecasts from the fitted ARIMA model."""
        if self.model_fit is None:
            st.error("No model fitted. Please fit an ARIMA model first.")
            return None
        
        if self.ts_test is None:
            st.error("No testing data available. Split the data first.")
            return None
            
        if steps is None:
            steps = len(self.ts_test)
        
        forecast = self.model_fit.forecast(steps)
        
        if plot and ARIMATimeSeriesAnalyzerStreamlit._df is not None:
            fig, ax = plt.subplots(figsize=(12, 6))
            
            # Plot original data
            ax.plot(self.ts, label=f'Original {self.ts.name}')
            
            # Plot forecast
            forecast_index = pd.date_range(start=self.ts_train.index[-1], periods=steps+1, freq=pd.infer_freq(self.ts.index))[1:]
            ax.plot(forecast_index, forecast, 'r--', label='Manual ARIMA Forecast')
            
            ax.set_title("ARIMA Forecast")
            ax.legend()
            ax.grid(True)
            st.pyplot(fig)
            
            # Calculate forecast metrics
            mse = mean_squared_error(self.ts_test, forecast)
            rmse = np.sqrt(mse)
            mae = mean_absolute_error(self.ts_test, forecast)
            r2 = r2_score(self.ts_test, forecast)
            
            st.write("### Forecast Metrics")
            metrics = {
                "Mean Squared Error (MSE)": mse,
                "Root Mean Squared Error (RMSE)": rmse,
                "Mean Absolute Error (MAE)": mae,
                "R² Score": r2
            }
            st.dataframe(pd.DataFrame([metrics]))
        
        return forecast
    
    def fit_auto_arima(self, seasonal=False, m=12):
        """Automatically find the optimal ARIMA parameters and fit the model."""
        if self.ts_train is None:
            st.error("No training data available. Split the data first.")
            return None
        
        progress_text = st.text("Finding optimal ARIMA parameters...")
        progress_bar = st.progress(0)
        
        try:
            with st.spinner("Running Auto ARIMA (this may take a while)..."):
                self.auto_model = auto_arima(
                    self.ts_train,
                    start_p=0, d=1, start_q=0,
                    max_p=5, max_d=5, max_q=5,
                    start_P=0, D=1, start_Q=0,
                    max_P=5, max_D=5, max_Q=5,
                    m=m,
                    seasonal=[seasonal],
                    error_action='warn',
                    trace=False,
                    suppress_warnings=True,
                    stepwise=True,
                    random_state=20,
                    n_fits=50
                )
            
            progress_bar.progress(100)
            progress_text.text(f"Auto ARIMA found optimal parameters: {self.auto_model.order}")
            
            st.success(f"✅ Optimal ARIMA order found: {self.auto_model.order}")
            if seasonal:
                st.success(f"✅ Optimal seasonal order: {self.auto_model.seasonal_order}")
            
            # Display model summary 
            st.write("### Auto ARIMA Model Summary")
            st.code(str(self.auto_model.summary()))
            
        except Exception as e:
            progress_bar.progress(100)
            progress_text.text(f"Error in Auto ARIMA: {str(e)}")
            st.error(f"Failed to run Auto ARIMA: {str(e)}")
        
        return self
    
    def auto_forecast(self, steps=None, plot=True):
        """Generate forecasts from the auto-fitted ARIMA model."""
        if self.auto_model is None:
            st.error("No auto ARIMA model fitted. Please run Auto ARIMA first.")
            return None
        
        if self.ts_test is None:
            st.error("No testing data available. Split the data first.")
            return None
            
        if steps is None:
            steps = len(self.ts_test)
        
        forecast = self.auto_model.predict(steps)
        
        if plot and ARIMATimeSeriesAnalyzerStreamlit._df is not None:
            fig, ax = plt.subplots(figsize=(12, 6))
            
            # Plot original data
            ax.plot(self.ts, label=f'Original {self.ts.name}')
            
            # Plot forecast
            forecast_index = pd.date_range(start=self.ts_train.index[-1], periods=steps+1, freq=pd.infer_freq(self.ts.index))[1:]
            ax.plot(forecast_index, forecast, 'g--', label='Auto ARIMA Forecast')
            
            ax.set_title("Auto ARIMA Forecast")
            ax.legend()
            ax.grid(True)
            st.pyplot(fig)
            
            # Calculate forecast metrics
            mse = mean_squared_error(self.ts_test, forecast)
            rmse = np.sqrt(mse)
            mae = mean_absolute_error(self.ts_test, forecast)
            r2 = r2_score(self.ts_test, forecast)
            
            st.write("### Forecast Metrics")
            metrics = {
                "Mean Squared Error (MSE)": mse,
                "Root Mean Squared Error (RMSE)": rmse,
                "Mean Absolute Error (MAE)": mae,
                "R² Score": r2
            }
            st.dataframe(pd.DataFrame([metrics]))
        
        return forecast
    
    def evaluate_models(self):
        """Evaluate and compare the performance of manual and auto ARIMA models."""
        if self.ts_test is None:
            st.error("No testing data available. Split the data first.")
            return None
        
        results = {}
        combined_metrics = {}
        
        if self.model_fit is not None:
            manual_forecast = self.forecast(plot=False)
            manual_rmse = np.sqrt(mean_squared_error(self.ts_test, manual_forecast))
            manual_mae = mean_absolute_error(self.ts_test, manual_forecast)
            manual_r2 = r2_score(self.ts_test, manual_forecast)
            
            results['Manual ARIMA'] = {
                'RMSE': manual_rmse,
                'MAE': manual_mae,
                'R²': manual_r2
            }
            
            combined_metrics['Model'] = ['Manual ARIMA']
            combined_metrics['RMSE'] = [manual_rmse]
            combined_metrics['MAE'] = [manual_mae]
            combined_metrics['R²'] = [manual_r2]
        
        if self.auto_model is not None:
            auto_forecast = self.auto_forecast(plot=False)
            auto_rmse = np.sqrt(mean_squared_error(self.ts_test, auto_forecast))
            auto_mae = mean_absolute_error(self.ts_test, auto_forecast)
            auto_r2 = r2_score(self.ts_test, auto_forecast)
            
            results['Auto ARIMA'] = {
                'RMSE': auto_rmse,
                'MAE': auto_mae,
                'R²': auto_r2
            }
            
            if 'Model' not in combined_metrics:
                combined_metrics['Model'] = []
                combined_metrics['RMSE'] = []
                combined_metrics['MAE'] = []
                combined_metrics['R²'] = []
                
            combined_metrics['Model'].append('Auto ARIMA')
            combined_metrics['RMSE'].append(auto_rmse)
            combined_metrics['MAE'].append(auto_mae)
            combined_metrics['R²'].append(auto_r2)
        
        if results:
            st.write("### Model Comparison")
            comparison_df = pd.DataFrame(combined_metrics)
            st.dataframe(comparison_df)
            
            fig, ax = plt.subplots(figsize=(10, 6))
            
            x = np.arange(len(combined_metrics['Model']))
            width = 0.25
            
            ax.bar(x - width, combined_metrics['RMSE'], width, label='RMSE')
            ax.bar(x, combined_metrics['MAE'], width, label='MAE')
            ax.bar(x + width, combined_metrics['R²'], width, label='R²')
            
            ax.set_xticks(x)
            ax.set_xticklabels(combined_metrics['Model'])
            ax.legend()
            ax.set_title('Model Metrics Comparison')
            
            st.pyplot(fig)
            
            # Plot both forecasts together
            if self.model_fit is not None and self.auto_model is not None:
                manual_forecast = self.forecast(plot=False)
                auto_forecast = self.auto_forecast(plot=False)
                
                fig, ax = plt.subplots(figsize=(12, 6))
                
                # Plot original data
                ax.plot(self.ts, label=f'Original {self.ts.name}')
                
                # Plot forecasts
                forecast_index = pd.date_range(start=self.ts_train.index[-1], periods=len(manual_forecast)+1, freq=pd.infer_freq(self.ts.index))[1:]
                ax.plot(forecast_index, manual_forecast, 'r--', label='Manual ARIMA Forecast')
                ax.plot(forecast_index, auto_forecast, 'g--', label='Auto ARIMA Forecast')
                
                ax.set_title("ARIMA Model Forecasts Comparison")
                ax.legend()
                ax.grid(True)
                st.pyplot(fig)
        
        return results

def display_sample_csv():
    """Display a sample CSV format for users."""
    st.subheader("Sample CSV Format")
    
    st.markdown("""
    You can upload a CSV file with time series data in one of these formats:
    
    1. **Wide format** with regions/variables as rows and dates as columns:
    
    | RegionName | 2020-01-01 | 2020-02-01 | 2020-03-01 | ... |
    |------------|------------|------------|------------|-----|
    | New York   | 100.2      | 101.3      | 102.1      | ... |
    | Chicago    | 95.8       | 96.2       | 97.5       | ... |
    
    2. **Long format** with a date column and value column:
    
    | date       | value      | region     |
    |------------|------------|------------|
    | 2020-01-01 | 100.2      | New York   |
    | 2020-02-01 | 101.3      | New York   |
    | 2020-01-01 | 95.8       | Chicago    |
    | 2020-02-01 | 96.2       | Chicago    |
    """)
    
    st.info("The application will try to detect the format and process the data accordingly.")

# Main Streamlit app
def main():
    st.set_page_config(page_title="ARIMA Time Series Analyzer", layout="wide")
    
    st.title("ARIMA Time Series Analyzer")
    st.markdown("""
    This application helps you analyze and forecast time series data using ARIMA models.
    Upload your CSV file, select a column to analyze, and follow the steps to build your forecasting model.
    """)

    # Create tabs for different sections
    tabs = st.tabs(["📊 Data Upload", "🔍 Data Exploration", "📈 ARIMA Modeling", "🤖 Auto ARIMA", "📊 Model Comparison"])
    
    # Create an instance of the analyzer
    analyzer = ARIMATimeSeriesAnalyzerStreamlit()
    
    # Data Upload Tab
    with tabs[0]:
        st.header("Data Upload")
        
        # Display sample CSV format
        if st.checkbox("Show sample CSV format"):
            display_sample_csv()
        
        uploaded_file = st.file_uploader("Choose a CSV file", type="csv")
        
        if uploaded_file is not None:
            try:
                # Load the data
                ARIMATimeSeriesAnalyzerStreamlit.load_data(uploaded_file)
                
                if ARIMATimeSeriesAnalyzerStreamlit._df is not None:
                    # Display first few rows of the data
                    st.subheader("Preview of the Data")
                    st.dataframe(ARIMATimeSeriesAnalyzerStreamlit._df.head())
                    
                    # Display column selection
                    st.subheader("Select a Column to Analyze")
                    selected_column = st.selectbox("Choose a column", ARIMATimeSeriesAnalyzerStreamlit._df.columns)
                    
                    if st.button("Select Column"):
                        analyzer.select_column(selected_column)
                        st.session_state.selected_column = selected_column
                        st.success(f"Selected: {selected_column}")
            except Exception as e:
                st.error(f"Error loading data: {str(e)}")
    
    # Data Exploration Tab
    with tabs[1]:
        st.header("Data Exploration")
        
        if ARIMATimeSeriesAnalyzerStreamlit._df is None:
            st.warning("Please upload a CSV file in the Data Upload tab.")
        elif not hasattr(st.session_state, 'selected_column'):
            st.warning("Please select a column to analyze in the Data Upload tab.")
        else:
            # Re-select the column if necessary
            if analyzer.ts is None:
                analyzer.select_column(st.session_state.selected_column)
            
            st.subheader(f"Time Series Plot: {st.session_state.selected_column}")
            analyzer.plot_time_series()
            
            # Split data
            st.subheader("Split Data into Training and Testing Sets")
            train_size = st.slider("Training data proportion", min_value=0.5, max_value=0.95, value=0.8, step=0.05)
            
            if st.button("Split Data"):
                analyzer.split_data(train_size=train_size)
                st.session_state.data_split = True
            
            # Check stationarity
            if hasattr(st.session_state, 'data_split') and st.session_state.data_split:
                st.subheader("Stationarity Check")
                analyzer.check_stationarity()
                
                # Differencing
                st.subheader("Differencing to Achieve Stationarity")
                if st.button("Apply Differencing"):
                    analyzer.difference_series()
                
                # ACF and PACF
                st.subheader("ACF and PACF Plots")
                if st.button("Generate ACF and PACF Plots"):
                    analyzer.plot_acf_pacf()
    
    # ARIMA Modeling Tab
    with tabs[2]:
        st.header("ARIMA Modeling")
        
        if ARIMATimeSeriesAnalyzerStreamlit._df is None:
            st.warning("Please upload a CSV file in the Data Upload tab.")
        elif not hasattr(st.session_state, 'selected_column'):
            st.warning("Please select a column to analyze in the Data Upload tab.")
        elif not hasattr(st.session_state, 'data_split') or not st.session_state.data_split:
            st.warning("Please split the data in the Data Exploration tab.")
        else:
            # Re-select the column if necessary
            if analyzer.ts is None:
                analyzer.select_column(st.session_state.selected_column)
                analyzer.split_data(train_size=0.8, plot=False)
            
            # Manual ARIMA Parameters
            st.subheader("Fit ARIMA Model")
            col1, col2, col3 = st.columns(3)
            
            with col1:
                p = st.number_input("p (AR order)", min_value=0, max_value=10, value=1)
            with col2:
                d = st.number_input("d (Differencing)", min_value=0, max_value=5, value=1)
            with col3:
                q = st.number_input("q (MA order)", min_value=0, max_value=10, value=1)
            
            if st.button("Fit ARIMA Model"):
                analyzer.fit_arima(order=(p, d, q))
                st.session_state.arima_fit = True
            
            # Residual Analysis
            if hasattr(st.session_state, 'arima_fit') and st.session_state.arima_fit:
                st.subheader("Residual Analysis")
                if st.button("Analyze Residuals"):
                    analyzer.plot_residuals()
                
                # Forecasting
                st.subheader("Generate Forecasts")
                forecast_steps = st.number_input("Forecast Steps (leave empty for test period length)", 
                                                min_value=1, max_value=100, value=None)
                
                if st.button("Generate Forecast"):
                    analyzer.forecast(steps=forecast_steps)
    
    # Auto ARIMA Tab
    with tabs[3]:
        st.header("Auto ARIMA")
        
        if ARIMATimeSeriesAnalyzerStreamlit._df is None:
            st.warning("Please upload a CSV file in the Data Upload tab.")
        elif not hasattr(st.session_state, 'selected_column'):
            st.warning("Please select a column to analyze in the Data Upload tab.")
        elif not hasattr(st.session_state, 'data_split') or not st.session_state.data_split:
            st.warning("Please split the data in the Data Exploration tab.")
        else:
            # Re-select the column if necessary
            if analyzer.ts is None:
                analyzer.select_column(st.session_state.selected_column)
                analyzer.split_data(train_size=0.8, plot=False)
            
            st.subheader("Automatically Find Optimal ARIMA Parameters")
            
            seasonal = st.checkbox("Include Seasonal Component")
            
            if seasonal:
                m = st.number_input("Seasonality Period (m)", min_value=2, max_value=52, value=12)
            else:
                m = 12
            
            if st.button("Run Auto ARIMA"):
                analyzer.fit_auto_arima(seasonal=seasonal, m=m)
                st.session_state.auto_arima_fit = True
            
            # Auto ARIMA Forecasting
            if hasattr(st.session_state, 'auto_arima_fit') and st.session_state.auto_arima_fit:
                st.subheader("Generate Auto ARIMA Forecasts")
                auto_forecast_steps = st.number_input("Auto Forecast Steps (leave empty for test period length)", 
                                                     min_value=1, max_value=100, value=None)
                
                if st.button("Generate Auto Forecast"):
                    analyzer.auto_forecast(steps=auto_forecast_steps)
    
    # Model Comparison Tab
    with tabs[4]:
        st.header("Model Comparison")
        
        both_models_fit = (hasattr(st.session_state, 'arima_fit') and st.session_state.arima_fit and 
                          hasattr(st.session_state, 'auto_arima_fit') and st.session_state.auto_arima_fit)
        
        if ARIMATimeSeriesAnalyzerStreamlit._df is None:
            st.warning("Please upload a CSV file in the Data Upload tab.")
        elif not hasattr(st.session_state, 'selected_column'):
            st.warning("Please select a column to analyze in the Data Upload tab.")
        elif not hasattr(st.session_state, 'data_split') or not st.session_state.data_split:
            st.warning("Please split the data in the Data Exploration tab.")
        elif not (hasattr(st.session_state, 'arima_fit') or hasattr(st.session_state, 'auto_arima_fit')):
            st.warning("Please fit at least one ARIMA model in the ARIMA Modeling or Auto ARIMA tab.")
        else:
            # Re-select the column if necessary
            if analyzer.ts is None:
                analyzer.select_column(st.session_state.selected_column)
                analyzer.split_data(train_size=0.8, plot=False)
            
            st.subheader("Compare Model Performance")
            
            if st.button("Evaluate Models"):
                analyzer.evaluate_models()
            
            if both_models_fit:
                st.info("Both manual and auto ARIMA models have been fitted. "
                        "Click 'Evaluate Models' to compare their performance.")
            else:
                st.info("Only one model has been fitted. Fit both models for complete comparison.")

if __name__ == "__main__":
    main()
