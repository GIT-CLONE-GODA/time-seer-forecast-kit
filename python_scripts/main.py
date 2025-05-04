import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf
from statsmodels.tsa.stattools import adfuller
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from pmdarima.arima import auto_arima
import math
import re
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')


class ARIMATimeSeriesAnalyzer:
    """
    A class for analyzing time series data using ARIMA models.
    This class encapsulates the functionality for loading data, checking stationarity,
    fitting ARIMA models, and forecasting future values.
    """
    
    # Class variable to store loaded data
    _df = None
    
    def __init__(self, column=None, data_source=None):
        """
        Initialize the analyzer with optional column and data source parameters.
        
        Parameters:
        -----------
        column : str, optional
            Column name in the DataFrame to analyze
        data_source : pandas.DataFrame or str, optional
            DataFrame containing time series data or a path to a CSV file
        """
        self.ts = None
        self.ts_train = None
        self.ts_test = None
        self.model_fit = None
        self.auto_model = None
        
        # Load data if provided and not already loaded
        if data_source is not None:
            ARIMATimeSeriesAnalyzer.load_data(data_source)
        
        # Select the column if provided and data is available
        if column is not None and ARIMATimeSeriesAnalyzer._df is not None:
            self.select_column(column)
    
    @classmethod
    def load_data(cls, data_source):
        """
        Load time series data from a DataFrame or CSV file.
        This is a class method that loads the data once for all instances.
        
        Parameters:
        -----------
        data_source : pandas.DataFrame or str
            DataFrame containing time series data or a path to a CSV file
        """
        if isinstance(data_source, str):
            cls._df = pd.read_csv(data_source)
            date_cols = cls._df.columns[cls._df.columns.get_loc("2015-01-31"):]
            data_subset = cls._df[["RegionName"] + list(date_cols)]
            melted = data_subset.melt(id_vars="RegionName", var_name="date", value_name="value")
            melted["date"] = pd.to_datetime(melted["date"])
            cleaned = melted.pivot(index="date", columns="RegionName", values="value").dropna(axis=1)
            cls._df = cleaned
            print(f"Loaded data from {data_source}")
        else:
            cls._df = data_source
            print("Loaded data from provided DataFrame")
        
        return cls
    
    def select_column(self, column):
        """
        Select a specific column from the loaded data for analysis.
        
        Parameters:
        -----------
        column : str
            Column name in the DataFrame to analyze
        """
        if ARIMATimeSeriesAnalyzer._df is None:
            raise ValueError("No data loaded. Call load_data() first.")
        
        if column not in ARIMATimeSeriesAnalyzer._df.columns:
            raise ValueError(f"Column '{column}' not found in the data.")
        
        self.ts = ARIMATimeSeriesAnalyzer._df[column]
        print(f"Selected time series data for {column}")
        
        return self
    
    def plot_time_series(self, title=None, figsize=(12, 6)):
        """
        Plot the loaded time series data.
        
        Parameters:
        -----------
        title : str, optional
            Title for the plot
        figsize : tuple, optional
            Figure size (width, height)
        """
        if self.ts is None:
            raise ValueError("No time series data selected. Call select_column() first.")
        
        plt.figure(figsize=figsize)
        plt.plot(self.ts)
        plt.title(title or f'{self.ts.name} Prices')
        plt.ylabel('Price Index')
        plt.grid(True)
        plt.show()
        
        return self
    
    def split_data(self, train_size=0.8, plot=True):
        """
        Split the time series data into training and testing sets.
        
        Parameters:
        -----------
        train_size : float, optional
            Proportion of data to use for training (0 < train_size < 1)
        plot : bool, optional
            Whether to plot the train-test split
        """
        if self.ts is None:
            raise ValueError("No time series data selected. Call select_column() first.")
        
        split_idx = int(len(self.ts) * train_size)
        self.ts_train, self.ts_test = self.ts[:split_idx], self.ts[split_idx:]
        
        print(f"Training data size: {len(self.ts_train)}")
        print(f"Testing data size: {len(self.ts_test)}")
        
        if plot:
            plt.figure(figsize=(12, 6))
            plt.plot(self.ts_train, label='Training Data')
            plt.plot(self.ts_test, label='Testing Data')
            plt.title(f'Train-Test Split of {self.ts.name}')
            plt.ylabel('Price Index')
            plt.legend()
            plt.grid(True)
            plt.show()
        
        return self
    
    def check_stationarity(self, series=None):
        """
        Check if a time series is stationary using the Augmented Dickey-Fuller test.
        
        Parameters:
        -----------
        series : pandas.Series, optional
            Time series to check for stationarity. If None, uses training data.
        
        Returns:
        --------
        bool
            True if the series is stationary (p-value <= 0.05), False otherwise
        """
        if series is None:
            if self.ts_train is None:
                raise ValueError("No training data available. Call split_data() first.")
            series = self.ts_train
        
        # Perform Augmented Dickey-Fuller test
        result = adfuller(series.dropna())
        print(f'ADF Statistic: {result[0]}')
        print(f'p-value: {result[1]}')
        print('Critical Values:')
        for key, value in result[4].items():
            print(f'\t{key}: {value}')
        
        # Interpret the results
        is_stationary = result[1] <= 0.05
        if is_stationary:
            print("\nData is stationary (reject null hypothesis)")
        else:
            print("\nData is non-stationary (fail to reject null hypothesis)")
        
        return is_stationary
    
    def difference_series(self, plot=True):
        """
        Apply differencing to make the time series stationary.
        
        Parameters:
        -----------
        plot : bool, optional
            Whether to plot the differenced series
        
        Returns:
        --------
        pandas.Series
            Differenced time series
        """
        if self.ts_train is None:
            raise ValueError("No training data available. Call split_data() first.")
        
        ts_diff = self.ts_train.diff().dropna()  # First difference
        
        if plot:
            ts_diff.plot(figsize=(12, 6), title="Differenced Time Series")
            plt.show()
            self.check_stationarity(ts_diff)
        
        return ts_diff
    
    def plot_acf_pacf(self, series=None):
        """
        Plot the Autocorrelation Function (ACF) and Partial Autocorrelation Function (PACF).
        
        Parameters:
        -----------
        series : pandas.Series, optional
            Time series for which to plot ACF and PACF. If None, uses differenced training data.
        """
        if series is None:
            series = self.difference_series(plot=False)
        
        plt.figure(figsize=(12, 10))
        
        plt.subplot(211)
        plot_acf(series, ax=plt.gca())
        
        plt.subplot(212)
        plot_pacf(series, ax=plt.gca())
        
        plt.tight_layout()
        plt.show()
        
        return self
    
    def fit_arima(self, order=(2, 1, 0)):
        """
        Fit an ARIMA model to the training data.
        
        Parameters:
        -----------
        order : tuple, optional
            ARIMA order parameters (p, d, q)
        """
        if self.ts_train is None:
            raise ValueError("No training data available. Call split_data() first.")
        
        model = ARIMA(self.ts_train, order=order)
        self.model_fit = model.fit()
        print(self.model_fit.summary())
        
        return self
    
    def plot_residuals(self):
        """
        Plot the residuals of the fitted ARIMA model.
        """
        if self.model_fit is None:
            raise ValueError("No model fitted. Call fit_arima() first.")
        
        residuals = self.model_fit.resid[1:]
        fig, ax = plt.subplots(1, 2, figsize=(16, 6))
        residuals.plot(title='Residuals', ax=ax[0])
        residuals.plot(title='Density', kind='kde', ax=ax[1])
        plt.show()
        
        return self
    
    def forecast(self, steps=None, plot=True):
        """
        Generate forecasts from the fitted ARIMA model.
        
        Parameters:
        -----------
        steps : int, optional
            Number of steps to forecast. If None, forecasts for the length of test data.
        plot : bool, optional
            Whether to plot the forecasts against the original data
        
        Returns:
        --------
        pandas.Series
            Forecasted values
        """
        if self.model_fit is None:
            raise ValueError("No model fitted. Call fit_arima() first.")
        
        # Always use test data length for steps if not specified
        if self.ts_test is None:
            raise ValueError("No testing data available. Call split_data() first.")
            
        if steps is None:
            steps = len(self.ts_test)
        
        forecast = self.model_fit.forecast(steps)
        
        if plot and ARIMATimeSeriesAnalyzer._df is not None:
            # Create a copy to avoid modifying original data
            plot_data = ARIMATimeSeriesAnalyzer._df.copy()
            if self.ts.name in plot_data.columns:
                plot_data['Manual ARIMA'] = [None] * len(self.ts_train) + list(forecast)
                plot_data[[self.ts.name, 'Manual ARIMA']].plot(figsize=(12, 6))
                plt.title("ARIMA Forecast")
                plt.show()
        
        return forecast
    
    def fit_auto_arima(self, seasonal=False, m=12):
        """
        Automatically find the optimal ARIMA parameters and fit the model.
        
        Parameters:
        -----------
        seasonal : bool, optional
            Whether to include seasonal components
        m : int, optional
            The number of periods in each season (for seasonal models)
        """
        if self.ts_train is None:
            raise ValueError("No training data available. Call split_data() first.")
        
        self.auto_model = auto_arima(
            self.ts_train,
            start_p=0, d=1, start_q=0,
            max_p=5, max_d=5, max_q=5,
            start_P=0, D=1, start_Q=0,
            max_P=5, max_D=5, max_Q=5,
            m=m,
            seasonal=[seasonal],
            error_action='warn',
            trace=True,
            suppress_warnings=True,
            stepwise=True,
            random_state=20,
            n_fits=50
        )
        
        print(self.auto_model.summary())
        
        return self
    
    def auto_forecast(self, steps=None, plot=True):
        """
        Generate forecasts from the auto-fitted ARIMA model.
        
        Parameters:
        -----------
        steps : int, optional
            Number of steps to forecast. If None, forecasts for the length of test data.
        plot : bool, optional
            Whether to plot the forecasts against the original data
        
        Returns:
        --------
        pandas.Series
            Forecasted values
        """
        if self.auto_model is None:
            raise ValueError("No auto ARIMA model fitted. Call fit_auto_arima() first.")
        
        # Always use test data length for steps if not specified
        if self.ts_test is None:
            raise ValueError("No testing data available. Call split_data() first.")
            
        if steps is None:
            steps = len(self.ts_test)
        
        forecast = self.auto_model.predict(steps)
        
        if plot and ARIMATimeSeriesAnalyzer._df is not None:
            # Create a copy to avoid modifying original data
            plot_data = ARIMATimeSeriesAnalyzer._df.copy()
            if self.ts.name in plot_data.columns:
                plot_data['Auto ARIMA'] = [None] * len(self.ts_train) + list(forecast)
                plot_data[[self.ts.name, 'Auto ARIMA']].plot(figsize=(12, 6))
                plt.title("Auto ARIMA Forecast")
                plt.show()
        
        return forecast
    
    def evaluate_models(self):
        """
        Evaluate and compare the performance of manual and auto ARIMA models.
        
        Returns:
        --------
        dict
            Dictionary containing evaluation metrics for both models
        """
        if self.ts_test is None:
            raise ValueError("No testing data available. Call split_data() first.")
        
        results = {}
        
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
            
            print(f"Manual ARIMA - RMSE: {manual_rmse:.4f}, MAE: {manual_mae:.4f}, R²: {manual_r2:.4f}")
        
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
            
            print(f"Auto ARIMA - RMSE: {auto_rmse:.4f}, MAE: {auto_mae:.4f}, R²: {auto_r2:.4f}")
        
        return results


# Example usage
if __name__ == "__main__":
    # Load data from CSV file once
    ARIMATimeSeriesAnalyzer.load_data('Metro_zori_uc_sfrcondomfr_sm_month(1).csv')
    
    # Create an instance for Los Angeles
    la_analyzer = ARIMATimeSeriesAnalyzer(column='Austin, TX')
    
    # Plot the original time series
    la_analyzer.plot_time_series()
    
    # Split data into training and testing sets
    la_analyzer.split_data(train_size=0.85)
    
    # Check stationarity of the original series
    print("Stationarity check of original series:")
    la_analyzer.check_stationarity()
    
    # Apply differencing and check stationarity again
    la_analyzer.difference_series()
    
    # Plot ACF and PACF
    la_analyzer.plot_acf_pacf()
    
    # Fit a manual ARIMA model
    la_analyzer.fit_arima(order=(1, 1, 1))
    
    # Plot residuals
    la_analyzer.plot_residuals()
    
    # Generate forecasts
    la_analyzer.forecast()
    
    # Fit an auto ARIMA model
    la_analyzer.fit_auto_arima()
    
    # Generate forecasts from the auto ARIMA model
    la_analyzer.auto_forecast()
    
    # Evaluate both models
    metrics = la_analyzer.evaluate_models()
    print("\nModel Comparison:")
    for model, values in metrics.items():
        print(f"{model}: RMSE={values['RMSE']:.4f}, MAE={values['MAE']:.4f}, R²={values['R²']:.4f}")
    
    # Create another instance for a different city
    print("\n\nAnalyzing a different city:")
    # ny_analyzer = ARIMATimeSeriesAnalyzer(column='Dallas, TX')
    # ny_analyzer.plot_time_series()
    # ny_analyzer.split_data(train_size=0.8)