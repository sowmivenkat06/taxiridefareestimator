import logging
import random
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Mock data for traffic conditions
TRAFFIC_PATTERNS = {
    'New York': {
        'early_morning': {'low': 70, 'moderate': 25, 'heavy': 5, 'extreme': 0},
        'morning_rush': {'low': 5, 'moderate': 15, 'heavy': 50, 'extreme': 30},
        'day': {'low': 20, 'moderate': 50, 'heavy': 25, 'extreme': 5},
        'evening_rush': {'low': 5, 'moderate': 15, 'heavy': 55, 'extreme': 25},
        'evening': {'low': 30, 'moderate': 45, 'heavy': 20, 'extreme': 5},
        'night': {'low': 75, 'moderate': 20, 'heavy': 5, 'extreme': 0},
    },
    'Los Angeles': {
        'early_morning': {'low': 60, 'moderate': 30, 'heavy': 10, 'extreme': 0},
        'morning_rush': {'low': 0, 'moderate': 10, 'heavy': 55, 'extreme': 35},
        'day': {'low': 10, 'moderate': 40, 'heavy': 35, 'extreme': 15},
        'evening_rush': {'low': 0, 'moderate': 10, 'heavy': 50, 'extreme': 40},
        'evening': {'low': 20, 'moderate': 45, 'heavy': 30, 'extreme': 5},
        'night': {'low': 70, 'moderate': 25, 'heavy': 5, 'extreme': 0},
    },
    'Chicago': {
        'early_morning': {'low': 75, 'moderate': 20, 'heavy': 5, 'extreme': 0},
        'morning_rush': {'low': 10, 'moderate': 25, 'heavy': 45, 'extreme': 20},
        'day': {'low': 25, 'moderate': 45, 'heavy': 25, 'extreme': 5},
        'evening_rush': {'low': 5, 'moderate': 20, 'heavy': 50, 'extreme': 25},
        'evening': {'low': 35, 'moderate': 40, 'heavy': 20, 'extreme': 5},
        'night': {'low': 80, 'moderate': 15, 'heavy': 5, 'extreme': 0},
    },
    'default': {
        'early_morning': {'low': 70, 'moderate': 25, 'heavy': 5, 'extreme': 0},
        'morning_rush': {'low': 5, 'moderate': 20, 'heavy': 50, 'extreme': 25},
        'day': {'low': 20, 'moderate': 50, 'heavy': 25, 'extreme': 5},
        'evening_rush': {'low': 5, 'moderate': 20, 'heavy': 50, 'extreme': 25},
        'evening': {'low': 30, 'moderate': 45, 'heavy': 20, 'extreme': 5},
        'night': {'low': 75, 'moderate': 20, 'heavy': 5, 'extreme': 0},
    }
}

# Mock data for weather conditions
WEATHER_PATTERNS = {
    'New York': {'clear': 40, 'cloudy': 30, 'rain': 20, 'snow': 5, 'storm': 5},
    'Los Angeles': {'clear': 75, 'cloudy': 20, 'rain': 4, 'snow': 0, 'storm': 1},
    'Chicago': {'clear': 35, 'cloudy': 30, 'rain': 20, 'snow': 10, 'storm': 5},
    'default': {'clear': 50, 'cloudy': 25, 'rain': 15, 'snow': 5, 'storm': 5}
}

# Mock currency exchange rates (relative to USD)
EXCHANGE_RATES = {
    'USD': 1.0,
    'EUR': 0.85,
    'GBP': 0.73,
    'JPY': 110.0,
    'CAD': 1.25,
    'AUD': 1.35,
    'CNY': 6.45,
    'INR': 74.5,
}

def get_traffic_conditions(location, time_of_day):
    """
    Get current traffic conditions for a location and time of day.
    
    In a real implementation, this would call an external traffic API.
    
    Args:
        location (str): City name
        time_of_day (str): Time period
        
    Returns:
        str: Traffic condition (low, moderate, heavy, extreme)
    """
    try:
        # Get the traffic distribution for the location and time
        city_patterns = TRAFFIC_PATTERNS.get(location, TRAFFIC_PATTERNS['default'])
        time_patterns = city_patterns.get(time_of_day, city_patterns['day'])
        
        # Weighted random choice
        rand = random.randint(1, 100)
        cumulative = 0
        
        for condition, probability in time_patterns.items():
            cumulative += probability
            if rand <= cumulative:
                return condition
                
        return 'moderate'  # Default fallback
        
    except Exception as e:
        logger.error(f"Error getting traffic conditions: {str(e)}")
        return 'moderate'  # Default fallback

def get_weather_conditions(location):
    """
    Get current weather conditions for a location.
    
    In a real implementation, this would call an external weather API.
    
    Args:
        location (str): City name
        
    Returns:
        str: Weather condition (clear, cloudy, rain, snow, storm)
    """
    try:
        # Get the weather distribution for the location
        weather_dist = WEATHER_PATTERNS.get(location, WEATHER_PATTERNS['default'])
        
        # Weighted random choice
        rand = random.randint(1, 100)
        cumulative = 0
        
        for condition, probability in weather_dist.items():
            cumulative += probability
            if rand <= cumulative:
                return condition
                
        return 'clear'  # Default fallback
        
    except Exception as e:
        logger.error(f"Error getting weather conditions: {str(e)}")
        return 'clear'  # Default fallback

def get_exchange_rate(currency_code):
    """
    Get exchange rate for converting USD to specified currency.
    
    In a real implementation, this would call an external currency API.
    
    Args:
        currency_code (str): Currency code (USD, EUR, etc.)
        
    Returns:
        float: Exchange rate from USD to specified currency
    """
    try:
        return EXCHANGE_RATES.get(currency_code.upper(), 1.0)
    except Exception as e:
        logger.error(f"Error getting exchange rate: {str(e)}")
        return 1.0  # Default to USD

def predict_traffic(location, current_time, minutes_ahead):
    """
    Predict traffic conditions for a future time.
    
    Args:
        location (str): City name
        current_time (str): Current time period
        minutes_ahead (int): Minutes to look ahead
        
    Returns:
        str: Predicted traffic condition
    """
    # Calculate future time of day
    future_time = calculate_future_time(current_time, minutes_ahead)
    
    # Get the predicted traffic with some randomness for variety
    base_prediction = get_traffic_conditions(location, future_time)
    
    # Sometimes, deviate from the base prediction to simulate unpredictability
    if random.random() < 0.3:  # 30% chance of deviation
        conditions = ['low', 'moderate', 'heavy', 'extreme']
        current_index = conditions.index(base_prediction)
        
        # Move up or down by 1 level, staying within bounds
        shift = random.choice([-1, 1])
        new_index = max(0, min(len(conditions) - 1, current_index + shift))
        
        return conditions[new_index]
    
    return base_prediction

def predict_weather(location, minutes_ahead):
    """
    Predict weather conditions for a future time.
    
    Args:
        location (str): City name
        minutes_ahead (int): Minutes to look ahead
        
    Returns:
        str: Predicted weather condition
    """
    # Weather changes more slowly, so usually stay the same for short term predictions
    current_weather = get_weather_conditions(location)
    
    # For longer predictions, occasionally change the weather
    if minutes_ahead >= 60 and random.random() < 0.4:  # 40% chance of change for 60+ minutes
        weather_dist = WEATHER_PATTERNS.get(location, WEATHER_PATTERNS['default'])
        conditions = list(weather_dist.keys())
        
        # Exclude current weather from options
        other_conditions = [c for c in conditions if c != current_weather]
        
        # Pick a new condition if there are other options
        if other_conditions:
            # Weight the selection by probability in the weather distribution
            weights = [weather_dist[c] for c in other_conditions]
            return random.choices(other_conditions, weights=weights, k=1)[0]
    
    return current_weather

def calculate_future_time(current_time, minutes_ahead):
    """Calculate the time period after adding minutes to current time."""
    # Define time periods and their approximate midpoint hour
    time_periods = {
        'early_morning': 6,   # 5-7 AM
        'morning_rush': 8,    # 7-9 AM
        'day': 12,            # 9 AM-4 PM
        'evening_rush': 17,   # 4-7 PM
        'evening': 20,        # 7-10 PM
        'night': 1            # 10 PM-5 AM
    }
    
    # Get the current hour
    current_hour = time_periods.get(current_time, 12)  # Default to noon
    
    # Calculate future hour (24-hour format)
    future_hour = (current_hour + (minutes_ahead // 60)) % 24
    
    # Map hour to time period
    if 5 <= future_hour < 7:
        return 'early_morning'
    elif 7 <= future_hour < 9:
        return 'morning_rush'
    elif 9 <= future_hour < 16:
        return 'day'
    elif 16 <= future_hour < 19:
        return 'evening_rush'
    elif 19 <= future_hour < 22:
        return 'evening'
    else:
        return 'night'
