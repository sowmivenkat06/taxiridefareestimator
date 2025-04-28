import logging

logger = logging.getLogger(__name__)

# CO2 emissions by taxi type (grams per km)
CO2_EMISSIONS = {
    'Sedan': 120,    # Average sedan
    'SUV': 180,      # Average SUV
    'Electric': 30,  # Electric (from electricity production)
    'Luxury': 220    # Luxury vehicle
}

def calculate_eco_score(taxi_type, distance):
    """
    Calculate an eco-friendliness score from 0-100 for the ride.
    
    Args:
        taxi_type (str): The type of taxi
        distance (float): The distance in kilometers
        
    Returns:
        int: Eco score from 0-100
    """
    try:
        # Base scores by taxi type
        base_scores = {
            'Electric': 90,
            'Sedan': 60,
            'SUV': 30,
            'Luxury': 20
        }
        
        # Get base score
        base_score = base_scores.get(taxi_type, 50)
        
        # Adjust score based on distance (longer distances are less eco-friendly)
        # For distances over 50km, reduce score slightly
        distance_factor = max(0, min(1, 1 - (distance - 10) / 100)) if distance > 10 else 1
        
        # Calculate final score
        eco_score = int(base_score * distance_factor)
        
        # Ensure score is between 0 and 100
        eco_score = max(0, min(100, eco_score))
        
        return eco_score
        
    except Exception as e:
        logger.error(f"Error calculating eco score: {str(e)}")
        return 50  # Default score

def calculate_co2_emissions(taxi_type, distance):
    """
    Calculate the CO2 emissions for the ride.
    
    Args:
        taxi_type (str): The type of taxi
        distance (float): The distance in kilometers
        
    Returns:
        dict: CO2 emission details
    """
    try:
        # Get emissions per km
        emissions_per_km = CO2_EMISSIONS.get(taxi_type, 120)  # Default to sedan if not found
        
        # Calculate total emissions
        total_emissions = emissions_per_km * distance
        
        # Calculate savings compared to SUV (as reference)
        suv_emissions = CO2_EMISSIONS['SUV'] * distance
        savings = suv_emissions - total_emissions
        
        # Calculate equivalent data points
        trees_needed = total_emissions / 21000  # Average tree absorbs ~21kg CO2 per year
        
        return {
            'total_g': round(total_emissions, 2),
            'per_km': emissions_per_km,
            'savings_vs_suv_g': round(savings, 2),
            'trees_equivalent': round(trees_needed, 4),
            'is_eco_friendly': taxi_type == 'Electric'
        }
        
    except Exception as e:
        logger.error(f"Error calculating CO2 emissions: {str(e)}")
        return {
            'total_g': 0,
            'per_km': 0,
            'savings_vs_suv_g': 0,
            'trees_equivalent': 0,
            'is_eco_friendly': False
        }

def get_eco_suggestions(taxi_type, distance, duration):
    """
    Generate eco-friendly suggestions based on ride details.
    
    Args:
        taxi_type (str): The type of taxi
        distance (float): The distance in kilometers
        duration (float): The duration in minutes
        
    Returns:
        list: List of eco-friendly suggestions
    """
    suggestions = []
    
    # Suggest electric taxi if not already selected
    if taxi_type != 'Electric':
        suggestions.append({
            'type': 'switch_taxi',
            'text': 'Switch to an electric taxi to reduce CO2 emissions by up to 84%',
            'savings': 'Reduces CO2 by ~150g per km'
        })
    
    # For short distances, suggest alternative transportation
    if distance < 3:
        suggestions.append({
            'type': 'alternative',
            'text': 'Consider walking or cycling for this short distance',
            'savings': 'Eliminates all CO2 emissions for this trip'
        })
    elif distance < 10:
        suggestions.append({
            'type': 'alternative',
            'text': 'Consider public transportation for this distance',
            'savings': 'Reduces CO2 by up to 75% compared to a taxi'
        })
    
    # For longer trips, suggest carpooling
    if distance > 15:
        suggestions.append({
            'type': 'carpool',
            'text': 'Share your ride with others going in the same direction',
            'savings': 'Cuts emissions per passenger by 50% or more'
        })
    
    # For rush hours, suggest time shifting
    if duration > distance * 3:  # Indicates slow traffic
        suggestions.append({
            'type': 'time_shift',
            'text': 'Consider traveling outside peak hours for faster, more efficient travel',
            'savings': 'Reduces idle time and associated emissions'
        })
    
    return suggestions

def get_currency_symbol(currency_code):
    """Get currency symbol from currency code."""
    symbols = {
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'CAD': 'C$',
        'AUD': 'A$',
        'CNY': '¥',
        'INR': '₹',
    }
    return symbols.get(currency_code, '$')
