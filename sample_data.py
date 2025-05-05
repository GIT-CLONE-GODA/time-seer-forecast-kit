import pandas as pd
import numpy as np
import os

def generate_sample_data():
    """
    Generate sample time series data for housing prices in different regions.
    This is useful for testing the application when no real data is available.
    """
    # Create date range for the past 5 years (monthly data)
    date_range = pd.date_range(start='2019-01-01', end='2023-12-01', freq='MS')
    
    # Define regions
    regions = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 
               'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA',
               'Dallas, TX', 'Austin, TX']
    
    # Create a DataFrame with the date as index
    df = pd.DataFrame(index=date_range)
    
    # Base values and growth rates for different regions
    base_values = {
        'New York, NY': 500000,
        'Los Angeles, CA': 700000,
        'Chicago, IL': 300000,
        'Houston, TX': 250000,
        'Phoenix, AZ': 350000,
        'Philadelphia, PA': 280000,
        'San Antonio, TX': 220000,
        'San Diego, CA': 650000,
        'Dallas, TX': 280000,
        'Austin, TX': 450000
    }
    
    # Generate data for each region with different patterns
    for region in regions:
        # Base value
        base = base_values[region]
        
        # Generate trend (linear growth)
        trend = np.linspace(0, 0.5, len(date_range))
        
        # Generate seasonality (yearly pattern)
        seasonality = 0.1 * np.sin(np.linspace(0, 2 * np.pi * 5, len(date_range)))
        
        # Generate some random noise
        noise = 0.05 * np.random.randn(len(date_range))
        
        # Combine components
        series = base * (1 + trend + seasonality + noise)
        
        # Add to DataFrame
        df[region] = series
    
    # Round values
    df = df.round(0)
    
    # Convert index to string format (YYYY-MM-DD)
    df.index = df.index.strftime('%Y-%m-%d')
    
    # Reset index to make date a column
    df = df.reset_index().rename(columns={'index': 'date'})
    
    # Save to CSV
    df.to_csv('sample_housing_prices.csv', index=False)
    print(f"Sample data created and saved to 'sample_housing_prices.csv'")
    
    return df

if __name__ == "__main__":
    generate_sample_data() 