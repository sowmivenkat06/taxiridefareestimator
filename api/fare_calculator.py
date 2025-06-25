import logging
import random
from datetime import datetime

logger = logging.getLogger(__name__)

# Base fare rates by taxi type (per km and per minute)
TAXI_BASE_RATES = {
    'Sedan': {'base_fare': 2.50, 'per_km': 1.50, 'per_minute': 0.35},
    'SUV': {'base_fare': 3.50, 'per_km': 2.00, 'per_minute': 0.45},
    'Electric': {'base_fare': 3.00, 'per_km': 1.60, 'per_minute': 0.40},
    'Luxury': {'base_fare': 5.00, 'per_km': 2.80, 'per_minute': 0.60},
}

# Modifier factors
TRAFFIC_MODIFIERS = {
    'low': 1.0,
    'moderate': 1.2,
    'heavy': 1.5,
    'extreme': 1.8,
}

WEATHER_MODIFIERS = {
    'clear': 1.0,
    'cloudy': 1.05,
    'rain': 1.2,
    'snow': 1.4,
    'storm': 1.6,
}

TIME_OF_DAY_MODIFIERS = {
    'early_morning': 1.1,  # 5-7 AM
    'morning_rush': 1.5,   # 7-9 AM
    'day': 1.0,            # 9 AM-4 PM
    'evening_rush': 1.5,   # 4-7 PM
    'evening': 1.2,        # 7-10 PM
    'night': 1.3,          # 10 PM-5 AM
}

DEMAND_SURGE_MODIFIERS = {
    'very_low': 0.8,
    'low': 0.9,
    'normal': 1.0,
    'high': 1.3,
    'very_high': 1.8,
    'extreme': 2.5,
}

# Eco-friendly discount for electric vehicles
ECO_DISCOUNT = 0.1  # 10% discount for electric taxis

def calculate_fare(distance, duration, taxi_type, traffic_conditions, weather_conditions, 
                  time_of_day, exchange_rate=1.0, currency='USD', passenger_count=1):
    """
    Calculate taxi fare based on multiple factors.
    
    Args:
        distance (float): Distance in kilometers
        duration (float): Duration in minutes
        taxi_type (str): Type of taxi (Sedan, SUV, Electric, Luxury)
        traffic_conditions (str): Traffic level (low, moderate, heavy, extreme)
        weather_conditions (str): Weather condition (clear, cloudy, rain, snow, storm)
        time_of_day (str): Time period (early_morning, morning_rush, day, evening_rush, evening, night)
        exchange_rate (float): Exchange rate to convert from USD
        currency (str): Target currency code
        passenger_count (int): Number of passengers (default: 1)
        
    Returns:
        dict: Fare details including base fare, distance fare, time fare, adjusted fare, and factors affecting price
    """
    try:
        # Get base rates for selected taxi type
        if taxi_type not in TAXI_BASE_RATES:
            taxi_type = 'Sedan'  # Default to Sedan if invalid type
        
        rates = TAXI_BASE_RATES[taxi_type]
        
        # Calculate base components
        base_fare = rates['base_fare']
        distance_fare = distance * rates['per_km']
        time_fare = duration * rates['per_minute']
        
        # Calculate raw fare
        raw_fare = base_fare + distance_fare + time_fare
        
        # Get modifiers
        traffic_modifier = TRAFFIC_MODIFIERS.get(traffic_conditions, 1.0)
        weather_modifier = WEATHER_MODIFIERS.get(weather_conditions, 1.0)
        time_modifier = TIME_OF_DAY_MODIFIERS.get(time_of_day, 1.0)
        
        # Simulate demand based on time, traffic, and weather
        demand_level = calculate_demand_level(time_of_day, traffic_conditions, weather_conditions)
        demand_modifier = DEMAND_SURGE_MODIFIERS.get(demand_level, 1.0)
        
        # Apply modifiers
        adjusted_fare = raw_fare * traffic_modifier * weather_modifier * time_modifier * demand_modifier
        
        # Apply eco discount for electric taxis
        if taxi_type == 'Electric':
            adjusted_fare = adjusted_fare * (1 - ECO_DISCOUNT)
        
        # Apply passenger multiplier (cap at 5 passengers)
        passenger_count = min(int(passenger_count), 5)
        total_fare = adjusted_fare * passenger_count
        
        # Convert to requested currency
        converted_fare = total_fare * exchange_rate
        
        # Round to 2 decimal places
        converted_fare = round(converted_fare, 2)
        
        # Prepare response
        response = {
            'base_fare': round(base_fare * exchange_rate, 2),
            'distance_fare': round(distance_fare * exchange_rate, 2),
            'time_fare': round(time_fare * exchange_rate, 2),
            'raw_fare': round(raw_fare * exchange_rate, 2),
            'adjusted_fare': round(adjusted_fare * exchange_rate, 2),
            'total_fare': converted_fare,
            'currency': currency,
            'passenger_count': passenger_count,
            'factors': {
                'traffic': {'condition': traffic_conditions, 'modifier': traffic_modifier},
                'weather': {'condition': weather_conditions, 'modifier': weather_modifier},
                'time': {'period': time_of_day, 'modifier': time_modifier},
                'demand': {'level': demand_level, 'modifier': demand_modifier},
                'eco_discount': ECO_DISCOUNT if taxi_type == 'Electric' else 0
            }
        }
        
        return response
    
    except Exception as e:
        logger.error(f"Error calculating fare: {str(e)}")
        raise

def calculate_demand_level(time_of_day, traffic, weather):
    """Calculate demand level based on time, traffic, and weather."""
    # Base demand score by time of day
    demand_scores = {
        'early_morning': 30,
        'morning_rush': 80,
        'day': 50,
        'evening_rush': 85,
        'evening': 65,
        'night': 40
    }
    
    # Add traffic impact
    traffic_scores = {
        'low': 0,
        'moderate': 10,
        'heavy': 25,
        'extreme': 40
    }
    
    # Add weather impact
    weather_scores = {
        'clear': 0,
        'cloudy': 5,
        'rain': 15,
        'snow': 25,
        'storm': 35
    }
    
    base_score = demand_scores.get(time_of_day, 50)
    traffic_score = traffic_scores.get(traffic, 0)
    weather_score = weather_scores.get(weather, 0)
    
    # Add some randomness (±10 points)
    random_factor = random.randint(-10, 10)
    
    total_score = base_score + traffic_score + weather_score + random_factor
    
    # Map score to demand level
    if total_score < 30:
        return 'very_low'
    elif total_score < 50:
        return 'low'
    elif total_score < 70:
        return 'normal'
    elif total_score < 85:
        return 'high'
    elif total_score < 100:
        return 'very_high'
    else:
        return 'extreme'

def predict_fare(distance, duration, taxi_type, location, time_of_day, currency, time_offset=15):
    """
    Predict future fares based on time offset.
    
    Args:
        distance (float): Distance in kilometers
        duration (float): Duration in minutes
        taxi_type (str): Type of taxi (Sedan, SUV, Electric, Luxury)
        location (str): Location name
        time_of_day (str): Current time period
        currency (str): Target currency code
        time_offset (int): Prediction time in minutes (15, 30, or 60)
        
    Returns:
        dict: Predictions for current fare and future fares
    """
    from api.external_apis import get_traffic_conditions, get_weather_conditions, get_exchange_rate, predict_traffic, predict_weather
    
    # Get current conditions
    current_traffic = get_traffic_conditions(location, time_of_day)
    current_weather = get_weather_conditions(location)
    exchange_rate = get_exchange_rate(currency)
    
    # Calculate current fare
    current_fare = calculate_fare(
        distance=distance,
        duration=duration,
        taxi_type=taxi_type,
        traffic_conditions=current_traffic,
        weather_conditions=current_weather,
        time_of_day=time_of_day,
        exchange_rate=exchange_rate,
        currency=currency
    )
    
    # Predict conditions for different time offsets
    predictions = {
        'current': current_fare,
        'predictions': []
    }
    
    # Define time offsets to predict
    offsets = [15, 30, 60] if time_offset >= 60 else ([15, 30] if time_offset >= 30 else [15])
    
    for offset in offsets:
        # Predict future traffic and weather
        future_traffic = predict_traffic(location, time_of_day, offset)
        future_weather = predict_weather(location, offset)
        
        # Calculate new time of day based on offset
        future_time = calculate_future_time_of_day(time_of_day, offset)
        
        # Calculate predicted fare
        predicted_fare = calculate_fare(
            distance=distance,
            duration=duration,
            taxi_type=taxi_type,
            traffic_conditions=future_traffic,
            weather_conditions=future_weather,
            time_of_day=future_time,
            exchange_rate=exchange_rate,
            currency=currency
        )
        
        # Add prediction data
        predictions['predictions'].append({
            'time_offset': offset,
            'fare': predicted_fare['adjusted_fare'],
            'traffic': future_traffic,
            'weather': future_weather,
            'time_of_day': future_time,
            'change_percentage': calculate_percentage_change(
                current_fare['adjusted_fare'], 
                predicted_fare['adjusted_fare']
            ),
            'factors': predicted_fare['factors']
        })
    
    return predictions

def calculate_future_time_of_day(current_time, minutes_offset):
    """Calculate future time of day based on minutes offset."""
    # Define time periods and their rough hour ranges
    time_periods = {
        'early_morning': (5, 7),   # 5-7 AM
        'morning_rush': (7, 9),    # 7-9 AM
        'day': (9, 16),            # 9 AM-4 PM
        'evening_rush': (16, 19),  # 4-7 PM
        'evening': (19, 22),       # 7-10 PM
        'night': (22, 5)           # 10 PM-5 AM (wrapping around midnight)
    }
    
    # Get the current hour range
    current_period = time_periods.get(current_time, (12, 13))  # Default to mid-day if invalid
    
    # Handle night period which wraps around midnight
    if current_time == 'night':
        current_hour = 23  # Assume middle of night period
    else:
        current_hour = (current_period[0] + current_period[1]) // 2  # Middle of the period
    
    # Calculate future hour
    future_hour = (current_hour + (minutes_offset // 60)) % 24
    
    # Determine future time period
    for period, (start, end) in time_periods.items():
        if period == 'night':  # Special handling for night which wraps around
            if future_hour >= 22 or future_hour < 5:
                return period
        elif start <= future_hour < end:
            return period
    
    return 'day'  # Default fallback

def calculate_percentage_change(original, new):
    """Calculate percentage change between two values."""
    if original == 0:
        return 0
    change = ((new - original) / original) * 100
    return round(change, 1)
